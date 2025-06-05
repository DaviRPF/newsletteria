import sourceDiscoveryService from './sourceDiscoveryService.js';

class CategoryService {
  constructor() {
    // Mapeia interesses do usuário para URLs específicas
    this.categoryMapping = {
      'esporte': {
        keywords: ['esporte', 'futebol', 'basquete', 'vôlei', 'tênis', 'atletismo', 'copa', 'campeonato', 'jogos', 'time', 'atleta'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/esporte.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Opera Mundi': null // Opera Mundi não tem seção específica de esporte
        }
      },
      'futebol': {
        keywords: ['futebol', 'football', 'brasileiro', 'série a', 'libertadores', 'copa do brasil', 'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'santos', 'grêmio', 'internacional', 'seleção', 'cbf'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/esporte.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Opera Mundi': null
        }
      },
      'tecnologia': {
        keywords: ['tecnologia', 'tech', 'programação', 'software', 'hardware', 'inteligência artificial', 'ia', 'computador', 'internet', 'digital', 'inovação'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/tecnologia.xml',
          'Agência Brasil': null,
          'Opera Mundi': null
        }
      },
      'economia': {
        keywords: ['economia', 'financeiro', 'mercado', 'investimento', 'bolsa', 'dólar', 'inflação', 'juros', 'pib', 'empresas', 'negócios'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/economia.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/economia/feed.xml',
          'Opera Mundi': null
        }
      },
      'saude': {
        keywords: ['saúde', 'medicina', 'médico', 'hospital', 'tratamento', 'doença', 'vacina', 'covid', 'pandemia', 'sus'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/ciencia-e-saude.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml',
          'Opera Mundi': null
        }
      },
      'educacao': {
        keywords: ['educação', 'ensino', 'escola', 'universidade', 'professor', 'estudante', 'mec', 'enem', 'vestibular'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/educacao.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/educacao/feed.xml',
          'Opera Mundi': null
        }
      },
      'politica': {
        keywords: ['política', 'governo', 'presidente', 'ministro', 'congresso', 'senado', 'deputado', 'eleição', 'lula', 'bolsonaro'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/politica.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/politica/feed.xml',
          'Opera Mundi': null // Opera Mundi é focado em política internacional
        }
      },
      'internacional': {
        keywords: ['internacional', 'mundo', 'global', 'países', 'exterior', 'diplomacia', 'guerra', 'eua', 'europa', 'china'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/mundo.xml',
          'Agência Brasil': null,
          'Opera Mundi': 'https://operamundi.uol.com.br/rss' // Principal foco
        }
      },
      'cultura': {
        keywords: ['cultura', 'arte', 'música', 'cinema', 'teatro', 'livro', 'literatura', 'festival', 'show', 'museu', 'exposição', 'artista'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/entretenimento.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/cultura/feed.xml',
          'Opera Mundi': null
        }
      },
      'entretenimento': {
        keywords: ['entretenimento', 'celebridade', 'famoso', 'novela', 'série', 'filme', 'show', 'espetáculo', 'reality', 'tv', 'streaming'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/entretenimento.xml',
          'Agência Brasil': null,
          'Opera Mundi': null
        }
      },
      'seguranca': {
        keywords: ['segurança', 'polícia', 'crime', 'violência', 'assalto', 'roubo', 'homicídio', 'operação', 'prisão', 'bandido', 'criminoso', 'segurança pública'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/noticias.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml',
          'Opera Mundi': null
        }
      },
      'meio-ambiente': {
        keywords: ['meio ambiente', 'ambiental', 'natureza', 'sustentabilidade', 'ecologia', 'clima', 'aquecimento global', 'desmatamento', 'poluição', 'reciclagem', 'floresta', 'amazônia'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/ciencia-e-saude.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml',
          'Opera Mundi': null
        }
      },
      'infraestrutura': {
        keywords: ['infraestrutura', 'transporte', 'mobilidade', 'trânsito', 'metrô', 'ônibus', 'rodovia', 'estrada', 'obra', 'construção', 'saneamento', 'energia'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/economia.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/infraestrutura/feed.xml',
          'Opera Mundi': null
        }
      },
      'justica': {
        keywords: ['justiça', 'tribunal', 'juiz', 'promotor', 'advogado', 'julgamento', 'sentença', 'processo', 'stf', 'stj', 'direito', 'lei'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/politica.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml',
          'Opera Mundi': null
        }
      },
      'religiao': {
        keywords: ['religião', 'igreja', 'fé', 'deus', 'pastor', 'padre', 'evangélico', 'católico', 'cristão', 'missa', 'culto', 'templo', 'bíblia'],
        sources: {
          'UOL': 'https://rss.uol.com.br/feed/noticias.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml',
          'Opera Mundi': null
        }
      }
    };

    // URLs gerais (sempre incluir)
    this.generalSources = {
      'UOL': 'https://rss.uol.com.br/feed/noticias.xml',
      'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
      'Opera Mundi': 'https://operamundi.uol.com.br/rss'
    };
  }

  // Analisa o perfil do usuário e identifica categorias de interesse
  analyzeUserProfile(profileDescription) {
    if (!profileDescription || profileDescription.trim().length === 0) {
      return [];
    }

    const profile = profileDescription.toLowerCase();
    const detectedCategories = [];

    for (const [category, config] of Object.entries(this.categoryMapping)) {
      const hasKeyword = config.keywords.some(keyword => profile.includes(keyword));
      if (hasKeyword) {
        detectedCategories.push(category);
      }
    }

    console.log(`🎯 Categorias detectadas no perfil: ${detectedCategories.join(', ') || 'nenhuma'}`);
    return detectedCategories;
  }

  // Gera lista de fontes personalizadas baseada no perfil (COM DESCOBERTA AUTOMÁTICA)
  async getPersonalizedSources(userCategories, useAutoDiscovery = true) {
    const sources = [];

    // SEMPRE inclui fontes gerais (2-3 notícias)
    console.log('📰 Adicionando fontes GERAIS...');
    for (const [sourceName, url] of Object.entries(this.generalSources)) {
      sources.push({
        name: sourceName,
        url: url,
        type: 'geral',
        weight: 1 // Peso normal
      });
    }

    if (userCategories.length > 0) {
      if (useAutoDiscovery) {
        // NOVO: Descoberta automática de fontes
        console.log(`🔍 DESCOBRINDO FONTES AUTOMATICAMENTE para: ${userCategories.join(', ')}`);
        
        try {
          const discoveredSources = await sourceDiscoveryService.discoverSources(userCategories, 8);
          
          for (const discoveredSource of discoveredSources) {
            sources.push({
              name: discoveredSource.name,
              url: discoveredSource.url,
              type: discoveredSource.type,
              weight: discoveredSource.weight || 3, // Peso alto para fontes descobertas
              discovered: true
            });
          }
          
          console.log(`🎯 ${discoveredSources.length} fontes descobertas automaticamente!`);
          
          // Se não encontrou fontes, usa conhecidas como fallback
          if (discoveredSources.length === 0) {
            console.log('🔄 Nenhuma fonte descoberta, usando fontes conhecidas...');
            for (const category of userCategories) {
              const knownSources = this.getKnownBrazilianSources(category);
              for (const knownSource of knownSources) {
                sources.push({
                  name: knownSource.name,
                  url: knownSource.url,
                  type: category,
                  weight: 3,
                  fallback: true
                });
              }
            }
          }
        } catch (error) {
          console.error('❌ Erro na descoberta automática:', error.message);
          console.log('🔄 Usando fontes fixas + conhecidas como fallback...');
          
          // Adiciona fontes conhecidas do Brasil como fallback
          for (const category of userCategories) {
            const knownSources = this.getKnownBrazilianSources(category);
            for (const knownSource of knownSources) {
              sources.push({
                name: knownSource.name,
                url: knownSource.url,
                type: category,
                weight: 3,
                fallback: true
              });
            }
          }
          
          useAutoDiscovery = false; // Fallback para modo fixo
        }
      }
      
      if (!useAutoDiscovery) {
        // Modo tradicional com fontes fixas
        console.log(`📊 Adicionando fontes FIXAS para: ${userCategories.join(', ')}`);
        
        for (const category of userCategories) {
          const categoryConfig = this.categoryMapping[category];
          if (categoryConfig) {
            for (const [sourceName, url] of Object.entries(categoryConfig.sources)) {
              if (url) { // Só adiciona se tem URL específica
                sources.push({
                  name: sourceName,
                  url: url,
                  type: category,
                  weight: 2 // Peso maior para interesse específico
                });
              }
            }
          }
        }
      }
    }

    // Remove duplicatas (mantém o de maior peso)
    const uniqueSources = [];
    const seenUrls = new Set();

    sources.sort((a, b) => b.weight - a.weight); // Prioriza peso maior

    for (const source of sources) {
      if (!seenUrls.has(source.url)) {
        uniqueSources.push(source);
        seenUrls.add(source.url);
      }
    }

    console.log(`✅ ${uniqueSources.length} fontes selecionadas:`);
    uniqueSources.forEach(source => {
      const discoveryTag = source.discovered ? ' 🔍' : '';
      console.log(`   ${source.name} (${source.type}) - peso ${source.weight}${discoveryTag}`);
    });

    return uniqueSources;
  }

  // Calcula distribuição de notícias por tipo
  calculateNewsDistribution(userCategories) {
    const totalNews = 6;
    
    if (userCategories.length === 0) {
      // Sem preferências: todas gerais
      return {
        geral: 6,
        especificas: {}
      };
    }

    // Com preferências: 3 gerais + 3 específicas
    const geralCount = 3;
    const specificCount = 3;
    
    const distribution = {
      geral: geralCount,
      especificas: {}
    };

    // Distribui as específicas entre as categorias
    const categoriesCount = userCategories.length;
    const newsPerCategory = Math.floor(specificCount / categoriesCount);
    const remainder = specificCount % categoriesCount;

    for (let i = 0; i < userCategories.length; i++) {
      const category = userCategories[i];
      distribution.especificas[category] = newsPerCategory + (i < remainder ? 1 : 0);
    }

    console.log('📊 Distribuição de notícias:', distribution);
    return distribution;
  }

  // Filtra notícias por categoria baseado no conteúdo
  categorizeNews(news, targetCategory) {
    if (targetCategory === 'geral') {
      return true; // Notícias gerais aceitam qualquer coisa
    }

    const categoryConfig = this.categoryMapping[targetCategory];
    if (!categoryConfig) {
      return false;
    }

    const title = news.title?.toLowerCase() || '';
    const content = news.originalContent?.toLowerCase() || '';
    const combined = title + ' ' + content;

    // Verifica se a notícia contém palavras-chave da categoria
    return categoryConfig.keywords.some(keyword => combined.includes(keyword));
  }

  // Pontuação especial para notícias que batem com interesse do usuário
  getPersonalizedScore(news, userCategories) {
    let bonus = 0;

    for (const category of userCategories) {
      if (this.categorizeNews(news, category)) {
        bonus += 15; // Bonus significativo para interesse específico
        console.log(`🎯 Bonus de ${15} pontos para "${news.title.substring(0, 30)}..." (categoria: ${category})`);
      }
    }

    return bonus;
  }

  // Fontes conhecidas do Brasil como fallback
  getKnownBrazilianSources(category) {
    const knownSources = {
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
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
        { name: 'Terra Esportes', url: 'https://www.terra.com.br/esportes/rss.xml' },
        { name: 'Sportv', url: 'https://sportv.globo.com/rss/sportv/' }
      ],
      'politica': [
        { name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
        { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
        { name: 'Poder360', url: 'https://www.poder360.com.br/feed/' },
        { name: 'UOL Política', url: 'https://noticias.uol.com.br/politica/rss.xml' },
        { name: 'R7 Brasil', url: 'https://noticias.r7.com/brasil/feed.xml' }
      ],
      'economia': [
        { name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
        { name: 'Exame', url: 'https://exame.com/feed/' },
        { name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
        { name: 'Folha Mercado', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
        { name: 'UOL Economia', url: 'https://economia.uol.com.br/rss.xml' }
      ],
      'entretenimento': [
        { name: 'G1 Pop & Arte', url: 'https://g1.globo.com/rss/g1/pop-arte/' },
        { name: 'Folha Ilustrada', url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml' },
        { name: 'Rolling Stone Brasil', url: 'https://rollingstone.uol.com.br/feed/' },
        { name: 'UOL Entretenimento', url: 'https://entretenimento.uol.com.br/rss.xml' },
        { name: 'R7 Entretenimento', url: 'https://noticias.r7.com/pop/feed.xml' }
      ],
      'seguranca': [
        { name: 'Agência Brasil Justiça', url: 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml' },
        { name: 'G1 Brasil', url: 'https://g1.globo.com/rss/g1/brasil/' },
        { name: 'Folha Cotidiano', url: 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml' },
        { name: 'UOL Notícias', url: 'https://noticias.uol.com.br/rss.xml' }
      ],
      'saude': [
        { name: 'G1 Saúde', url: 'https://g1.globo.com/rss/g1/bemestar/' },
        { name: 'Folha Saúde', url: 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml' },
        { name: 'Agência Brasil Saúde', url: 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml' },
        { name: 'UOL Saúde', url: 'https://noticias.uol.com.br/saude/rss.xml' },
        { name: 'R7 Saúde', url: 'https://noticias.r7.com/saude/feed.xml' }
      ],
      'educacao': [
        { name: 'G1 Educação', url: 'https://g1.globo.com/rss/g1/educacao/' },
        { name: 'Folha Educação', url: 'https://feeds.folha.uol.com.br/educacao/rss091.xml' },
        { name: 'Agência Brasil Educação', url: 'http://agenciabrasil.ebc.com.br/rss/educacao/feed.xml' },
        { name: 'UOL Educação', url: 'https://educacao.uol.com.br/rss.xml' },
        { name: 'R7 Educação', url: 'https://noticias.r7.com/educacao/feed.xml' }
      ],
      'tecnologia': [
        { name: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/' },
        { name: 'Canaltech', url: 'https://canaltech.com.br/rss/' },
        { name: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
        { name: 'UOL Tecnologia', url: 'https://tecnologia.uol.com.br/rss.xml' },
        { name: 'G1 Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/' },
        { name: 'Folha Tec', url: 'https://feeds.folha.uol.com.br/tec/rss091.xml' }
      ],
      'meio-ambiente': [
        { name: 'Agência Brasil Meio Ambiente', url: 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml' },
        { name: 'G1 Ciência', url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/' },
        { name: 'Folha Ambiente', url: 'https://feeds.folha.uol.com.br/ambiente/rss091.xml' },
        { name: 'UOL Ciência', url: 'https://noticias.uol.com.br/ciencia/rss.xml' }
      ],
      'cultura': [
        { name: 'G1 Pop & Arte', url: 'https://g1.globo.com/rss/g1/pop-arte/' },
        { name: 'Folha Ilustrada', url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml' },
        { name: 'Cult', url: 'https://revistacult.uol.com.br/home/feed/' },
        { name: 'Agência Brasil Cultura', url: 'http://agenciabrasil.ebc.com.br/rss/cultura/feed.xml' },
        { name: 'UOL Entretenimento', url: 'https://entretenimento.uol.com.br/rss.xml' }
      ],
      'infraestrutura': [
        { name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
        { name: 'Folha Mercado', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
        { name: 'Agência Brasil Economia', url: 'http://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
        { name: 'UOL Economia', url: 'https://economia.uol.com.br/rss.xml' }
      ],
      'justica': [
        { name: 'Conjur', url: 'https://www.conjur.com.br/rss.xml' },
        { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
        { name: 'Agência Brasil Justiça', url: 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml' },
        { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
        { name: 'UOL Política', url: 'https://noticias.uol.com.br/politica/rss.xml' }
      ],
      'religiao': [
        { name: 'Gospel Mais', url: 'https://noticias.gospelmais.com.br/feed' },
        { name: 'Gospel Prime', url: 'https://www.gospelprime.com.br/feed/' },
        { name: 'CNBB', url: 'https://www.cnbb.org.br/feed/' },
        { name: 'Canção Nova', url: 'https://noticias.cancaonova.com/feed/' }
      ]
    };

    return knownSources[category] || [];
  }
}

export default new CategoryService();