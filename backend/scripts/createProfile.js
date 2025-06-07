import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

// Configurar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Verificar parâmetros
const phoneNumber = process.argv[2];
const profileDescription = process.argv[3];

if (!phoneNumber || !profileDescription) {
  console.error('❌ Uso: node createProfile.js <número> "<descrição>"');
  console.error('   Exemplo: node createProfile.js 558496059942 "gosto de tecnologia e esportes"');
  process.exit(1);
}

console.log(`\n👤 Criando perfil para: ${phoneNumber}`);
console.log(`📝 Descrição: "${profileDescription}"`);
console.log('─'.repeat(50));

async function createProfile() {
  let mongoClient;
  
  try {
    // Conectar ao MongoDB
    console.log('🔗 Conectando ao MongoDB...');
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter';
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    const db = mongoClient.db('newsletter');
    console.log('✅ MongoDB conectado');
    
    // Verificar se usuário já existe
    const existingUser = await db.collection('users').findOne({ phone: phoneNumber });
    
    if (existingUser) {
      console.log('📋 Usuário já existe - atualizando perfil...');
      
      await db.collection('users').updateOne(
        { phone: phoneNumber },
        { 
          $set: { 
            profileDescription: profileDescription,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Perfil atualizado com sucesso!');
    } else {
      console.log('👤 Criando novo usuário...');
      
      const newUser = {
        phone: phoneNumber,
        email: `user_${phoneNumber}@temp.com`,
        name: 'Usuário Desenvolvedor',
        subscriptionStatus: 'active',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        deliveryTime: '10:00',
        timezone: 'America/Sao_Paulo',
        profileDescription: profileDescription,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeveloper: true
      };
      
      await db.collection('users').insertOne(newUser);
      console.log('✅ Usuário criado com sucesso!');
    }
    
    console.log('\n🎯 Agora o usuário receberá notícias personalizadas!');
    console.log('📨 Para testar, envie "l" do WhatsApp');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔒 Conexão MongoDB fechada');
    }
  }
}

// Executar
createProfile();