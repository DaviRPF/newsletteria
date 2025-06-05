import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkUserProfile() {
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter';
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db();
    const user = await db.collection('users').findOne({ phone: '558481843434' });
    
    if (user) {
      console.log('👤 Usuário encontrado:');
      console.log('📱 Phone:', user.phone);
      console.log('👤 Nome:', user.name);
      console.log('📧 Email:', user.email);
      console.log('📝 Profile Description:', user.profileDescription || '(VAZIO)');
      console.log('✅ Status:', user.subscriptionStatus);
      console.log('🕒 Created:', user.createdAt);
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.close();
  }
}

checkUserProfile().catch(console.error);