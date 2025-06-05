// Teste rápido da funcionalidade sem banco
import dotenv from 'dotenv';
dotenv.config();

import aiService from './src/services/aiService.js';

const testProfile = "Desenvolvedor interessado em tecnologia, programação e inovação";
const testNews = {
  title: "De Auschwitz a Gaza",
  content: "Gaza, um campo de concentração a céu aberto 😢. A situação é dramática: mais da metade da população palestina são crianças..."
};

console.log('🧪 Testando análise personalizada...');
console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

try {
  // Força inicialização da IA
  aiService.initializeAI();
  
  const analysis = await aiService.generatePersonalizedImpact(
    testNews.title,
    testNews.content,
    testProfile
  );
  
  console.log('✅ Análise gerada:');
  console.log(analysis);
} catch (error) {
  console.error('❌ Erro:', error.message);
}