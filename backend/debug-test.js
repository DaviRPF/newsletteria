import dotenv from 'dotenv';
dotenv.config();

import dynamicNewsService from './src/services/dynamicNewsService.js';

async function testDebug() {
  console.log('🧪 TESTE DEBUG - SISTEMA DE NOTÍCIAS');
  console.log('=====================================\n');

  const testProfile = {
    profileDescription: "opa eu sou Davi, estou estudando programação, quero ser arquiteto de software, eu também jogo volei, to querendo começar a jogar handball e também gosto de acompanhar a bolsa de valores"
  };

  try {
    console.log('👤 Perfil de teste:', testProfile.profileDescription);
    console.log('\n🔍 Iniciando coleta personalizada...\n');

    const news = await dynamicNewsService.getPersonalizedNews(testProfile);
    
    console.log('\n✅ RESULTADO FINAL:');
    console.log(`📊 Total de notícias: ${news.length}`);
    
    if (news.length > 0) {
      console.log('\n📰 NOTÍCIAS COLETADAS:');
      news.forEach((item, index) => {
        console.log(`${index + 1}. [${item.source}] "${item.title?.substring(0, 60)}..."`);
        console.log(`   📅 ${item.pubDate}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDebug();