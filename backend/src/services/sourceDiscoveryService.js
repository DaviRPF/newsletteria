import axios from 'axios';
import * as cheerio from 'cheerio';
import RSSParser from 'rss-parser';

class SourceDiscoveryService {
  constructor() {
    this.parser = new RSSParser();
    this.discoveredSources = new Map(); // Cache de fontes descobertas
    this.searchEngines = [
      {
        name: 'DuckDuckGo',
        search: this.searchDuckDuckGo.bind(this)
      }
    ];
  }

  // Busca automática por fontes de notícias baseado em interesses
  async discoverSources(interests, maxSources = 10) {
    console.log(`🔍 Descobrindo fontes automaticamente para: ${interests.join(', ')}`);
    
    const allSources = [];
    
    for (const interest of interests) {
      // Verifica cache primeiro
      const cacheKey = `sources_${interest}`;
      if (this.discoveredSources.has(cacheKey)) {
        const cachedSources = this.discoveredSources.get(cacheKey);
        console.log(`📋 Usando ${cachedSources.length} fontes em cache para "${interest}"`);
        allSources.push(...cachedSources);
        continue;
      }

      console.log(`🔍 Buscando fontes para "${interest}"...`);
      
      try {
        const sources = await this.findSourcesForTopic(interest);
        
        // Salva no cache por 1 hora
        this.discoveredSources.set(cacheKey, sources);
        setTimeout(() => {
          this.discoveredSources.delete(cacheKey);
        }, 60 * 60 * 1000);
        
        allSources.push(...sources);
        console.log(`✅ Encontradas ${sources.length} fontes para "${interest}"`);
        
        // Delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Erro ao buscar fontes para "${interest}":`, error.message);
      }
    }

    // Remove duplicatas e limita quantidade
    const uniqueSources = this.removeDuplicateSources(allSources);
    const limitedSources = uniqueSources.slice(0, maxSources);
    
    console.log(`✅ Total: ${limitedSources.length} fontes únicas descobertas`);
    
    return limitedSources;
  }

  // Busca fontes para um tópico específico
  async findSourcesForTopic(topic) {
    const sources = [];
    
    // Termos de busca mais específicos para sites brasileiros
    const searchQueries = [
      `site:tecmundo.com.br OR site:olhardigital.com.br OR site:canaltech.com.br "${topic}"`,
      `site:ge.globo.com OR site:lance.com.br OR site:espn.com.br "${topic}"`,
      `site:valor.globo.com OR site:infomoney.com.br "${topic}"`,
      `"${topic}" RSS feed site:com.br`,
      `"${topic}" feed xml site:org.br`,
      `portal "${topic}" Brasil RSS`
    ];

    for (const query of searchQueries) {
      try {
        console.log(`🔍 Buscando: "${query}"`);
        const searchResults = await this.searchForRSSFeeds(query);
        
        for (const result of searchResults) {
          const discoveredSources = await this.extractRSSFromPage(result.url, topic);
          sources.push(...discoveredSources);
        }
        
        // Para não fazer muitas requisições
        if (sources.length >= 5) break;
        
      } catch (error) {
        console.log(`⚠️ Erro na busca "${query}":`, error.message);
      }
    }

    // Se não encontrou nada via busca, tenta URLs diretas conhecidas
    if (sources.length === 0) {
      console.log(`🔍 Tentando URLs diretas para "${topic}"...`);
      const directUrls = this.getDirectUrlsForTopic(topic);
      
      for (const urlInfo of directUrls) {
        try {
          const validatedSource = await this.validateRSSFeed(urlInfo.url, topic, urlInfo.url);
          if (validatedSource) {
            sources.push(validatedSource);
          }
        } catch (error) {
          console.log(`⚠️ URL direta falhou: ${urlInfo.url}`);
        }
      }
    }

    return sources;
  }

  // Busca usando DuckDuckGo (não precisa de API key)
  async searchDuckDuckGo(query, maxResults = 10) {
    try {
      // Adiciona -site:duckduckgo.com para evitar páginas do próprio DuckDuckGo
      const cleanQuery = query + ' -site:duckduckgo.com -site:amazon.com.br -site:mercadolivre.com.br';
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.result__title a').each((index, element) => {
        if (index >= maxResults) return false;
        
        const title = $(element).text().trim();
        const url = $(element).attr('href');
        
        if (url && title) {
          results.push({
            title,
            url: url.startsWith('//') ? `https:${url}` : url,
            snippet: $(element).closest('.result').find('.result__snippet').text().trim()
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Erro no DuckDuckGo:', error.message);
      return [];
    }
  }

  // Busca por feeds RSS nos resultados
  async searchForRSSFeeds(query) {
    const results = [];
    
    for (const engine of this.searchEngines) {
      try {
        const searchResults = await engine.search(query, 5);
        results.push(...searchResults);
      } catch (error) {
        console.log(`⚠️ Erro em ${engine.name}:`, error.message);
      }
    }

    return results;
  }

  // Extrai feeds RSS de uma página
  async extractRSSFromPage(pageUrl, topic) {
    const sources = [];
    
    try {
      console.log(`🔍 Analisando página: ${pageUrl}`);
      
      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000,
        maxRedirects: 3
      });

      const $ = cheerio.load(response.data);
      const potentialFeeds = new Set();

      // Busca links RSS na página
      $('link[type="application/rss+xml"], link[type="application/atom+xml"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = this.resolveUrl(href, pageUrl);
          potentialFeeds.add(fullUrl);
        }
      });

      // Busca links que podem ser RSS
      $('a[href*="rss"], a[href*="feed"], a[href*=".xml"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && (href.includes('rss') || href.includes('feed') || href.endsWith('.xml'))) {
          const fullUrl = this.resolveUrl(href, pageUrl);
          potentialFeeds.add(fullUrl);
        }
      });

      // URLs comuns de RSS
      const commonRSSPaths = ['/rss', '/feed', '/rss.xml', '/feed.xml', '/atom.xml'];
      for (const path of commonRSSPaths) {
        const baseUrl = new URL(pageUrl).origin;
        potentialFeeds.add(baseUrl + path);
      }

      // Testa cada feed potencial
      for (const feedUrl of potentialFeeds) {
        try {
          const validatedSource = await this.validateRSSFeed(feedUrl, topic, pageUrl);
          if (validatedSource) {
            sources.push(validatedSource);
          }
        } catch (error) {
          // Ignora feeds inválidos silenciosamente
        }
      }

    } catch (error) {
      console.log(`⚠️ Erro ao analisar ${pageUrl}:`, error.message);
    }

    return sources;
  }

  // Valida se um feed RSS é válido e relevante
  async validateRSSFeed(feedUrl, topic, sourcePageUrl) {
    try {
      console.log(`🔍 Testando feed: ${feedUrl}`);
      
      const response = await axios.get(feedUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
        }
      });

      // Tenta fazer parse do RSS
      const feed = await this.parser.parseString(response.data);
      
      if (!feed || !feed.items || feed.items.length === 0) {
        return null;
      }

      // Verifica se é relevante para o tópico
      const relevanceScore = this.calculateFeedRelevance(feed, topic);
      if (relevanceScore < 0.3) {
        console.log(`⚠️ Feed pouco relevante para "${topic}": ${feedUrl}`);
        return null;
      }

      // Verifica se tem notícias recentes (últimas 24 horas)
      const recentNews = this.getRecentNews(feed.items, 24);
      if (recentNews.length === 0) {
        console.log(`⚠️ Feed sem notícias das últimas 24h: ${feedUrl}`);
        return null;
      }

      console.log(`✅ Feed válido encontrado: ${feed.title || 'Sem título'} (${recentNews.length} notícias recentes)`);

      return {
        name: feed.title || this.extractSiteName(feedUrl),
        url: feedUrl,
        baseUrl: new URL(feedUrl).origin,
        type: topic,
        weight: Math.round(relevanceScore * 10),
        recentCount: recentNews.length,
        sourcePageUrl: sourcePageUrl
      };

    } catch (error) {
      // Feed inválido ou inacessível
      return null;
    }
  }

  // Calcula relevância do feed para o tópico
  calculateFeedRelevance(feed, topic) {
    const topicLower = topic.toLowerCase();
    let score = 0;
    let totalItems = 0;

    // Analisa título do feed
    const feedTitle = (feed.title || '').toLowerCase();
    if (feedTitle.includes(topicLower)) {
      score += 0.4;
    }

    // Analisa últimas 10 notícias
    const recentItems = feed.items.slice(0, 10);
    for (const item of recentItems) {
      totalItems++;
      const title = (item.title || '').toLowerCase();
      const content = (item.content || item.summary || '').toLowerCase();
      
      if (title.includes(topicLower) || content.includes(topicLower)) {
        score += 0.1;
      }
    }

    return totalItems > 0 ? score / totalItems : 0;
  }

  // Filtra notícias recentes
  getRecentNews(items, hoursBack = 24) {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    return items.filter(item => {
      if (!item.pubDate) return false;
      const pubDate = new Date(item.pubDate);
      return !isNaN(pubDate.getTime()) && pubDate > cutoffTime;
    });
  }

  // Resolve URLs relativas
  resolveUrl(href, baseUrl) {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }

  // Extrai nome do site da URL
  extractSiteName(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').replace('.com.br', '').replace('.com', '');
    } catch {
      return 'Fonte Desconhecida';
    }
  }

  // Remove fontes duplicadas
  removeDuplicateSources(sources) {
    const seen = new Set();
    return sources.filter(source => {
      const key = source.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // URLs diretas para testar quando busca falha
  getDirectUrlsForTopic(topic) {
    const directUrls = {
      'tecnologia': [
        { name: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/' },
        { name: 'Canaltech', url: 'https://canaltech.com.br/rss/' },
        { name: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
        { name: 'UOL Tecnologia', url: 'https://tecnologia.uol.com.br/rss.xml' },
        { name: 'G1 Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/' }
      ],
      'esporte': [
        { name: 'ESPN Brasil', url: 'https://www.espn.com.br/rss/futebol.xml' },
        { name: 'Torcedores.com', url: 'https://www.torcedores.com/feed' },
        { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
        { name: 'Folha Esportes', url: 'https://feeds.folha.uol.com.br/esporte/rss091.xml' },
        { name: 'R7 Esportes', url: 'https://noticias.r7.com/esportes/feed.xml' }
      ],
      'futebol': [
        { name: 'ESPN Brasil Futebol', url: 'https://www.espn.com.br/rss/futebol.xml' },
        { name: 'Torcedores.com', url: 'https://www.torcedores.com/feed' },
        { name: 'G1 Futebol', url: 'https://g1.globo.com/rss/g1/futebol/' },
        { name: 'Folha Esportes', url: 'https://feeds.folha.uol.com.br/esporte/rss091.xml' },
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' }
      ],
      'economia': [
        { name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
        { name: 'Exame', url: 'https://exame.com/feed/' },
        { name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
        { name: 'Folha Mercado', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
        { name: 'UOL Economia', url: 'https://economia.uol.com.br/rss.xml' }
      ],
      'politica': [
        { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
        { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
        { name: 'Poder360', url: 'https://www.poder360.com.br/feed/' },
        { name: 'UOL Política', url: 'https://noticias.uol.com.br/politica/rss.xml' },
        { name: 'R7 Brasil', url: 'https://noticias.r7.com/brasil/feed.xml' }
      ],
      'entretenimento': [
        { name: 'G1 Pop & Arte', url: 'https://g1.globo.com/rss/g1/pop-arte/' },
        { name: 'Folha Ilustrada', url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml' },
        { name: 'Rolling Stone Brasil', url: 'https://rollingstone.uol.com.br/feed/' },
        { name: 'UOL Entretenimento', url: 'https://entretenimento.uol.com.br/rss.xml' },
        { name: 'R7 Entretenimento', url: 'https://noticias.r7.com/pop/feed.xml' }
      ],
      'seguranca': [
        { name: 'G1 SP', url: 'https://g1.globo.com/rss/g1/sao-paulo/' },
        { name: 'Band News', url: 'https://www.band.uol.com.br/rss/noticias.xml' },
        { name: 'R7 Cidades', url: 'https://noticias.r7.com/cidades/feed.xml' },
        { name: 'Agência Brasil Justiça', url: 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml' }
      ],
      'saude': [
        { name: 'G1 Saúde', url: 'https://g1.globo.com/rss/g1/bemestar/' },
        { name: 'UOL Saúde', url: 'https://rss.uol.com.br/feed/ciencia-e-saude.xml' },
        { name: 'Folha Saúde', url: 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml' },
        { name: 'CNN Brasil Saúde', url: 'https://www.cnnbrasil.com.br/saude/feed/' },
        { name: 'Agência Brasil Saúde', url: 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml' }
      ],
      'educacao': [
        { name: 'G1 Educação', url: 'https://g1.globo.com/rss/g1/educacao/' },
        { name: 'UOL Educação', url: 'https://rss.uol.com.br/feed/educacao.xml' },
        { name: 'Folha Educação', url: 'https://feeds.folha.uol.com.br/educacao/rss091.xml' },
        { name: 'Estadão Educação', url: 'https://educacao.estadao.com.br/rss' },
        { name: 'Agência Brasil Educação', url: 'http://agenciabrasil.ebc.com.br/rss/educacao/feed.xml' }
      ],
      'meio-ambiente': [
        { name: 'G1 Natureza', url: 'https://g1.globo.com/rss/g1/natureza/' },
        { name: 'Um Só Planeta', url: 'https://umsoplaneta.globo.com/rss' },
        { name: 'eCycle', url: 'https://www.ecycle.com.br/feed/' },
        { name: 'National Geographic Brasil', url: 'https://www.nationalgeographicbrasil.com/rss' }
      ],
      'cultura': [
        { name: 'G1 Pop & Arte', url: 'https://g1.globo.com/rss/g1/pop-arte/' },
        { name: 'Folha Ilustrada', url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml' },
        { name: 'UOL Entretenimento', url: 'https://rss.uol.com.br/feed/entretenimento.xml' },
        { name: 'Cult', url: 'https://revistacult.uol.com.br/home/feed/' },
        { name: 'Agência Brasil Cultura', url: 'http://agenciabrasil.ebc.com.br/rss/cultura/feed.xml' }
      ],
      'infraestrutura': [
        { name: 'Mobilize Brasil', url: 'https://www.mobilize.org.br/rss/' },
        { name: 'Vias Seguras', url: 'https://www.vias-seguras.com/rss' },
        { name: 'G1 Infraestrutura', url: 'https://g1.globo.com/rss/g1/economia/infraestrutura/' },
        { name: 'Agência Brasil Infraestrutura', url: 'http://agenciabrasil.ebc.com.br/rss/infraestrutura/feed.xml' }
      ],
      'justica': [
        { name: 'Conjur', url: 'https://www.conjur.com.br/rss.xml' },
        { name: 'Migalhas', url: 'https://www.migalhas.com.br/rss' },
        { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
        { name: 'STF Notícias', url: 'http://www.stf.jus.br/portal/rss/noticiaRss.asp' },
        { name: 'Agência Brasil Justiça', url: 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml' }
      ],
      'religiao': [
        { name: 'Gospel Mais', url: 'https://noticias.gospelmais.com.br/feed' },
        { name: 'Gospel Prime', url: 'https://www.gospelprime.com.br/feed/' },
        { name: 'CNBB', url: 'https://www.cnbb.org.br/feed/' },
        { name: 'Canção Nova', url: 'https://noticias.cancaonova.com/feed/' }
      ]
    };

    return directUrls[topic] || [];
  }

  // Busca fontes conhecidas do Brasil como fallback
  getKnownBrazilianSources(topic) {
    return this.getDirectUrlsForTopic(topic);
  }
}

export default new SourceDiscoveryService();