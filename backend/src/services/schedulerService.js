import cron from 'node-cron';
import { User } from '../models/User.js';
import newsService from './newsService.js';
import aiService from './aiService.js';
import whatsappService from './whatsappService.js';
import developerManager from '../utils/developers.js';
import tempNewsService from './tempNewsService.js';

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  async initialize(db) {
    this.db = db;
    
    cron.schedule('0 6 * * *', async () => {
      console.log('Iniciando coleta diária de notícias...');
      await this.collectAndProcessNews();
    });

    cron.schedule('*/10 * * * *', async () => {
      await this.checkDeliveryTimes();
    });

    console.log('Scheduler inicializado com sucesso');
  }

  async collectAndProcessNews() {
    try {
      console.log('=== COLETA DE NOTÍCIAS ===');
      
      const newNews = await newsService.fetchAllNews(this.db);
      console.log(`${newNews.length} novas notícias coletadas`);

      if (newNews.length === 0) {
        console.log('Nenhuma notícia nova para processar');
        return;
      }

      console.log('=== DETECTANDO DUPLICATAS ===');
      const duplicateGroups = await newsService.detectDuplicates(this.db);
      
      if (duplicateGroups.length > 0) {
        await aiService.processDuplicateGroups(this.db, duplicateGroups);
      }

      console.log('=== PROCESSANDO COM IA ===');
      await aiService.processUnprocessedNews(this.db);

      console.log('Coleta e processamento concluídos!');
      
    } catch (error) {
      console.error('Erro na coleta/processamento:', error);
    }
  }

  async checkDeliveryTimes() {
    if (this.isRunning) return;
    
    try {
      this.isRunning = true;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      console.log(`⏰ Verificando horário de entrega: ${currentTime}`);
      
      let subscribersToDelivery = [];
      
      // Se tem DB, busca usuários normais
      if (this.db) {
        subscribersToDelivery = await User.getSubscribersByTime(this.db, currentTime);
      }
      
      // Adiciona desenvolvedores que devem receber no horário atual
      const developersForCurrentTime = developerManager.getDevelopersForTime(currentTime);
      const devUsers = developersForCurrentTime.map(devPhone => {
        console.log(`🚀 Adicionando desenvolvedor ${devPhone} para receber newsletter às ${currentTime}`);
        return developerManager.createDeveloperUser(devPhone);
      });
      
      subscribersToDelivery = [...subscribersToDelivery, ...devUsers];
      
      if (subscribersToDelivery.length === 0) {
        return;
      }

      console.log(`📨 Enviando newsletter para ${subscribersToDelivery.length} usuários às ${currentTime}`);

      // Busca notícias reais ou de teste
      let topNews;
      if (this.db) {
        topNews = await newsService.getTodayTopNews(this.db);
      } else {
        // Sem DB, usa o serviço temporário que coleta notícias reais
        console.log('📰 Buscando notícias reais dos RSS feeds...');
        topNews = await tempNewsService.getLatestNews();
      }
      
      if (topNews.length === 0) {
        console.log('Nenhuma notícia disponível para envio');
        return;
      }

      if (!whatsappService.isClientConnected()) {
        console.log('WhatsApp não está conectado. Tentando reconectar...');
        await whatsappService.initialize();
      }

      // Gera introdução (com ou sem IA)
      let intro;
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key') {
        intro = await aiService.generateDailyNewsletter(topNews);
      } else {
        const now = new Date();
        const hora = now.getHours().toString().padStart(2, '0');
        const minuto = now.getMinutes().toString().padStart(2, '0');
        
        intro = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🌅 *NEWSLETTER WHATSAPP*\n` +
          `${hora}:${minuto} - Edição Diária\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📰 *${topNews.length} PRINCIPAIS NOTÍCIAS*\n` +
          `_Selecionadas dos melhores portais brasileiros_\n\n` +
          `${topNews.some(n => n.processed) ? '🤖 *Processadas pela IA Gemini*' : '📄 *Conteúdo dos portais*'}\n\n` +
          `Boa leitura! 📖`;
      }
      
      for (const subscriber of subscribersToDelivery) {
        try {
          await whatsappService.sendMessage(subscriber.phone, intro);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await whatsappService.sendNewsToUser(subscriber.phone, topNews, false, this.db);
          
          console.log(`Newsletter enviada para ${subscriber.phone}`);
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          console.error(`Erro ao enviar para ${subscriber.phone}:`, error);
        }
      }

      // Só marca como enviado se tiver DB
      if (this.db && topNews.length > 0) {
        await newsService.markNewsAsSent(this.db, topNews.map(news => news._id));
      }
      
    } catch (error) {
      console.error('Erro no envio programado:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async sendTestNewsletter(phone) {
    try {
      const topNews = await newsService.getTodayTopNews(this.db);
      
      if (topNews.length === 0) {
        return { success: false, message: 'Nenhuma notícia disponível' };
      }

      if (!whatsappService.isClientConnected()) {
        await whatsappService.initialize();
      }

      const intro = await aiService.generateDailyNewsletter(topNews);
      
      await whatsappService.sendMessage(phone, `🧪 *TESTE* - ${intro}`);
      await whatsappService.sendNewsToUser(phone, topNews, false, this.db);
      
      return { success: true, message: 'Newsletter de teste enviada' };
    } catch (error) {
      console.error('Erro no teste:', error);
      return { success: false, message: error.message };
    }
  }

  async forceNewsCollection() {
    console.log('Forçando coleta de notícias...');
    await this.collectAndProcessNews();
  }

  createTestNews() {
    const now = new Date();
    const hora = now.getHours().toString().padStart(2, '0');
    const minuto = now.getMinutes().toString().padStart(2, '0');
    
    return [
      {
        title: "Economia Brasileira em Alta",
        rewrittenContent: `📈 O mercado financeiro brasileiro apresentou forte recuperação nesta ${this.getDayOfWeek()}, com o Ibovespa fechando em alta de 2,3%. Analistas apontam que a confiança dos investidores está retornando devido às novas políticas econômicas implementadas pelo governo.\n\nOs setores de tecnologia e energia renovável lideraram os ganhos, com destaque para empresas de e-commerce e startups de energia solar.`,
        source: "Portal Econômico",
        originalUrl: "https://exemplo.com/economia-alta",
        imageUrl: null
      },
      {
        title: "Nova Descoberta Científica no Brasil",
        rewrittenContent: `🔬 Pesquisadores da Universidade de São Paulo fizeram uma descoberta revolucionária na área de biotecnologia. O novo método desenvolvido promete acelerar a produção de medicamentos em até 40%.\n\nA pesquisa, que durou 3 anos, pode transformar a indústria farmacêutica nacional e colocar o Brasil como referência mundial em biotecnologia médica.`,
        source: "Ciência Hoje",
        originalUrl: "https://exemplo.com/descoberta-cientifica",
        imageUrl: null
      },
      {
        title: "Tecnologia Sustentável Ganha Espaço",
        rewrittenContent: `🌱 Empresas brasileiras investem cada vez mais em tecnologias sustentáveis. Um novo relatório mostra que os investimentos em energia limpa cresceram 150% no último ano.\n\nStartups de energia solar e eólica lideram o movimento, criando milhares de empregos verdes e reduzindo significativamente as emissões de carbono do país.`,
        source: "Verde News",
        originalUrl: "https://exemplo.com/tecnologia-sustentavel",
        imageUrl: null
      },
      {
        title: "Inovação na Educação Digital",
        rewrittenContent: `💻 Plataformas digitais revolucionam o ensino no Brasil. Mais de 2 milhões de estudantes já utilizam novas ferramentas de aprendizado online que combinam inteligência artificial com metodologias pedagógicas inovadoras.\n\nOs resultados mostram melhoria de 30% no aproveitamento escolar, especialmente em matemática e ciências, democratizando o acesso à educação de qualidade.`,
        source: "Educação Digital",
        originalUrl: "https://exemplo.com/educacao-digital",
        imageUrl: null
      }
    ];
  }

  getDayOfWeek() {
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    return days[new Date().getDay()];
  }

  async getSystemStatus() {
    let activeSubscribers = 0;
    let todayNews = 0;
    
    if (this.db) {
      const subscribers = await User.getActiveSubscribers(this.db);
      const news = await newsService.getTodayTopNews(this.db);
      activeSubscribers = subscribers.length;
      todayNews = news.length;
    } else {
      // Modo desenvolvimento
      activeSubscribers = developerManager.getDevelopers().length;
      todayNews = 4; // Sempre 4 notícias de teste
    }
    
    return {
      whatsappConnected: whatsappService.isClientConnected(),
      activeSubscribers,
      todayNews,
      lastCollection: new Date().toISOString()
    };
  }
}

export default new SchedulerService();