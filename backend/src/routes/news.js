import { News } from '../models/News.js';
import newsService from '../services/newsService.js';
import aiService from '../services/aiService.js';
import schedulerService from '../services/schedulerService.js';

export default async function newsRoutes(fastify, options) {

  fastify.get('/today', async (request, reply) => {
    try {
      const { date } = request.query;
      const targetDate = date ? new Date(date) : new Date();
      
      const news = await newsService.getTodayTopNews(fastify.mongo.db, targetDate);
      
      return reply.send({
        date: targetDate.toDateString(),
        count: news.length,
        news: news.map(article => ({
          id: article._id,
          title: article.title,
          source: article.source,
          relevanceScore: article.relevanceScore,
          rewrittenContent: article.rewrittenContent,
          originalUrl: article.originalUrl,
          imageUrl: article.imageUrl,
          pubDate: article.pubDate
        }))
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao buscar notícias'
      });
    }
  });

  fastify.get('/all', async (request, reply) => {
    try {
      const { page = 1, limit = 20, source, processed } = request.query;
      
      const filter = {};
      if (source) filter.source = source;
      if (processed !== undefined) filter.processed = processed === 'true';

      const skip = (page - 1) * limit;
      
      const news = await fastify.mongo.db.collection('news')
        .find(filter)
        .sort({ pubDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      const total = await fastify.mongo.db.collection('news').countDocuments(filter);

      return reply.send({
        news,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao buscar notícias'
      });
    }
  });

  fastify.get('/stats', async (request, reply) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const [
        totalNews,
        todayNews,
        processedNews,
        sentNews
      ] = await Promise.all([
        fastify.mongo.db.collection('news').countDocuments(),
        fastify.mongo.db.collection('news').countDocuments({
          pubDate: { $gte: startOfDay, $lte: endOfDay }
        }),
        fastify.mongo.db.collection('news').countDocuments({
          processed: true
        }),
        fastify.mongo.db.collection('news').countDocuments({
          sent: true
        })
      ]);

      const sourceStats = await fastify.mongo.db.collection('news').aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            avgScore: { $avg: '$relevanceScore' }
          }
        }
      ]).toArray();

      return reply.send({
        totalNews,
        todayNews,
        processedNews,
        sentNews,
        sourceStats,
        processingRate: totalNews > 0 ? (processedNews / totalNews * 100).toFixed(2) : 0
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao buscar estatísticas'
      });
    }
  });

  fastify.post('/collect', async (request, reply) => {
    try {
      await schedulerService.forceNewsCollection();
      
      return reply.send({
        message: 'Coleta de notícias iniciada com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao iniciar coleta de notícias'
      });
    }
  });

  fastify.post('/process', async (request, reply) => {
    try {
      await aiService.processUnprocessedNews(fastify.mongo.db);
      
      return reply.send({
        message: 'Processamento de notícias iniciado com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao processar notícias'
      });
    }
  });

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const news = await fastify.mongo.db.collection('news').findOne({
        _id: fastify.mongo.ObjectId(id)
      });

      if (!news) {
        return reply.status(404).send({
          error: 'Notícia não encontrada'
        });
      }

      return reply.send({ news });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao buscar notícia'
      });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const result = await fastify.mongo.db.collection('news').deleteOne({
        _id: fastify.mongo.ObjectId(id)
      });

      if (result.deletedCount === 0) {
        return reply.status(404).send({
          error: 'Notícia não encontrada'
        });
      }

      return reply.send({
        message: 'Notícia removida com sucesso'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao remover notícia'
      });
    }
  });

  fastify.put('/:id/score', async (request, reply) => {
    try {
      const { id } = request.params;
      const { score } = request.body;

      if (score < 0 || score > 100) {
        return reply.status(400).send({
          error: 'Score deve estar entre 0 e 100'
        });
      }

      const result = await fastify.mongo.db.collection('news').updateOne(
        { _id: fastify.mongo.ObjectId(id) },
        { $set: { relevanceScore: score } }
      );

      if (result.matchedCount === 0) {
        return reply.status(404).send({
          error: 'Notícia não encontrada'
        });
      }

      return reply.send({
        message: 'Score atualizado com sucesso',
        score
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erro ao atualizar score'
      });
    }
  });
}