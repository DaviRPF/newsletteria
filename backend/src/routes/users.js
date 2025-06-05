import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

export default async function userRoutes(fastify, options) {
  
  fastify.post('/register', async (request, reply) => {
    try {
      const { phone, email, name, timezone = 'America/Sao_Paulo' } = request.body;

      if (!phone || !email || !name) {
        return reply.status(400).send({
          error: 'Phone, email e name são obrigatórios'
        });
      }

      const existingUser = await User.findByPhone(fastify.mongo.db, phone);
      if (existingUser) {
        return reply.status(409).send({
          error: 'Usuário já existe com este telefone'
        });
      }

      const existingEmail = await User.findByEmail(fastify.mongo.db, email);
      if (existingEmail) {
        return reply.status(409).send({
          error: 'Usuário já existe com este email'
        });
      }

      const userData = {
        phone: phone.replace(/\D/g, ''),
        email,
        name,
        timezone,
        subscriptionStatus: 'inactive',
        deliveryTime: '10:00'
      };

      const user = await User.create(fastify.mongo.db, userData);

      return reply.status(201).send({
        message: 'Usuário criado com sucesso',
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          subscriptionStatus: user.subscriptionStatus
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.get('/profile/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;
      
      const user = await User.findByPhone(fastify.mongo.db, phone);
      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        });
      }

      return reply.send({
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          subscriptionStatus: user.subscriptionStatus,
          deliveryTime: user.deliveryTime,
          timezone: user.timezone,
          profileDescription: user.profileDescription || '',
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.put('/delivery-time/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;
      const { deliveryTime } = request.body;

      if (!deliveryTime || !/^\d{1,2}:\d{2}$/.test(deliveryTime)) {
        return reply.status(400).send({
          error: 'Formato de horário inválido. Use HH:MM'
        });
      }

      const user = await User.findByPhone(fastify.mongo.db, phone);
      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        });
      }

      if (user.subscriptionStatus !== 'active') {
        return reply.status(403).send({
          error: 'Usuário precisa ter assinatura ativa'
        });
      }

      await User.updateDeliveryTime(fastify.mongo.db, phone, deliveryTime);

      return reply.send({
        message: 'Horário de entrega atualizado com sucesso',
        deliveryTime
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.get('/subscribers', async (request, reply) => {
    try {
      const subscribers = await User.getActiveSubscribers(fastify.mongo.db);
      
      return reply.send({
        count: subscribers.length,
        subscribers: subscribers.map(sub => ({
          phone: sub.phone,
          name: sub.name,
          deliveryTime: sub.deliveryTime,
          subscriptionStatus: sub.subscriptionStatus
        }))
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.put('/profile-description/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;
      const { profileDescription } = request.body;

      if (typeof profileDescription !== 'string') {
        return reply.status(400).send({
          error: 'Descrição do perfil deve ser um texto'
        });
      }

      if (profileDescription.length > 500) {
        return reply.status(400).send({
          error: 'Descrição do perfil não pode ter mais de 500 caracteres'
        });
      }

      const user = await User.findByPhone(fastify.mongo.db, phone);
      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        });
      }

      await User.updateProfileDescription(fastify.mongo.db, phone, profileDescription);

      return reply.send({
        message: 'Descrição do perfil atualizada com sucesso',
        profileDescription
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });

  fastify.delete('/:phone', async (request, reply) => {
    try {
      const { phone } = request.params;

      const result = await fastify.mongo.db.collection('users').deleteOne({ phone });

      if (result.deletedCount === 0) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        });
      }

      return reply.send({
        message: 'Usuário removido com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro interno do servidor'
      });
    }
  });
}