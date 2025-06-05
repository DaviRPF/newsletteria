import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

async function createUser() {
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter-whatsapp';
  
  console.log('🔗 Conectando ao MongoDB...');
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    const userData = {
      phone: '558481843434',
      email: 'davirdr344@gmail.com',
      name: 'Davi',
      subscriptionStatus: 'active',
      subscriptionId: null,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias de trial
      deliveryTime: '10:00',
      timezone: 'America/Sao_Paulo',
      profileDescription: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Verifica se o usuário já existe
    const existingUser = await usersCollection.findOne({ phone: userData.phone });
    
    if (existingUser) {
      console.log('⚠️  Usuário já existe!');
      console.log('📋 Dados do usuário:');
      console.log(existingUser);
    } else {
      // Cria o usuário
      const result = await usersCollection.insertOne(userData);
      console.log('✅ Usuário criado com sucesso!');
      console.log('🆔 ID:', result.insertedId);
      console.log('📋 Dados do usuário:');
      console.log(userData);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexão fechada');
  }
}

createUser();