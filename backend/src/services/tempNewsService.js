import newsService from './newsService.js';
import aiService from './aiService.js';
import tokenTracker from './tokenTracker.js';
import categoryService from './categoryService.js';

class TempNewsService {
  constructor() {
    this.cachedNews = [];
    this.lastUpdate = null;
    this.lastUserProfile = null; // Rastreia o perfil usado no último cache
    
    // FORÇA LIMPEZA DO CACHE (ALGORITMO MELHORADO)
    this.lastUpdate = null;
  }

  async getLatestNews(userProfile = null) {
    const now = new Date();
    
    // Verifica se precisa atualizar o cache
    const cacheExpired = !this.lastUpdate || (now - this.lastUpdate) > 30 * 60 * 1000;
    const profileChanged = JSON.stringify(userProfile?.profileDescription) !== JSON.stringify(this.lastUserProfile?.profileDescription);
    
    if (cacheExpired || profileChanged) {
      if (cacheExpired) {
        console.log('🔄 Atualizando cache de notícias (cache expirado)...');
      } else if (profileChanged) {
        console.log('🔄 Atualizando cache de notícias (perfil diferente)...');
        console.log(`   Perfil anterior: ${this.lastUserProfile?.profileDescription || 'nenhum'}`);
        console.log(`   Perfil atual: ${userProfile?.profileDescription || 'nenhum'}`);
      }
      
      await this.updateNewsCache(userProfile);
      this.lastUserProfile = userProfile;
    } else {
      console.log('✅ Usando cache existente (ainda válido)');
    }

    return this.cachedNews;
  }

  async updateNewsCache(userProfile = null) {
    try {
      console.log('📰 Coletando notícias personalizadas...');
      
      // NOVA ABORDAGEM: Sistema categoria-dirigido (IA identifica categorias → busca nas fontes específicas)
      const categoryDrivenNewsService = await import('./categoryDrivenNewsService.js');
      const allNews = await categoryDrivenNewsService.default.getPersonalizedNews(userProfile);
      
      console.log(`✅ ${allNews.length} notícias categoria-dirigidas coletadas`);

      if (allNews.length === 0) {
        console.log('⚠️ Nenhuma notícia coletada, mantendo cache anterior');
        return;
      }

      // O categoryDrivenNewsService já retorna notícias filtradas e organizadas por categoria
      console.log(`📅 ${allNews.length} notícias já filtradas por categoria e personalizadas`);

      // Processa com sistema local para obter pontuação
      console.log('🧠 Fazendo pontuação com sistema local...');
      const localProcessed = this.processNewsLocally(allNews);
      
      console.log(`🎯 Processadas ${localProcessed.length} notícias personalizadas`);

      // Só processa com IA se disponível (refinamento opcional)
      let finalNews;
      try {
        // Verifica se a API key está configurada e não é a padrão
        const hasValidKey = process.env.GEMINI_API_KEY && 
                           process.env.GEMINI_API_KEY !== 'your-gemini-api-key' &&
                           process.env.GEMINI_API_KEY.length > 30;
        
        if (hasValidKey) {
          console.log('🤖 Refinando notícias com IA Gemini (opcional)...');
          finalNews = await this.processWithAI(localProcessed);
          console.log('✅ Refinamento com IA bem-sucedido');
        } else {
          console.log('⚠️ API key Gemini inválida, usando processamento local');
          finalNews = localProcessed;
        }
      } catch (error) {
        console.log('❌ Erro na IA, mantendo processamento local:', error.message);
        finalNews = localProcessed;
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
      let score = 30; // Score base menor
      
      // Palavras-chave que aumentam relevância (peso moderado)
      const highRelevanceKeywords = [
        'brasil', 'lula', 'bolsonaro', 'governo', 'política', 'economia', 
        'eleição', 'supremo', 'stf', 'congresso', 'senado', 'deputado',
        'ministro', 'presidente', 'petrobras', 'banco central', 'inflação', 'pib'
      ];
      
      const mediumRelevanceKeywords = [
        'rio', 'são paulo', 'brasília', 'saúde', 'educação', 'violência', 
        'segurança', 'corrupção', 'investigação', 'operação', 'polícia federal',
        'justiça', 'onu', 'internacional'
      ];
      
      const lowRelevanceKeywords = [
        'esporte', 'futebol', 'música', 'cultura', 'festival', 'celebridade',
        'entretenimento', 'cinema', 'tv', 'novela'
      ];
      
      const title = item.title?.toLowerCase() || '';
      const content = item.originalContent?.toLowerCase() || '';
      const combined = title + ' ' + content;
      
      // Pontuação por palavras-chave (valores reduzidos)
      let keywordMatches = 0;
      highRelevanceKeywords.forEach(keyword => {
        if (combined.includes(keyword)) {
          score += title.includes(keyword) ? 12 : 8;
          keywordMatches++;
        }
      });
      
      mediumRelevanceKeywords.forEach(keyword => {
        if (combined.includes(keyword)) {
          score += title.includes(keyword) ? 6 : 4;
          keywordMatches++;
        }
      });
      
      // Penaliza notícias de baixa relevância
      lowRelevanceKeywords.forEach(keyword => {
        if (combined.includes(keyword)) {
          score -= 8;
        }
      });
      
      // Bonificação por fonte (reduzida)
      if (item.source?.includes('Agência Brasil')) score += 8;
      else if (item.source?.includes('Opera Mundi')) score += 6;
      else if (item.source?.includes('UOL')) score += 5;
      
      // Sem bonificação por recência - todas as notícias das últimas 24h têm peso igual
      
      // Bonus menor para conteúdo
      if (content.length > 300) score += 5;
      if (content.length > 600) score += 5;
      
      // Penaliza títulos problemáticos
      if (title.length < 15) score -= 10;
      if (title.length > 150) score -= 5;
      if (title.includes('...')) score -= 3; // Títulos truncados
      
      // Se não tem palavras-chave relevantes, reduz muito o score
      if (keywordMatches === 0) score -= 20;
      
      // Adiciona variação mínima para evitar empates
      score += Math.random() * 3;
      
      // Garante score entre 15 e 95 (range mais realista)
      score = Math.max(15, Math.min(95, score));
      
      console.log(`📊 [${item.source}] "${title.substring(0, 40)}..." - Score: ${Math.round(score)} (matches: ${keywordMatches})`);
      
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
  async forceUpdate(userProfile = null) {
    this.lastUpdate = null;
    this.lastUserProfile = null; // Força re-avaliação do perfil
    await this.getLatestNews(userProfile);
  }
}

export default new TempNewsService();