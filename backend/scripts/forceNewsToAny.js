import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

// Configurar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Verificar parâmetros
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('❌ Uso: node forceNewsToAny.js <número_telefone>');
  console.error('   Exemplo: node forceNewsToAny.js 558481843434');
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
  let tempUserCreated = false;
  
  try {
    // 1. Conectar ao MongoDB
    console.log('🔗 Conectando ao MongoDB...');
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter';
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    const db = mongoClient.db('newsletter');
    console.log('✅ MongoDB conectado');
    
    // 2. Verificar se usuário existe
    let user = await db.collection('users').findOne({ phone: phoneNumber });
    
    if (!user) {
      console.log('⚠️  Usuário não cadastrado - criando temporariamente...');
      
      // Criar usuário temporário
      const tempUser = {
        phone: phoneNumber,
        email: `temp_${phoneNumber}@temp.com`,
        name: 'Usuário Temporário',
        subscriptionStatus: 'active',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        deliveryTime: '10:00',
        timezone: 'America/Sao_Paulo',
        profileDescription: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        isTemporary: true
      };
      
      await db.collection('users').insertOne(tempUser);
      tempUserCreated = true;
      console.log('✅ Usuário temporário criado');
      user = tempUser;
    } else {
      console.log(`✅ Usuário encontrado: ${user.name}`);
      if (user.profileDescription) {
        console.log(`📝 Perfil: ${user.profileDescription.substring(0, 60)}...`);
      }
    }
    
    // 3. Enviar newsletter via API
    console.log('\n📤 Enviando newsletter...');
    
    const response = await fetch('http://localhost:3000/api/whatsapp/send-newsletter-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phones: [phoneNumber]
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ ' + result.message);
      console.log('\n💡 Newsletter sendo enviada...');
      console.log('📲 Verifique o WhatsApp do número informado');
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao enviar newsletter');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 O servidor não está rodando!');
      console.error('   Execute primeiro: npm start');
    }
    
  } finally {
    // Limpar usuário temporário se foi criado
    if (tempUserCreated && mongoClient) {
      try {
        console.log('\n🧹 Removendo usuário temporário...');
        await mongoClient.db('newsletter').collection('users').deleteOne({ 
          phone: phoneNumber, 
          isTemporary: true 
        });
        console.log('✅ Usuário temporário removido');
      } catch (error) {
        console.error('⚠️  Erro ao remover usuário temporário:', error.message);
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