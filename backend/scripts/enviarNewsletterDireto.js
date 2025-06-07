import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Configurar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Verificar parâmetros
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('❌ Uso: node enviarNewsletterDireto.js <número_telefone>');
  console.error('   Exemplo: node enviarNewsletterDireto.js 558481843434');
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
    // Passo 1: Adicionar como desenvolvedor via API
    console.log('🔧 Configurando permissões...');
    
    // Obter número de um desenvolvedor existente
    const devNumbers = process.env.DEVELOPER_NUMBERS?.split(',') || [];
    const adminNumber = devNumbers[0] || '558481843434';
    
    // Simular comando "dev add" 
    const addDevResponse = await fetch('http://localhost:3000/api/whatsapp/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: adminNumber,
        message: `dev add ${phoneNumber}`
      })
    });
    
    if (!addDevResponse.ok) {
      console.error('⚠️  Não foi possível adicionar como desenvolvedor');
    } else {
      console.log('✅ Permissões configuradas');
    }
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Passo 2: Enviar comando "l" do próprio número
    console.log('\n📤 Enviando comando para gerar newsletter...');
    
    const newsletterResponse = await fetch('http://localhost:3000/api/whatsapp/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message: 'l'
      })
    });
    
    if (newsletterResponse.ok) {
      console.log('✅ Comando enviado com sucesso!');
      console.log('\n💡 A newsletter está sendo gerada...');
      console.log('📲 Aguarde alguns segundos e verifique o WhatsApp');
      console.log('\n📌 Nota: O número foi adicionado temporariamente como desenvolvedor');
      console.log('   Para remover: dev remove ' + phoneNumber);
    } else {
      const error = await newsletterResponse.text();
      console.error('❌ Erro ao enviar comando:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.error('\n💡 O servidor não está rodando!');
      console.error('   Execute primeiro: npm start');
    }
  }
}

// Executar
sendNewsletter();