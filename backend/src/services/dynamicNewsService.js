import aiService from './aiService.js';
import newsService from './newsService.js';

class DynamicNewsService {
  constructor() {
    // Lista de todas as fontes disponíveis
    this.allSources = [
      // Fontes gerais
      { name: 'G1', url: 'https://g1.globo.com/rss/g1/' },
      { name: 'UOL', url: 'https://rss.uol.com.br/feed/noticias.xml' },
      { name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/folha/rss091.xml' },
      { name: 'R7', url: 'https://noticias.r7.com/feed.xml' },
      
      // Economia e Investimentos
      { name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
      { name: 'Exame', url: 'https://exame.com/feed/' },
      { name: 'Valor Econômico', url: 'https://valor.globo.com/rss/home/' },
      { name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
      
      // Tecnologia
      { name: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/' },
      { name: 'Canaltech', url: 'https://canaltech.com.br/rss/' },
      { name: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
      { name: 'UOL Tecnologia', url: 'https://tecnologia.uol.com.br/rss.xml' },
      
      // Esportes
      { name: 'ESPN Brasil', url: 'https://www.espn.com.br/rss/' },
      { name: 'Sportv', url: 'https://sportv.globo.com/rss/sportv/' },
      { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
      { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
      
      // Política
      { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
      { name: 'Poder360', url: 'https://www.poder360.com.br/feed/' },
      
      // Saúde
      { name: 'G1 Saúde', url: 'https://g1.globo.com/rss/g1/bemestar/' },
      
      // Educação
      { name: 'G1 Educação', url: 'https://g1.globo.com/rss/g1/educacao/' }
    ];
  }

  // Analisa o perfil e gera notícias dinamicamente
  async getPersonalizedNews(userProfile) {
    try {
      console.log('🧠 Analisando perfil dinamicamente...');
      
      // 1. IA identifica interesses livres (sem categorias fixas) - 1 ÚNICA CHAMADA DE IA
      const userInterests = await aiService.analyzeUserInterests(userProfile.profileDescription || '');
      console.log(`🎯 Interesses identificados: ${userInterests.join(', ')}`);
      
      // 2. Mapeia interesses para fontes específicas (SEM IA)
      const relevantSources = this.mapInterestsToSources(userInterests);
      console.log(`📰 Usando ${relevantSources.length} fontes relevantes`);
      
      // 3. Coleta notícias APENAS das fontes relevantes (SEM IA)
      const allNews = await this.collectFromRelevantSources(relevantSources);
      
      // 4. Filtra por keywords simples (SEM IA)
      const filteredNews = await this.filterByAI(allNews, userInterests);
      
      // 5. Seleciona as 6 melhores
      const finalNews = this.selectBestNews(filteredNews, 6);
      
      console.log(`✅ ${finalNews.length} notícias personalizadas selecionadas`);
      return finalNews;
      
    } catch (error) {
      console.error('❌ Erro na coleta dinâmica:', error);
      
      // Fallback: notícias gerais
      return await newsService.fetchAllNews(null, this.allSources.slice(0, 3));
    }
  }

  // Mapeia interesses identificados pela IA para fontes específicas (SEM IA)
  mapInterestsToSources(userInterests) {
    const interestToSourceMap = {
      // Tecnologia e Programação
      'programacao': ['Olhar Digital', 'Canaltech', 'Tecnoblog', 'UOL Tecnologia'],
      'tecnologia': ['Olhar Digital', 'Canaltech', 'Tecnoblog', 'UOL Tecnologia'],
      'arquitetura-de-software': ['Olhar Digital', 'Canaltech', 'Tecnoblog'],
      'desenvolvimento': ['Olhar Digital', 'Canaltech', 'Tecnoblog'],
      'software': ['Olhar Digital', 'Canaltech', 'Tecnoblog'],
      
      // Investimentos e Economia
      'investimentos': ['InfoMoney', 'Exame', 'G1 Economia'],
      'bolsa': ['InfoMoney', 'Exame', 'G1 Economia'],
      'acoes': ['InfoMoney', 'Exame'],
      'mercado-financeiro': ['InfoMoney', 'Exame', 'G1 Economia'],
      'economia': ['G1 Economia', 'InfoMoney', 'Exame'],
      'financeiro': ['InfoMoney', 'Exame', 'G1 Economia'],
      
      // Esportes
      'volei': ['ESPN Brasil', 'Sportv', 'G1 Esportes', 'UOL Esporte'],
      'handebol': ['ESPN Brasil', 'Sportv', 'G1 Esportes'],
      'futebol': ['ESPN Brasil', 'Sportv', 'G1 Esportes', 'UOL Esporte'],
      'basquete': ['ESPN Brasil', 'Sportv', 'G1 Esportes'],
      'esporte': ['ESPN Brasil', 'Sportv', 'G1 Esportes', 'UOL Esporte'],
      
      // Outras áreas
      'politica': ['G1 Política', 'Poder360', 'G1'],
      'saude': ['G1 Saúde', 'G1'],
      'medicina': ['G1 Saúde', 'G1'],
      'educacao': ['G1 Educação', 'G1'],
      'ensino': ['G1 Educação', 'G1']
    };

    const relevantSources = new Set();
    
    // Adiciona fontes gerais sempre
    relevantSources.add('G1');
    relevantSources.add('UOL');
    
    // Mapeia cada interesse para suas fontes específicas
    userInterests.forEach(interest => {
      const sources = interestToSourceMap[interest.toLowerCase()];
      if (sources) {
        sources.forEach(source => relevantSources.add(source));
        console.log(`📂 ${interest} → ${sources.join(', ')}`);
      } else {
        console.log(`⚠️ Interesse "${interest}" não mapeado, usando fontes gerais`);
      }
    });

    // Converte para array de objetos fonte
    return Array.from(relevantSources).map(sourceName => {
      return this.allSources.find(source => source.name === sourceName);
    }).filter(source => source !== undefined);
  }

  // Coleta notícias APENAS das fontes relevantes (SEM IA)
  async collectFromRelevantSources(relevantSources) {
    const allNews = [];
    
    console.log(`📊 Coletando de ${relevantSources.length} fontes relevantes...`);
    
    // Usa fontes relevantes em paralelo
    const sourcePromises = relevantSources.map(async (source) => {
      try {
        console.log(`   📰 ${source.name}...`);
        const sourceNews = await newsService.fetchNewsFromSource(source);
        
        // Filtra notícias das últimas 24 horas
        const recentNews = sourceNews.filter(item => {
          if (!item.pubDate) return false;
          const pubDate = new Date(item.pubDate);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return !isNaN(pubDate.getTime()) && pubDate > twentyFourHoursAgo;
        });
        
        console.log(`       → ${recentNews.length} notícias recentes`);
        return recentNews;
        
      } catch (error) {
        console.log(`   ❌ Erro em ${source.name}: ${error.message}`);
        return [];
      }
    });
    
    const results = await Promise.all(sourcePromises);
    results.forEach(sourceNews => allNews.push(...sourceNews));
    
    // Remove duplicatas
    const uniqueNews = this.removeDuplicates(allNews);
    console.log(`📊 Total: ${uniqueNews.length} notícias únicas`);
    
    return uniqueNews;
  }

  // Filtra notícias usando IA PURA em batch (sem keywords)
  async filterByAI(allNews, userInterests) {
    const relevantNews = [];
    
    console.log(`🤖 Filtrando ${allNews.length} notícias usando IA pura em batch...`);
    
    // Se não tem interesses específicos, avalia todas como 'geral'
    if (userInterests.length === 0) {
      console.log(`🔄 Avaliando todas as ${allNews.length} notícias como gerais...`);
      
      const generalScores = await aiService.scoreCategoryRelevanceBatch(allNews, 'geral');
      
      for (let i = 0; i < allNews.length; i++) {
        const news = allNews[i];
        const score = generalScores[i];
        
        if (score >= 50) {
          console.log(`✅ "${news.title.substring(0, 40)}..." relevante geral (Score: ${score})`);
          relevantNews.push({
            ...news,
            matchedInterests: ['geral'],
            relevanceScore: score
          });
        }
      }
    } else {
      // Avalia para cada interesse do usuário
      for (const interest of userInterests) {
        console.log(`🔄 Avaliando ${allNews.length} notícias para interesse: ${interest}...`);
        
        try {
          const scores = await aiService.scoreCategoryRelevanceBatch(allNews, interest);
          
          for (let i = 0; i < allNews.length; i++) {
            const news = allNews[i];
            const score = scores[i];
            
            // Se score >= 60, considera relevante
            if (score >= 60) {
              console.log(`✅ "${news.title.substring(0, 40)}..." relevante para ${interest} (Score: ${score})`);
              
              // Verifica se já foi adicionada por outro interesse
              const existingNews = relevantNews.find(existing => 
                existing.title === news.title && existing.originalUrl === news.originalUrl
              );
              
              if (existingNews) {
                // Atualiza se score for maior
                if (score > existingNews.relevanceScore) {
                  existingNews.relevanceScore = score;
                }
                if (!existingNews.matchedInterests.includes(interest)) {
                  existingNews.matchedInterests.push(interest);
                }
              } else {
                // Adiciona nova notícia
                relevantNews.push({
                  ...news,
                  matchedInterests: [interest],
                  relevanceScore: score
                });
              }
            }
          }
          
          // Delay pequeno entre categorias
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Erro na IA para interesse ${interest}:`, error.message);
        }
      }
    }
    
    console.log(`🎯 ${relevantNews.length} notícias relevantes encontradas pela IA`);
    return relevantNews;
  }

  // Seleciona as melhores notícias (SEM IA)
  selectBestNews(filteredNews, targetCount) {
    // Ordena por relevância e data
    const sorted = filteredNews.sort((a, b) => {
      // Primeiro por score de relevância
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // Depois por data (mais recente primeiro)
      return new Date(b.pubDate) - new Date(a.pubDate);
    });

    // Balanceia por interesses para ter diversidade
    const selected = [];
    const usedInterests = new Set();
    
    // Primeira passada: pega uma notícia de cada interesse
    for (const news of sorted) {
      if (selected.length >= targetCount) break;
      
      const hasNewInterest = news.matchedInterests?.some(interest => !usedInterests.has(interest));
      if (hasNewInterest || usedInterests.size === 0) {
        selected.push(news);
        news.matchedInterests?.forEach(interest => usedInterests.add(interest));
      }
    }
    
    // Segunda passada: completa com as melhores restantes
    for (const news of sorted) {
      if (selected.length >= targetCount) break;
      
      if (!selected.includes(news)) {
        selected.push(news);
      }
    }
    
    return selected.slice(0, targetCount);
  }


  // Remove duplicatas baseado no título
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
}

export default new DynamicNewsService();