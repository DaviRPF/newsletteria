import RSSParser from 'rss-parser';
import categoryService from '../src/services/categoryService.js';
import aiService from '../src/services/aiService.js';
import newsDistributionService from '../src/services/newsDistributionService.js';

class CompleteTester {
  constructor() {
    this.parser = new RSSParser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      details: []
    };
    
    // Perfis de teste para sistema otimizado
    this.testProfiles = [
      {
        name: "Desenvolvedor",
        description: "Sou desenvolvedor de software, trabalho com JavaScript e React. Gosto de tecnologia."
      },
      {
        name: "Professor",
        description: "Sou professor de matemática. Me interesso por educação e políticas públicas."
      },
      {
        name: "Fã de Futebol",
        description: "Sou fanático por futebol, torço para o Flamengo. Gosto de esportes em geral."
      }
    ];
  }

  async runCompleteTest() {
    console.log('🧪 TESTE COMPLETO DO SISTEMA');
    console.log('============================\n');
    
    // Pergunta qual teste executar
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    
    switch(testType) {
      case 'sources':
        await this.testAllSources();
        break;
      case 'profiles':
        await this.testOptimizedProfiles();
        break;
      case 'news':
        await this.testNewsCollection();
        break;
      case 'all':
      default:
        await this.testOptimizedProfiles();
        console.log('\n' + '='.repeat(50) + '\n');
        await this.testAllSources();
        break;
    }
  }

  async testOptimizedProfiles() {
    console.log('🧠 TESTANDO SISTEMA OTIMIZADO DE PERFIS');
    console.log('======================================\n');

    for (const profile of this.testProfiles) {
      console.log(`👤 PERFIL: ${profile.name}`);
      console.log(`📝 "${profile.description}"`);
      
      try {
        const interests = await aiService.analyzeUserInterests(profile.description);
        console.log(`🎯 Categorias: ${interests.join(', ')}`);
        
        const distribution = newsDistributionService.calculateNewsDistribution(interests);
        console.log(`📊 Distribuição:`, distribution);
        
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
      }
      
      console.log('');
    }
  }

  async testNewsCollection() {
    console.log('📰 TESTANDO COLETA PERSONALIZADA');
    console.log('===============================\n');

    const devProfile = {
      profileDescription: "Sou desenvolvedor de software, trabalho com JavaScript."
    };

    console.log(`👤 Testando coleta para: Desenvolvedor`);
    
    try {
      const startTime = Date.now();
      const news = await newsDistributionService.getPersonalizedNews(devProfile);
      const endTime = Date.now();
      
      console.log(`⏱️ Tempo: ${Math.round((endTime - startTime) / 1000)}s`);
      console.log(`📊 Total: ${news.length} notícias\n`);
      
      if (news.length > 0) {
        news.forEach((item, index) => {
          console.log(`${index + 1}. [${item.source}] ${item.title?.substring(0, 50)}...`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }

  async testAllSources() {
    console.log('🔍 TESTANDO FONTES RSS');
    console.log('=====================\n');
    
    const startTime = Date.now();
    
    // Pega todas as categorias do categoryService
    const allCategories = [
      'esporte', 'futebol', 'tecnologia', 'economia', 'politica', 
      'entretenimento', 'seguranca', 'saude', 'educacao', 'meio-ambiente',
      'cultura', 'infraestrutura', 'justica', 'religiao'
    ];

    for (const category of allCategories) {
      await this.testCategory(category);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    this.printSummary(duration);
  }

  async testCategory(category) {
    console.log(`\n📂 CATEGORIA: ${category.toUpperCase()}`);
    console.log('─'.repeat(50));

    const sources = categoryService.getKnownBrazilianSources(category);
    
    if (sources.length === 0) {
      console.log(`❌ Nenhuma fonte configurada para categoria "${category}"`);
      return;
    }

    console.log(`📊 Testando ${sources.length} fontes...\n`);

    for (const source of sources) {
      await this.testSource(source, category);
    }
  }

  async testSource(source, category) {
    this.results.total++;
    
    try {
      console.log(`🔍 Testando: ${source.name}`);
      console.log(`   URL: ${source.url}`);
      
      const feed = await this.parser.parseURL(source.url);
      
      if (!feed || !feed.items || feed.items.length === 0) {
        this.logFailure(source, category, 'Feed vazio ou inválido');
        return;
      }

      // Filtra notícias das últimas 24 horas
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentNews = feed.items.filter(item => {
        if (!item.pubDate) return false;
        const pubDate = new Date(item.pubDate);
        return !isNaN(pubDate.getTime()) && pubDate > twentyFourHoursAgo;
      });

      if (recentNews.length === 0) {
        this.logFailure(source, category, 'Nenhuma notícia das últimas 24h');
        return;
      }

      // Pega as primeiras 2 notícias recentes
      const newsToShow = recentNews.slice(0, 2);
      
      console.log(`   ✅ SUCESSO: ${recentNews.length} notícias das últimas 24h`);
      console.log(`   📰 Feed: ${feed.title || 'Sem título'}`);
      
      newsToShow.forEach((item, index) => {
        const pubDate = new Date(item.pubDate);
        const timeAgo = this.getTimeAgo(pubDate);
        console.log(`   ${index + 1}. "${item.title?.substring(0, 60)}..." (${timeAgo})`);
      });
      
      this.results.success++;
      this.results.details.push({
        category,
        source: source.name,
        url: source.url,
        status: 'success',
        recentCount: recentNews.length,
        feedTitle: feed.title
      });

    } catch (error) {
      this.logFailure(source, category, error.message);
    }
    
    console.log(''); // Linha em branco
  }

  logFailure(source, category, reason) {
    console.log(`   ❌ FALHOU: ${reason}`);
    this.results.failed++;
    this.results.details.push({
      category,
      source: source.name,
      url: source.url,
      status: 'failed',
      reason: reason
    });
  }

  getTimeAgo(pubDate) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - pubDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours}h`;
    
    return `há ${Math.floor(diffInHours / 24)} dias`;
  }

  printSummary(duration) {
    console.log('\n🎯 RESUMO FINAL');
    console.log('=====================================');
    console.log(`⏱️  Tempo total: ${duration} segundos`);
    console.log(`📊 Total de fontes testadas: ${this.results.total}`);
    console.log(`✅ Fontes funcionando: ${this.results.success}`);
    console.log(`❌ Fontes com problemas: ${this.results.failed}`);
    console.log(`📈 Taxa de sucesso: ${Math.round((this.results.success / this.results.total) * 100)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ FONTES COM PROBLEMAS:');
      console.log('─'.repeat(50));
      
      const failedByCategory = {};
      this.results.details
        .filter(item => item.status === 'failed')
        .forEach(item => {
          if (!failedByCategory[item.category]) {
            failedByCategory[item.category] = [];
          }
          failedByCategory[item.category].push(item);
        });

      for (const [category, failures] of Object.entries(failedByCategory)) {
        console.log(`\n📂 ${category.toUpperCase()}:`);
        failures.forEach(failure => {
          console.log(`   • ${failure.source}: ${failure.reason}`);
          console.log(`     URL: ${failure.url}`);
        });
      }
    }

    console.log('\n🏆 FONTES FUNCIONANDO PERFEITAMENTE:');
    console.log('─'.repeat(50));
    
    const successByCategory = {};
    this.results.details
      .filter(item => item.status === 'success')
      .forEach(item => {
        if (!successByCategory[item.category]) {
          successByCategory[item.category] = [];
        }
        successByCategory[item.category].push(item);
      });

    for (const [category, successes] of Object.entries(successByCategory)) {
      console.log(`\n📂 ${category.toUpperCase()} (${successes.length} fontes):`);
      successes.forEach(success => {
        console.log(`   ✅ ${success.source}: ${success.recentCount} notícias recentes`);
      });
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');
  }
}

// Executa o teste se for chamado diretamente
if (process.argv[1].endsWith('testAllSources.js')) {
  const tester = new CompleteTester();
  tester.runCompleteTest()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      console.log('\n💡 COMO USAR:');
      console.log('npm run test-sources           # Testa tudo');
      console.log('npm run test-sources profiles  # Só perfis');
      console.log('npm run test-sources sources   # Só fontes RSS');
      console.log('npm run test-sources news      # Só coleta de notícias');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

export default CompleteTester;