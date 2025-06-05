import aiService from './aiService.js';
import categoryService from './categoryService.js';

class NewsDistributionService {
  constructor() {
    this.userInterestCache = new Map(); // Cache dos interesses do usuário
  }

  // Analisa o perfil do usuário UMA VEZ e cacheia o resultado
  async getUserInterests(userProfile) {
    if (!userProfile || !userProfile.profileDescription) {
      return ['politica']; // Padrão
    }

    const profileKey = userProfile.profileDescription.trim();
    
    // Verifica cache primeiro
    if (this.userInterestCache.has(profileKey)) {
      const cached = this.userInterestCache.get(profileKey);
      console.log(`🎯 Usando interesses em cache: ${cached.join(', ')}`);
      return cached;
    }

    // Analisa com IA uma única vez
    console.log(`🤖 Analisando perfil do usuário com IA...`);
    const interests = await aiService.analyzeUserInterests(userProfile.profileDescription);
    
    // Cacheia o resultado por 7 dias
    this.userInterestCache.set(profileKey, interests);
    setTimeout(() => {
      this.userInterestCache.delete(profileKey);
    }, 7 * 24 * 60 * 60 * 1000); // 7 dias

    return interests;
  }

  // Distribui as 6 notícias baseado nos interesses do usuário
  calculateNewsDistribution(userInterests) {
    const totalNews = 6;
    
    if (userInterests.length === 1) {
      // Só política: todas as 6 notícias são políticas
      return {
        'politica': 6
      };
    }

    if (userInterests.length === 2) {
      // Política + 1 interesse: 3 de cada
      return {
        [userInterests[0]]: 3,
        [userInterests[1]]: 3
      };
    }

    if (userInterests.length === 3) {
      // 3 interesses: 2-2-2
      return {
        [userInterests[0]]: 2,
        [userInterests[1]]: 2,
        [userInterests[2]]: 2
      };
    }

    if (userInterests.length === 4) {
      // 4 interesses: política tem prioridade (2), outros têm 1-1-2
      return {
        'politica': 2,
        [userInterests[1]]: 2,
        [userInterests[2]]: 1,
        [userInterests[3]]: 1
      };
    }

    // Fallback: só política
    return {
      'politica': 6
    };
  }

  // Coleta notícias distribuídas por categoria
  async collectCategorizedNews(userInterests, distribution) {
    console.log(`📊 Distribuição de notícias:`, distribution);
    
    const categorizedNews = {};
    
    for (const [category, count] of Object.entries(distribution)) {
      console.log(`🔍 Coletando ${count} notícias de ${category}...`);
      
      try {
        // Usa as fontes específicas da categoria
        const sources = categoryService.getKnownBrazilianSources(category);
        
        if (sources.length === 0) {
          console.log(`⚠️ Nenhuma fonte para categoria ${category}, usando fontes gerais`);
          continue;
        }

        // Coleta notícias das fontes da categoria
        const categoryNews = await this.collectFromCategorySources(sources, count * 2); // Coleta 2x mais para ter opções
        
        categorizedNews[category] = categoryNews.slice(0, count); // Pega só a quantidade necessária
        
      } catch (error) {
        console.error(`❌ Erro ao coletar notícias de ${category}:`, error.message);
        categorizedNews[category] = [];
      }
    }

    return categorizedNews;
  }

  // Coleta notícias de fontes específicas de uma categoria
  async collectFromCategorySources(sources, maxNews) {
    const newsService = await import('./newsService.js');
    const news = [];

    for (const source of sources.slice(0, 3)) { // Usa só as 3 primeiras fontes por categoria
      try {
        console.log(`   📰 Coletando de: ${source.name}`);
        const sourceNews = await newsService.default.fetchNewsFromSource(source);
        
        // Filtra notícias das últimas 24 horas
        const recentNews = sourceNews.filter(item => {
          if (!item.pubDate) return false;
          const pubDate = new Date(item.pubDate);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return !isNaN(pubDate.getTime()) && pubDate > twentyFourHoursAgo;
        });

        news.push(...recentNews);
        
        if (news.length >= maxNews) break; // Para quando tem notícias suficientes
        
      } catch (error) {
        console.log(`   ⚠️ Erro em ${source.name}: ${error.message}`);
      }
    }

    // Remove duplicatas e ordena por data
    const uniqueNews = this.removeDuplicates(news);
    const sortedNews = uniqueNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    console.log(`   ✅ ${sortedNews.length} notícias coletadas`);
    return sortedNews;
  }

  // Remove notícias duplicadas baseado no título
  removeDuplicates(news) {
    const seen = new Set();
    return news.filter(item => {
      const normalizedTitle = item.title?.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (!normalizedTitle || seen.has(normalizedTitle)) {
        return false;
      }
      seen.add(normalizedTitle);
      return true;
    });
  }

  // Combina todas as notícias categorizadas em uma lista final de 6
  combineNews(categorizedNews, distribution) {
    const finalNews = [];
    
    // Adiciona notícias na ordem de prioridade (política primeiro)
    const priorityOrder = ['politica', 'economia', 'tecnologia', 'esporte', 'futebol', 'saude', 'educacao', 'cultura', 'entretenimento'];
    
    for (const category of priorityOrder) {
      if (categorizedNews[category] && distribution[category]) {
        const needed = distribution[category];
        const available = categorizedNews[category].slice(0, needed);
        
        console.log(`📰 Adicionando ${available.length}/${needed} notícias de ${category}`);
        finalNews.push(...available);
      }
    }

    // Se não conseguiu 6 notícias, completa com notícias gerais de política
    if (finalNews.length < 6 && categorizedNews['politica']) {
      const remaining = 6 - finalNews.length;
      const extraPolitics = categorizedNews['politica'].slice(distribution['politica'] || 0, (distribution['politica'] || 0) + remaining);
      finalNews.push(...extraPolitics);
    }

    return finalNews.slice(0, 6); // Garante que são exatamente 6
  }

  // Método principal: coleta notícias otimizada por interesse do usuário
  async getPersonalizedNews(userProfile) {
    try {
      // 1. Analisa interesses do usuário (uma única chamada de IA)
      const userInterests = await this.getUserInterests(userProfile);
      
      // 2. Calcula distribuição de notícias
      const distribution = this.calculateNewsDistribution(userInterests);
      
      // 3. Coleta notícias de cada categoria
      const categorizedNews = await this.collectCategorizedNews(userInterests, distribution);
      
      // 4. Combina em lista final de 6 notícias
      const finalNews = this.combineNews(categorizedNews, distribution);
      
      console.log(`✅ ${finalNews.length} notícias personalizadas coletadas`);
      return finalNews;
      
    } catch (error) {
      console.error('❌ Erro na coleta personalizada:', error);
      
      // Fallback: coleta notícias gerais
      const newsService = await import('./newsService.js');
      return await newsService.default.fetchAllNews(null, null);
    }
  }

  // Limpa o cache quando necessário
  clearCache() {
    this.userInterestCache.clear();
    console.log('🗑️ Cache de interesses limpo');
  }
}

export default new NewsDistributionService();