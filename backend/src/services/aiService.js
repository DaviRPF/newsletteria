import { GoogleGenerativeAI } from '@google/generative-ai';
import { News } from '../models/News.js';
import tokenTracker from './tokenTracker.js';

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initializeAI() {
    if (!this.genAI && process.env.GEMINI_API_KEY) {
      console.log('🤖 Inicializando Gemini AI com API Key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
    }
    return this.model;
  }

  // NOVO: Analisa perfil e identifica categorias específicas do CategoryService
  async identifyUserCategories(profileDescription) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      const prompt = `
Analise este perfil de usuário e identifique EXATAMENTE quais categorias específicas de interesse ele tem.

CATEGORIAS DISPONÍVEIS:
- futebol, volei, handebol, rugby, futsal, volei-praia, formula1 (esportes específicos)
- tecnologia, economia, investimentos
- saude, educacao, politica, internacional
- cultura, entretenimento, seguranca
- meio-ambiente, infraestrutura, justica, religiao

REGRAS IMPORTANTES:
1. Se mencionar esporte específico listado acima, use EXATAMENTE esse esporte
2. Se mencionar esporte específico NÃO listado (ex: basquete, tênis, natação), NÃO inclua NENHUMA categoria de esporte (nem esporte genérico)
3. Se disser "gosto de esportes" EM GERAL sem especificar, use "esporte"
4. Seja LITERAL e ESPECÍFICO - apenas categorias que existem na lista e são EXPLICITAMENTE mencionadas
5. NUNCA redirecione esportes específicos não listados para "esporte" genérico
6. "cursando psicologia" = "psicologia", NÃO "educacao"
7. NÃO adicione categorias que não são explicitamente mencionadas

PERFIL DO USUÁRIO: "${profileDescription}"

EXEMPLOS:
- "gosto de futebol" → "futebol"
- "jogo volei" → "volei" 
- "gosto de formula 1" → "formula1"
- "cursando psicologia" → "psicologia"
- "trabalho com tecnologia" → "tecnologia"
- "gosto de basquete" → "" (não inclui nada de esporte)
- "gosto de tênis" → "" (não inclui nada de esporte)
- "gosto de esportes" → "esporte"
- "acompanho esportes em geral" → "esporte"
- "gosto de saber sobre tudo que acontece no mundo" → "internacional"
- "opa eu sou amanda, eu gosto de formula 1 e to cursando psicologia, gosto de saber sobre tudo que ta acontecendo no mundo" → "formula1,psicologia,internacional"

Responda APENAS com uma lista das categorias relevantes separadas por vírgula, sem explicações.
Se não houver perfil ou categorias claras, responda: "geral"

Exemplo: "tecnologia,investimentos,futebol"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      
      tokenTracker.addEstimatedUsage('USER_CATEGORIES', prompt, responseText, `Profile: "${profileDescription.substring(0, 30)}..."`);
      
      if (responseText === "geral" || !responseText) {
        return [];
      }
      
      const categories = responseText.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
      console.log(`🎯 IA identificou categorias: ${categories.join(', ')}`);
      
      return categories;
      
    } catch (error) {
      console.error('❌ Erro na identificação de categorias:', error.message);
      return [];
    }
  }

  async scoreNewsRelevance(title, content, source) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      const prompt = `
Analise este título de notícia e dê uma pontuação realista de 0 a 100:

CRITÉRIOS:
- Impacto político/social nacional (0-25 pontos)
- Interesse do público brasileiro (0-25 pontos)  
- Urgência/novidade (0-25 pontos)
- Relevância jornalística (0-25 pontos)

TÍTULO: "${title}"
FONTE: ${source}

IMPORTANTE: 
- Use toda a escala de 0-100
- Seja crítico e realista
- Notícias locais/específicas = pontuação menor
- Notícias internacionais irrelevantes = pontuação baixa
- Apenas eventos muito importantes = 80-100 pontos

Responda APENAS com um número de 0 a 100, nada mais:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      
      // Rastreia tokens
      tokenTracker.addEstimatedUsage('SCORE_NEWS', prompt, responseText, `"${title.substring(0, 30)}..."`);
      
      console.log(`🤖 DEBUG Score: "${title}" -> Resposta: "${responseText}"`);
      
      const score = parseInt(responseText.replace(/[^0-9]/g, ''));
      const finalScore = isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
      
      console.log(`📊 DEBUG: Score final: ${finalScore}`);
      
      return finalScore;
    } catch (error) {
      console.error('Erro ao calcular relevância:', error);
      return 50;
    }
  }

  async rewriteArticle(title, content, source, duplicateArticles = []) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      let prompt = `
Reescreva esta notícia para um newsletter via WhatsApp seguindo estas diretrizes:

FORMATO:
- 3-4 parágrafos concisos (80-120 palavras total)
- Linguagem clara e acessível
- Tom informativo mas envolvente
- Foque apenas nos fatos mais importantes
- Inclua o impacto principal da notícia
- Mencione dados essenciais quando relevante

ESTILO:
- Use emojis moderadamente (1 por parágrafo)
- Frases curtas e diretas
- Evite jargão técnico
- Mantenha o interesse do leitor
- Seja conciso mas informativo
- Vá direto ao ponto

CONTEÚDO ORIGINAL:
Título: ${title}
Fonte: ${source}
Texto: ${content}
`;

      if (duplicateArticles.length > 0) {
        prompt += `\n\nARTIGOS SIMILARES PARA REFERÊNCIA:
${duplicateArticles.map(article => `
Fonte: ${article.source}
Título: ${article.title}
Conteúdo: ${article.originalContent.substring(0, 500)}...
`).join('\n')}

IMPORTANTE: Use as informações dos artigos similares para enriquecer a notícia, mas escreva um texto único e coeso.`;
      }

      prompt += `\n\nEscreva APENAS o texto da notícia reescrita, sem títulos ou formatação extra.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      
      // Rastreia tokens
      tokenTracker.addEstimatedUsage('REWRITE_ARTICLE', prompt, responseText, `"${title.substring(0, 30)}..."`);
      
      return responseText;
    } catch (error) {
      console.error('Erro ao reescrever artigo:', error);
      return content.substring(0, 500) + '...';
    }
  }

  async detectDuplicateNews(news1, news2) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      const prompt = `
Analise se estas duas notícias são sobre o mesmo evento/assunto:

NOTÍCIA 1:
Título: ${news1.title}
Fonte: ${news1.source}
Conteúdo: ${news1.originalContent.substring(0, 300)}...

NOTÍCIA 2:
Título: ${news2.title}  
Fonte: ${news2.source}
Conteúdo: ${news2.originalContent.substring(0, 300)}...

Responda apenas "SIM" se forem sobre o mesmo assunto principal, ou "NAO" se forem diferentes.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim().toUpperCase() === 'SIM';
    } catch (error) {
      console.error('Erro na detecção de duplicatas:', error);
      return false;
    }
  }

  async processUnprocessedNews(db) {
    console.log('Processando notícias com IA...');
    
    const unprocessedNews = await News.getUnprocessedNews(db);
    console.log(`${unprocessedNews.length} notícias para processar`);

    for (const news of unprocessedNews) {
      try {
        console.log(`Processando: ${news.title}`);
        
        const [score, rewrittenContent] = await Promise.all([
          this.scoreNewsRelevance(news.title, news.originalContent, news.source),
          this.rewriteArticle(news.title, news.originalContent, news.source)
        ]);

        await News.updateProcessedContent(db, news._id, rewrittenContent, score);
        
        console.log(`Processada: ${news.title} (Score: ${score})`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Erro ao processar notícia ${news._id}:`, error);
      }
    }

    console.log('Processamento de notícias concluído!');
  }

  async processDuplicateGroups(db, duplicateGroups) {
    console.log('Processando grupos de notícias duplicadas...');

    for (const group of duplicateGroups) {
      try {
        const mainNews = group.reduce((prev, current) => {
          return (prev.originalContent.length > current.originalContent.length) ? prev : current;
        });

        const otherArticles = group.filter(news => news._id !== mainNews._id);

        const [score, rewrittenContent] = await Promise.all([
          this.scoreNewsRelevance(mainNews.title, mainNews.originalContent, mainNews.source),
          this.rewriteArticle(mainNews.title, mainNews.originalContent, mainNews.source, otherArticles)
        ]);

        await News.updateProcessedContent(db, mainNews._id, rewrittenContent, score);

        for (const article of otherArticles) {
          await db.collection('news').deleteOne({ _id: article._id });
        }

        console.log(`Grupo processado: ${mainNews.title} (${group.length} artigos similares)`);

      } catch (error) {
        console.error('Erro ao processar grupo de duplicatas:', error);
      }
    }
  }

  async generateDailyNewsletter(topNews) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      const newsTexts = topNews.map((news, index) => 
        `${index + 1}. ${news.title}\n${news.rewrittenContent}`
      ).join('\n\n---\n\n');

      const prompt = `
Com base nestas ${topNews.length} notícias principais do dia, crie uma mensagem de abertura envolvente para o newsletter:

${newsTexts}

Crie uma mensagem de 2-3 linhas que:
- Cumprimente o leitor
- Mencione brevemente os principais temas do dia
- Use um tom amigável e profissional
- Use 1-2 emojis apropriados

Exemplo de formato:
🌅 Bom dia! Hoje trouxemos as principais notícias sobre [tema1], [tema2] e [tema3]. Confira:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error('Erro ao gerar introdução:', error);
      return '📰 Bom dia! Aqui estão as principais notícias de hoje:';
    }
  }

  async compareSimilarity(title1, title2, content1 = '', content2 = '') {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      const prompt = `
Analise a similaridade entre estas duas notícias e retorne um valor de 0.0 a 1.0:

NOTÍCIA 1:
Título: ${title1}
Conteúdo: ${content1.substring(0, 300)}...

NOTÍCIA 2:
Título: ${title2}
Conteúdo: ${content2.substring(0, 300)}...

Critérios:
- 0.0-0.4: Notícias completamente diferentes
- 0.5-0.7: Notícias com alguns elementos em comum
- 0.75-0.9: Notícias muito similares sobre o mesmo assunto
- 0.95-1.0: Notícias praticamente idênticas

Considere:
- Mesmo evento/pessoa principal
- Mesma data/contexto
- Informações principais similares

Retorne APENAS o número decimal (ex: 0.85), sem explicações.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const similarity = parseFloat(response.text().trim());
      
      return isNaN(similarity) ? 0.5 : Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.error('Erro ao comparar similaridade:', error);
      return 0.5;
    }
  }

  async consolidateNews(articles) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      const articlesText = articles.map((article, index) => `
FONTE ${index + 1}: ${article.source}
TÍTULO: ${article.title}
URL: ${article.url}
CONTEÚDO: ${article.content.substring(0, 800)}...
`).join('\n---\n');

      const prompt = `
Você recebeu a mesma notícia de múltiplas fontes. Crie uma versão consolidada que:

1. TÍTULO: Crie um título claro e informativo que capture a essência da notícia
2. CONTEÚDO: Escreva um artigo consolidado que:
   - Combine as melhores informações de todas as fontes
   - Seja objetivo e factual
   - Tenha 3-4 parágrafos
   - Use linguagem clara para WhatsApp
   - Inclua os detalhes mais importantes
   - Mencione perspectivas diferentes se existirem

FONTES DISPONÍVEIS:
${articlesText}

FORMATO DE RESPOSTA:
TÍTULO: [título consolidado]

CONTEÚDO: [artigo consolidado]

Escreva APENAS no formato acima, sem explicações adicionais.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Parse da resposta
      const titleMatch = text.match(/TÍTULO:\s*(.+?)(?:\n|$)/);
      const contentMatch = text.match(/CONTEÚDO:\s*([\s\S]+)/);
      
      return {
        title: titleMatch ? titleMatch[1].trim() : articles[0].title,
        content: contentMatch ? contentMatch[1].trim() : articles[0].content
      };
    } catch (error) {
      console.error('Erro ao consolidar notícias:', error);
      return {
        title: articles[0].title,
        content: articles[0].content
      };
    }
  }

  async createAdvancedScore(title, content, source, context = {}) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');
      
      const prompt = `
Analise esta notícia com critérios avançados e dê uma pontuação de 0 a 100:

CRITÉRIOS PRINCIPAIS (peso maior):
1. Impacto político/econômico nacional (0-20 pontos)
2. Relevância social/interesse público (0-20 pontos)
3. Urgência/atualidade da informação (0-20 pontos)
4. Qualidade e credibilidade da fonte (0-15 pontos)

CRITÉRIOS SECUNDÁRIOS:
5. Originalidade da informação (0-10 pontos)
6. Potencial de engajamento (0-10 pontos)
7. Clareza e completude da informação (0-5 pontos)

NOTÍCIA:
Título: ${title}
Fonte: ${source}
Conteúdo: ${content.substring(0, 1200)}...

${context.sourceCount ? `Esta notícia foi encontrada em ${context.sourceCount} fontes diferentes.` : ''}
${context.consolidated ? 'Esta é uma notícia consolidada de múltiplas fontes.' : ''}

BONIFICAÇÕES ESPECIAIS:
- +5 pontos se for notícia exclusiva/breaking news
- +3 pontos se afetar diretamente o cidadão brasileiro
- +2 pontos se for sobre figuras políticas importantes
- +5 pontos se for encontrada em múltiplas fontes confiáveis

Retorne APENAS o número da pontuação (0-100), sem explicações.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      const score = parseInt(responseText);
      
      // Rastreia tokens
      tokenTracker.addEstimatedUsage('ADVANCED_SCORE', prompt, responseText, `"${title.substring(0, 30)}..."`);
      
      return isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Erro ao calcular pontuação avançada:', error);
      return 50;
    }
  }

  async analyzeUserInterests(userProfile) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');

      if (!userProfile || !userProfile.trim()) {
        return ['politica']; // Padrão: só política
      }

      const prompt = `
Analise este perfil de usuário e identifique EXATAMENTE quais são os interesses específicos da pessoa:

PERFIL: ${userProfile}

INSTRUÇÕES:
1. Identifique os interesses REAIS e ESPECÍFICOS mencionados pela pessoa
2. Use termos descritivos livres, não categorias fixas
3. Seja preciso - se menciona "vôlei", use "volei", se menciona "ações", use "investimentos"
4. Se menciona esportes específicos, use o nome do esporte
5. Se menciona áreas profissionais, use a área específica
6. Máximo 4 interesses principais
7. Se não conseguir identificar interesses claros, use ["noticias-gerais"]

EXEMPLOS DE ANÁLISE LIVRE:
- "Sou desenvolvedor de software" → ["programacao", "tecnologia"]
- "Trabalho com vendas e gosto de futebol" → ["vendas", "futebol"]
- "Jogo vôlei e handball" → ["volei", "handebol"]
- "Gosto de acompanhar a bolsa de valores" → ["investimentos", "mercado-financeiro"]
- "Sou médico pediatra" → ["medicina", "pediatria"]
- "Advogado criminalista que acompanha política" → ["direito-criminal", "politica"]
- "Professor de matemática interessado em educação" → ["matematica", "educacao"]
- "Empresário que investe em startups de tech" → ["empreendedorismo", "investimentos", "tecnologia"]

IMPORTANTE: 
- Use os termos EXATOS que a pessoa menciona
- Não force categorias que não existem no perfil
- Seja específico e literal
- Uma política só se explicitamente mencionada

Responda APENAS com um array JSON com os interesses identificados:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();

      // Rastreia tokens
      tokenTracker.addEstimatedUsage('ANALYZE_INTERESTS', prompt, responseText, 'Profile analysis');

      // Parse da resposta (limpa markdown se houver)
      try {
        let cleanResponse = responseText;
        
        // Remove markdown code blocks se houver
        if (cleanResponse.includes('```')) {
          cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        }
        
        // Remove quebras de linha e espaços extras
        cleanResponse = cleanResponse.trim();
        
        const categories = JSON.parse(cleanResponse);
        
        // Validação
        if (!Array.isArray(categories) || categories.length === 0) {
          return ['politica'];
        }

        // NÃO força política - deixa apenas os interesses identificados
        // (política será adicionada pela distribuição se necessário)

        // Limita a 4 categorias
        const validCategories = categories.slice(0, 4);
        
        console.log(`🎯 Categorias identificadas: ${validCategories.join(', ')}`);
        return validCategories;

      } catch (parseError) {
        console.log(`⚠️ Erro ao fazer parse da resposta: ${responseText}`);
        return ['politica'];
      }

    } catch (error) {
      console.error('Erro ao analisar interesses do usuário:', error);
      return ['politica'];
    }
  }

  // NOVO: Avalia múltiplas notícias de uma vez (batch processing)
  async scoreCategoryRelevanceBatch(newsArray, category, userProfile = null) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');

      const categoryDescriptions = {
        'politica': 'política, governo, eleições, ministros, congresso, STF, leis, decisões governamentais',
        'economia': 'economia geral, PIB, empresas, negócios, setor bancário, indústria, crescimento econômico',
        'investimentos': 'investimentos, bolsa de valores, ações, fundos, Bitcoin, criptomoedas, dividendos, mercado financeiro, trader, Bovespa, B3',
        'tecnologia': 'tecnologia, programação, software, hardware, IA, computadores, internet, aplicativos, startups, inovação digital',
        'esporte': 'esportes em geral, competições, atletas, jogos, campeonatos, olimpíadas',
        'futebol': 'futebol específico, times brasileiros, seleção, Série A, Libertadores, Copa do Brasil',
        'volei': 'vôlei, voleibol, Superliga, seleção brasileira de vôlei, Liga das Nações de vôlei, CBV',
        'handebol': 'handebol, handball, seleção brasileira de handebol, mundial de handebol, CBHb',
        'rugby': 'rugby, rugbi, seleção brasileira de rugby, World Rugby, rugby sevens',
        'futsal': 'futsal, liga de futsal, seleção brasileira de futsal, mundial de futsal, CBFS',
        'volei-praia': 'vôlei de praia, beach volleyball, circuito mundial de vôlei de praia, CBV praia',
        'formula1': 'Fórmula 1, F1, Grande Prêmio, GP, Verstappen, Hamilton, Ferrari, Mercedes, Red Bull, McLaren, Interlagos',
        'saude': 'saúde, medicina, hospitais, tratamentos, medicamentos, doenças, prevenção',
        'educacao': 'educação, escolas, universidades, professores, ensino, cursos, graduação'
      };

      const categoryDesc = categoryDescriptions[category] || category;

      // Cria lista de notícias numeradas
      const newsList = newsArray.map((news, index) => `
${index + 1}. TÍTULO: ${news.title}
   CONTEÚDO: ${news.originalContent?.substring(0, 400) || 'Sem conteúdo'}...
`).join('\n');

      const prompt = `
Analise a relevância de ${newsArray.length} notícias para a categoria "${category}".

CATEGORIA: ${category} - ${categoryDesc}

NOTÍCIAS PARA AVALIAR:
${newsList}

AVALIE CADA NOTÍCIA COM BASE EM:
1. RELEVÂNCIA DIRETA: A notícia trata DIRETAMENTE do assunto da categoria?
2. IMPORTÂNCIA: É uma notícia significativa e impactante ou apenas trivial?
3. ATUALIDADE: É informação relevante e atual?
4. QUALIDADE: É conteúdo substancial ou apenas clickbait/fofoca?

EXEMPLOS DE SCORING:
- Muito relevante e importante = 80-95
- Relevante mas não essencial = 60-79  
- Pouco relevante = 30-59
- Irrelevante = 0-29

${userProfile ? `PERFIL DO USUÁRIO: ${userProfile}` : ''}

Responda APENAS com os scores em uma linha, separados por vírgula:
Exemplo: 85,72,45,90,15,78
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();

      // Rastreia tokens
      tokenTracker.addEstimatedUsage('CATEGORY_RELEVANCE_BATCH', prompt, responseText, `${newsArray.length} notícias -> ${category}`);

      // Parse dos scores
      const scores = responseText.split(',').map(score => {
        const parsedScore = parseInt(score.trim());
        return isNaN(parsedScore) ? 50 : Math.min(100, Math.max(0, parsedScore));
      });

      // Se não conseguiu parsear todos os scores, preenche com 50
      while (scores.length < newsArray.length) {
        scores.push(50);
      }

      console.log(`🤖 [${category}] Batch de ${newsArray.length} notícias -> Scores: [${scores.join(', ')}]`);
      
      return scores;
    } catch (error) {
      console.error('Erro ao avaliar batch de relevância da categoria:', error);
      // Retorna scores médios para todas as notícias
      return new Array(newsArray.length).fill(50);
    }
  }

  // Mantém método individual para compatibilidade
  async scoreCategoryRelevance(title, content, category, userProfile = null) {
    const result = await this.scoreCategoryRelevanceBatch([{title, originalContent: content}], category, userProfile);
    return result[0];
  }

  async generatePersonalizedImpact(newsTitle, newsContent, userProfile) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');

      if (!userProfile || !userProfile.trim()) {
        return null; // Não gera análise se não tem perfil
      }

      const prompt = `
Analise esta notícia sob a perspectiva específica deste usuário, fornecendo um insight PRÁTICO e BEM FORMATADO para WhatsApp:

PERFIL DO USUÁRIO:
${userProfile}

NOTÍCIA:
Título: ${newsTitle}
Conteúdo: ${newsContent.substring(0, 800)}...

FORMATO OBRIGATÓRIO PARA WHATSAPP:
- Máximo 3-4 linhas
- Use emojis moderadamente (1-2 por parágrafo)
- Frases curtas e diretas
- Foque em UMA oportunidade/impacto específico
- Linguagem clara e objetiva

CRITÉRIOS DE CONTEÚDO:
1. Seja ESPECÍFICO para o perfil profissional do usuário
2. Mencione UMA oportunidade concreta ou impacto direto
3. Sugira UMA ação prática quando possível
4. Evite listas numeradas - use texto corrido
5. Foque no que é mais relevante para ESSA pessoa

EXEMPLOS DE ANÁLISES BEM FORMATADAS:
- Desenvolvedor sobre IA: "💻 Esta regulamentação pode abrir mercado de compliance em IA. Considere se especializar em AI ethics - área com salários 40% maiores e alta demanda."

- Médico sobre telemedicina: "🏥 A mudança pode reduzir consultas presenciais em 30%. Invista em plataformas de telemedicina agora - setor cresce 200% ao ano."

- Professor sobre educação digital: "📚 A reforma prioriza competências digitais. Desenvolva habilidades em EdTech - professores especializados ganham até R$ 8mil/mês."

EVITE ABSOLUTAMENTE:
- Textos longos e densos
- Listas numeradas extensas
- Análises genéricas
- Múltiplas oportunidades numa só análise

Se não houver conexão REAL e ESPECÍFICA, retorne: "Esta notícia não tem impacto direto no seu perfil profissional atual."

Escreva APENAS a análise concisa e bem formatada:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text().trim();

      // Rastreia tokens
      tokenTracker.addEstimatedUsage('PERSONALIZED_IMPACT', prompt, analysis, `"${newsTitle.substring(0, 30)}..."`);

      // Valida se é uma resposta útil
      if (analysis.length < 15 || 
          analysis.toLowerCase().includes('não posso') || 
          analysis.toLowerCase().includes('não é possível')) {
        console.log(`⚠️ DEBUG: Análise rejeitada: "${analysis}"`);
        return null;
      }
      
      // Se a IA disser que não tem impacto direto, não mostra análise (é melhor sem do que genérica)
      if (analysis.toLowerCase().includes('não tem impacto direto no seu perfil profissional atual')) {
        console.log(`📰 DEBUG: Notícia sem impacto específico para o perfil do usuário`);
        return null;
      }

      return analysis;
    } catch (error) {
      console.error('Erro ao gerar análise personalizada:', error);
      return null;
    }
  }
}

export default new AIService();