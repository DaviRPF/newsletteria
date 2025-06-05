import whatsappService from '../services/whatsappService.js';
import schedulerService from '../services/schedulerService.js';
import { User } from '../models/User.js';

export default async function whatsappRoutes(fastify, options) {

  fastify.get('/status', async (request, reply) => {
    try {
      const connectionInfo = await whatsappService.getConnectionInfo();
      const systemStatus = await schedulerService.getSystemStatus();
      
      return reply.send({
        whatsapp: connectionInfo,
        system: systemStatus
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao verificar status'
      });
    }
  });

  fastify.post('/connect', async (request, reply) => {
    try {
      if (whatsappService.isClientConnected()) {
        return reply.send({
          message: 'WhatsApp já está conectado'
        });
      }

      await whatsappService.initialize();
      whatsappService.setDatabase(fastify.mongo.db);
      
      return reply.send({
        message: 'Conexão com WhatsApp iniciada com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao conectar WhatsApp'
      });
    }
  });

  fastify.post('/reconnect', async (request, reply) => {
    try {
      const success = await whatsappService.reconnect();
      
      if (success) {
        whatsappService.setDatabase(fastify.mongo.db);
        return reply.send({
          message: 'Reconexão com WhatsApp realizada com sucesso'
        });
      } else {
        return reply.status(500).send({
          error: 'Falha na reconexão com WhatsApp'
        });
      }

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao reconectar WhatsApp'
      });
    }
  });

  fastify.post('/send-test/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;

      if (!whatsappService.isClientConnected()) {
        return reply.status(400).send({
          error: 'WhatsApp não está conectado'
        });
      }

      const result = await schedulerService.sendTestNewsletter(phone);
      
      if (result.success) {
        return reply.send({
          message: result.message
        });
      } else {
        return reply.status(400).send({
          error: result.message
        });
      }

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao enviar teste'
      });
    }
  });

  fastify.post('/send-message', async (request, reply) => {
    try {
      const { phone, message } = request.body;

      if (!phone || !message) {
        return reply.status(400).send({
          error: 'Phone e message são obrigatórios'
        });
      }

      if (!whatsappService.isClientConnected()) {
        return reply.status(400).send({
          error: 'WhatsApp não está conectado'
        });
      }

      await whatsappService.sendMessage(phone, message);
      
      return reply.send({
        message: 'Mensagem enviada com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao enviar mensagem'
      });
    }
  });

  fastify.post('/send-newsletter-now', async (request, reply) => {
    try {
      const { phones } = request.body;

      if (!whatsappService.isClientConnected()) {
        return reply.status(400).send({
          error: 'WhatsApp não está conectado'
        });
      }

      let subscribers;
      
      if (phones && phones.length > 0) {
        subscribers = [];
        for (const phone of phones) {
          const user = await User.findByPhone(fastify.mongo.db, phone);
          if (user && user.subscriptionStatus === 'active') {
            subscribers.push(user);
          }
        }
      } else {
        subscribers = await User.getActiveSubscribers(fastify.mongo.db);
      }

      if (subscribers.length === 0) {
        return reply.status(400).send({
          error: 'Nenhum assinante ativo encontrado'
        });
      }

      const news = await fastify.mongo.db.collection('news')
        .find({ processed: true })
        .sort({ relevanceScore: -1 })
        .limit(4)
        .toArray();

      if (news.length === 0) {
        return reply.status(400).send({
          error: 'Nenhuma notícia processada disponível'
        });
      }

      fastify.log.info(`Enviando newsletter para ${subscribers.length} assinantes`);
      
      whatsappService.sendBulkNews(subscribers, news, fastify.mongo.db).catch(err => {
        fastify.log.error('Erro no envio em massa:', err);
      });

      return reply.send({
        message: `Newsletter sendo enviada para ${subscribers.length} assinantes`,
        subscribersCount: subscribers.length,
        newsCount: news.length
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao enviar newsletter'
      });
    }
  });

  fastify.post('/update-time/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;
      const { time } = request.body;

      if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
        return reply.status(400).send({
          error: 'Formato de horário inválido. Use HH:MM'
        });
      }

      await whatsappService.updateUserTime(phone, time, fastify.mongo.db);
      
      return reply.send({
        message: 'Horário atualizado com sucesso via WhatsApp'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao atualizar horário'
      });
    }
  });

  fastify.get('/delivery-stats', async (request, reply) => {
    try {
      const timeStats = await fastify.mongo.db.collection('users').aggregate([
        {
          $match: { subscriptionStatus: 'active' }
        },
        {
          $group: {
            _id: '$deliveryTime',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray();

      return reply.send({
        timeStats: timeStats.map(stat => ({
          time: stat._id,
          subscribers: stat.count
        }))
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao buscar estatísticas de entrega'
      });
    }
  });

  fastify.post('/broadcast', async (request, reply) => {
    try {
      const { message, targetAudience = 'all' } = request.body;

      if (!message) {
        return reply.status(400).send({
          error: 'Mensagem é obrigatória'
        });
      }

      if (!whatsappService.isClientConnected()) {
        return reply.status(400).send({
          error: 'WhatsApp não está conectado'
        });
      }

      let filter = { subscriptionStatus: 'active' };
      
      if (targetAudience === 'trial') {
        filter.trialEndDate = { $gt: new Date() };
      } else if (targetAudience === 'paid') {
        filter.trialEndDate = { $lt: new Date() };
      }

      const subscribers = await fastify.mongo.db.collection('users').find(filter).toArray();

      if (subscribers.length === 0) {
        return reply.status(400).send({
          error: 'Nenhum assinante encontrado para o público alvo'
        });
      }

      fastify.log.info(`Enviando broadcast para ${subscribers.length} assinantes`);

      for (const subscriber of subscribers) {
        try {
          await whatsappService.sendMessage(subscriber.phone, message);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          fastify.log.error(`Erro ao enviar broadcast para ${subscriber.phone}:`, error);
        }
      }

      return reply.send({
        message: `Broadcast enviado para ${subscribers.length} assinantes`,
        subscribersCount: subscribers.length
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao enviar broadcast'
      });
    }
  });
}