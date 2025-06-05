import RSSParser from 'rss-parser';
import crypto from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { News } from '../models/News.js';

class NewsService {
  constructor() {
    this.parser = new RSSParser();
    this.sources = [
      {
        name: 'Opera Mundi',
        url: 'https://operamundi.uol.com.br/rss',
        baseUrl: 'https://operamundi.uol.com.br'
      },
      {
        name: 'UOL',
        url: 'https://rss.uol.com.br/feed/noticias.xml',
        baseUrl: 'https://www.uol.com.br'
      },
      {
        name: 'Agência Brasil',
        url: 'http://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
        baseUrl: 'https://agenciabrasil.ebc.com.br'
      }
    ];
  }

  // Método para coletar notícias de uma fonte específica
  async fetchNewsFromSource(source) {
    try {
      console.log(`🔍 Coletando de ${source.name}...`);
      const feed = await this.parser.parseURL(source.url);
      
      const news = [];
      for (const item of feed.items) {
        const newsHash = this.generateHash(item.title, item.link);
        
        try {
          const newsItem = {
            title: item.title,
            originalContent: item.contentSnippet || item.summary || item.description || '',
            source: source.name,
            originalUrl: item.link,
            pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            hash: newsHash,
            imageUrl: await this.extractImageFromItem(item)
          };

          news.push(newsItem);
        } catch (itemError) {
          console.log(`⚠️ Erro ao processar item de ${source.name}:`, itemError.message);
        }
      }
      
      console.log(`   ✅ ${news.length} notícias coletadas de ${source.name}`);
      return news;
      
    } catch (error) {
      console.log(`❌ Erro ao coletar de ${source.name}:`, error.message);
      return [];
    }
  }

  async fetchAllNews(db = null, customSources = null) {
    console.log('Iniciando coleta de notícias...');
    const allNews = [];
    
    // Usa fontes personalizadas se fornecidas, senão usa as padrão
    const sourcesToUse = customSources || this.sources;
    console.log(`📊 Usando ${sourcesToUse.length} fontes: ${sourcesToUse.map(s => s.name || s.url).join(', ')}`);

    for (const source of sourcesToUse) {
      try {
        console.log(`🔍 Coletando notícias de ${source.name}...`);
        console.log(`   URL: ${source.url}`);
        const feed = await this.parser.parseURL(source.url);
        console.log(`   Feed título: ${feed.title}`);
        
        for (const item of feed.items) {
          const newsHash = this.generateHash(item.title, item.link);
          
          // Se tem DB, verifica duplicatas
          if (db) {
            const existingNews = await News.findByHash(db, newsHash);
            if (existingNews) {
              console.log(`   🔄 Duplicata ignorada: ${item.title?.substring(0, 50)}...`);
              continue;
            }
          }

          // Cria data válida
          let pubDate = new Date();
          if (item.pubDate) {
            const parsedDate = new Date(item.pubDate);
            if (!isNaN(parsedDate.getTime())) {
              pubDate = parsedDate;
            } else {
              console.log(`⚠️ Data inválida para ${item.title}: ${item.pubDate}`);
            }
          }

          const newsItem = {
            title: item.title,
            originalUrl: item.link,
            source: source.name,
            pubDate: pubDate,
            hash: newsHash,
            originalContent: item.contentSnippet || item.content || '',
            imageUrl: await this.extractImageFromItem(item) || null
          };

          try {
            const fullContent = await this.scrapeFullContent(item.link);
            if (fullContent) {
              newsItem.originalContent = fullContent;
            }
          } catch (error) {
            console.error(`Erro ao fazer scraping de ${item.link}:`, error.message);
          }

          if (db) {
            const savedNews = await News.create(db, newsItem);
            allNews.push(savedNews);
          } else {
            // Sem DB, apenas adiciona à lista temporária
            newsItem._id = newsHash;
            allNews.push(newsItem);
            console.log(`   ✅ Adicionada: ${item.title?.substring(0, 50)}... [${source.name}]`);
          }
        }
        
        console.log(`✅ ${source.name}: ${feed.items.length} notícias coletadas, ${feed.items.filter(item => item.title && item.link).length} válidas`);
      } catch (error) {
        console.error(`❌ Erro ao coletar de ${source.name}:`, error.message);
        console.log(`⚠️ Tentando URL alternativa para ${source.name}...`);
        
        // URLs alternativas para fontes que podem falhar
        let alternativeUrl = null;
        if (source.name.includes('Opera')) {
          alternativeUrl = 'https://operamundi.uol.com.br/feed/';
        } else if (source.name.includes('UOL')) {
          alternativeUrl = 'https://noticias.uol.com.br/ultimas-noticias/index.xml';
        } else if (source.name.includes('Agência Brasil')) {
          alternativeUrl = 'http://agenciabrasil.ebc.com.br/rss/politica/feed.xml';
        }
        
        if (alternativeUrl) {
          try {
            console.log(`🔄 Tentando: ${alternativeUrl}`);
            const feed = await this.parser.parseURL(alternativeUrl);
            
            for (const item of feed.items) {
              const newsHash = this.generateHash(item.title, item.link);
              
              if (db) {
                const existingNews = await News.findByHash(db, newsHash);
                if (existingNews) continue;
              }

              // Cria data válida para fonte alternativa
              let altPubDate = new Date();
              if (item.pubDate) {
                const parsedDate = new Date(item.pubDate);
                if (!isNaN(parsedDate.getTime())) {
                  altPubDate = parsedDate;
                }
              }

              const newsItem = {
                title: item.title,
                originalUrl: item.link,
                source: source.name + ' (Alt)',
                pubDate: altPubDate,
                hash: newsHash,
                originalContent: item.contentSnippet || item.content || '',
                imageUrl: await this.extractImageFromItem(item) || null
              };

              if (db) {
                const savedNews = await News.create(db, newsItem);
                allNews.push(savedNews);
              } else {
                newsItem._id = newsHash;
                allNews.push(newsItem);
              }
            }
            
            console.log(`✅ ${source.name} (alternativa): ${feed.items.length} notícias processadas`);
          } catch (altError) {
            console.error(`❌ URL alternativa também falhou para ${source.name}:`, altError.message);
          }
        }
      }
    }

    console.log(`Total de novas notícias coletadas: ${allNews.length}`);
    return allNews;
  }

  async scrapeFullContent(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      $('script, style, nav, header, footer, aside, .advertisement, .ad, .comments').remove();

      let content = '';
      
      const selectors = [
        'article p',
        '.content p',
        '.post-content p',
        '.entry-content p',
        '.article-body p',
        '.text p',
        'main p',
        '.story p'
      ];

      for (const selector of selectors) {
        const paragraphs = $(selector);
        if (paragraphs.length > 0) {
          paragraphs.each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.length > 50) {
              content += text + '\n\n';
            }
          });
          break;
        }
      }

      if (!content) {
        const allParagraphs = $('p');
        allParagraphs.each((i, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 50) {
            content += text + '\n\n';
          }
        });
      }

      return content.trim();
    } catch (error) {
      console.error('Erro no scraping:', error.message);
      return null;
    }
  }

  async extractImageFromItem(item) {
    // 1. Tenta pegar de enclosures (comum em RSS)
    if (item.enclosures && item.enclosures.length > 0) {
      for (const enclosure of item.enclosures) {
        if (enclosure.type && enclosure.type.startsWith('image/')) {
          return enclosure.url;
        }
      }
    }

    // 2. Tenta pegar de media namespace
    if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
      return item['media:content'].$.url;
    }

    // 3. Tenta extrair do conteúdo HTML
    const contentImage = this.extractImageFromContent(item.content || item.description);
    if (contentImage && this.isValidImage(contentImage)) {
      return contentImage;
    }

    // 4. Tenta fazer scraping da página (com timeout)
    try {
      const scrapedImage = await this.scrapeImageFromPage(item.link);
      if (scrapedImage) {
        return scrapedImage;
      }
    } catch (error) {
      // Falha silenciosa no scraping - não queremos atrasar o processo
    }

    return null;
  }

  extractImageFromContent(content) {
    if (!content) return null;
    
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    const matches = content.matchAll(imgRegex);
    
    for (const match of matches) {
      const imageUrl = match[1];
      if (this.isValidImage(imageUrl)) {
        return imageUrl;
      }
    }
    
    return null;
  }

  isValidImage(url) {
    if (!url) return false;
    
    // Filtra tracking pixels e imagens muito pequenas
    if (url.includes('1x1') || url.includes('pixel') || url.includes('tracking')) {
      return false;
    }

    // Verifica se é uma URL de imagem válida
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    
    // Aceita se tem extensão de imagem ou se parece com URL de imagem
    return hasImageExtension || url.includes('image') || url.includes('foto') || url.includes('img');
  }

  async scrapeImageFromPage(url) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Procura por meta tags Open Graph
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage && this.isValidImage(ogImage)) {
        return ogImage;
      }

      // Procura pela primeira imagem grande no artigo
      const articleSelectors = [
        'article img',
        '.content img',
        '.post-content img',
        '.entry-content img',
        '.article-body img',
        'main img'
      ];

      for (const selector of articleSelectors) {
        const img = $(selector).first();
        if (img.length > 0) {
          const src = img.attr('src');
          if (src && this.isValidImage(src)) {
            // Converte URL relativa em absoluta
            const fullUrl = new URL(src, url).href;
            return fullUrl;
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  generateHash(title, url) {
    const content = title + url;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  async findSimilarNews(db, title) {
    const words = title.toLowerCase().split(' ').filter(word => word.length > 3);
    const searchRegex = new RegExp(words.join('|'), 'i');
    
    return await db.collection('news').find({
      title: { $regex: searchRegex }
    }).toArray();
  }

  calculateSimilarity(title1, title2) {
    const words1 = title1.toLowerCase().split(' ');
    const words2 = title2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  async detectDuplicates(db) {
    const allNews = await db.collection('news').find({
      processed: false
    }).toArray();

    const duplicateGroups = [];
    const processed = new Set();

    for (let i = 0; i < allNews.length; i++) {
      if (processed.has(allNews[i]._id.toString())) continue;

      const group = [allNews[i]];
      processed.add(allNews[i]._id.toString());

      for (let j = i + 1; j < allNews.length; j++) {
        if (processed.has(allNews[j]._id.toString())) continue;

        const similarity = this.calculateSimilarity(allNews[i].title, allNews[j].title);
        
        if (similarity > 0.6) {
          group.push(allNews[j]);
          processed.add(allNews[j]._id.toString());
        }
      }

      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }

    console.log(`Encontrados ${duplicateGroups.length} grupos de notícias similares`);
    return duplicateGroups;
  }

  async getTodayTopNews(db, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await News.getTopNews(db, date, 4);
  }

  async markNewsAsSent(db, newsIds) {
    return await News.markAsSent(db, newsIds);
  }
}

export default new NewsService();