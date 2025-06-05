# 📱 Configuração do Venom-bot (WhatsApp)

Este guia explica como configurar e usar o Venom-bot para integrar WhatsApp ao sistema de newsletter.

## 🛠️ Instalação

O Venom-bot já está incluído nas dependências do projeto:

```bash
npm install venom-bot
```

## 🚀 Primeira Configuração

### 1. Iniciar o Servidor
```bash
cd backend
npm run dev
```

### 2. QR Code
Quando o servidor iniciar, você verá algo assim no console:

```
🚀 Inicializando Venom-bot...

📱 QR CODE PARA CONECTAR WHATSAPP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
█▀▀▀▀▀█ ▀▀█ █ █▀█▀█  ▀▀▀ █▀▀▀▀▀█
█ ███ █ ▀▀▀▀█▀██▄▄▀█ ▄██ █ ███ █
█ ▀▀▀ █ █▀█▄▀ ▀▄▀▄▀█▄▀▀█ █ ▀▀▀ █
▀▀▀▀▀▀▀ ▀ █ █▄▀ █ ▀ █ █ ▀▀▀▀▀▀▀
██▀▀▀▀▀█▀█ ▀▀▀▀█▀▀▀▀▀▀▀█▀ ▄██▄▀
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Tentativa: 1
⏰ Escaneie o QR Code acima com seu WhatsApp em até 45 segundos
📲 Abra o WhatsApp > Três pontos > Aparelhos conectados > Conectar um aparelho
```

### 3. Escanear QR Code

1. **Abra o WhatsApp** no seu celular
2. **Toque nos três pontos** (menu) no canto superior direito
3. **Selecione "Aparelhos conectados"**
4. **Toque em "Conectar um aparelho"**
5. **Escaneie o QR Code** que aparece no console

### 4. Confirmação
Quando conectado com sucesso, você verá:

```
✅ QR Code lido com sucesso! Aguardando confirmação...
✅ WhatsApp conectado com sucesso!
📱 Pronto para receber e enviar mensagens!
```

## 📂 Arquivos de Sessão

O Venom salva a sessão na pasta `tokens/` para não precisar escanear o QR Code toda vez:

```
backend/
├── tokens/
│   ├── newsletter-session/
│   │   ├── Default/
│   │   └── session.json
```

**⚠️ IMPORTANTE:** Não delete a pasta `tokens/` ou você terá que escanear o QR Code novamente.

## 🔧 Configurações do Venom

### Variáveis de Ambiente

```env
# Nome da sessão (padrão: newsletter-session)
WHATSAPP_SESSION_NAME=newsletter-session

# Modo headless (true para produção, false para desenvolvimento)
NODE_ENV=production
```

### Configurações Avançadas

O Venom está configurado com:

- **multiDevice: true** - Suporte ao WhatsApp Multi-Device
- **headless: true** - Executa sem interface gráfica em produção
- **folderNameToken: 'tokens'** - Pasta para salvar sessões
- **browserArgs** - Argumentos otimizados para servidores

## 📱 Funcionalidades Implementadas

### 1. Envio de Mensagens
```javascript
await whatsappService.sendMessage(phone, message);
```

### 2. Envio de Imagens
```javascript
await whatsappService.sendImage(phone, imageUrl, caption);
```

### 3. Escuta de Mensagens
O sistema automaticamente escuta e responde a:
- `"configurar horario"` - Instruções para alterar horário
- `"HH:MM"` (ex: "08:30") - Altera horário de entrega
- `"cancelar"` - Informações sobre cancelamento
- `"ativar"` - Informações sobre reativação

### 4. Envio em Massa
```javascript
await whatsappService.sendBulkNews(subscribers, news);
```

## 🔄 Reconexão Automática

Se a conexão cair, o sistema tenta:

1. **Detectar desconexão** automaticamente
2. **Tentar reconectar** em envios de newsletter
3. **Reinicializar** se necessário

### Reconexão Manual

Via API:
```bash
POST /api/whatsapp/reconnect
```

Via código:
```javascript
await whatsappService.reconnect();
```

## 📊 Monitoramento

### Status da Conexão
```bash
GET /api/whatsapp/status
```

Retorna:
```json
{
  "whatsapp": {
    "isConnected": true,
    "device": "iPhone de João",
    "battery": 85,
    "sessionName": "newsletter-session"
  }
}
```

### Logs do Sistema

O Venom gera logs detalhados:

```
🔄 Estado da conexão mudou: CONNECTED
📡 Stream mudou: SYNCING
📞 Chamada recebida: 5511999999999
```

## 🚨 Solução de Problemas

### QR Code não aparece
```bash
# Pare o servidor
Ctrl + C

# Delete a sessão
rm -rf backend/tokens/

# Reinicie o servidor
npm run dev
```

### WhatsApp desconecta frequentemente
1. **Verifique conexão com internet**
2. **Certifique-se que o celular está online**
3. **Não use o WhatsApp Web em outros dispositivos**
4. **Evite fazer logout no celular**

### Erro "Browser not found"
```bash
# Instale o Chromium (Ubuntu/Debian)
sudo apt update
sudo apt install chromium-browser

# Ou instale o Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install google-chrome-stable
```

### Sessão inválida
```bash
# Delete tokens e reconecte
rm -rf backend/tokens/
# Reinicie o servidor e escaneie novo QR Code
```

## 📋 Comandos de Teste

### Testar Conexão
```bash
curl http://localhost:3000/api/whatsapp/status
```

### Enviar Mensagem Teste
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Teste do sistema!"}'
```

### Enviar Newsletter Teste
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-test/5511999999999
```

## 🔐 Segurança

### Proteção da Sessão
- **Nunca compartilhe** a pasta `tokens/`
- **Use .gitignore** para excluir tokens do repositório
- **Faça backup** da sessão em produção

### Rate Limiting
O sistema implementa delays entre mensagens:
- **1 segundo** entre mensagens para o mesmo usuário
- **2-3 segundos** entre usuários diferentes
- **Proteção contra spam** automática

## 🌐 Produção

### Configurações para Servidor

```env
NODE_ENV=production
WHATSAPP_SESSION_NAME=newsletter-prod
```

### Docker (Opcional)

```dockerfile
# Instalar dependências do Chrome
RUN apt-get update && apt-get install -y \
    chromium-browser \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Monitoramento

Configure alertas para:
- Desconexões do WhatsApp
- Falhas no envio de mensagens
- Sessões expiradas

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** do console
2. **Teste a conexão** via API
3. **Reconecte** se necessário
4. **Delete tokens** em último caso

O Venom-bot é uma ferramenta poderosa e estável quando configurada corretamente! 🚀