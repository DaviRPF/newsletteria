import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

// Configurar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Verificar parâmetros
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('❌ Uso: node forceLCommand.js <número_telefone>');
  console.error('   Exemplo: node forceLCommand.js 558481843434');
  process.exit(1);
}

// Validar formato do número
if (!phoneNumber.match(/^\d+$/)) {
  console.error('❌ Número inválido! Use apenas dígitos (ex: 558481843434)');
  process.exit(1);
}

console.log(`\n📱 Forçando envio de newsletter para: ${phoneNumber}`);
console.log('─'.repeat(50));

async function forceNewsletter() {
  let mongoClient;
  let wasAlreadyDeveloper = false;
  
  try {
    // 1. Conectar ao MongoDB
    console.log('🔗 Conectando ao MongoDB...');
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter';
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    const db = mongoClient.db('newsletter');
    console.log('✅ MongoDB conectado');
    
    // 2. Verificar se já é desenvolvedor
    const developerNumbers = process.env.DEVELOPER_NUMBERS?.split(',') || [];
    wasAlreadyDeveloper = developerNumbers.includes(phoneNumber);
    
    if (!wasAlreadyDeveloper) {
      console.log('🔧 Adicionando temporariamente como desenvolvedor...');
      
      // Adicionar ao .env temporariamente
      const newDeveloperNumbers = [...developerNumbers, phoneNumber].join(',');
      process.env.DEVELOPER_NUMBERS = newDeveloperNumbers;
      
      // Atualizar no arquivo .env
      const fs = await import('fs');
      const envPath = join(__dirname, '../.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('DEVELOPER_NUMBERS=')) {
        envContent = envContent.replace(
          /DEVELOPER_NUMBERS=.*/,
          `DEVELOPER_NUMBERS=${newDeveloperNumbers}`
        );
      } else {
        envContent += `\nDEVELOPER_NUMBERS=${newDeveloperNumbers}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Adicionado como desenvolvedor temporário');
    }
    
    // 3. Importar e executar o whatsappService
    console.log('\n🤖 Executando comando "l"...');
    const whatsappService = (await import('../src/services/whatsappService.js')).default;
    
    // Configurar database
    whatsappService.setDatabase(db);
    
    // Verificar conexão
    if (!whatsappService.isClientConnected()) {
      throw new Error('WhatsApp não está conectado. O servidor precisa estar rodando.');
    }
    
    // Executar o comando
    await whatsappService.triggerNewsletterNow(phoneNumber);
    
    console.log('\n✅ Newsletter enviada com sucesso!');
    console.log('📲 Verifique o WhatsApp do número informado');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
    if (error.message.includes('não está conectado')) {
      console.error('\n💡 O servidor principal precisa estar rodando!');
      console.error('   Execute: npm start');
    }
    
  } finally {
    // Remover do .env se foi adicionado temporariamente
    if (!wasAlreadyDeveloper && phoneNumber) {
      try {
        console.log('\n🧹 Removendo status de desenvolvedor temporário...');
        
        const fs = await import('fs');
        const envPath = join(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        const developerNumbers = process.env.DEVELOPER_NUMBERS?.split(',') || [];
        const filteredNumbers = developerNumbers.filter(num => num !== phoneNumber);
        
        envContent = envContent.replace(
          /DEVELOPER_NUMBERS=.*/,
          `DEVELOPER_NUMBERS=${filteredNumbers.join(',')}`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Status de desenvolvedor removido');
        
      } catch (error) {
        console.error('⚠️  Erro ao remover desenvolvedor:', error.message);
      }
    }
    
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔒 Conexão MongoDB fechada');
    }
    
    process.exit(0);
  }
}

// Executar
forceNewsletter().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});