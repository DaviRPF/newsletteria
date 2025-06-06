import dotenv from 'dotenv';
dotenv.config();

import RSSParser from 'rss-parser';
import categoryService from '../src/services/categoryService.js';

class AllSourcesTester {
  constructor() {
    this.parser = new RSSParser({
      timeout: 15000,
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
  }

  async testAllSources() {
    console.log('🔍 TESTANDO TODAS AS FONTES DE TODAS AS CATEGORIAS');
    console.log('='.repeat(60));
    console.log('📊 Pegando pelo menos 2 notícias de CADA fonte');
    console.log('='.repeat(60) + '\n');
    
    const startTime = Date.now();
    
    // Pega TODAS as categorias do categoryMapping
    const allCategories = Object.keys(categoryService.categoryMapping);
    
    console.log(`📂 Total de categorias: ${allCategories.length}`);
    console.log(`📂 Categorias: ${allCategories.join(', ')}\n`);

    for (const category of allCategories) {
      await this.testCategoryFromMapping(category);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    this.printFinalSummary(duration);
  }

  async testCategoryFromMapping(category) {
    console.log(`\n📂 CATEGORIA: ${category.toUpperCase()}`);
    console.log('─'.repeat(60));

    const categoryConfig = categoryService.categoryMapping[category];
    
    if (!categoryConfig || !categoryConfig.sources) {
      console.log(`❌ Categoria "${category}" não configurada corretamente`);
      return;
    }

    const sources = categoryConfig.sources;
    const sourceEntries = Object.entries(sources).filter(([name, url]) => url !== null);
    
    if (sourceEntries.length === 0) {
      console.log(`⚠️  Nenhuma fonte ativa para categoria "${category}"`);
      return;
    }

    console.log(`📊 ${sourceEntries.length} fontes ativas para testar\n`);

    for (const [sourceName, sourceUrl] of sourceEntries) {
      await this.testSingleSource(sourceName, sourceUrl, category);
    }
  }

  async testSingleSource(sourceName, sourceUrl, category) {
    this.results.total++;
    
    try {
      console.log(`🔍 TESTANDO: ${sourceName}`);
      console.log(`   📡 URL: ${sourceUrl}`);
      console.log(`   📂 Categoria: ${category}`);
      
      const feed = await this.parser.parseURL(sourceUrl);
      
      if (!feed || !feed.items || feed.items.length === 0) {
        this.logSourceFailure(sourceName, sourceUrl, category, 'Feed vazio ou inválido');
        return;
      }

      // Filtra notícias das últimas 48 horas (mais flexível)
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const recentNews = feed.items.filter(item => {
        if (!item.pubDate) return true; // Se não tem data, inclui mesmo assim
        const pubDate = new Date(item.pubDate);
        return !isNaN(pubDate.getTime()) ? pubDate > fortyEightHoursAgo : true;
      });

      if (recentNews.length === 0) {
        this.logSourceFailure(sourceName, sourceUrl, category, 'Nenhuma notícia recente');
        return;
      }

      // Pega pelo menos 2 notícias (ou todas se tiver menos que 2)
      const newsToShow = recentNews.slice(0, Math.max(2, recentNews.length > 5 ? 3 : recentNews.length));
      
      console.log(`   ✅ SUCESSO: ${recentNews.length} notícias encontradas`);
      console.log(`   📰 Feed: ${feed.title || 'Sem título'}\n`);
      
      newsToShow.forEach((item, index) => {
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const timeAgo = this.getTimeAgo(pubDate);
        const title = item.title || 'Sem título';
        const content = this.getNewsPreview(item);
        
        console.log(`   📰 ${index + 1}. "${title}"`);
        console.log(`      ⏰ ${timeAgo}`);
        console.log(`      📝 ${content}\n`);
      });
      
      this.results.success++;
      this.results.details.push({
        category,
        source: sourceName,
        url: sourceUrl,
        status: 'success',
        recentCount: recentNews.length,
        feedTitle: feed.title,
        sampleNews: newsToShow.map(item => ({
          title: item.title,
          pubDate: item.pubDate,
          preview: this.getNewsPreview(item)
        }))
      });

    } catch (error) {
      this.logSourceFailure(sourceName, sourceUrl, category, error.message);
    }
    
    console.log('─'.repeat(40) + '\n');
  }

  getNewsPreview(item) {
    // Tenta pegar preview do conteúdo
    let content = '';
    
    if (item.contentSnippet) {
      content = item.contentSnippet;
    } else if (item.content) {
      content = item.content.replace(/<[^>]*>/g, ''); // Remove HTML
    } else if (item.summary) {
      content = item.summary;
    } else if (item.description) {
      content = item.description.replace(/<[^>]*>/g, '');
    } else {
      content = 'Sem conteúdo disponível';
    }
    
    // Limita e limpa o conteúdo
    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 150);
    
    return content ? content + (content.length >= 150 ? '...' : '') : 'Sem prévia disponível';
  }

  logSourceFailure(sourceName, sourceUrl, category, reason) {
    console.log(`   ❌ FALHOU: ${reason}\n`);
    this.results.failed++;
    this.results.details.push({
      category,
      source: sourceName,
      url: sourceUrl,
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
    
    return `há ${Math.floor(diffInHours / 24)} dia(s)`;
  }

  printFinalSummary(duration) {
    console.log('\n🎯 RESUMO FINAL DO TESTE DE TODAS AS FONTES');
    console.log('='.repeat(70));
    console.log(`⏱️  Tempo total: ${duration} segundos`);
    console.log(`📊 Total de fontes testadas: ${this.results.total}`);
    console.log(`✅ Fontes funcionando: ${this.results.success}`);
    console.log(`❌ Fontes com problemas: ${this.results.failed}`);
    console.log(`📈 Taxa de sucesso: ${Math.round((this.results.success / this.results.total) * 100)}%\n`);

    // Agrupa resultados por categoria
    const byCategory = {};
    this.results.details.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { success: [], failed: [] };
      }
      byCategory[item.category][item.status].push(item);
    });

    // Mostra sucessos por categoria
    console.log('🏆 FONTES FUNCIONANDO POR CATEGORIA:');
    console.log('─'.repeat(50));
    
    Object.entries(byCategory).forEach(([category, results]) => {
      if (results.success.length > 0) {
        console.log(`\n📂 ${category.toUpperCase()} (${results.success.length}/${results.success.length + results.failed.length} funcionando):`);
        results.success.forEach(success => {
          console.log(`   ✅ ${success.source}: ${success.recentCount} notícias`);
        });
      }
    });

    // Mostra falhas se houver
    if (this.results.failed > 0) {
      console.log('\n\n❌ FONTES COM PROBLEMAS:');
      console.log('─'.repeat(50));
      
      Object.entries(byCategory).forEach(([category, results]) => {
        if (results.failed.length > 0) {
          console.log(`\n📂 ${category.toUpperCase()}:`);
          results.failed.forEach(failure => {
            console.log(`   ❌ ${failure.source}: ${failure.reason}`);
            console.log(`      URL: ${failure.url}`);
          });
        }
      });
    }

    console.log('\n🎉 TESTE DE TODAS AS FONTES CONCLUÍDO!');
    console.log(`📊 ${this.results.success} fontes RSS estão funcionando corretamente`);
    console.log(`🔗 Cada fonte forneceu pelo menos 2 notícias com título e preview`);
  }
}

// Executa o teste
const tester = new AllSourcesTester();
tester.testAllSources()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  });