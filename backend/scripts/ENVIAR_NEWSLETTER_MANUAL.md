# 📨 Enviar Newsletter Manualmente

Este diretório contém scripts para enviar a newsletter manualmente para qualquer número, sem precisar esperar o horário agendado ou que a pessoa digite "l".

## 📋 Pré-requisitos

1. **O servidor principal deve estar rodando** (`npm start`)
2. O WhatsApp deve estar conectado
3. O número deve incluir o código do país (55 para Brasil)

## 🚀 Como usar

### Opção 1: Usar o arquivo .bat (Windows - Mais fácil)

1. Dê duplo clique em `enviarNewsletter.bat`
2. Digite o número quando solicitado
3. Ou execute direto no terminal:
   ```
   enviarNewsletter.bat 558481843434
   ```

### Opção 2: Usar o Node.js diretamente

```bash
# Do diretório backend:
node scripts/forceNewsletterDirect.js 558481843434
```

## 📱 Formato do número

- **Sempre inclua o código do país**: 55 para Brasil
- **Sem espaços, hífens ou parênteses**
- **Apenas dígitos**

### Exemplos corretos:
- ✅ `558481843434` (Brasil - PE)
- ✅ `5511999887766` (Brasil - SP)
- ✅ `5521987654321` (Brasil - RJ)

### Exemplos incorretos:
- ❌ `81843434` (falta código do país)
- ❌ `+55 84 98184-3434` (tem formatação)
- ❌ `(84) 98184-3434` (tem formatação)

## 🔧 Como funciona

O script `forceNewsletterDirect.js` acessa diretamente o serviço de distribuição de notícias e força o envio da newsletter personalizada, exatamente como acontece quando o usuário digita "l" no WhatsApp. A newsletter é enviada com imagens e personalização completa.

## ⚠️ Notas importantes

1. **O usuário não precisa estar cadastrado** - Se não estiver, receberá uma newsletter genérica
2. **Respeite limites de envio** - Não abuse do sistema para evitar bloqueios
3. **Newsletter personalizada** - Se o usuário estiver cadastrado com perfil, receberá conteúdo personalizado
4. **Processo assíncrono** - Após executar o script, aguarde alguns segundos para a newsletter ser enviada

## 🐛 Resolução de problemas

### "Erro de conexão recusada"
- Certifique-se de que o servidor está rodando: `npm start`

### "WhatsApp não conectado"
- Verifique se o QR code foi escaneado
- Reinicie o servidor se necessário

### "Número inválido"
- Verifique o formato do número
- Inclua o código do país

## 📊 Logs

Para ver os logs detalhados do envio, verifique o terminal onde o servidor principal está rodando.

## 💡 Dicas

- Use para testar mudanças no sistema sem esperar horários
- Útil para demonstrações ou suporte ao cliente
- Pode ser integrado em outros scripts ou sistemas