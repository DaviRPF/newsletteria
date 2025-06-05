import newsService from './newsService.js';
import aiService from './aiService.js';

class TempNewsService {
  constructor() {
    this.cachedNews = [];
    this.lastUpdate = null;
  }

  async getLatestNews() {
    // Atualiza cache a cada 30 minutos
    const now = new Date();
    if (!this.lastUpdate || (now - this.lastUpdate) > 30 * 60 * 1000) {
      console.log('🔄 Atualizando cache de notícias...');
      await this.updateNewsCache();
    }

    return this.cachedNews;
  }

  async updateNewsCache() {
    try {
      console.log('📰 Coletando notícias dos RSS feeds...');
      
      // Coleta notícias sem banco de dados
      const allNews = await newsService.fetchAllNews(null);
      console.log(`✅ ${allNews.length} notícias coletadas`);

      if (allNews.length === 0) {
        console.log('⚠️ Nenhuma notícia coletada, mantendo cache anterior');
        return;
      }

      // Filtra notícias das últimas 24 horas
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      console.log(`⏰ Filtrando notícias mais recentes que: ${twentyFourHoursAgo.toLocaleString('pt-BR')}`);
      
      const recentNews = allNews.filter(news => {
        if (!news.pubDate) {
          console.log(`📰 Notícia sem data descartada [${news.source}]: ${news.title?.substring(0, 50)}...`);
          return false; // Se não tem data, não inclui (mais restritivo)
        }
        const newsDate = new Date(news.pubDate);
        const isValid = !isNaN(newsDate.getTime()) && newsDate > twentyFourHoursAgo;
        if (!isValid) {
          console.log(`🗓️ Notícia antiga descartada [${news.source}] (${newsDate.toLocaleString('pt-BR')}): ${news.title?.substring(0, 50)}...`);
        } else {
          console.log(`✅ Notícia aceita [${news.source}] (${newsDate.toLocaleString('pt-BR')}): ${news.title?.substring(0, 50)}...`);
        }
        return isValid;
      });

      console.log(`📅 ${recentNews.length} notícias das últimas 24 horas`);

      // Remove duplicatas por similaridade de título
      const uniqueNews = await this.removeDuplicates(recentNews);
      console.log(`🔄 ${uniqueNews.length} notícias únicas após remoção de duplicatas`);

      // PRIMEIRO: Processa com sistema local para obter pontuação inicial
      console.log('🧠 Fazendo pontuação inicial com sistema local...');
      const localProcessed = this.processNewsLocally(uniqueNews);
      
      // SEGUNDO: Ordena por relevância e pega apenas as TOP 4
      const top4News = localProcessed
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 4);
      
      console.log(`🎯 Selecionadas as TOP 4 notícias para processamento com IA`);

      // TERCEIRO: Só agora processa as TOP 4 com IA se disponível
      let finalNews;
      try {
        // Verifica se a API key está configurada e não é a padrão
        const hasValidKey = process.env.GEMINI_API_KEY && 
                           process.env.GEMINI_API_KEY !== 'your-gemini-api-key' &&
                           process.env.GEMINI_API_KEY.length > 30;
        
        if (hasValidKey) {
          console.log('🤖 Refinando TOP 4 notícias com IA Gemini...');
          finalNews = await this.processWithAI(top4News);
          console.log('✅ Refinamento com IA bem-sucedido');
        } else {
          console.log('⚠️ API key Gemini inválida, usando processamento local');
          finalNews = top4News;
        }
      } catch (error) {
        console.log('❌ Erro na IA, mantendo processamento local:', error.message);
        finalNews = top4News;
      }
      
      this.cachedNews = finalNews;

      this.lastUpdate = new Date();
      console.log(`✅ Cache atualizado com ${this.cachedNews.length} notícias`);

    } catch (error) {
      console.error('❌ Erro ao atualizar cache de notícias:', error);
    }
  }

  async removeDuplicates(news) {
    console.log(`🔍 Analisando ${news.length} notícias para detectar duplicatas...`);
    
    // Agrupa notícias por similaridade usando IA quando disponível
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < news.length; i++) {
      if (processed.has(i)) continue;
      
      const currentNews = news[i];
      const group = {
        main: currentNews,
        duplicates: [],
        sources: [currentNews.source],
        urls: [currentNews.originalUrl]
      };
      
      processed.add(i);
      
      // Procura por notícias similares
      for (let j = i + 1; j < news.length; j++) {
        if (processed.has(j)) continue;
        
        const compareNews = news[j];
        const similarity = await this.calculateAdvancedSimilarity(currentNews, compareNews);
        
        if (similarity > 0.75) { // 75% de similaridade = duplicata
          console.log(`🔄 Duplicata encontrada (${Math.round(similarity * 100)}%): [${currentNews.source}] "${currentNews.title.substring(0, 30)}..." ≈ [${compareNews.source}] "${compareNews.title.substring(0, 30)}..."`);
          
          group.duplicates.push(compareNews);
          group.sources.push(compareNews.source);
          group.urls.push(compareNews.originalUrl);
          processed.add(j);
        }
      }
      
      groups.push(group);
    }
    
    console.log(`✅ ${groups.length} grupos únicos criados (${news.length - groups.length} duplicatas removidas)`);
    
    // Cria versões consolidadas das notícias
    const uniqueNews = [];
    for (const group of groups) {
      if (group.duplicates.length > 0) {
        // Combina informações de múltiplas fontes
        console.log(`📊 Consolidando: [${group.sources.join(' + ')}] "${group.main.title.substring(0, 40)}..." (${group.duplicates.length + 1} fontes)`);
        const consolidatedNews = await this.consolidateNews(group);
        uniqueNews.push(consolidatedNews);
      } else {
        console.log(`📰 Notícia única: [${group.main.source}] "${group.main.title.substring(0, 40)}..."`);
        uniqueNews.push(group.main);
      }
    }
    
    return uniqueNews;
  }

  normalizeTitle(title) {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  calculateSimilarity(title1, title2) {
    const words1 = title1.split(' ');
    const words2 = title2.split(' ');
    
    const intersection = words1.filter(word => words2.includes(word) && word.length > 2);
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  async calculateAdvancedSimilarity(news1, news2) {
    // Análise local aprimorada (sem depender de IA)
    const title1 = this.normalizeTitle(news1.title);
    const title2 = this.normalizeTitle(news2.title);
    
    // Similaridade básica de títulos
    const titleSimilarity = this.calculateSimilarity(title1, title2);
    
    // Verifica palavras-chave importantes
    const keywords1 = this.extractKeywords(title1);
    const keywords2 = this.extractKeywords(title2);
    const keywordMatch = keywords1.filter(k => keywords2.includes(k)).length / Math.max(keywords1.length, keywords2.length);
    
    // Pontuação final combinada
    return (titleSimilarity * 0.7) + (keywordMatch * 0.3);
  }

  extractKeywords(text) {
    const stopWords = ['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob', 'sobre', 'entre', 'até', 'após', 'antes', 'durante', 'contra', 'através', 'pela', 'pelo', 'pelas', 'pelos', 'à', 'ao', 'às', 'aos', 'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'e', 'ou', 'mas', 'que', 'se', 'é', 'são', 'foi', 'foram', 'será', 'serão', 'tem', 'têm', 'teve', 'tiveram', 'terá', 'terão'];
    
    return text.split(' ')
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10); // Pega as 10 palavras mais relevantes
  }

  async consolidateNews(group) {
    console.log(`🔗 Consolidando notícia: "${group.main.title.substring(0, 50)}..." de ${group.sources.length} fontes`);
    
    // Consolidação local - pega o conteúdo mais completo
    const longestContent = [group.main, ...group.duplicates]
      .sort((a, b) => (b.originalContent?.length || 0) - (a.originalContent?.length || 0))[0];
    
    return {
      ...longestContent,
      source: `${group.sources.join(', ')} (${group.sources.length} fontes)`,
      originalUrl: group.urls[0],
      alternativeUrls: group.urls.slice(1),
      consolidated: true,
      sourceCount: group.sources.length
    };
  }

  async processWithAI(news) {
    const processedNews = [];

    for (const item of news) {
      try {
        console.log(`🤖 Processando: ${item.title.substring(0, 50)}...`);

        // Faz scraping do conteúdo completo se necessário
        let fullContent = item.originalContent;
        if (!fullContent || fullContent.length < 200) {
          try {
            fullContent = await newsService.scrapeFullContent(item.originalUrl);
          } catch (scrapeError) {
            console.log(`⚠️ Erro no scraping de ${item.originalUrl}: ${scrapeError.message}`);
          }
        }

        // Processa com IA avançada se tiver conteúdo
        if (fullContent && fullContent.length > 100) {
          const context = {
            sourceCount: item.sourceCount || 1,
            consolidated: item.consolidated || false
          };

          const [score, rewrittenContent] = await Promise.all([
            aiService.createAdvancedScore(item.title, fullContent, item.source, context),
            aiService.rewriteArticle(item.title, fullContent, item.source, item.alternativeUrls || [])
          ]);

          processedNews.push({
            ...item,
            originalContent: fullContent,
            rewrittenContent,
            relevanceScore: score,
            processed: true,
            aiProcessed: true
          });
        } else {
          // Se não conseguiu conteúdo, usa sistema local para essa notícia
          const localProcessed = this.processNewsLocally([item])[0];
          processedNews.push(localProcessed);
        }

        // Delay maior para não esgotar quota da API gratuita
        await new Promise(resolve => setTimeout(resolve, 4000));

      } catch (error) {
        console.error(`❌ Erro ao processar ${item.title}:`, error.message);
        
        // Em caso de erro, usa sistema local para essa notícia
        const localProcessed = this.processNewsLocally([item])[0];
        processedNews.push(localProcessed);
      }
    }

    return processedNews;
  }

  // Sistema de pontuação local (fallback quando IA não funciona)
  processNewsLocally(news) {
    const processedNews = news.map((item, index) => {
      let score = 60; // Score base mais alto
      
      // Palavras-chave que aumentam relevância (peso alto)
      const highRelevanceKeywords = [
        'brasil', 'lula', 'bolsonaro', 'governo', 'política', 'economia', 
        'eleição', 'supremo', 'stf', 'congresso', 'senado', 'deputado',
        'ministro', 'presidente', 'covid', 'pandemia', 'vacina',
        'petrobras', 'banco central', 'inflação', 'pib', 'real',
        'amazônia', 'meio ambiente', 'desmatamento', 'indígena',
        'pgr', 'prisão', 'zambelli', 'portugal', 'brasileiros',
        'milhões', 'combate', 'cristina kirchner', 'argentino'
      ];
      
      const mediumRelevanceKeywords = [
        'rio', 'são paulo', 'salvador', 'belo horizonte', 'brasília',
        'saúde', 'educação', 'violência', 'segurança', 'corrupção',
        'investigação', 'operação', 'polícia federal', 'justiça',
        'onu', 'internacional', 'guerra', 'sudão', 'enchentes'
      ];
      
      const title = item.title?.toLowerCase() || '';
      const content = item.originalContent?.toLowerCase() || '';
      const combined = title + ' ' + content;
      
      // Pontuação por palavras-chave (aumentei os valores)
      highRelevanceKeywords.forEach(keyword => {
        if (combined.includes(keyword)) {
          score += title.includes(keyword) ? 25 : 15; // Mais pontos se estiver no título
        }
      });
      
      mediumRelevanceKeywords.forEach(keyword => {
        if (combined.includes(keyword)) {
          score += title.includes(keyword) ? 12 : 8;
        }
      });
      
      // Pontuação por fonte (aumentei)
      if (item.source?.includes('Opera Mundi')) score += 15;
      if (item.source?.includes('Agência Brasil')) score += 20;
      if (item.source?.includes('UOL')) score += 12;
      
      // Pontuação por recência (mais recente = mais pontos)
      const hoursAgo = (new Date() - new Date(item.pubDate)) / (1000 * 60 * 60);
      if (hoursAgo < 1) score += 30;
      else if (hoursAgo < 3) score += 25;
      else if (hoursAgo < 6) score += 20;
      else if (hoursAgo < 12) score += 15;
      else if (hoursAgo < 24) score += 10;
      
      // Bonus para notícias com mais conteúdo
      if (content.length > 200) score += 10;
      if (content.length > 500) score += 15;
      
      // Desconta pontos para títulos muito curtos ou muito longos
      if (title.length < 20) score -= 15;
      if (title.length > 200) score -= 10;
      
      // Adiciona variação baseada na posição para evitar empates
      score += Math.random() * 5;
      
      // Garante score entre 10 e 100
      score = Math.max(10, Math.min(100, score));
      
      console.log(`📊 [${item.source}] "${title.substring(0, 40)}..." - Score: ${Math.round(score)}`);
      
      return {
        ...item,
        relevanceScore: Math.round(score),
        rewrittenContent: this.formatContent(item),
        processed: true // Marca como processado pelo sistema local
      };
    });
    
    return processedNews;
  }
  
  // Formata o conteúdo de forma mais legível
  formatContent(item) {
    let content = item.originalContent || item.title;
    
    // Remove tags HTML se houver
    content = content.replace(/<[^>]*>/g, '');
    
    // Limita o tamanho do conteúdo
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }
    
    // Remove múltiplos espaços e quebras de linha
    content = content.replace(/\s+/g, ' ').trim();
    
    return content;
  }

  // Método para forçar atualização
  async forceUpdate() {
    this.lastUpdate = null;
    await this.getLatestNews();
  }
}

export default new TempNewsService();