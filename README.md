# Newsletter WhatsApp 📱

Sistema completo de newsletter via WhatsApp que coleta notícias de fontes confiáveis, processa com IA e envia para assinantes de forma automatizada.

## 🚀 Funcionalidades

- **Coleta automatizada** de notícias dos principais sites brasileiros (UOL, Opera Mundi)
- **IA Gemini 1.5 Flash** para análise, pontuação e reescrita de notícias
- **Detecção de duplicatas** inteligente para evitar repetições
- **Sistema de assinatura** com trial gratuito de 2 dias
- **Pagamentos via Mercado Pago** com cobrança automática
- **Envio personalizado** - usuário escolhe horário de recebimento
- **Interface web** moderna para cadastro e assinatura
- **Comandos WhatsApp** para configuração (horário, cancelamento, etc.)

## 🛠️ Tecnologias

### Backend
- **Fastify** - Framework web rápido e eficiente
- **MongoDB** - Banco de dados NoSQL
- **Venom-bot** - Integração com WhatsApp Web
- **Gemini 1.5 Flash** - IA para processamento de notícias
- **Mercado Pago SDK** - Processamento de pagamentos
- **Node-cron** - Agendamento de tarefas
- **RSS Parser** - Leitura de feeds RSS
- **Cheerio** - Web scraping

### Frontend
- **React** - Interface de usuário
- **React Router** - Navegação SPA
- **Axios** - Cliente HTTP
- **CSS moderno** - Design responsivo

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- MongoDB
- Conta no Google AI (Gemini)
- Conta no Mercado Pago

### Backend

1. **Clone o repositório**
```bash
git clone <repo-url>
cd newsletterwhatsapp/backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# Database
MONGODB_URL=mongodb://localhost:27017/newsletter

# JWT
JWT_SECRET=seu-jwt-secret-muito-seguro

# Server
PORT=3000

# WhatsApp
WHATSAPP_SESSION_NAME=newsletter-session

# Gemini AI
GEMINI_API_KEY=sua-chave-gemini-aqui

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu-access-token-mercadopago
MERCADOPAGO_PUBLIC_KEY=sua-public-key-mercadopago

# RSS Sources
RSS_ICP_URL=https://www.icp.org.br/feed/
RSS_UOL_URL=https://rss.uol.com.br/feed/noticias.xml
RSS_OPERA_MUNDI_URL=https://operamundi.uol.com.br/feed/

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

4. **Inicie o servidor**
```bash
npm run dev
```

### Frontend

1. **Navegue para o diretório frontend**
```bash
cd ../frontend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
```

4. **Inicie o frontend**
```bash
npm start
```

## 🔧 Configuração

### 1. WhatsApp
- Na primeira execução, um QR Code aparecerá no console
- Escaneie com seu WhatsApp para conectar
- A sessão será salva para próximas execuções

### 2. Gemini AI
- Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
- Crie uma API key
- Adicione no arquivo `.env`

### 3. Mercado Pago
- Acesse sua conta do [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
- Obtenha suas credenciais de produção ou sandbox
- Configure no arquivo `.env`

### 4. MongoDB
- Instale o MongoDB localmente ou use MongoDB Atlas
- Configure a URL de conexão no `.env`

## 📱 Como Usar

### Para Usuários Finais

1. **Acesse a landing page** - `http://localhost:3001`
2. **Digite seu email** e clique em "Começar Trial Grátis"
3. **Preencha seus dados** (nome, email, WhatsApp)
4. **Complete o pagamento** no Mercado Pago
5. **Receba notícias diariamente** no WhatsApp às 10h

### Comandos WhatsApp para Usuários

- `configurar horario` - Alterar horário de recebimento
- `08:30` (exemplo) - Definir novo horário (formato HH:MM)
- `cancelar` - Informações sobre cancelamento
- `ativar` - Reativar assinatura cancelada

### Para Administradores

**APIs disponíveis:**

```bash
# Estatísticas
GET /api/subscriptions/stats

# Status do sistema
GET /api/admin/status

# Forçar coleta de notícias
POST /api/admin/collect-news

# Enviar newsletter teste
POST /api/admin/test-newsletter
```

## 🤖 Sistema de IA

### Processo de Análise
1. **Coleta** - RSS feeds coletados automaticamente às 6h
2. **Scraping** - Conteúdo completo extraído dos artigos
3. **Detecção de duplicatas** - IA compara títulos e conteúdos
4. **Pontuação** - Cada notícia recebe score de 0-100 baseado em:
   - Impacto social/político (25 pontos)
   - Interesse público (25 pontos)
   - Atualidade e urgência (25 pontos)
   - Qualidade da informação (25 pontos)
5. **Reescrita** - IA adapta conteúdo para WhatsApp
6. **Seleção** - 4 notícias com maior pontuação são enviadas

## 📅 Agendamento

- **6:00** - Coleta automática de notícias
- **10 em 10 minutos** - Verificação de horários de entrega
- **Horários personalizados** - Cada usuário recebe no seu horário

## 💰 Sistema de Pagamentos

- **Trial gratuito** - 2 dias após confirmação do pagamento
- **Cobrança automática** - R$ 5,00/mês após trial
- **Cancelamento** - A qualquer momento via WhatsApp
- **Webhooks** - Atualizações automáticas do status

## 🔐 Segurança

- Validação de entrada em todas as APIs
- Sanitização de dados antes do processamento
- Timeout em requisições externas
- Rate limiting nas APIs públicas
- Logs detalhados para auditoria

## 📊 Monitoramento

O sistema inclui logs detalhados para:
- Coleta de notícias
- Processamento da IA
- Envios do WhatsApp
- Webhooks de pagamento
- Erros e exceções

## 🚨 Solução de Problemas

### WhatsApp não conecta
- Verifique se não há outro Venom rodando
- Deletar pasta `tokens/` e reconectar
- Verificar logs do console

### IA não funciona
- Verificar chave do Gemini no `.env`
- Confirmar cota da API Gemini
- Verificar logs de erro

### Pagamentos não funcionam
- Verificar credenciais do Mercado Pago
- Confirmar URL do webhook
- Testar com conta sandbox primeiro

### Notícias não chegam
- Verificar conexão WhatsApp
- Confirmar agendamento (cron jobs)
- Verificar se usuário tem assinatura ativa

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Entre em contato via WhatsApp
- Email: suporte@newsletterwhatsapp.com

---

Desenvolvido com ❤️ para manter você sempre bem informado! 📰