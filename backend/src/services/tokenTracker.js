class TokenTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalTokens = 0;
    this.operations = [];
    this.sessionStart = new Date();
  }

  addTokenUsage(operation, promptTokens, responseTokens, details = '') {
    const totalForOperation = promptTokens + responseTokens;
    this.totalTokens += totalForOperation;
    
    this.operations.push({
      operation,
      promptTokens,
      responseTokens,
      total: totalForOperation,
      details,
      timestamp: new Date()
    });

    console.log(`🔥 TOKENS [${operation}]: ${promptTokens} prompt + ${responseTokens} response = ${totalForOperation} total${details ? ` (${details})` : ''}`);
  }

  // Estima tokens baseado no tamanho do texto (aproximação)
  estimateTokens(text) {
    if (!text) return 0;
    // Estimativa: ~4 caracteres por token para português
    return Math.ceil(text.length / 4);
  }

  addEstimatedUsage(operation, promptText, responseText, details = '') {
    const promptTokens = this.estimateTokens(promptText);
    const responseTokens = this.estimateTokens(responseText);
    this.addTokenUsage(operation, promptTokens, responseTokens, details);
  }

  getSessionSummary() {
    const duration = ((new Date() - this.sessionStart) / 1000).toFixed(1);
    
    console.log('\n🏁 ===== RESUMO DE TOKENS DA SESSÃO =====');
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`🔥 Total de tokens gastos: ${this.totalTokens.toLocaleString()}`);
    console.log(`💰 Custo estimado: $${(this.totalTokens * 0.000001).toFixed(6)} USD`);
    console.log(`📊 Operações realizadas: ${this.operations.length}`);
    
    // Agrupa por tipo de operação
    const byOperation = this.operations.reduce((acc, op) => {
      if (!acc[op.operation]) {
        acc[op.operation] = { count: 0, tokens: 0 };
      }
      acc[op.operation].count++;
      acc[op.operation].tokens += op.total;
      return acc;
    }, {});

    console.log('\n📈 Breakdown por operação:');
    Object.entries(byOperation).forEach(([operation, data]) => {
      console.log(`   ${operation}: ${data.count}x = ${data.tokens.toLocaleString()} tokens`);
    });
    
    console.log('==========================================\n');
    
    return {
      totalTokens: this.totalTokens,
      duration: parseFloat(duration),
      operations: this.operations.length,
      breakdown: byOperation
    };
  }

  getCurrentTotal() {
    return this.totalTokens;
  }
}

export default new TokenTracker();