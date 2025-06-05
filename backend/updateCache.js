import tempNewsService from './src/services/tempNewsService.js';

console.log('🔄 Forçando atualização do cache...');
await tempNewsService.forceUpdate();
console.log('✅ Cache atualizado!');