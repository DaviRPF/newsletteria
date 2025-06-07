import venom from 'venom-bot';
import { User } from '../models/User.js';
import developerManager from '../utils/developers.js';
import tempNewsService from './tempNewsService.js';
import imageService from './imageService.js';
import canvasImageService from './canvasImageService.js';
import aiService from './aiService.js';
import tokenTracker from './tokenTracker.js';
import sourceDiscoveryService from './sourceDiscoveryService.js';

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      console.log('🚀 Inicializando Venom-bot...');
      
      this.client = await venom.create(
        process.env.WHATSAPP_SESSION_NAME || 'newsletter-session',
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log('\n📱 QR CODE PARA CONECTAR WHATSAPP:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(asciiQR);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📊 Tentativa: ${attempts}`);
          console.log('⏰ Escaneie o QR Code acima com seu WhatsApp em até 45 segundos');
          console.log('📲 Abra o WhatsApp > Três pontos > Aparelhos conectados > Conectar um aparelho');
        },
        (statusSession, session) => {
          console.log(`📊 Status da sessão: ${statusSession}`);
          console.log(`🔗 Sessão: ${session}`);
          
          if (statusSession === 'successChat') {
            console.log('✅ WhatsApp conectado com sucesso!');
          } else if (statusSession === 'qrReadSuccess') {
            console.log('✅ QR Code lido com sucesso! Aguardando confirmação...');
          } else if (statusSession === 'qrReadFail') {
            console.log('❌ Falha ao ler QR Code. Tente novamente.');
          }
        },
        {
          multiDevice: true,
          folderNameToken: 'tokens',
          mkdirFolderToken: '',
          headless: process.env.NODE_ENV === 'production',
          useChrome: true,
          debug: false,
          logQR: true,
          browserWS: '',
          browserArgs: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
          puppeteerOptions: {
            args: [
              '--no-sandbox', 
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage'
            ]
          },
          disableWelcome: true,
          updatesLog: false,
          autoClose: 0,
          createPathFileToken: true,
          refreshQR: 0,
        }
      );

      this.isConnected = true;
      console.log('✅ WhatsApp conectado com sucesso!');
      console.log('📱 Pronto para receber e enviar mensagens!');

      this.client.onMessage(async (message) => {
        await this.handleIncomingMessage(message);
      });

      this.client.onStateChange((state) => {
        console.log('🔄 Estado da conexão mudou:', state);
        this.isConnected = state === 'CONNECTED';
      });

      this.client.onStreamChange((state) => {
        console.log('📡 Stream mudou:', state);
      });

      this.client.onIncomingCall(async (call) => {
        console.log('📞 Chamada recebida:', call.from);
        await this.client.rejectCall(call.id);
      });

      return this.client;
    } catch (error) {
      console.error('❌ Erro ao conectar WhatsApp:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async handleIncomingMessage(message) {
    if (message.isGroupMsg || message.from === 'status@broadcast') return;

    const phone = message.from.replace('@c.us', '');
    const messageText = message.body.toLowerCase().trim();
    
    console.log(`\n📨 Mensagem recebida de ${phone}: "${messageText}" (tamanho: ${messageText.length})`);
    console.log(`📝 Mensagem original: "${message.body}"`);
    console.log(`🔍 Tipo de mensagem: ${message.type}`);

    try {
      // Verifica se é desenvolvedor
      const isDeveloper = developerManager.isDeveloper(phone);
      
      // Verifica se tem assinatura ativa (quando DB estiver ativo)
      let hasActiveSubscription = false;
      if (this.db) {
        const user = await User.findByPhone(this.db, phone);
        hasActiveSubscription = user && user.subscriptionStatus === 'active';
      }

      // Se não é desenvolvedor e não tem assinatura, só responde para comandos específicos
      if (!isDeveloper && !hasActiveSubscription) {
        if (messageText === 'ativar' || messageText === 'assinar' || messageText === 'start') {
          await this.sendSignupMessage(phone);
        } else if (messageText === 'dev add me') {
          // Comando temporário para se auto-adicionar como desenvolvedor
          developerManager.addDeveloper(phone);
          await this.sendMessage(phone, `✅ Você foi adicionado como desenvolvedor!\n\n🚀 Agora você tem acesso ilimitado. Digite "status" para verificar.`);
        } else {
          await this.sendUnauthorizedMessage(phone);
        }
        return;
      }

      // Comandos disponíveis para usuários autorizados
      console.log(`🎯 Verificando comando...`);
      
      if (messageText === 'configurar horario' || messageText === 'configurar horário') {
        console.log(`⚙️ Comando: Configurar horário`);
        await this.sendTimeConfigMessage(phone);
      } else if (messageText.match(/^\d{1,2}:\d{2}$/)) {
        console.log(`⏰ Detectado horário: ${messageText}`);
        await this.updateUserTime(phone, messageText);
      } else if (messageText === 'cancelar' || messageText === 'cancelar assinatura') {
        await this.handleCancellation(phone);
      } else if (messageText === 'ativar' || messageText === 'reativar') {
        await this.handleReactivation(phone);
      } else if (messageText === 'status' || messageText === 'perfil' || messageText === 'meu perfil') {
        await this.handleProfileRequest(phone);
      } else if (messageText.startsWith('dev ') && isDeveloper) {
        // Comandos especiais para desenvolvedores
        await this.handleDeveloperCommand(phone, messageText);
      } else if (messageText === 'l' && isDeveloper) {
        // Comando temporário para forçar envio de newsletter
        console.log(`🚀 Comando "l" recebido - Forçando envio de newsletter para ${phone}`);
        await this.triggerNewsletterNow(phone);
      } else {
        // Resposta padrão para qualquer outra mensagem
        await this.sendDefaultResponse(phone);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  async sendTimeConfigMessage(phone) {
    const message = `⏰ *Configuração de Horário*

Para alterar o horário de recebimento das notícias, digite o horário desejado no formato HH:MM.

Exemplos:
• 08:00 (8 da manhã)
• 14:30 (2:30 da tarde)
• 20:15 (8:15 da noite)

O horário atual é baseado no fuso de Brasília.`;

    await this.sendMessage(phone, message);
  }

  setDatabase(db) {
    console.log('🔍 DEBUG: setDatabase chamado com:', db ? 'Banco Conectado' : 'NULL');
    this.db = db;
    console.log('🔍 DEBUG: this.db agora é:', this.db ? 'Definido' : 'NULL');
  }

  async updateUserTime(phone, time) {
    try {
      // Se é desenvolvedor, salva no sistema temporário
      if (developerManager.isDeveloper(phone)) {
        developerManager.setDeveloperDeliveryTime(phone, time);
        await this.sendMessage(phone, `✅ Horário atualizado com sucesso! 

Você receberá as notícias diariamente às *${time}*.

🚀 *Nota:* Como desenvolvedor, você receberá notícias reais dos RSS feeds no horário configurado. Use "l" para testar imediatamente.`);
        return;
      }

      if (!this.db) {
        await this.sendMessage(phone, '⚠️ Sistema temporariamente indisponível. Tente novamente mais tarde.');
        return;
      }

      const user = await User.findByPhone(this.db, phone);
      
      if (!user) {
        await this.sendMessage(phone, '❌ Usuário não encontrado. Você precisa estar cadastrado para alterar o horário.');
        return;
      }

      if (user.subscriptionStatus !== 'active') {
        await this.sendMessage(phone, '❌ Você precisa ter uma assinatura ativa para configurar o horário.');
        return;
      }

      await User.updateDeliveryTime(this.db, phone, time);
      
      await this.sendMessage(phone, `✅ Horário atualizado com sucesso! 

Você receberá as notícias diariamente às *${time}*.`);

    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
      await this.sendMessage(phone, '❌ Erro ao atualizar horário. Tente novamente.');
    }
  }

  async handleCancellation(phone) {
    try {
      // Verifica se é desenvolvedor
      if (developerManager.isDeveloper(phone)) {
        await this.sendMessage(phone, `🚀 *Desenvolvedor Detectado*

Como desenvolvedor, você tem acesso ilimitado e não pode cancelar.

Para sair do modo desenvolvedor, contate o administrador do sistema.`);
        return;
      }

      // Se tem banco de dados, atualiza status
      if (this.db) {
        const user = await User.findByPhone(this.db, phone);
        
        if (!user) {
          await this.sendMessage(phone, `❌ *Usuário não encontrado*

Você não possui uma assinatura ativa no sistema.

Para assinar, digite: *assinar*`);
          return;
        }

        if (user.subscriptionStatus !== 'active') {
          await this.sendMessage(phone, `ℹ️ *Assinatura já cancelada*

Sua assinatura já está cancelada ou inativa.

Para reativar, digite: *ativar*`);
          return;
        }

        // Marca como cancelada mas mantém acesso até o fim do período
        await User.cancelSubscription(this.db, phone);
        
        const message = `✅ *Assinatura Cancelada*

Sua assinatura foi cancelada com sucesso.

📅 *Você continuará recebendo as notícias até:* ${user.trialEndDate ? user.trialEndDate.toLocaleDateString('pt-BR') : 'o final do período pago'}

💡 *Para reativar a qualquer momento, digite:* *ativar*

😔 Sentiremos sua falta! Obrigado por ter usado nossa newsletter.`;

        await this.sendMessage(phone, message);
      } else {
        // Sem banco de dados - resposta genérica
        const message = `📱 *Cancelamento de Assinatura*

Para cancelar sua assinatura:

🔗 Acesse o link do Mercado Pago enviado no seu email
💌 Ou entre em contato com nosso suporte

📅 Você continuará recebendo as notícias até o final do período pago.

💡 Para reativar futuramente, digite: *ativar*`;

        await this.sendMessage(phone, message);
      }
    } catch (error) {
      console.error('Erro no cancelamento:', error);
      await this.sendMessage(phone, '❌ Erro interno. Tente novamente ou contate o suporte.');
    }
  }

  async handleReactivation(phone) {
    const message = `📱 *Reativação de Assinatura*

Para reativar sua assinatura, acesse nossa página de assinatura:

[LINK DA LANDING PAGE]

Ou entre em contato conosco através do nosso suporte.`;

    await this.sendMessage(phone, message);
  }

  async sendMessage(phone, message) {
    if (!this.isConnected || !this.client) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      await this.client.sendText(chatId, message);
      console.log(`Mensagem enviada para ${phone}: ${message.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Erro ao enviar mensagem para ${phone}:`, error);
      throw error;
    }
  }

  async sendNewsToUser(phone, news, useImages = false, db = null) {
    if (!this.isConnected || !this.client) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      
      // Debug da conexão do banco
      console.log(`🔍 DEBUG: DB passado para sendNewsToUser:`, db ? 'Conectado' : 'NULL');
      console.log(`🔍 DEBUG: this.db:`, this.db ? 'Conectado' : 'NULL');
      
      // Busca perfil do usuário se DB estiver disponível
      let userProfile = null;
      const activeDb = db || this.db;
      
      if (activeDb) {
        try {
          console.log(`🔍 DEBUG: Buscando usuário ${phone} no banco...`);
          userProfile = await User.findByPhone(activeDb, phone);
          console.log(`👤 DEBUG: Perfil encontrado:`, userProfile);
          console.log(`👤 Perfil carregado para ${phone}: ${userProfile?.profileDescription ? 'Personalização ativa' : 'Sem personalização'}`);
        } catch (error) {
          console.log(`⚠️ Erro ao carregar perfil de ${phone}:`, error.message);
        }
      } else {
        console.log(`❌ DEBUG: Nenhum banco de dados disponível para carregar perfil`);
      }
      
      // Envia notícias com personalização se disponível
      await this.sendNewsAsText(chatId, news, userProfile);

    } catch (error) {
      console.error(`Erro ao enviar notícias para ${phone}:`, error);
      throw error;
    }
  }

  async sendNewsAsImages(chatId, news) {
    console.log('📱 Enviando notícias como imagens geradas por Canvas...');
    
    // Gera e envia introdução
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    try {
      console.log('🎨 Gerando imagem de introdução...');
      const introImage = await canvasImageService.generateIntroImage(news.length, currentTime);
      
      await this.client.sendImage(
        chatId, 
        introImage.filepath, 
        'newsletter-intro', 
        '🌅 Newsletter WhatsApp - Introdução'
      );
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Erro ao gerar introdução:', error);
      // Fallback para texto se imagem falhar
      const introMessage = `🌅 *Newsletter WhatsApp* - ${currentTime}\n\n📰 ${news.length} principais notícias de hoje`;
      await this.client.sendText(chatId, introMessage);
    }
    
    // Gera e envia cada notícia como imagem
    for (let i = 0; i < news.length; i++) {
      const article = news[i];
      const articleNumber = i + 1;
      
      try {
        console.log(`📸 Gerando imagem para notícia ${articleNumber}...`);
        const newsImage = await canvasImageService.generateNewsImage(article, articleNumber);
        
        // Envia a imagem da notícia
        await this.client.sendImage(
          chatId, 
          newsImage.filepath, 
          `noticia-${articleNumber}`, 
          `📰 Notícia ${articleNumber}: ${article.title}`
        );
        
        // Envia link complementar em texto
        let linkMessage = `🔗 *Leia mais:* ${article.originalUrl}`;
        if (article.consolidated && article.alternativeUrls && article.alternativeUrls.length > 0) {
          linkMessage += `\n\n📊 *Links adicionais:*`;
          article.alternativeUrls.slice(0, 2).forEach((url, idx) => {
            linkMessage += `\n   ${idx + 1}. ${url}`;
          });
        }
        
        await this.client.sendText(chatId, linkMessage);
        
        // Delay entre notícias
        if (i < news.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`Erro ao gerar imagem da notícia ${articleNumber}:`, error);
        // Fallback para texto se a imagem falhar
        await this.sendSingleNewsAsText(chatId, article, articleNumber);
      }
    }
    
    // Gera e envia rodapé com comandos
    try {
      console.log('🎨 Gerando imagem de rodapé...');
      const footerImage = await canvasImageService.generateFooterImage();
      
      await this.client.sendImage(
        chatId, 
        footerImage.filepath, 
        'newsletter-footer', 
        '⚙️ Comandos disponíveis'
      );
    } catch (error) {
      console.error('Erro ao gerar rodapé:', error);
      // Fallback para texto simples
      const footerMessage = `⚙️ Para alterar o horário de recebimento das notícias, digite: *configurar horario*\n\n📱 Newsletter WhatsApp - Sempre bem informado!`;
      await this.client.sendText(chatId, footerMessage);
    }
  }

  async sendNewsAsText(chatId, news, userProfile = null) {
    // Debug do perfil do usuário
    console.log('👤 DEBUG: UserProfile recebido:', userProfile);
    console.log('📝 DEBUG: ProfileDescription:', userProfile?.profileDescription);
    
    // Enviar introdução simples
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let introMessage = `🌅 *Newsletter WhatsApp* - ${currentTime}\n\n📰 As ${news.length} principais notícias de hoje`;
    
    // Adiciona nota sobre personalização se o usuário tem perfil
    if (userProfile && userProfile.profileDescription) {
      introMessage += `\n🎯 _Análise personalizada incluída_`;
    }
    introMessage += `:`;
    
    await this.client.sendText(chatId, introMessage);
    
    for (let i = 0; i < news.length; i++) {
      const article = news[i];
      const articleNumber = i + 1;
      
      await this.sendSingleNewsAsText(chatId, article, articleNumber, userProfile);
      
      // Delay entre notícias para melhor experiência
      if (i < news.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Rodapé simples
    const footerMessage = `\n⚙️ *Comandos:*\n` +
      `• *configurar horario* - Alterar horário\n` +
      `• *status* - Ver sua assinatura\n` +
      `• *cancelar* - Info sobre cancelamento\n\n` +
      `📱 Newsletter WhatsApp - Sempre bem informado!`;
    
    await this.client.sendText(chatId, footerMessage);
  }

  async sendSingleNewsAsText(chatId, article, articleNumber, userProfile = null) {
    let message = `\n`;
    
    // Título destacado
    message += `📰 *${article.title}*\n\n`;
    
    // Conteúdo formatado
    const content = article.rewrittenContent || article.originalContent || '';
    const formattedContent = content.replace(/\n\n/g, '\n\n');
    message += `${formattedContent}\n\n`;

    // Análise personalizada se o usuário tem perfil
    if (userProfile && userProfile.profileDescription) {
      try {
        console.log(`🎯 DEBUG: Gerando análise personalizada para notícia ${articleNumber}...`);
        console.log(`📝 DEBUG: Profile usado: "${userProfile.profileDescription}"`);
        const personalizedImpact = await aiService.generatePersonalizedImpact(
          article.title,
          content,
          userProfile.profileDescription
        );

        console.log(`✅ DEBUG: Análise gerada: "${personalizedImpact}"`);
        
        if (personalizedImpact) {
          message += `🎯 *Como isso afeta você:*\n`;
          message += `${personalizedImpact}\n\n`;
        } else {
          console.log(`⚠️ DEBUG: Análise personalizada retornou null/vazio`);
        }
      } catch (error) {
        console.error('❌ DEBUG: Erro ao gerar análise personalizada:', error);
      }
    } else {
      console.log(`⚠️ DEBUG: Sem perfil para análise personalizada. UserProfile:`, userProfile);
    }
    
    // Fonte e horário de forma simples
    message += `📍 ${article.source}`;
    if (article.pubDate) {
      const timeAgo = this.getTimeAgo(article.pubDate);
      message += ` • ${timeAgo}`;
    }
    message += `\n\n`;
    
    // Link principal
    message += `🔗 Leia mais: ${article.originalUrl}`;

    await this.client.sendText(chatId, message);

    // Debug: sempre mostrar se há imageUrl
    console.log(`🔍 DEBUG imageUrl da notícia ${articleNumber}: ${article.imageUrl || 'NENHUMA'}`);
    
    // Envia imagem se disponível e válida
    if (article.imageUrl) {
      try {
        // Tenta enviar qualquer imagem, exceto SVGs óbvios
        const isObviousSvg = article.imageUrl.toLowerCase().includes('.svg');
        
        if (!isObviousSvg) {
          console.log(`📸 Enviando imagem da notícia ${articleNumber}: ${article.imageUrl}`);
          await this.client.sendImage(chatId, article.imageUrl, `noticia-${articleNumber}`, `📸 Imagem da Notícia ${articleNumber}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`⚠️ Imagem SVG ignorada: ${article.imageUrl}`);
        }
      } catch (imgError) {
        console.error('Erro ao enviar imagem:', imgError);
      }
    } else {
      console.log(`📭 Notícia ${articleNumber} não tem imagem`);
    }
  }

  async sendBulkNews(subscribers, news, db = null) {
    console.log(`Enviando notícias para ${subscribers.length} assinantes...`);
    
    for (const subscriber of subscribers) {
      try {
        await this.sendNewsToUser(subscriber.phone, news, false, db);
        console.log(`Notícias enviadas para ${subscriber.phone}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Erro ao enviar para ${subscriber.phone}:`, error);
      }
    }
  }

  isClientConnected() {
    return this.isConnected && this.client;
  }

  async reconnect() {
    try {
      console.log('🔄 Tentando reconectar WhatsApp...');
      
      if (this.client) {
        try {
          await this.client.close();
        } catch (error) {
          console.log('Erro ao fechar cliente anterior:', error.message);
        }
      }

      this.client = null;
      this.isConnected = false;

      await this.initialize();
      
      if (this.db) {
        this.setDatabase(this.db);
      }

      console.log('✅ Reconexão bem-sucedida!');
      return true;
    } catch (error) {
      console.error('❌ Erro na reconexão:', error);
      return false;
    }
  }

  async checkConnection() {
    if (!this.client) {
      return false;
    }

    try {
      const isConnected = await this.client.isConnected();
      this.isConnected = isConnected;
      return isConnected;
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getConnectionInfo() {
    if (!this.client) {
      return {
        isConnected: false,
        error: 'Cliente não inicializado'
      };
    }

    try {
      const isConnected = await this.checkConnection();
      
      if (isConnected) {
        const hostDevice = await this.client.getHostDevice();
        const batteryLevel = await this.client.getBatteryLevel();
        
        return {
          isConnected: true,
          device: hostDevice,
          battery: batteryLevel,
          sessionName: process.env.WHATSAPP_SESSION_NAME || 'newsletter-session'
        };
      } else {
        return {
          isConnected: false,
          error: 'Desconectado'
        };
      }
    } catch (error) {
      return {
        isConnected: false,
        error: error.message
      };
    }
  }

  async handleProfileRequest(phone) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const profileUrl = `${frontendUrl}/profile/${phone}`;
    
    let statusMessage = '';
    
    // Verifica se é desenvolvedor primeiro
    if (developerManager.isDeveloper(phone)) {
      statusMessage = `🚀 *Status:* Desenvolvedor (Acesso Ilimitado)`;
    } else if (this.db) {
      try {
        const user = await User.findByPhone(this.db, phone);
        
        if (user) {
          if (user.subscriptionStatus === 'active') {
            const now = new Date();
            if (user.trialEndDate && now < user.trialEndDate) {
              const daysLeft = Math.ceil((user.trialEndDate - now) / (1000 * 60 * 60 * 24));
              statusMessage = `✅ *Status:* Trial Ativo (${daysLeft} dias restantes)`;
            } else {
              statusMessage = `✅ *Status:* Assinatura Ativa`;
            }
          } else if (user.subscriptionStatus === 'cancelled') {
            statusMessage = `❌ *Status:* Assinatura Cancelada`;
          } else {
            statusMessage = `⚠️ *Status:* Assinatura Inativa`;
          }
        } else {
          statusMessage = `❓ *Status:* Não cadastrado`;
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        statusMessage = `⚠️ *Status:* Erro ao verificar`;
      }
    } else {
      // Sem banco de dados, ainda verifica desenvolvedores
      if (developerManager.isDeveloper(phone)) {
        statusMessage = `🚀 *Status:* Desenvolvedor (Acesso Ilimitado)`;
      } else {
        statusMessage = `⚠️ *Status:* Sistema temporariamente indisponível`;
      }
    }
    
    const message = `👤 *Seu Perfil - Newsletter WhatsApp*

${statusMessage}

🔗 *Acesse seu perfil completo:*
${profileUrl}

No link acima você pode:
• Ver detalhes da sua assinatura
• Atualizar seus dados
• Gerenciar pagamento
• Cancelar ou reativar assinatura

📱 *Comandos disponíveis:*
• "configurar horario" - Alterar horário
• "status" - Ver este resumo
• "cancelar" - Informações de cancelamento`;

    await this.sendMessage(phone, message);
  }

  async sendDefaultResponse(phone) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const profileUrl = `${frontendUrl}/profile/${phone}`;
    
    const message = `👋 *Olá! Sou o bot da Newsletter WhatsApp*

📱 *Acesse seu perfil:*
${profileUrl}

⚙️ *Comandos disponíveis:*
• "status" ou "perfil" - Ver status da assinatura
• "configurar horario" - Alterar horário de entrega
• "cancelar" - Informações sobre cancelamento
• "ativar" - Reativar assinatura

💡 *Dica:* Digite qualquer comando acima!`;

    await this.sendMessage(phone, message);
  }

  async handleDeveloperCommand(phone, command) {
    const parts = command.split(' ');
    const subCommand = parts[1];
    
    switch(subCommand) {
      case 'help':
        await this.sendMessage(phone, `🚀 *Comandos de Desenvolvedor*

• "dev help" - Este menu
• "dev test" - Receber newsletter teste
• "dev update" - Atualizar cache de notícias
• "dev add [numero]" - Adicionar desenvolvedor
• "dev remove [numero]" - Remover desenvolvedor
• "dev list" - Listar desenvolvedores
• "dev images" - Testar modo imagem
• "dev text" - Testar modo texto
• "dev canvas" - Testar Canvas individualmente
• "dev discover [termo]" - Testar descoberta automática de fontes`);
        break;
        
      case 'test':
        await this.sendMessage(phone, `📰 *Newsletter Teste*

🔥 *Notícia 1:* Exemplo de notícia principal do dia
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

💡 *Notícia 2:* Segunda notícia mais relevante
Sed do eiusmod tempor incididunt ut labore et dolore magna.

🌟 *Notícia 3:* Terceira notícia importante
Ut enim ad minim veniam, quis nostrud exercitation.

📌 *Notícia 4:* Quarta notícia do dia
Duis aute irure dolor in reprehenderit in voluptate.

⚙️ Para alterar o horário de recebimento, digite: *configurar horario*`);
        break;
        
      case 'add':
        if (parts[2]) {
          developerManager.addDeveloper(parts[2]);
          await this.sendMessage(phone, `✅ Desenvolvedor ${parts[2]} adicionado!`);
        } else {
          await this.sendMessage(phone, `❌ Use: dev add [numero]`);
        }
        break;
        
      case 'remove':
        if (parts[2]) {
          developerManager.removeDeveloper(parts[2]);
          await this.sendMessage(phone, `✅ Desenvolvedor ${parts[2]} removido!`);
        } else {
          await this.sendMessage(phone, `❌ Use: dev remove [numero]`);
        }
        break;
        
      case 'list':
        const devs = developerManager.getDevelopers();
        await this.sendMessage(phone, `👥 *Desenvolvedores (${devs.length}):*\n\n${devs.join('\n')}`);
        break;

      case 'update':
        await this.sendMessage(phone, `🔄 Atualizando cache de notícias...`);
        await tempNewsService.forceUpdate();
        await this.sendMessage(phone, `✅ Cache atualizado! Use "l" para ver as 6 notícias.`);
        break;

      case 'images':
        await this.sendMessage(phone, `📸 *Testando modo IMAGEM (Canvas)*`);
        await this.triggerNewsletterWithImages(phone);
        break;

      case 'text':
        await this.sendMessage(phone, `📝 *Testando modo TEXTO*`);
        await this.triggerNewsletterWithText(phone);
        break;

      case 'canvas':
        await this.sendMessage(phone, `🎨 *Testando Canvas Image Service*`);
        await this.testCanvasService(phone);
        break;

      case 'discover':
        const searchTerm = parts[2] || 'tecnologia';
        await this.sendMessage(phone, `🔍 *Testando descoberta automática para: ${searchTerm}*`);
        await this.testSourceDiscovery(phone, searchTerm);
        break;
        
      default:
        await this.sendMessage(phone, `❌ Comando desconhecido. Digite "dev help"`);
    }
  }

  async sendUnauthorizedMessage(phone) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    const message = `❌ *Acesso Negado*

Você não possui uma assinatura ativa da Newsletter WhatsApp.

📱 *Para assinar:*
${frontendUrl}

💰 *Apenas R$ 5,00/mês*
✅ 2 dias grátis para testar
📰 6 principais notícias diárias
🤖 Conteúdo reescrito por IA

Digite "assinar" para mais informações.`;

    await this.sendMessage(phone, message);
  }

  async sendSignupMessage(phone) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    const message = `🎯 *Newsletter WhatsApp - Assinatura*

📰 Receba diariamente as 6 principais notícias do Brasil direto no seu WhatsApp!

✨ *Benefícios:*
• Notícias selecionadas por IA
• Conteúdo reescrito para fácil leitura
• Entrega no horário que você escolher
• Sem anúncios ou spam

💰 *Preço:* R$ 5,00/mês
🎁 *Bônus:* 2 dias grátis para testar!

🔗 *Assine agora:*
${frontendUrl}

Ou acesse o link e use seu número: ${phone}

Após assinar, você receberá uma mensagem de confirmação aqui!`;

    await this.sendMessage(phone, message);
  }

  async triggerNewsletterNow(phone) {
    // Por padrão usa imagens
    await this.triggerNewsletterWithImages(phone);
  }

  async triggerNewsletterWithImages(phone) {
    try {
      // Reset completo para contar TUDO desde o início
      tokenTracker.reset();
      console.log('🔥 Iniciando rastreamento COMPLETO de tokens (incluindo scores)...');
      
      await this.sendMessage(phone, '🚀 *Coletando notícias reais em formato IMAGEM...*');
      
      // Busca perfil do usuário para personalizar coleta
      let userProfile = null;
      if (this.db) {
        try {
          userProfile = await User.findByPhone(this.db, phone);
          console.log(`👤 Perfil carregado para coleta personalizada: ${userProfile?.profileDescription ? 'SIM' : 'NÃO'}`);
        } catch (error) {
          console.log(`⚠️ Erro ao carregar perfil para coleta:`, error.message);
        }
      }
      
      // Força atualização do cache para comando manual "l"
      await tempNewsService.forceUpdate(userProfile);
      const realNews = tempNewsService.cachedNews;
      
      if (realNews.length === 0) {
        await this.sendMessage(phone, '⚠️ Nenhuma notícia disponível no momento. Usando notícias de exemplo...');
        const testNews = this.getTestNews();
        await this.sendNewsToUser(phone, testNews, true, this.db); // true = usar imagens
      } else {
        const newsToSend = realNews.slice(0, 6);
        await this.sendNewsToUser(phone, newsToSend, true, this.db); // true = usar imagens
      }
      
      console.log(`✅ Newsletter com IMAGENS enviada para ${phone}`);
      
      // Mostra resumo COMPLETO incluindo coleta, scores, reescrita e análises personalizadas
      console.log('\n🔥 ===== TOKENS TOTAIS DO PROCESSO COMPLETO =====');
      tokenTracker.getSessionSummary();
      
    } catch (error) {
      console.error('Erro ao enviar newsletter com imagens:', error);
      await this.sendMessage(phone, '❌ Erro ao gerar imagens. Enviando em modo texto...');
      await this.triggerNewsletterWithText(phone);
    }
  }

  async triggerNewsletterWithText(phone) {
    try {
      // Reset completo para contar TUDO desde o início
      tokenTracker.reset();
      console.log('🔥 Iniciando rastreamento COMPLETO de tokens (incluindo scores)...');
      
      await this.sendMessage(phone, '🚀 *Coletando notícias reais em formato TEXTO...*');
      
      // Busca perfil do usuário para personalizar coleta
      let userProfile = null;
      if (this.db) {
        try {
          userProfile = await User.findByPhone(this.db, phone);
          console.log(`👤 Perfil carregado para coleta personalizada: ${userProfile?.profileDescription ? 'SIM' : 'NÃO'}`);
        } catch (error) {
          console.log(`⚠️ Erro ao carregar perfil para coleta:`, error.message);
        }
      }
      
      // Força atualização do cache para comando manual "l"
      await tempNewsService.forceUpdate(userProfile);
      const realNews = tempNewsService.cachedNews;
      
      if (realNews.length === 0) {
        await this.sendMessage(phone, '⚠️ Nenhuma notícia disponível no momento. Usando notícias de exemplo...');
        const testNews = this.getTestNews();
        await this.sendNewsToUser(phone, testNews, false, this.db); // false = usar texto
      } else {
        const newsToSend = realNews.slice(0, 6);
        
        // Envia introdução
        const now = new Date();
        const hora = now.getHours().toString().padStart(2, '0');
        const minuto = now.getMinutes().toString().padStart(2, '0');
        
        let intro = `🌅 *Newsletter WhatsApp* - ${hora}:${minuto}

📰 Aqui estão as ${newsToSend.length} principais notícias de hoje`;

        // Adiciona nota sobre personalização se há perfil
        if (userProfile && userProfile.profileDescription) {
          intro += `, selecionadas especialmente para seu perfil`;
        }
        
        intro += `:

${newsToSend.some(n => n.processed) ? '🤖 Processadas e reescritas pela IA Gemini' : '📄 Conteúdo original dos portais'}`;

        await this.sendMessage(phone, intro);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.sendNewsToUser(phone, newsToSend, false, this.db); // false = usar texto
      }
      
      console.log(`✅ Newsletter com TEXTO enviada para ${phone}`);
      
      // Mostra resumo COMPLETO incluindo coleta, scores, reescrita e análises personalizadas
      console.log('\n🔥 ===== TOKENS TOTAIS DO PROCESSO COMPLETO =====');
      tokenTracker.getSessionSummary();
      
    } catch (error) {
      console.error('Erro ao enviar newsletter em texto:', error);
      await this.sendMessage(phone, '❌ Erro ao enviar newsletter. Tente novamente.');
    }
  }

  getTestNews() {
    return [
      {
        title: "Economia Brasileira em Alta",
        rewrittenContent: `📈 O mercado financeiro brasileiro apresentou forte recuperação hoje, com o Ibovespa fechando em alta de 2,3%. Analistas apontam que a confiança dos investidores está retornando devido às novas políticas econômicas implementadas pelo governo.\n\nOs setores de tecnologia e energia renovável lideraram os ganhos, com destaque para empresas de e-commerce e startups de energia solar.`,
        source: "Portal Econômico",
        originalUrl: "https://exemplo.com/economia-alta",
        pubDate: new Date()
      },
      {
        title: "Nova Descoberta Científica no Brasil",
        rewrittenContent: `🔬 Pesquisadores da Universidade de São Paulo fizeram uma descoberta revolucionária na área de biotecnologia. O novo método desenvolvido promete acelerar a produção de medicamentos em até 40%.\n\nA pesquisa, que durou 3 anos, pode transformar a indústria farmacêutica nacional e colocar o Brasil como referência mundial em biotecnologia médica.`,
        source: "Ciência Hoje",
        originalUrl: "https://exemplo.com/descoberta-cientifica",
        pubDate: new Date()
      },
      {
        title: "Tecnologia Sustentável Ganha Espaço",
        rewrittenContent: `🌱 Empresas brasileiras investem cada vez mais em tecnologias sustentáveis. Um novo relatório mostra que os investimentos em energia limpa cresceram 150% no último ano.\n\nStartups de energia solar e eólica lideram o movimento, criando milhares de empregos verdes e reduzindo significativamente as emissões de carbono do país.`,
        source: "Verde News",
        originalUrl: "https://exemplo.com/tecnologia-sustentavel",
        pubDate: new Date()
      },
      {
        title: "Inovação na Educação Digital",
        rewrittenContent: `💻 Plataformas digitais revolucionam o ensino no Brasil. Mais de 2 milhões de estudantes já utilizam novas ferramentas de aprendizado online que combinam inteligência artificial com metodologias pedagógicas inovadoras.\n\nOs resultados mostram melhoria de 30% no aproveitamento escolar, especialmente em matemática e ciências, democratizando o acesso à educação de qualidade.`,
        source: "Educação Digital",
        originalUrl: "https://exemplo.com/educacao-digital",
        pubDate: new Date()
      }
    ];
  }

  async testCanvasService(phone) {
    try {
      const testNews = {
        title: "Teste do Canvas Image Service",
        rewrittenContent: "Este é um teste do serviço de geração de imagens usando Canvas. A funcionalidade está sendo testada para verificar se as imagens são geradas corretamente e enviadas via WhatsApp.",
        source: "Sistema de Teste",
        originalUrl: "https://exemplo.com/teste",
        pubDate: new Date(),
        relevanceScore: 9.5
      };

      console.log('🎨 Testando geração de imagem individual...');
      const newsImage = await canvasImageService.generateNewsImage(testNews, 1);
      
      const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      
      await this.client.sendImage(
        chatId, 
        newsImage.filepath, 
        'teste-canvas', 
        '🎨 Teste do Canvas Image Service'
      );
      
      await this.sendMessage(phone, '✅ Teste do Canvas concluído! Imagem gerada e enviada.');
      
    } catch (error) {
      console.error('Erro no teste do Canvas:', error);
      await this.sendMessage(phone, `❌ Erro no teste do Canvas: ${error.message}`);
    }
  }

  async testSourceDiscovery(phone, searchTerm) {
    try {
      await this.sendMessage(phone, `🔍 Iniciando busca por fontes de "${searchTerm}"...`);
      
      console.log(`🔍 Testando descoberta de fontes para: ${searchTerm}`);
      const discoveredSources = await sourceDiscoveryService.discoverSources([searchTerm], 5);
      
      if (discoveredSources.length === 0) {
        await this.sendMessage(phone, `❌ Nenhuma fonte encontrada para "${searchTerm}"`);
        return;
      }

      let resultMessage = `✅ *${discoveredSources.length} fontes encontradas para "${searchTerm}":*\n\n`;
      
      discoveredSources.forEach((source, index) => {
        resultMessage += `${index + 1}. *${source.name}*\n`;
        resultMessage += `   📊 Peso: ${source.weight}/10\n`;
        resultMessage += `   📰 Notícias recentes: ${source.recentCount}\n`;
        resultMessage += `   🔗 ${source.url}\n\n`;
      });

      await this.sendMessage(phone, resultMessage);
      await this.sendMessage(phone, `🎯 Use "dev update" para usar essas fontes na próxima coleta!`);
      
    } catch (error) {
      console.error('Erro no teste de descoberta:', error);
      await this.sendMessage(phone, `❌ Erro na descoberta: ${error.message}`);
    }
  }

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

  async sendWelcomeMessage(phone, userName) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const profileUrl = `${frontendUrl}/profile/${phone}`;
    
    const isDev = developerManager.isDeveloper(phone);
    
    let message = `🎉 *Bem-vindo(a) à Newsletter WhatsApp, ${userName}!*\n\n`;
    
    if (isDev) {
      message += `🚀 *Você é um desenvolvedor!*\n`;
      message += `✅ Acesso ilimitado ativado!\n\n`;
    } else {
      message += `✅ Seu trial de 2 dias foi ativado com sucesso!\n\n`;
    }
    
    message += `📰 *O que você vai receber:*
• As 6 principais notícias do dia
• Conteúdo reescrito pela IA para fácil leitura
• Entrega diária às 10:00 (personalizável)

🔗 *Seu perfil:*
${profileUrl}

⚙️ *Comandos úteis:*
• Digite "configurar horario" para alterar o horário
• Digite "status" para ver sua assinatura
• Digite "cancelar" para informações sobre cancelamento`;

    if (isDev) {
      message += `\n\n🚀 *Comandos de Desenvolvedor:*
• Digite "dev help" para ver comandos especiais`;
    }

    message += `\n\n📱 Guarde este número na sua agenda para não perder as mensagens!

Obrigado por escolher a Newsletter WhatsApp! 🙏`;

    await this.sendMessage(phone, message);
  }
}

export default new WhatsAppService();