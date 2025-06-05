import dotenv from 'dotenv';
dotenv.config(); // Carrega .env PRIMEIRO!

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import mongodb from '@fastify/mongodb';
import userRoutes from './routes/users.js';
import subscriptionRoutes from './routes/subscriptions.js';
import newsRoutes from './routes/news.js';
import whatsappRoutes from './routes/whatsapp-simple.js';
import { initializeServices } from './init.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

// MongoDB temporariamente desabilitado para testar WhatsApp
// await fastify.register(mongodb, {
//   forceClose: true,
//   url: process.env.MONGODB_URL || 'mongodb://localhost:27017/newsletter'
// });

// await fastify.register(userRoutes, { prefix: '/api/users' });
// await fastify.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
// await fastify.register(newsRoutes, { prefix: '/api/news' });
await fastify.register(whatsappRoutes, { prefix: '/api/whatsapp' });

fastify.get('/', async (request, reply) => {
  return { message: 'Newsletter WhatsApp API', version: '1.0.0', status: 'running' };
});

fastify.get('/health', async (request, reply) => {
  return { 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
});

const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3000,
      host: '0.0.0.0'
    });
    
    console.log('✅ Servidor rodando na porta', process.env.PORT || 3000);
    
    setTimeout(async () => {
      try {
        await initializeServices(fastify);
      } catch (error) {
        console.error('Erro na inicialização dos serviços:', error);
      }
    }, 2000);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();