import mercadopago from 'mercadopago';
import { User } from '../models/User.js';

// Só configura se tiver token
if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
  mercadopago.configure({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
  });
}

export default async function subscriptionRoutes(fastify, options) {

  fastify.post('/create-preference', async (request, reply) => {
    try {
      const { phone, email, name } = request.body;

      if (!phone || !email || !name) {
        return reply.status(400).send({
          error: 'Phone, email e name são obrigatórios'
        });
      }

      const user = await User.findByPhone(fastify.mongo.db, phone);
      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado. Registre-se primeiro.'
        });
      }

      const preference = {
        items: [
          {
            title: 'Newsletter WhatsApp - Assinatura Mensal',
            description: 'Receba as principais notícias diariamente no seu WhatsApp',
            unit_price: 5.00,
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: name,
          email: email,
          phone: {
            number: phone
          }
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success`,
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`
        },
        auto_return: 'approved',
        external_reference: phone,
        notification_url: `${process.env.BACKEND_URL}/api/subscriptions/webhook`,
        statement_descriptor: 'Newsletter WhatsApp',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await mercadopago.preferences.create(preference);

      return reply.send({
        preferenceId: response.body.id,
        initPoint: response.body.init_point,
        sandboxInitPoint: response.body.sandbox_init_point
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao criar preferência de pagamento'
      });
    }
  });

  fastify.post('/webhook', async (request, reply) => {
    try {
      const { type, data } = request.body;

      if (type === 'payment') {
        const paymentId = data.id;
        
        const payment = await mercadopago.payment.findById(paymentId);
        const paymentData = payment.body;

        console.log('Webhook recebido:', paymentData.status, paymentData.external_reference);

        if (paymentData.status === 'approved') {
          const phone = paymentData.external_reference;
          
          if (phone) {
            const trialStartDate = new Date();
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 2);

            await User.updateSubscription(fastify.mongo.db, phone, {
              subscriptionStatus: 'active',
              subscriptionId: paymentData.id,
              trialStartDate: trialStartDate,
              trialEndDate: trialEndDate
            });

            console.log(`Assinatura ativada para ${phone} com trial até ${trialEndDate}`);
          }
        } else if (paymentData.status === 'cancelled' || paymentData.status === 'refunded') {
          const phone = paymentData.external_reference;
          
          if (phone) {
            await User.updateSubscription(fastify.mongo.db, phone, {
              subscriptionStatus: 'cancelled'
            });

            console.log(`Assinatura cancelada para ${phone}`);
          }
        }
      }

      return reply.status(200).send({ received: true });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro no processamento do webhook'
      });
    }
  });

  fastify.get('/status/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;

      const user = await User.findByPhone(fastify.mongo.db, phone);
      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        });
      }

      const now = new Date();
      let subscriptionStatus = user.subscriptionStatus;

      if (subscriptionStatus === 'active' && user.trialEndDate && now > user.trialEndDate) {
        subscriptionStatus = 'expired';
        
        await User.updateSubscription(fastify.mongo.db, phone, {
          subscriptionStatus: 'expired'
        });
      }

      return reply.send({
        subscriptionStatus,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        isInTrial: user.trialEndDate && now < user.trialEndDate,
        daysLeft: user.trialEndDate ? Math.ceil((user.trialEndDate - now) / (1000 * 60 * 60 * 24)) : 0
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.post('/cancel/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;

      const user = await User.findByPhone(fastify.mongo.db, phone);
      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        });
      }

      await User.updateSubscription(fastify.mongo.db, phone, {
        subscriptionStatus: 'cancelled'
      });

      return reply.send({
        message: 'Assinatura cancelada com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.post('/reactivate/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;

      const user = await User.findByPhone(fastify.mongo.db, phone);
      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        });
      }

      if (user.subscriptionStatus === 'active') {
        return reply.status(400).send({
          error: 'Assinatura já está ativa'
        });
      }

      await User.updateSubscription(fastify.mongo.db, phone, {
        subscriptionStatus: 'active'
      });

      return reply.send({
        message: 'Assinatura reativada com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.get('/stats', async (request, reply) => {
    try {
      const totalUsers = await fastify.mongo.db.collection('users').countDocuments();
      const activeSubscriptions = await fastify.mongo.db.collection('users').countDocuments({
        subscriptionStatus: 'active'
      });
      const trialUsers = await fastify.mongo.db.collection('users').countDocuments({
        subscriptionStatus: 'active',
        trialEndDate: { $gt: new Date() }
      });

      return reply.send({
        totalUsers,
        activeSubscriptions,
        trialUsers,
        conversionRate: totalUsers > 0 ? (activeSubscriptions / totalUsers * 100).toFixed(2) : 0
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });
}