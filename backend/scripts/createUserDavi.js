import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

async function createUserDavi() {
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter';
  
  console.log('🔗 Conectando ao MongoDB...');
  console.log('📍 URL:', mongoUrl);
  
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
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias de acesso
      deliveryTime: '10:00',
      timezone: 'America/Sao_Paulo',
      profileDescription: 'Desenvolvedor interessado em tecnologia, programação e inovação',
      createdAt: new Date(),
      updatedAt: new Date(),
      isAdmin: true,
      isDeveloper: true
    };
    
    // Verifica se o usuário já existe
    const existingUser = await usersCollection.findOne({ phone: userData.phone });
    
    if (existingUser) {
      console.log('⚠️  Usuário já existe! Atualizando dados...');
      
      const updateResult = await usersCollection.updateOne(
        { phone: userData.phone },
        { 
          $set: {
            email: userData.email,
            name: userData.name,
            subscriptionStatus: userData.subscriptionStatus,
            trialEndDate: userData.trialEndDate,
            deliveryTime: userData.deliveryTime,
            profileDescription: userData.profileDescription,
            updatedAt: new Date(),
            isAdmin: true,
            isDeveloper: true
          }
        }
      );
      
      console.log('✅ Usuário atualizado com sucesso!');
      console.log('📝 Documentos modificados:', updateResult.modifiedCount);
      
      // Busca e exibe os dados atualizados
      const updatedUser = await usersCollection.findOne({ phone: userData.phone });
      console.log('📋 Dados atualizados:');
      console.log(JSON.stringify(updatedUser, null, 2));
      
    } else {
      // Cria o usuário
      const result = await usersCollection.insertOne(userData);
      console.log('✅ Usuário criado com sucesso!');
      console.log('🆔 ID:', result.insertedId);
      console.log('📋 Dados do usuário:');
      console.log(JSON.stringify(userData, null, 2));
    }
    
    // Verifica se a coleção foi criada
    const collections = await db.listCollections().toArray();
    console.log('📚 Coleções disponíveis:', collections.map(c => c.name));
    
    // Conta total de usuários
    const userCount = await usersCollection.countDocuments();
    console.log('👥 Total de usuários no banco:', userCount);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    console.error('🔍 Detalhes:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

// Executa a função
createUserDavi().catch(console.error);