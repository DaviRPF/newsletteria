import whatsappService from '../services/whatsappService.js';

export default async function whatsappRoutes(fastify, options) {

  // Status da conexão
  fastify.get('/status', async (request, reply) => {
    try {
      const isConnected = whatsappService.isClientConnected();
      
      return reply.send({
        whatsappConnected: isConnected,
        message: isConnected ? 'WhatsApp conectado!' : 'WhatsApp desconectado'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao verificar status'
      });
    }
  });

  // Conectar WhatsApp
  fastify.post('/connect', async (request, reply) => {
    try {
      if (whatsappService.isClientConnected()) {
        return reply.send({
          message: 'WhatsApp já está conectado'
        });
      }

      await whatsappService.initialize();
      
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

  // Enviar mensagem simples
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

  // Reconectar
  fastify.post('/reconnect', async (request, reply) => {
    try {
      const success = await whatsappService.reconnect();
      
      if (success) {
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

  // Teste simples
  fastify.get('/test', async (request, reply) => {
    return reply.send({
      message: 'API WhatsApp funcionando!',
      endpoints: [
        'GET /api/whatsapp/status',
        'POST /api/whatsapp/connect',
        'POST /api/whatsapp/send-message',
        'POST /api/whatsapp/reconnect'
      ]
    });
  });
}