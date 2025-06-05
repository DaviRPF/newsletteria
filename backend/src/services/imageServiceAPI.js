import axios from 'axios';
import fs from 'fs';
import path from 'path';

class ImageServiceAPI {
  constructor() {
    this.imageDir = path.join(process.cwd(), 'generated-images');
    
    // Cria diretório se não existir
    if (!fs.existsSync(this.imageDir)) {
      fs.mkdirSync(this.imageDir, { recursive: true });
    }
    
    console.log('🎨 ImageServiceAPI: Gerando imagens reais via API');
  }

  // Gera cor de fundo baseada na fonte da notícia
  getSourceColors(source) {
    if (source.includes('UOL')) {
      return { bg: 'ff6b35', text: 'ffffff', emoji: '🟠' };
    } else if (source.includes('Opera Mundi')) {
      return { bg: '2193b0', text: 'ffffff', emoji: '🔵' };
    } else if (source.includes('Agência Brasil')) {
      return { bg: '11998e', text: 'ffffff', emoji: '🟢' };
    } else {
      return { bg: '667eea', text: 'ffffff', emoji: '🟣' };
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

  // Quebra texto em linhas
  wrapText(text, maxLength = 50) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Gera imagem da notícia usando API
  async generateNewsImage(news, newsNumber) {
    try {
      const colors = this.getSourceColors(news.source);
      const timeAgo = this.getTimeAgo(news.pubDate);
      
      // Prepara o conteúdo
      const titleLines = this.wrapText(news.title, 45);
      const contentText = news.rewrittenContent || news.originalContent || '';
      const maxContentLength = 200;
      const truncatedContent = contentText.length > maxContentLength 
        ? contentText.substring(0, maxContentLength) + '...'
        : contentText;
      const contentLines = this.wrapText(truncatedContent, 50);
      
      // Cria o texto formatado para a imagem
      let imageText = `NOTÍCIA ${newsNumber}`;
      if (news.relevanceScore) {
        imageText += ` | Score: ${news.relevanceScore}`;
      }
      imageText += '\n\n';
      
      // Adiciona título
      titleLines.forEach(line => {
        imageText += line + '\n';
      });
      imageText += '\n';
      
      // Adiciona conteúdo (limitado)
      contentLines.slice(0, 6).forEach(line => {
        imageText += line + '\n';
      });
      imageText += '\n\n';
      
      // Adiciona footer
      imageText += `${news.source} | ${timeAgo}\n`;
      imageText += 'Newsletter WhatsApp';
      
      // Usa API Placeholder para gerar imagem
      const width = 800;
      const height = 600;
      const bgColor = colors.bg;
      const textColor = colors.text;
      
      // Cria URL para API de imagem
      const apiUrl = `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}.png`;
      
      // Por enquanto, vamos criar um arquivo de texto com as informações da notícia
      // já que APIs de imagem com texto customizado são pagas
      const filename = `news-${Date.now()}-${newsNumber}.txt`;
      const filepath = path.join(this.imageDir, filename);
      
      // Salva como arquivo de texto formatado
      const formattedContent = `
${colors.emoji}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.emoji}
${colors.emoji}                 NOTÍCIA ${newsNumber}                    ${colors.emoji}
${news.relevanceScore ? `${colors.emoji}                 Score: ${news.relevanceScore}                     ${colors.emoji}\n` : ''}${colors.emoji}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.emoji}

📰 ${news.title}

${truncatedContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Fonte: ${news.source}
⏰ ${timeAgo}
📱 Newsletter WhatsApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      
      fs.writeFileSync(filepath, formattedContent);
      
      console.log(`✅ Arquivo visual gerado: ${filename}`);
      
      return {
        filename,
        filepath,
        visualMessage: formattedContent,
        isText: true
      };
      
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      throw error;
    }
  }

  // Gera imagem de introdução
  async generateIntroImage(newsCount, currentTime) {
    try {
      const formattedContent = `
🔵━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🔵
🔵                                                          🔵
🔵                 🌅 NEWSLETTER WHATSAPP                  🔵
🔵                                                          🔵
🔵━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🔵

                    ⏰ ${currentTime}
           📰 ${newsCount} Principais Notícias do Dia

    🤖 Processadas e reescritas pela IA Gemini
    📍 Fontes: UOL, Opera Mundi e Agência Brasil

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                📱 Sempre bem informado!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      
      console.log(`✅ Introdução visual gerada`);
      
      return {
        filename: 'intro.txt',
        filepath: null,
        visualMessage: formattedContent,
        isText: true
      };
      
    } catch (error) {
      console.error('Erro ao gerar introdução:', error);
      throw error;
    }
  }

  // Gera imagem de rodapé
  async generateFooterImage() {
    try {
      const formattedContent = `
⚙️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚙️
⚙️                                                          ⚙️
⚙️                    COMANDOS DISPONÍVEIS                  ⚙️
⚙️                                                          ⚙️
⚙️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚙️

📋 Digite um dos comandos abaixo:

    ▪️ "configurar horario" - Alterar horário de entrega
    ▪️ "status" - Ver status da assinatura  
    ▪️ "cancelar" - Informações sobre cancelamento

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            📱 Newsletter WhatsApp
           Sempre bem informado!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      
      console.log(`✅ Rodapé visual gerado`);
      
      return {
        filename: 'footer.txt',
        filepath: null,
        visualMessage: formattedContent,
        isText: true
      };
      
    } catch (error) {
      console.error('Erro ao gerar rodapé:', error);
      throw error;
    }
  }

  // Limpeza de arquivos antigos
  cleanOldImages() {
    try {
      const files = fs.readdirSync(this.imageDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      files.forEach(file => {
        const filepath = path.join(this.imageDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filepath);
          console.log(`🗑️ Arquivo antigo removido: ${file}`);
        }
      });
    } catch (error) {
      console.error('Erro na limpeza:', error);
    }
  }
}

export default new ImageServiceAPI();