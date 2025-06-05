import fs from 'fs';
import path from 'path';

class ImageServiceReal {
  constructor() {
    this.imageDir = path.join(process.cwd(), 'generated-images');
    
    // Cria diretório se não existir
    if (!fs.existsSync(this.imageDir)) {
      fs.mkdirSync(this.imageDir, { recursive: true });
    }

    console.log('🎨 ImageServiceReal: Gerando imagens reais usando HTML/CSS');
  }

  // Gera cor de fundo baseada na fonte da notícia
  getSourceColors(source) {
    if (source.includes('UOL')) {
      return { primary: '#ff6b35', secondary: '#ff8e53', emoji: '🟠' };
    } else if (source.includes('Opera Mundi')) {
      return { primary: '#2193b0', secondary: '#6dd5ed', emoji: '🔵' };
    } else if (source.includes('Agência Brasil')) {
      return { primary: '#11998e', secondary: '#38ef7d', emoji: '🟢' };
    } else {
      return { primary: '#667eea', secondary: '#764ba2', emoji: '🟣' };
    }
  }

  // Gera HTML para a notícia
  generateNewsHTML(news, newsNumber) {
    const colors = this.getSourceColors(news.source);
    const timeAgo = this.getTimeAgo(news.pubDate);
    
    // Limita o conteúdo
    const contentText = news.rewrittenContent || news.originalContent || '';
    const maxContentLength = 350;
    const truncatedContent = contentText.length > maxContentLength 
      ? contentText.substring(0, maxContentLength) + '...'
      : contentText;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
            position: relative;
            overflow: hidden;
        }
        
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
        }
        
        .container {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            color: white;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
        }
        
        .news-number {
            font-size: 28px;
            color: #333;
        }
        
        .score {
            font-size: 18px;
            color: #666;
        }
        
        .content {
            flex: 1;
            padding: 30px;
            display: flex;
            flex-direction: column;
        }
        
        .title {
            font-size: 32px;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 25px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .text {
            font-size: 18px;
            line-height: 1.6;
            flex: 1;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .footer {
            background: rgba(0, 0, 0, 0.8);
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .source {
            font-size: 16px;
            font-weight: 600;
        }
        
        .time {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .brand {
            font-size: 14px;
            font-weight: 600;
            opacity: 0.9;
        }
        
        .emoji {
            font-size: 24px;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="overlay"></div>
    <div class="container">
        <div class="header">
            <div class="news-number">
                <span class="emoji">🔥</span>NOTÍCIA ${newsNumber}
            </div>
            ${news.relevanceScore ? `<div class="score">Score: ${news.relevanceScore}</div>` : ''}
        </div>
        
        <div class="content">
            <div class="title">${news.title}</div>
            <div class="text">${truncatedContent}</div>
        </div>
        
        <div class="footer">
            <div>
                <div class="source">📍 ${news.source}</div>
                <div class="time">⏰ ${timeAgo}</div>
            </div>
            <div class="brand">📱 Newsletter WhatsApp</div>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  // Gera HTML para introdução
  generateIntroHTML(newsCount, currentTime) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            width: 800px;
            height: 400px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
        }
        
        .container {
            position: relative;
            z-index: 2;
            padding: 40px;
        }
        
        .title {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .subtitle {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 30px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .info {
            font-size: 18px;
            margin-bottom: 15px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .footer {
            font-size: 24px;
            font-weight: 600;
            margin-top: 30px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="overlay"></div>
    <div class="container">
        <div class="title">🌅 Newsletter WhatsApp</div>
        <div class="subtitle">${currentTime} - Principais Notícias</div>
        <div class="info">📰 ${newsCount} notícias selecionadas pelos melhores portais</div>
        <div class="info">🤖 Processadas e reescritas pela IA Gemini</div>
        <div class="footer">📱 Sempre bem informado!</div>
    </div>
</body>
</html>`;

    return html;
  }

  // Gera HTML para rodapé
  generateFooterHTML() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            width: 800px;
            height: 300px;
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .title {
            font-size: 32px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .commands {
            font-size: 18px;
            line-height: 2;
            margin-bottom: 30px;
        }
        
        .command {
            margin-bottom: 10px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .footer {
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="title">⚙️ Comandos Disponíveis</div>
    <div class="commands">
        <div class="command">• "configurar horario" - Alterar horário de entrega</div>
        <div class="command">• "status" - Ver status da assinatura</div>
        <div class="command">• "cancelar" - Informações sobre cancelamento</div>
    </div>
    <div class="footer">📱 Newsletter WhatsApp - Sempre bem informado!</div>
</body>
</html>`;

    return html;
  }

  // Por enquanto, salva como HTML (podemos usar screenshots depois)
  async generateNewsImage(news, newsNumber) {
    try {
      const html = this.generateNewsHTML(news, newsNumber);
      const filename = `news-${Date.now()}-${newsNumber}.html`;
      const filepath = path.join(this.imageDir, filename);
      
      fs.writeFileSync(filepath, html);
      
      console.log(`✅ HTML da notícia gerado: ${filename}`);
      
      // Retorna informação de que é HTML (não imagem ainda)
      return {
        filename,
        filepath,
        isHTML: true,
        htmlContent: html
      };
      
    } catch (error) {
      console.error('Erro ao gerar HTML da notícia:', error);
      throw error;
    }
  }

  async generateIntroImage(newsCount, currentTime) {
    try {
      const html = this.generateIntroHTML(newsCount, currentTime);
      const filename = `intro-${Date.now()}.html`;
      const filepath = path.join(this.imageDir, filename);
      
      fs.writeFileSync(filepath, html);
      
      console.log(`✅ HTML de introdução gerado: ${filename}`);
      
      return {
        filename,
        filepath,
        isHTML: true,
        htmlContent: html
      };
      
    } catch (error) {
      console.error('Erro ao gerar HTML de introdução:', error);
      throw error;
    }
  }

  async generateFooterImage() {
    try {
      const html = this.generateFooterHTML();
      const filename = `footer-${Date.now()}.html`;
      const filepath = path.join(this.imageDir, filename);
      
      fs.writeFileSync(filepath, html);
      
      console.log(`✅ HTML de rodapé gerado: ${filename}`);
      
      return {
        filename,
        filepath,
        isHTML: true,
        htmlContent: html
      };
      
    } catch (error) {
      console.error('Erro ao gerar HTML de rodapé:', error);
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

export default new ImageServiceReal();