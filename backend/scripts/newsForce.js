import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { createRequire } from 'module';

// Configurar require para módulos CommonJS
const require = createRequire(import.meta.url);

// Configurar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Verificar parâmetros
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('❌ Uso: node newsForce.js <número_telefone>');
  console.error('   Exemplo: node newsForce.js 558481843434');
  process.exit(1);
}

// Validar formato do número
if (!phoneNumber.match(/^\d+$/)) {
  console.error('❌ Número inválido! Use apenas dígitos (ex: 558481843434)');
  process.exit(1);
}

console.log(`\n📱 Forçando newsletter DIRETAMENTE para: ${phoneNumber}`);
console.log('─'.repeat(50));

// Importar o client Venom diretamente
async function getVenomClient() {
  try {
    // Procurar a sessão Venom existente
    const venom = require('venom-bot');
    const sessionsPath = join(__dirname, '../tokens');
    
    // Tentar usar cliente existente
    const client = await venom.create({
      session: 'newsletter-session',
      folderNameToken: 'tokens',
      multidevice: true,
      disableWelcome: true,
      updatesLog: false,
      autoClose: 0,
      useChrome: false,
      headless: true
    });
    
    return client;
  } catch (error) {
    console.error('❌ Erro ao obter cliente Venom:', error.message);
    return null;
  }
}

async function forceNewsletter() {
  let mongoClient;
  
  try {
    // 1. Conectar ao MongoDB
    console.log('🔗 Conectando ao MongoDB...');
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter';
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    const db = mongoClient.db('newsletter');
    console.log('✅ MongoDB conectado');
    
    // 2. Importar serviços necessários
    console.log('📦 Importando serviços...');
    const whatsappService = (await import('../src/services/whatsappService.js')).default;
    const tempNewsService = (await import('../src/services/tempNewsService.js')).default;
    const { User } = await import('../src/models/User.js');
    
    // 3. Configurar database
    whatsappService.setDatabase(db);
    
    // 4. Verificar se WhatsApp está conectado
    if (!whatsappService.isClientConnected()) {
      console.log('⚠️  WhatsApp não conectado via serviço principal');
      console.log('🔄 Tentando conexão direta...');
      
      // Tentar obter cliente diretamente
      const client = await getVenomClient();
      if (!client) {
        throw new Error('Não foi possível conectar ao WhatsApp');
      }
      
      whatsappService.client = client;
      whatsappService.isConnected = true;
    }
    
    // 5. Buscar perfil do usuário
    console.log('\n🔍 Buscando perfil do usuário...');
    const userProfile = await User.findByPhone(db, phoneNumber);
    
    if (userProfile) {
      console.log(`✅ Usuário: ${userProfile.name || 'Sem nome'}`);
      if (userProfile.profileDescription) {
        console.log(`📝 Perfil: ${userProfile.profileDescription.substring(0, 60)}...`);
      }
    } else {
      console.log('⚠️  Usuário não cadastrado');
    }
    
    // 6. Forçar coleta de notícias
    console.log('\n📰 Coletando notícias personalizadas...');
    await tempNewsService.forceUpdate(userProfile);
    const news = tempNewsService.cachedNews;
    
    if (news.length === 0) {
      console.log('⚠️  Nenhuma notícia disponível');
      console.log('📰 Usando notícias de exemplo...');
      const testNews = whatsappService.getTestNews();
      await whatsappService.sendNewsToUser(phoneNumber, testNews, true, db);
    } else {
      console.log(`✅ ${news.length} notícias encontradas`);
      const newsToSend = news.slice(0, 6);
      
      // 7. Enviar newsletter
      console.log('\n📤 Enviando newsletter com imagens...');
      await whatsappService.sendMessage(phoneNumber, '🚀 *Sua newsletter personalizada está chegando...*');
      await whatsappService.sendNewsToUser(phoneNumber, newsToSend, true, db);
    }
    
    console.log('\n✅ Newsletter enviada com sucesso!');
    console.log('📲 Verifique o WhatsApp');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
    
    if (error.message.includes('Cannot find module')) {
      console.error('\n💡 Módulo não encontrado. Certifique-se de que o servidor está rodando.');
    }
    
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔒 Conexão MongoDB fechada');
    }
    
    // Aguardar antes de sair
    await new Promise(resolve => setTimeout(resolve, 3000));
    process.exit(0);
  }
}

// Executar
forceNewsletter().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});