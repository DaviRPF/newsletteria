class ImageService {
  constructor() {
    // Serviço adaptado para criar designs visuais incríveis usando apenas texto
    console.log('🎨 ImageService: Criando designs visuais profissionais com texto formatado');
  }

  // Função auxiliar para quebrar texto em linhas
  wrapText(text, maxCharsPerLine = 45) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Gera emoji de cor baseado na fonte da notícia
  getSourceEmoji(source) {
    if (source.includes('UOL')) {
      return '🟠'; // Laranja
    } else if (source.includes('Opera Mundi')) {
      return '🔵'; // Azul
    } else if (source.includes('Agência Brasil')) {
      return '🟢'; // Verde
    } else {
      return '🟣'; // Roxo padrão
    }
  }

  // Gera "imagem" visual da notícia usando formatação rica em texto
  async generateNewsImage(news, newsNumber) {
    try {
      const sourceEmoji = this.getSourceEmoji(news.source);
      const timeAgo = this.getTimeAgo(news.pubDate);
      
      // Cria uma mensagem visual rica usando caracteres especiais
      let visualMessage = '';
      
      // Header com borda e emoji da fonte
      visualMessage += `${sourceEmoji}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${sourceEmoji}\n`;
      visualMessage += `${sourceEmoji}           📰 NOTÍCIA ${newsNumber}           ${sourceEmoji}\n`;
      if (news.relevanceScore) {
        visualMessage += `${sourceEmoji}              Score: ${news.relevanceScore}               ${sourceEmoji}\n`;
      }
      visualMessage += `${sourceEmoji}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${sourceEmoji}\n\n`;
      
      // Título em destaque
      visualMessage += `🔥 *${news.title}*\n\n`;
      
      // Conteúdo formatado
      const contentText = news.rewrittenContent || news.originalContent || '';
      const maxContentLength = 400;
      const truncatedContent = contentText.length > maxContentLength 
        ? contentText.substring(0, maxContentLength) + '...'
        : contentText;
      
      // Quebra o conteúdo em parágrafos para melhor legibilidade
      const paragraphs = truncatedContent.split('\n\n');
      paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          visualMessage += `${paragraph.trim()}\n\n`;
        }
      });
      
      // Footer com informações
      visualMessage += `┌────────────────────────────────────┐\n`;
      visualMessage += `│ 📍 Fonte: ${news.source.padEnd(25)} │\n`;
      if (news.pubDate) {
        visualMessage += `│ ⏰ ${timeAgo.padEnd(31)} │\n`;
      }
      visualMessage += `│ 📱 Newsletter WhatsApp             │\n`;
      visualMessage += `└────────────────────────────────────┘`;
      
      console.log(`✅ Mensagem visual gerada para notícia ${newsNumber}`);
      
      // Retorna a mensagem visual como "imagem de texto"
      return {
        filename: `news-text-${newsNumber}.txt`,
        filepath: null,
        visualMessage: visualMessage,
        isText: true
      };
      
    } catch (error) {
      console.error('Erro ao gerar mensagem visual:', error);
      throw error;
    }
  }

  // Gera mensagem visual de introdução do newsletter
  async generateIntroImage(newsCount, currentTime) {
    try {
      let introMessage = '';
      
      // Header decorativo
      introMessage += `🔵━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🔵\n`;
      introMessage += `🔵                                                  🔵\n`;
      introMessage += `🔵            🌅 *NEWSLETTER WHATSAPP*            🔵\n`;
      introMessage += `🔵                                                  🔵\n`;
      introMessage += `🔵━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🔵\n\n`;
      
      // Informações principais
      introMessage += `⏰ *${currentTime} - Principais Notícias*\n\n`;
      introMessage += `📰 *${newsCount} notícias selecionadas pelos melhores portais brasileiros*\n\n`;
      introMessage += `🤖 *Processadas e reescritas pela IA Gemini*\n\n`;
      
      // Footer decorativo
      introMessage += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      introMessage += `┃                                                  ┃\n`;
      introMessage += `┃            📱 *Sempre bem informado!*           ┃\n`;
      introMessage += `┃                                                  ┃\n`;
      introMessage += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
      
      console.log(`✅ Mensagem de introdução gerada`);
      
      return {
        filename: `intro-text.txt`,
        filepath: null,
        visualMessage: introMessage,
        isText: true
      };
      
    } catch (error) {
      console.error('Erro ao gerar mensagem de introdução:', error);
      throw error;
    }
  }

  // Função auxiliar para calcular tempo decorrido
  getTimeAgo(pubDate) {
    const now = new Date();
    const published = new Date(pubDate);
    const diffInMinutes = Math.floor((now - published) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    
    return published.toLocaleDateString('pt-BR');
  }


  // Gera mensagem visual de rodapé com comandos
  async generateFooterImage() {
    try {
      let footerMessage = '';
      
      // Header com título
      footerMessage += `⚙️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚙️\n`;
      footerMessage += `⚙️                                                  ⚙️\n`;
      footerMessage += `⚙️              *COMANDOS DISPONÍVEIS*             ⚙️\n`;
      footerMessage += `⚙️                                                  ⚙️\n`;
      footerMessage += `⚙️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚙️\n\n`;
      
      // Lista de comandos
      footerMessage += `📋 *Comandos úteis:*\n\n`;
      footerMessage += `• "*configurar horario*" - Alterar horário de entrega\n`;
      footerMessage += `• "*status*" - Ver status da assinatura\n`;
      footerMessage += `• "*cancelar*" - Informações sobre cancelamento\n\n`;
      
      // Footer final
      footerMessage += `┌──────────────────────────────────────────────────┐\n`;
      footerMessage += `│                                                  │\n`;
      footerMessage += `│         📱 Newsletter WhatsApp                   │\n`;
      footerMessage += `│            Sempre bem informado!                │\n`;
      footerMessage += `│                                                  │\n`;
      footerMessage += `└──────────────────────────────────────────────────┘`;
      
      console.log(`✅ Mensagem de rodapé gerada`);
      
      return {
        filename: `footer-text.txt`,
        filepath: null,
        visualMessage: footerMessage,
        isText: true
      };
      
    } catch (error) {
      console.error('Erro ao gerar mensagem de rodapé:', error);
      throw error;
    }
  }

  // Método de limpeza (não necessário para versão texto)
  cleanOldImages() {
    console.log('🧹 Limpeza não necessária para versão visual em texto');
  }
}

export default new ImageService();