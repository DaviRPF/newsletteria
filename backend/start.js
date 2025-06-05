// Script alternativo para iniciar o servidor
import('./src/server.js').catch(err => {
  console.error('Erro ao iniciar:', err.message);
  console.log('\nTentando solução alternativa...');
  
  // Se falhar, tenta executar com require
  try {
    require('./src/server.js');
  } catch (e) {
    console.error('Erro:', e.message);
    console.log('\nVerifique se as dependências principais estão instaladas.');
  }
});