import aiService from './aiService.js';
import categoryService from './categoryService.js';
import newsService from './newsService.js';

class CategoryDrivenNewsService {
  constructor() {
    // Cache para evitar re-identificação de categorias muito frequente
    this.categoryCache = new Map();
    this.cacheExpiration = 60 * 60 * 1000; // 1 hora
  }

  // FLUXO PRINCIPAL: IA identifica categorias → busca nas fontes específicas
  async getPersonalizedNews(userProfile) {
    try {
      console.log('🧠 Iniciando fluxo categoria-dirigido...');
      
      // 1. IA identifica categorias específicas (1 chamada de IA)
      const userCategories = await this.identifyUserCategories(userProfile);
      
      if (userCategories.length === 0) {
        console.log('📰 Nenhuma categoria específica → usando fontes gerais');
        return await this.getGeneralNews();
      }
      
      // 2. Busca nas fontes específicas dessas categorias (SEM IA)
      const specificNews = await this.getNewsFromSpecificCategories(userCategories);
      
      // 3. Adiciona algumas notícias gerais para diversidade
      const generalNews = await this.getGeneralNews(2);
      
      // 4. Combina e retorna as melhores
      const allNews = [...specificNews, ...generalNews];
      const finalNews = this.selectBestNews(allNews, 6); // GARANTIR 6 NOTÍCIAS
      
      console.log(`✅ ${finalNews.length} notícias categoria-dirigidas coletadas`);
      
      // FORÇA RETORNAR 6 NOTÍCIAS
      if (finalNews.length < 6) {
        console.log(`⚠️ Apenas ${finalNews.length} notícias selecionadas, buscando mais...`);
        // Pega mais notícias gerais se necessário
        const extraGeneral = await this.getGeneralNews(6 - finalNews.length);
        finalNews.push(...extraGeneral);
      }
      
      return finalNews.slice(0, 6); // GARANTE EXATAMENTE 6
      
    } catch (error) {
      console.error('❌ Erro no fluxo categoria-dirigido:', error);
      
      // Fallback: notícias gerais
      return await this.getGeneralNews();
    }
  }

  // Identifica categorias do usuário usando IA (com cache)
  async identifyUserCategories(userProfile) {
    const profileDescription = userProfile?.profileDescription || '';
    
    if (!profileDescription.trim()) {
      console.log('⚠️ Perfil vazio, usando categorias gerais');
      return [];
    }
    
    // Verifica cache
    const cacheKey = profileDescription.toLowerCase().trim();
    const cached = this.categoryCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiration) {
      console.log(`🔄 Categorias em cache: ${cached.categories.join(', ')}`);
      return cached.categories;
    }
    
    // Primeiro tenta IA, depois fallback local
    try {
      // Verifica se a API key está configurada e válida
      const hasValidKey = process.env.GEMINI_API_KEY && 
                         process.env.GEMINI_API_KEY !== 'your-gemini-api-key' &&
                         process.env.GEMINI_API_KEY.length > 30;
                         
      if (hasValidKey) {
        console.log('🤖 Usando IA para identificar categorias...');
        const categories = await aiService.identifyUserCategories(profileDescription);
        
        // Filtra apenas categorias válidas que existem no CategoryService
        const validCategories = categories.filter(cat => 
          categoryService.categoryMapping[cat] !== undefined
        );
        
        if (validCategories.length > 0) {
          // Salva no cache
          this.categoryCache.set(cacheKey, {
            categories: validCategories,
            timestamp: Date.now()
          });
          
          console.log(`🎯 IA identificou categorias: ${validCategories.join(', ')}`);
          return validCategories;
        } else {
          console.log('⚠️ IA não retornou categorias válidas, usando fallback local');
        }
      } else {
        console.log('⚠️ API key inválida, usando identificação local');
      }
      
      // Fallback: análise local
      const localCategories = this.identifyCategoriesLocally(profileDescription);
      
      // Salva no cache
      this.categoryCache.set(cacheKey, {
        categories: localCategories,
        timestamp: Date.now()
      });
      
      return localCategories;
      
    } catch (error) {
      console.error('❌ Erro na identificação por IA:', error.message);
      
      // Fallback: análise local simples
      const localCategories = this.identifyCategoriesLocally(profileDescription);
      
      // Salva no cache
      this.categoryCache.set(cacheKey, {
        categories: localCategories,
        timestamp: Date.now()
      });
      
      return localCategories;
    }
  }

  // Fallback: identificação local sem IA
  identifyCategoriesLocally(profileDescription) {
    const profile = profileDescription.toLowerCase();
    const detectedCategories = [];
    
    // Mapea palavras-chave para categorias - ESPECÍFICAS APENAS
    const keywordMapping = {
      'tecnologia': ['programação', 'software', 'tech', 'desenvolvimento', 'código'],
      'investimentos': ['investimento', 'ações', 'bolsa', 'financeiro', 'dinheiro'],
      'futebol': ['futebol', 'flamengo', 'palmeiras', 'corinthians', 'brasileiro'],
      'volei': ['vôlei', 'volei', 'volleyball'],
      'handebol': ['handebol', 'handball'],
      'rugby': ['rugby', 'rugbi'],
      'futsal': ['futsal'],
      'volei-praia': ['vôlei de praia', 'volei de praia', 'beach volleyball'],
      'formula1': ['formula 1', 'f1', 'formula um', 'fórmula 1'],
      'politica': ['política', 'governo', 'lula', 'bolsonaro', 'eleição'],
      'economia': ['economia', 'mercado', 'empresa', 'negócio'],
      'saude': ['saúde', 'medicina', 'médico', 'hospital'],
      'educacao': ['educação', 'ensino', 'escola', 'professor'],
      'psicologia': ['psicologia', 'psicólogo', 'terapia'],
      'cultura': ['cultura', 'arte', 'música', 'cinema', 'teatro'],
      'internacional': ['internacional', 'mundo', 'global', 'exterior']
    };
    
    // ESPORTES ESPECÍFICOS NÃO LISTADOS QUE DEVEM SER IGNORADOS
    const specificSportsToIgnore = [
      'basquete', 'basketball', 'tênis', 'tennis', 
      'natação', 'swimming', 'ciclismo', 'atletismo', 'judô', 'caratê',
      'mma', 'boxe', 'surf', 'skate', 'motociclismo', 'automobilismo'
    ];
    
    // Se menciona esporte específico não listado, NÃO adiciona nada de esporte
    const mentionsIgnoredSport = specificSportsToIgnore.some(sport => 
      profile.includes(sport)
    );
    
    if (mentionsIgnoredSport) {
      console.log(`🚫 Esporte específico não listado detectado - não incluindo categoria de esporte`);
    }
    
    for (const [category, keywords] of Object.entries(keywordMapping)) {
      const hasKeyword = keywords.some(keyword => profile.includes(keyword));
      if (hasKeyword) {
        detectedCategories.push(category);
      }
    }
    
    // Só adiciona "esporte" genérico se mencionar "esportes" EM GERAL e NÃO mencionar esporte específico ignorado
    if (!mentionsIgnoredSport && 
        (profile.includes('esportes') || profile.includes('esporte em geral') || profile.includes('acompanho esportes'))) {
      detectedCategories.push('esporte');
    }
    
    console.log(`🔍 Categorias detectadas localmente: ${detectedCategories.join(', ')}`);
    return detectedCategories;
  }

  // Busca notícias nas fontes específicas das categorias identificadas
  async getNewsFromSpecificCategories(userCategories) {
    const allNews = [];
    console.log(`📂 Buscando em categorias: ${userCategories.join(', ')}`);
    
    // Para cada categoria, pega suas fontes específicas
    for (const category of userCategories) {
      const categoryConfig = categoryService.categoryMapping[category];
      if (!categoryConfig) continue;
      
      console.log(`📰 Categoria "${category}":`);
      
      // Busca em cada fonte específica da categoria
      for (const [sourceName, sourceUrl] of Object.entries(categoryConfig.sources)) {
        if (!sourceUrl) continue; // Pula fontes sem URL específica
        
        try {
          console.log(`   📡 ${sourceName} (${sourceUrl})`);
          
          const sourceNews = await newsService.fetchNewsFromSource({
            name: sourceName,
            url: sourceUrl
          });
          
          // Filtra notícias recentes (últimas 24h)
          const recentNews = sourceNews.filter(item => {
            if (!item.pubDate) return false;
            const pubDate = new Date(item.pubDate);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return !isNaN(pubDate.getTime()) && pubDate > twentyFourHoursAgo;
          });
          
          // Adiciona metadata da categoria e calcula score usando IA em batch
          console.log(`       🤖 Avaliando ${recentNews.length} notícias em batch...`);
          
          const scores = await aiService.scoreCategoryRelevanceBatch(recentNews, category);
          
          const categorizedNews = recentNews.map((news, index) => ({
            ...news,
            category: category,
            sourceCategory: sourceName,
            relevanceScore: scores[index] || 50
          }));
          
          allNews.push(...categorizedNews);
          console.log(`       → ${recentNews.length} notícias recentes`);
          
        } catch (error) {
          console.log(`   ❌ Erro em ${sourceName}: ${error.message}`);
        }
      }
    }
    
    // Remove duplicatas
    const uniqueNews = this.removeDuplicates(allNews);
    console.log(`🔗 ${uniqueNews.length} notícias únicas coletadas das categorias específicas`);
    
    return uniqueNews;
  }

  // Busca notícias gerais (fallback ou complemento)
  async getGeneralNews(limit = 6) {
    try {
      console.log(`📰 Buscando ${limit} notícias gerais...`);
      
      const generalSources = [
        { name: 'G1 Geral', url: 'https://g1.globo.com/rss/g1/' },
        { name: 'Folha Geral', url: 'https://feeds.folha.uol.com.br/folha/rss091.xml' },
        { name: 'UOL Geral', url: 'https://rss.uol.com.br/feed/noticias.xml' },
        { name: 'Agência Brasil', url: 'http://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml' },
        { name: 'Opera Mundi', url: 'https://operamundi.uol.com.br/rss' }
      ];
      
      const allNews = [];
      
      for (const source of generalSources) {
        try {
          const sourceNews = await newsService.fetchNewsFromSource(source);
          
          // Filtra notícias recentes
          const recentNews = sourceNews.filter(item => {
            if (!item.pubDate) return false;
            const pubDate = new Date(item.pubDate);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return !isNaN(pubDate.getTime()) && pubDate > twentyFourHoursAgo;
          });
          
          // Calcula score das notícias gerais usando IA em batch
          console.log(`       🤖 Avaliando ${recentNews.length} notícias gerais em batch...`);
          
          const generalScores = await aiService.scoreCategoryRelevanceBatch(recentNews, 'geral');
          
          const generalNews = recentNews.map((news, index) => ({
            ...news,
            category: 'geral',
            relevanceScore: generalScores[index] || 50
          }));
          
          allNews.push(...generalNews);
          
        } catch (error) {
          console.log(`❌ Erro em ${source.name}: ${error.message}`);
        }
      }
      
      // Pega as melhores
      const uniqueNews = this.removeDuplicates(allNews);
      return uniqueNews.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Erro ao buscar notícias gerais:', error);
      return [];
    }
  }

  // Calcula score usando IA (inteligência real, não keywords)
  async calculateCategoryScore(news, category) {
    try {
      // Usa IA para avaliar relevância da categoria
      const aiScore = await aiService.scoreCategoryRelevance(
        news.title, 
        news.originalContent || '', 
        category
      );
      
      console.log(`🤖 [${category}] "${news.title.substring(0, 40)}..." - Score IA: ${aiScore}`);
      return aiScore;
      
    } catch (error) {
      console.error(`❌ Erro ao calcular score IA para ${category}:`, error.message);
      
      // Fallback simples se IA falhar
      const title = news.title?.toLowerCase() || '';
      const content = news.originalContent?.toLowerCase() || '';
      const combined = title + ' ' + content;
      
      // Score básico: se menciona a categoria, score médio, senão baixo
      if (combined.includes(category.toLowerCase())) {
        return 60;
      } else {
        return 30;
      }
    }
  }

  // Calcula score para notícias gerais usando IA
  async calculateGeneralScore(news) {
    try {
      // Usa IA para avaliar relevância geral
      const aiScore = await aiService.scoreNewsRelevance(
        news.title, 
        news.originalContent || '', 
        'geral'
      );
      
      console.log(`🤖 [geral] "${news.title.substring(0, 40)}..." - Score IA: ${aiScore}`);
      return aiScore;
      
    } catch (error) {
      console.error(`❌ Erro ao calcular score IA geral:`, error.message);
      
      // Fallback simples
      const title = news.title?.toLowerCase() || '';
      const content = news.originalContent?.toLowerCase() || '';
      const combined = title + ' ' + content;
      
      // Score básico: palavras-chave relevantes
      const relevantKeywords = ['brasil', 'governo', 'presidente', 'economia', 'política'];
      const keywordMatches = relevantKeywords.filter(keyword => 
        combined.includes(keyword)
      ).length;
      
      return Math.min(80, Math.max(20, 40 + keywordMatches * 8));
    }
  }

  // Seleciona as melhores notícias priorizando RELEVÂNCIA REAL via IA
  selectBestNews(allNews, targetCount) {
    // Com IA, scores são mais precisos - começa com 70+
    let candidateNews = allNews.filter(news => news.relevanceScore >= 70);
    
    console.log(`📊 Notícias com score >= 70: ${candidateNews.length}/${allNews.length}`);
    
    // Se não tem notícias suficientes, reduz gradualmente o threshold
    if (candidateNews.length < targetCount) {
      candidateNews = allNews.filter(news => news.relevanceScore >= 60);
      console.log(`📊 Expandindo para score >= 60: ${candidateNews.length}/${allNews.length}`);
    }
    
    if (candidateNews.length < targetCount) {
      candidateNews = allNews.filter(news => news.relevanceScore >= 50);
      console.log(`📊 Expandindo para score >= 50: ${candidateNews.length}/${allNews.length}`);
    }
    
    if (candidateNews.length < targetCount) {
      candidateNews = allNews.filter(news => news.relevanceScore >= 40);
      console.log(`📊 Expandindo para score >= 40: ${candidateNews.length}/${allNews.length}`);
    }
    
    // Se ainda não tem suficiente, pega TODAS e ordena por score
    if (candidateNews.length < targetCount) {
      candidateNews = allNews;
      console.log(`📊 Usando todas as notícias (${allNews.length}) ordenadas por score`);
    }
    
    // Ordena por relevância
    const sorted = candidateNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    const selected = [];
    const categoryCounts = {};
    
    // Prioriza as categorias do usuário
    const priorityCategories = ['tecnologia', 'investimentos', 'volei', 'handebol', 'futebol'];
    
    // ESTRATÉGIA: Garante diversidade de categorias
    const userCategories = ['tecnologia', 'investimentos', 'volei', 'handebol'];
    const categoriesSelected = new Set();
    
    // Primeira passada: UMA notícia de cada categoria do usuário
    for (const category of userCategories) {
      const categoryNews = sorted.filter(news => 
        news.category === category && !selected.includes(news) && news.relevanceScore >= 30
      );
      
      if (categoryNews.length > 0 && selected.length < targetCount) {
        selected.push(categoryNews[0]);
        categoriesSelected.add(category);
        categoryCounts[category] = 1;
        console.log(`✅ Selecionada [${category}]: "${categoryNews[0].title.substring(0, 40)}..." (Score: ${categoryNews[0].relevanceScore})`);
      }
    }
    
    // Segunda passada: completa com futebol/esporte e gerais
    const otherCategories = ['futebol', 'esporte', 'geral'];
    for (const category of otherCategories) {
      if (selected.length >= targetCount) break;
      
      const categoryNews = sorted.filter(news => 
        news.category === category && !selected.includes(news) && news.relevanceScore >= 25
      );
      
      if (categoryNews.length > 0) {
        selected.push(categoryNews[0]);
        categoryCounts[category] = 1;
        console.log(`✅ Selecionada [${category}]: "${categoryNews[0].title.substring(0, 40)}..." (Score: ${categoryNews[0].relevanceScore})`);
      }
    }
    
    // Terceira passada: completa com qualquer notícia restante se ainda falta
    for (const news of sorted) {
      if (selected.length >= targetCount) break;
      if (selected.includes(news)) continue;
      
      selected.push(news);
      categoryCounts[news.category] = (categoryCounts[news.category] || 0) + 1;
      console.log(`✅ Completando [${news.category}]: "${news.title.substring(0, 40)}..." (Score: ${news.relevanceScore})`);
    }
    
    // Log da distribuição final
    console.log('\n📊 DISTRIBUIÇÃO FINAL DAS NOTÍCIAS:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} notícia(s)`);
    });
    console.log('');
    
    return selected.slice(0, targetCount);
  }

  // Remove duplicatas baseado no título
  removeDuplicates(news) {
    const seen = new Set();
    return news.filter(item => {
      const normalizedTitle = item.title?.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!normalizedTitle || seen.has(normalizedTitle)) {
        return false;
      }
      
      seen.add(normalizedTitle);
      return true;
    });
  }
}

export default new CategoryDrivenNewsService();