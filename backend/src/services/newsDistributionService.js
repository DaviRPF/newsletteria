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
    const hasPolitics = userInterests.includes('politica');
    
    // Se não tem política nos interesses, adiciona 1 obrigatória + distribui o resto
    if (!hasPolitics && userInterests.length > 0) {
      const distribution = { 'politica': 1 }; // 1 obrigatória
      const remainingNews = 5; // Sobram 5 notícias
      const otherInterests = userInterests.slice(0, 3); // Máximo 3 outros interesses
      
      if (otherInterests.length === 1) {
        distribution[otherInterests[0]] = 5; // 1 política + 5 do interesse
      } else if (otherInterests.length === 2) {
        distribution[otherInterests[0]] = 3; // 1 política + 3 + 2
        distribution[otherInterests[1]] = 2;
      } else if (otherInterests.length === 3) {
        distribution[otherInterests[0]] = 2; // 1 política + 2 + 2 + 1
        distribution[otherInterests[1]] = 2;
        distribution[otherInterests[2]] = 1;
      }
      
      return distribution;
    }
    
    // Se tem política explicitamente ou nenhum interesse
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

        // Coleta notícias das fontes da categoria (mais para compensar filtros rigorosos)
        let categoryNews = await this.collectFromCategorySources(sources, count * 5); // Coleta 5x mais para ter opções
        
        // Filtra por relevância da categoria usando IA
        let relevantNews = await this.filterNewsByCategoryAI(categoryNews, category);
        console.log(`   🎯 ${relevantNews.length}/${categoryNews.length} notícias relevantes para ${category}`);
        
        // Se não tem notícias suficientes, tenta coletar de todas as fontes da categoria
        if (relevantNews.length < count && sources.length > 3) {
          console.log(`   🔄 Tentando coletar de mais fontes (${sources.length} disponíveis)...`);
          const allCategoryNews = await this.collectFromCategorySources(sources, count * 8); // Usa todas as fontes
          const allRelevantNews = await this.filterNewsByCategoryAI(allCategoryNews, category);
          relevantNews = allRelevantNews;
          console.log(`   📈 ${relevantNews.length} notícias relevantes após expandir fontes`);
        }
        
        categorizedNews[category] = relevantNews.slice(0, count); // Pega só a quantidade necessária
        
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
        console.log(`       → ${sourceNews.length} notícias baixadas de ${source.name}`);
        
        // Filtra notícias das últimas 24 horas
        const recentNews = sourceNews.filter(item => {
          if (!item.pubDate) return false;
          const pubDate = new Date(item.pubDate);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return !isNaN(pubDate.getTime()) && pubDate > twentyFourHoursAgo;
        });

        console.log(`       → ${recentNews.length} notícias das últimas 24h`);
        if (recentNews.length > 0) {
          recentNews.slice(0, 3).forEach((item, index) => {
            console.log(`       ${index + 1}. "${item.title?.substring(0, 40)}..."`);
          });
        }

        news.push(...recentNews);
        
        if (news.length >= maxNews) break; // Para quando tem notícias suficientes
        
      } catch (error) {
        console.log(`   ⚠️ Erro em ${source.name}: ${error.message}`);
      }
    }

    // Remove duplicatas e ordena por data
    const uniqueNews = this.removeDuplicates(news);
    const sortedNews = uniqueNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    console.log(`   ✅ ${sortedNews.length} notícias únicas coletadas`);
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
    
    console.log('🔍 DEBUG: Combinando notícias categorizadas:');
    console.log('📊 Distribuição esperada:', distribution);
    console.log('📰 Notícias disponíveis por categoria:');
    for (const [category, newsArray] of Object.entries(categorizedNews)) {
      console.log(`   ${category}: ${newsArray.length} notícias`);
    }
    
    // Adiciona notícias na ordem de prioridade (política primeiro)
    const priorityOrder = ['politica', 'economia', 'investimentos', 'tecnologia', 'esporte', 'futebol', 'saude', 'educacao', 'cultura', 'entretenimento'];
    
    for (const category of priorityOrder) {
      if (categorizedNews[category] && distribution[category]) {
        const needed = distribution[category];
        const available = categorizedNews[category].slice(0, needed);
        
        console.log(`📰 Adicionando ${available.length}/${needed} notícias de ${category}`);
        if (available.length > 0) {
          available.forEach((news, index) => {
            console.log(`   ${index + 1}. "${news.title?.substring(0, 50)}..." [${news.source}]`);
          });
        }
        finalNews.push(...available);
      } else if (distribution[category]) {
        console.log(`⚠️ Categoria ${category} esperava ${distribution[category]} notícias mas não tem notícias disponíveis`);
      }
    }

    // Se não conseguiu 6 notícias, completa com notícias gerais de política
    if (finalNews.length < 6) {
      const remaining = 6 - finalNews.length;
      console.log(`🔄 Faltam ${remaining} notícias, preenchendo com política...`);
      
      if (categorizedNews['politica'] && categorizedNews['politica'].length > (distribution['politica'] || 0)) {
        const extraPolitics = categorizedNews['politica'].slice(distribution['politica'] || 0, (distribution['politica'] || 0) + remaining);
        finalNews.push(...extraPolitics);
        console.log(`📰 Adicionadas ${extraPolitics.length} notícias extras de política`);
      }
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

  // Sistema híbrido: Keywords primeiro + IA para casos duvidosos
  async filterNewsByCategoryAI(news, category) {
    if (category === 'politica') return news; // Política aceita qualquer notícia política
    if (news.length === 0) return news;
    
    // FASE 1: Filtro básico com keywords (rápido, sem tokens)
    const keywordFiltered = this.filterNewsByKeywords(news, category);
    console.log(`   📝 ${keywordFiltered.accepted.length} aceitas por keywords, ${keywordFiltered.rejected.length} rejeitadas, ${keywordFiltered.uncertain.length} incertas`);
    
    // FASE 2: IA apenas para casos incertos (economiza tokens)
    const aiService = await import('./aiService.js');
    const finalRelevant = [...keywordFiltered.accepted]; // Começa com as aceitas por keywords
    
    if (keywordFiltered.uncertain.length > 0) {
      console.log(`   🤖 Avaliando ${keywordFiltered.uncertain.length} notícias incertas com IA...`);
      
      const maxUncertain = Math.min(keywordFiltered.uncertain.length, 8); // Máximo 8 incertas para IA
      
      for (let i = 0; i < maxUncertain; i++) {
        const item = keywordFiltered.uncertain[i];
        try {
          const isRelevant = await aiService.default.scoreCategoryRelevance(
            item.title,
            item.originalContent || '',
            category
          );
          
          if (isRelevant) {
            finalRelevant.push(item);
          }
        } catch (error) {
          console.log(`   ⚠️ Erro na IA para "${item.title?.substring(0, 30)}...": ${error.message}`);
          // Se erro na IA, não inclui (melhor filtrar do que incluir lixo)
        }
      }
    }
    
    return finalRelevant;
  }

  // Filtro rápido por keywords (sem tokens)
  filterNewsByKeywords(news, category) {
    const categoryConfig = {
      'investimentos': {
        strongKeywords: ['ibovespa', 'bovespa', 'b3', 'ações', 'dividendos', 'fundos', 'bitcoin', 'criptomoeda'],
        weakKeywords: ['investimento', 'bolsa', 'mercado financeiro', 'trader', 'dólar'],
        excludeKeywords: ['romance', 'namoro', 'entretenimento', 'celebridade', 'basquete', 'futebol', 'tênis'],
      },
      'tecnologia': {
        strongKeywords: ['programação', 'software', 'hardware', 'aplicativo', 'app', 'google', 'microsoft', 'apple'],
        weakKeywords: ['tecnologia', 'tech', 'digital', 'inovação', 'internet', 'computador'],
        excludeKeywords: ['meteoro', 'aurora', 'espaço', 'astronauta', 'planeta', 'estrela', 'galáxia'],
      },
      'economia': {
        strongKeywords: ['pib', 'empresas', 'receita', 'lucro', 'crescimento', 'economia'],
        weakKeywords: ['negócios', 'setor', 'indústria', 'mercado'],
        excludeKeywords: ['entretenimento', 'celebridade', 'romance'],
      },
      'esporte': {
        strongKeywords: ['futebol', 'basquete', 'tênis', 'vôlei', 'time', 'jogador', 'campeonato'],
        weakKeywords: ['esporte', 'atleta', 'copa', 'olimpíadas'],
        excludeKeywords: ['política', 'governo'],
      },
      'volei': {
        strongKeywords: ['vôlei', 'volei', 'voleibol', 'volleyball', 'superliga', 'cbv'],
        weakKeywords: ['liga das nações', 'seleção brasileira'],
        excludeKeywords: ['futebol', 'basquete', 'tênis'],
      },
      'handebol': {
        strongKeywords: ['handebol', 'handball', 'cbhb'],
        weakKeywords: ['seleção brasileira', 'mundial'],
        excludeKeywords: ['futebol', 'basquete', 'vôlei'],
      },
      'rugby': {
        strongKeywords: ['rugby', 'rugbi', 'rugby sevens'],
        weakKeywords: ['seleção brasileira', 'world rugby'],
        excludeKeywords: ['futebol', 'basquete', 'vôlei'],
      },
      'futsal': {
        strongKeywords: ['futsal', 'liga futsal', 'cbfs'],
        weakKeywords: ['seleção brasileira', 'mundial'],
        excludeKeywords: ['futebol de campo', 'basquete', 'vôlei'],
      },
      'volei-praia': {
        strongKeywords: ['vôlei de praia', 'volei de praia', 'beach volleyball', 'cbv praia'],
        weakKeywords: ['circuito mundial', 'praia'],
        excludeKeywords: ['futebol', 'basquete', 'vôlei indoor'],
      }
    };

    const config = categoryConfig[category];
    if (!config) return { accepted: news, rejected: [], uncertain: [] };

    const accepted = [];
    const rejected = [];
    const uncertain = [];

    for (const item of news) {
      const title = item.title?.toLowerCase() || '';
      const content = item.originalContent?.toLowerCase() || '';
      const combined = title + ' ' + content;
      
      // Verifica exclusões
      const hasExclusion = config.excludeKeywords.some(keyword => combined.includes(keyword));
      if (hasExclusion) {
        rejected.push(item);
        continue;
      }
      
      // Verifica palavras fortes (aceita automaticamente)
      const hasStrong = config.strongKeywords.some(keyword => combined.includes(keyword));
      if (hasStrong) {
        accepted.push(item);
        continue;
      }
      
      // Verifica palavras fracas (incerto, vai para IA)
      const hasWeak = config.weakKeywords.some(keyword => combined.includes(keyword));
      if (hasWeak) {
        uncertain.push(item);
      } else {
        rejected.push(item);
      }
    }

    return { accepted, rejected, uncertain };
  }

  // Limpa o cache quando necessário
  clearCache() {
    this.userInterestCache.clear();
    console.log('🗑️ Cache de interesses limpo');
  }
}

export default new NewsDistributionService();