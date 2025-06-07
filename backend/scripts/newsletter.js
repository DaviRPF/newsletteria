import fetch from 'node-fetch';

// Verificar parâmetros
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('❌ Uso: node newsletter.js <número_telefone>');
  console.error('   Exemplo: node newsletter.js 558481843434');
  process.exit(1);
}

// Validar formato do número
if (!phoneNumber.match(/^\d+$/)) {
  console.error('❌ Número inválido! Use apenas dígitos (ex: 558481843434)');
  process.exit(1);
}

console.log(`\n📱 Enviando newsletter para: ${phoneNumber}`);
console.log('─'.repeat(50));

async function sendNewsletter() {
  try {
    // Usar o endpoint send-test que envia newsletter de teste
    console.log('📤 Enviando newsletter...');
    
    const response = await fetch(`http://localhost:3000/api/whatsapp/send-test/${phoneNumber}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{}'  // Body vazio mas válido
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ ' + result.message);
      console.log('\n💡 Newsletter enviada com sucesso!');
      console.log('📲 Verifique o WhatsApp do número informado');
    } else {
      const errorText = await response.text();
      console.error('❌ Erro:', response.statusText);
      
      try {
        const error = JSON.parse(errorText);
        console.error('   Detalhes:', error.error || error.message);
        
        if (error.error === 'WhatsApp não está conectado') {
          console.log('\n💡 Certifique-se de que o WhatsApp está conectado');
          console.log('   Verifique se o QR Code foi escaneado');
        }
      } catch (e) {
        console.error('   Resposta:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.error('\n💡 O servidor não está rodando!');
    console.error('   Execute primeiro: npm start');
  }
}

// Executar
sendNewsletter();