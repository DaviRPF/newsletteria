import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import whatsappService from '../src/services/whatsappService.js';
import newsDistributionService from '../src/services/newsDistributionService.js';

// Configurar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Verificar parâmetros
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('❌ Uso: node sendNewsManual.js <número_telefone>');
  console.error('   Exemplo: node sendNewsManual.js 558481843434');
  process.exit(1);
}

// Validar formato do número
if (!phoneNumber.match(/^\d+$/)) {
  console.error('❌ Número inválido! Use apenas dígitos (ex: 558481843434)');
  process.exit(1);
}

console.log(`\n📱 Enviando newsletter para: ${phoneNumber}`);
console.log('─'.repeat(50));

async function sendManualNewsletter() {
  let mongoClient;
  
  try {
    // 1. Conectar ao MongoDB
    console.log('🔗 Conectando ao MongoDB...');
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db(process.env.MONGODB_DB);
    console.log('✅ MongoDB conectado');
    
    // 2. Inicializar WhatsApp
    console.log('\n🔗 Inicializando WhatsApp...');
    const sessionName = 'newsletter-session';
    
    // Configurar db no WhatsApp service
    whatsappService.setDatabase(db);
    
    // Verificar se está conectado
    const status = await whatsappService.getSessionStatus(sessionName);
    if (status !== 'successChat') {
      throw new Error('WhatsApp não está conectado. Execute o servidor principal primeiro.');
    }
    console.log('✅ WhatsApp conectado');
    
    // 3. Verificar se o usuário existe no banco
    console.log(`\n🔍 Verificando usuário ${phoneNumber}...`);
    const user = await db.collection('users').findOne({ phone: phoneNumber });
    
    if (user) {
      console.log(`✅ Usuário encontrado: ${user.name || 'Sem nome'}`);
      console.log(`   Email: ${user.email || 'Sem email'}`);
      console.log(`   Perfil: ${user.profileDescription ? user.profileDescription.substring(0, 50) + '...' : 'Sem perfil'}`);
    } else {
      console.log('⚠️  Usuário não cadastrado no sistema');
      console.log('   Enviando newsletter genérica...');
    }
    
    // 4. Enviar newsletter
    console.log('\n📨 Enviando newsletter...');
    
    // Usar o serviço de distribuição diretamente
    newsDistributionService.setDatabase(db);
    
    // Forçar envio individual
    await newsDistributionService.sendNewsToUser(phoneNumber, true);
    
    console.log('\n✅ Newsletter enviada com sucesso!');
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Erro ao enviar newsletter:', error.message);
    
    if (error.message.includes('não está conectado')) {
      console.error('\n💡 Dica: Certifique-se de que o servidor principal está rodando (npm start)');
    }
    
  } finally {
    // Fechar conexão
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔒 Conexão MongoDB fechada');
    }
    
    // Aguardar um pouco antes de sair para garantir que mensagens foram enviadas
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.exit(0);
  }
}

// Executar
sendManualNewsletter().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});