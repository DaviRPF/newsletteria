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
- Máximo 4 parágrafos
- Linguagem clara e acessível
- Tom informativo mas envolvente
- Foque nos fatos mais importantes
- Inclua contexto quando necessário

ESTILO:
- Use emojis moderadamente (1-2 por parágrafo)
- Frases curtas e diretas
- Evite jargão técnico
- Mantenha o interesse do leitor

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
Com base nestas 4 notícias principais do dia, crie uma mensagem de abertura envolvente para o newsletter:

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

  async generatePersonalizedImpact(newsTitle, newsContent, userProfile) {
    try {
      const model = this.initializeAI();
      if (!model) throw new Error('AI não inicializada');

      if (!userProfile || !userProfile.trim()) {
        return null; // Não gera análise se não tem perfil
      }

      const prompt = `
Analise como esta notícia pode impactar especificamente este usuário baseado no perfil dele:

PERFIL DO USUÁRIO:
${userProfile}

NOTÍCIA:
Título: ${newsTitle}
Conteúdo: ${newsContent.substring(0, 800)}...

INSTRUÇÕES:
1. Escreva uma análise personalizada de 2-3 frases
2. Foque especificamente em como isso afeta a vida/profissão/interesses desta pessoa
3. Use uma linguagem direta e relevante
4. Seja específico, não genérico
5. Se a notícia não tem relação clara com o perfil, diga "Esta notícia não tem impacto direto no seu perfil atual."

EXEMPLOS DE BOA ANÁLISE:
- Para estudante de medicina: "Como futuro médico, essa mudança na regulamentação do SUS pode afetar suas oportunidades de residência em hospitais públicos."
- Para empresário: "Essa nova política fiscal pode aumentar seus custos operacionais em cerca de 3-5% se sua empresa se enquadra no Simples Nacional."

Escreva APENAS a análise, sem títulos ou formatação extra:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text().trim();

      // Rastreia tokens
      tokenTracker.addEstimatedUsage('PERSONALIZED_IMPACT', prompt, analysis, `"${newsTitle.substring(0, 30)}..."`);

      // Valida se é uma resposta útil
      if (analysis.length < 20 || analysis.toLowerCase().includes('não posso') || analysis.toLowerCase().includes('não é possível')) {
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