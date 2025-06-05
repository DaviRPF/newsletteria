import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CanvasImageService {
  constructor() {
    this.imageDir = path.join(__dirname, '../../generated-images');
    this.ensureImageDir();
    
    // Image dimensions
    this.imageWidth = 800;
    this.imageHeight = 1200;
    
    console.log('🎨 CanvasImageService: Iniciado serviço de geração de imagens com Sharp');
  }

  ensureImageDir() {
    if (!fs.existsSync(this.imageDir)) {
      fs.mkdirSync(this.imageDir, { recursive: true });
      console.log(`📁 Diretório criado: ${this.imageDir}`);
    }
  }

  // Função para quebrar texto em linhas que cabem na largura especificada
  wrapText(text, maxCharsPerLine = 60) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  // Gera SVG da notícia e converte para PNG usando Sharp
  async generateNewsImage(news, newsNumber) {
    try {
      console.log(`🎨 Gerando imagem para notícia ${newsNumber}: ${news.title}`);
      
      const sourceEmoji = this.getSourceEmoji(news.source);
      const timeAgo = this.getTimeAgo(news.pubDate);
      
      // Prepara o conteúdo
      const titleLines = this.wrapText(news.title, 50);
      const contentText = news.rewrittenContent || news.originalContent || '';
      const maxContentLength = 600;
      const truncatedContent = contentText.length > maxContentLength 
        ? contentText.substring(0, maxContentLength) + '...'
        : contentText;
      const contentLines = this.wrapText(truncatedContent, 65);

      // Cria SVG
      const svg = this.createNewsSVG(newsNumber, sourceEmoji, titleLines, contentLines, news.source, timeAgo, news.relevanceScore);
      
      // Converte SVG para PNG usando Sharp
      const timestamp = Date.now();
      const filename = `news-${timestamp}-${newsNumber}.png`;
      const filepath = path.join(this.imageDir, filename);
      
      const buffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      fs.writeFileSync(filepath, buffer);

      console.log(`✅ Imagem gerada: ${filename}`);

      return {
        filename,
        filepath,
        buffer,
        isText: false
      };

    } catch (error) {
      console.error('Erro ao gerar imagem da notícia:', error);
      throw error;
    }
  }

  createNewsSVG(newsNumber, sourceEmoji, titleLines, contentLines, source, timeAgo, relevanceScore) {
    const headerHeight = 120;
    const titleHeight = Math.max(100, titleLines.length * 25 + 40);
    const contentHeight = Math.max(400, contentLines.length * 18 + 60);
    const footerHeight = 120;
    const totalHeight = headerHeight + titleHeight + contentHeight + footerHeight + 60;

    return `
      <svg width="${this.imageWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3c72;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2a5298;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${this.imageWidth}" height="${totalHeight}" fill="url(#bgGradient)" />
        
        <!-- Header -->
        <rect x="0" y="0" width="${this.imageWidth}" height="${headerHeight}" fill="rgba(255,255,255,0.1)" />
        <text x="${this.imageWidth/2}" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">📰 NOTÍCIA ${newsNumber}</text>
        ${relevanceScore ? `<text x="${this.imageWidth/2}" y="65" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16">Score: ${relevanceScore}</text>` : ''}
        <text x="${this.imageWidth/2}" y="95" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24">${sourceEmoji}</text>
        
        <!-- Title Area -->
        <rect x="40" y="${headerHeight + 20}" width="${this.imageWidth - 80}" height="${titleHeight}" fill="rgba(255,255,255,0.95)" rx="10" />
        ${titleLines.map((line, index) => 
          `<text x="60" y="${headerHeight + 50 + (index * 25)}" fill="#1e3c72" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${this.escapeXml(line)}</text>`
        ).join('')}
        
        <!-- Content Area -->
        <rect x="40" y="${headerHeight + titleHeight + 40}" width="${this.imageWidth - 80}" height="${contentHeight}" fill="rgba(255,255,255,0.9)" rx="10" />
        ${contentLines.slice(0, 20).map((line, index) => 
          `<text x="60" y="${headerHeight + titleHeight + 70 + (index * 18)}" fill="#333333" font-family="Arial, sans-serif" font-size="14">${this.escapeXml(line)}</text>`
        ).join('')}
        
        <!-- Footer -->
        <rect x="40" y="${headerHeight + titleHeight + contentHeight + 60}" width="${this.imageWidth - 80}" height="${footerHeight}" fill="rgba(0,0,0,0.7)" rx="10" />
        <text x="60" y="${headerHeight + titleHeight + contentHeight + 90}" fill="white" font-family="Arial, sans-serif" font-size="14">📍 Fonte: ${this.escapeXml(source)}</text>
        <text x="60" y="${headerHeight + titleHeight + contentHeight + 110}" fill="white" font-family="Arial, sans-serif" font-size="14">⏰ ${this.escapeXml(timeAgo)}</text>
        <text x="60" y="${headerHeight + titleHeight + contentHeight + 130}" fill="white" font-family="Arial, sans-serif" font-size="14">📱 Newsletter WhatsApp</text>
        
        <!-- Watermark -->
        <text x="${this.imageWidth/2}" y="${totalHeight - 10}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="Arial, sans-serif" font-size="10">Generated with Claude Code</text>
      </svg>
    `;
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Gera imagem de introdução do newsletter
  async generateIntroImage(newsCount, currentTime) {
    try {
      console.log('🎨 Gerando imagem de introdução do newsletter');
      
      const svg = this.createIntroSVG(newsCount, currentTime);
      
      const timestamp = Date.now();
      const filename = `intro-${timestamp}.png`;
      const filepath = path.join(this.imageDir, filename);
      
      const buffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      fs.writeFileSync(filepath, buffer);

      console.log(`✅ Imagem de introdução gerada: ${filename}`);

      return {
        filename,
        filepath,
        buffer,
        isText: false
      };

    } catch (error) {
      console.error('Erro ao gerar imagem de introdução:', error);
      throw error;
    }
  }

  createIntroSVG(newsCount, currentTime) {
    return `
      <svg width="${this.imageWidth}" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="introGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${this.imageWidth}" height="600" fill="url(#introGradient)" />
        
        <!-- Main title -->
        <text x="${this.imageWidth/2}" y="100" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="36" font-weight="bold">🌅 NEWSLETTER WHATSAPP</text>
        
        <!-- Subtitle -->
        <text x="${this.imageWidth/2}" y="150" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${this.escapeXml(currentTime)} - Principais Notícias</text>
        
        <!-- Content box -->
        <rect x="100" y="200" width="${this.imageWidth - 200}" height="280" fill="rgba(255,255,255,0.9)" rx="15" />
        
        <!-- Content text -->
        <text x="${this.imageWidth/2}" y="250" text-anchor="middle" fill="#333333" font-family="Arial, sans-serif" font-size="18" font-weight="bold">📰 ${newsCount} notícias selecionadas</text>
        <text x="${this.imageWidth/2}" y="280" text-anchor="middle" fill="#333333" font-family="Arial, sans-serif" font-size="18" font-weight="bold">pelos melhores portais brasileiros</text>
        
        <text x="${this.imageWidth/2}" y="330" text-anchor="middle" fill="#333333" font-family="Arial, sans-serif" font-size="16">🤖 Processadas e reescritas pela IA Gemini</text>
        
        <!-- Bottom message -->
        <text x="${this.imageWidth/2}" y="410" text-anchor="middle" fill="#333333" font-family="Arial, sans-serif" font-size="20" font-weight="bold">📱 Sempre bem informado!</text>
        
        <!-- Decorative circles -->
        <circle cx="200" cy="520" r="15" fill="rgba(255,255,255,0.2)" />
        <circle cx="300" cy="520" r="15" fill="rgba(255,255,255,0.2)" />
        <circle cx="400" cy="520" r="15" fill="rgba(255,255,255,0.2)" />
        <circle cx="500" cy="520" r="15" fill="rgba(255,255,255,0.2)" />
        <circle cx="600" cy="520" r="15" fill="rgba(255,255,255,0.2)" />
      </svg>
    `;
  }

  // Gera imagem de rodapé com comandos
  async generateFooterImage() {
    try {
      console.log('🎨 Gerando imagem de rodapé');
      
      const svg = this.createFooterSVG();
      
      const timestamp = Date.now();
      const filename = `footer-${timestamp}.png`;
      const filepath = path.join(this.imageDir, filename);
      
      const buffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      fs.writeFileSync(filepath, buffer);

      console.log(`✅ Imagem de rodapé gerada: ${filename}`);

      return {
        filename,
        filepath,
        buffer,
        isText: false
      };

    } catch (error) {
      console.error('Erro ao gerar imagem de rodapé:', error);
      throw error;
    }
  }

  createFooterSVG() {
    return `
      <svg width="${this.imageWidth}" height="500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="footerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${this.imageWidth}" height="500" fill="url(#footerGradient)" />
        
        <!-- Header -->
        <text x="${this.imageWidth/2}" y="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">⚙️ COMANDOS DISPONÍVEIS</text>
        
        <!-- Commands box -->
        <rect x="80" y="100" width="${this.imageWidth - 160}" height="300" fill="rgba(255,255,255,0.9)" rx="15" />
        
        <!-- Commands text -->
        <text x="100" y="150" fill="#333333" font-family="Arial, sans-serif" font-size="16" font-weight="bold">• "configurar horario" - Alterar horário de entrega</text>
        <text x="100" y="190" fill="#333333" font-family="Arial, sans-serif" font-size="16" font-weight="bold">• "status" - Ver status da assinatura</text>
        <text x="100" y="230" fill="#333333" font-family="Arial, sans-serif" font-size="16" font-weight="bold">• "cancelar" - Informações sobre cancelamento</text>
        
        <!-- Footer message -->
        <text x="${this.imageWidth/2}" y="330" text-anchor="middle" fill="#333333" font-family="Arial, sans-serif" font-size="18" font-weight="bold">📱 Newsletter WhatsApp</text>
        <text x="${this.imageWidth/2}" y="360" text-anchor="middle" fill="#333333" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Sempre bem informado!</text>
      </svg>
    `;
  }

  // Gera emoji de cor baseado na fonte da notícia
  getSourceEmoji(source) {
    if (source.includes('UOL')) {
      return '🟠';
    } else if (source.includes('Opera Mundi')) {
      return '🔵';
    } else if (source.includes('Agência Brasil')) {
      return '🟢';
    } else {
      return '🟣';
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

  // Limpa imagens antigas (mais de 1 hora)
  cleanOldImages() {
    try {
      const files = fs.readdirSync(this.imageDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      files.forEach(file => {
        const filepath = path.join(this.imageDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filepath);
          console.log(`🗑️ Imagem antiga removida: ${file}`);
        }
      });
    } catch (error) {
      console.error('Erro ao limpar imagens antigas:', error);
    }
  }
}

export default new CanvasImageService();