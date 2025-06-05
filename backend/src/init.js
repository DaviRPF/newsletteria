import whatsappService from './services/whatsappService.js';
import schedulerService from './services/schedulerService.js';

export async function initializeServices(fastify) {
  try {
    console.log('🚀 Inicializando serviços...');
    
    console.log('📱 Conectando WhatsApp...');
    await whatsappService.initialize();
    // whatsappService.setDatabase(fastify.mongo.db);
    
    console.log('⏰ Inicializando scheduler...');
    await schedulerService.initialize(null); // Inicia sem DB para desenvolvedores
    
    console.log('✅ Todos os serviços inicializados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error);
    throw error;
  }
}