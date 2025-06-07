import sourceDiscoveryService from './sourceDiscoveryService.js';

class CategoryService {
  constructor() {
    // Mapeia interesses do usuário para URLs específicas
    this.categoryMapping = {
      'esporte': {
        keywords: ['esporte', 'futebol', 'basquete', 'vôlei', 'tênis', 'atletismo', 'copa', 'campeonato', 'jogos', 'time', 'atleta'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml'
        }
      },
      'futebol': {
        keywords: ['futebol', 'football', 'brasileiro', 'série a', 'libertadores', 'copa do brasil', 'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'santos', 'grêmio', 'internacional', 'seleção', 'cbf'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml'
        }
      },
      'volei': {
        keywords: ['vôlei', 'volei', 'voleibol', 'volleyball', 'superliga', 'liga das nações', 'seleção brasileira vôlei', 'cbv'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml'
        }
      },
      'handebol': {
        keywords: ['handebol', 'handball', 'seleção brasileira handebol', 'liga handebol', 'mundial handebol'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml'
        }
      },
      'rugby': {
        keywords: ['rugby', 'rugby sevens', 'seleção brasileira rugby', 'world rugby', 'rugbi'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml'
        }
      },
      'futsal': {
        keywords: ['futsal', 'liga futsal', 'seleção brasileira futsal', 'mundial futsal', 'copa do mundo futsal'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml'
        }
      },
      'volei-praia': {
        keywords: ['vôlei de praia', 'volei de praia', 'beach volleyball', 'circuito mundial vôlei praia', 'cbv praia'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml'
        }
      },
      'formula1': {
        keywords: ['formula 1', 'f1', 'formula um', 'grande prêmio', 'gp', 'verstappen', 'hamilton', 'ferrari', 'mercedes', 'red bull', 'mclaren', 'aston martin', 'williams', 'alpine', 'alfa romeo', 'haas', 'alphatauri', 'senna', 'piquet', 'massa', 'barrichello', 'interlagos', 'monaco', 'silverstone', 'spa', 'monza', 'suzuka', 'fórmula 1', 'automobilismo', 'corrida', 'piloto'],
        sources: {
          'ESPN Brasil': 'https://www.espn.com.br/rss/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml',
          'UOL Esporte': 'https://esporte.uol.com.br/rss.xml'
        }
      },
      'tecnologia': {
        keywords: ['tecnologia', 'tech', 'programação', 'software', 'hardware', 'inteligência artificial', 'ia', 'computador', 'internet', 'digital', 'inovação'],
        sources: {
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Olhar Digital': 'https://olhardigital.com.br/feed/',
          'Tecnoblog': 'https://tecnoblog.net/feed/'
        }
      },
      'economia': {
        keywords: ['economia', 'financeiro', 'mercado', 'pib', 'empresas', 'negócios', 'bancário', 'setor', 'indústria'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/economia/feed.xml'
        }
      },
      'investimentos': {
        keywords: ['investimento', 'bolsa', 'ações', 'fundos', 'renda fixa', 'cdb', 'tesouro', 'dólar', 'bitcoin', 'criptomoeda', 'bovespa', 'b3', 'dividendos', 'carteira', 'trader', 'análise técnica', 'mercado financeiro'],
        sources: {
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Exame Invest': 'https://exame.com/invest/feed/',
          'Money Times': 'https://www.moneytimes.com.br/feed/'
        }
      },
      'saude': {
        keywords: ['saúde', 'medicina', 'médico', 'hospital', 'tratamento', 'doença', 'vacina', 'covid', 'pandemia', 'sus'],
        sources: {
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml',
          'Poder360': 'https://www.poder360.com.br/feed/'
        }
      },
      'educacao': {
        keywords: ['educação', 'ensino', 'escola', 'universidade', 'professor', 'estudante', 'mec', 'enem', 'vestibular'],
        sources: {
          'Folha Educação': 'https://feeds.folha.uol.com.br/educacao/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/educacao/feed.xml',
          'Poder360': 'https://www.poder360.com.br/feed/'
        }
      },
      'politica': {
        keywords: ['política', 'governo', 'presidente', 'ministro', 'congresso', 'senado', 'deputado', 'eleição', 'lula', 'bolsonaro'],
        sources: {
          'Folha Poder': 'https://feeds.folha.uol.com.br/poder/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/politica/feed.xml',
          'Poder360': 'https://www.poder360.com.br/feed/'
        }
      },
      'internacional': {
        keywords: ['internacional', 'mundo', 'global', 'países', 'exterior', 'diplomacia', 'guerra', 'eua', 'europa', 'china'],
        sources: {
          'Folha Mundo': 'https://feeds.folha.uol.com.br/mundo/rss091.xml',
          'Opera Mundi': 'https://operamundi.uol.com.br/rss',
          'InfoMoney': 'https://www.infomoney.com.br/feed/'
        }
      },
      'cultura': {
        keywords: ['cultura', 'arte', 'música', 'cinema', 'teatro', 'livro', 'literatura', 'festival', 'show', 'museu', 'exposição', 'artista'],
        sources: {
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/cultura/feed.xml',
          'Rolling Stone': 'https://rollingstone.uol.com.br/feed/'
        }
      },
      'entretenimento': {
        keywords: ['entretenimento', 'celebridade', 'famoso', 'novela', 'série', 'filme', 'show', 'espetáculo', 'reality', 'tv', 'streaming'],
        sources: {
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',
          'Rolling Stone': 'https://rollingstone.uol.com.br/feed/',
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/'
        }
      },
      'seguranca': {
        keywords: ['segurança', 'polícia', 'crime', 'violência', 'assalto', 'roubo', 'homicídio', 'operação', 'prisão', 'bandido', 'criminoso', 'segurança pública'],
        sources: {
          'Folha Cotidiano': 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml',
          'Conjur': 'https://www.conjur.com.br/rss.xml'
        }
      },
      'meio-ambiente': {
        keywords: ['meio ambiente', 'ambiental', 'natureza', 'sustentabilidade', 'ecologia', 'clima', 'aquecimento global', 'desmatamento', 'poluição', 'reciclagem', 'floresta', 'amazônia'],
        sources: {
          'Folha Ambiente': 'https://feeds.folha.uol.com.br/ambiente/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml',
          'Poder360': 'https://www.poder360.com.br/feed/'
        }
      },
      'infraestrutura': {
        keywords: ['infraestrutura', 'transporte', 'mobilidade', 'trânsito', 'metrô', 'ônibus', 'rodovia', 'estrada', 'obra', 'construção', 'saneamento', 'energia'],
        sources: {
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/economia/feed.xml',
          'Poder360': 'https://www.poder360.com.br/feed/'
        }
      },
      'justica': {
        keywords: ['justiça', 'tribunal', 'juiz', 'promotor', 'advogado', 'julgamento', 'sentença', 'processo', 'stf', 'stj', 'direito', 'lei'],
        sources: {
          'Folha Poder': 'https://feeds.folha.uol.com.br/poder/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml',
          'Conjur': 'https://www.conjur.com.br/rss.xml'
        }
      },
      'religiao': {
        keywords: ['religião', 'igreja', 'fé', 'deus', 'pastor', 'padre', 'evangélico', 'católico', 'cristão', 'missa', 'culto', 'templo', 'bíblia'],
        sources: {
          'Gospel Mais': 'https://noticias.gospelmais.com.br/feed',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml',
          'CNBB': 'https://www.cnbb.org.br/feed/'
        }
      },
      // CATEGORIA PROFISSÃO com 60 subcategorias
      'vendas-comercio': {
        keywords: ['vendas', 'comércio', 'varejo', 'atacado', 'loja', 'vendedor', 'comerciante', 'shopping', 'mercado', 'consumidor'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
          'InfoMoney': 'https://www.infomoney.com.br/feed/'
        }
      },
      'administracao': {
        keywords: ['administração', 'gestão', 'gerenciamento', 'administrador', 'empresa', 'negócios', 'planejamento', 'organização'],
        sources: {
          'Exame': 'https://exame.com/feed/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'servicos-limpeza': {
        keywords: ['limpeza', 'faxina', 'higienização', 'zeladoria', 'conservação', 'manutenção predial', 'terceirização'],
        sources: {
          'G1 Brasil': 'https://g1.globo.com/rss/g1/brasil/',
          'Folha Cotidiano': 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml'
        }
      },
      'seguranca-privada': {
        keywords: ['segurança privada', 'vigilante', 'porteiro', 'segurança patrimonial', 'monitoramento', 'vigilância'],
        sources: {
          'G1 Brasil': 'https://g1.globo.com/rss/g1/brasil/',
          'Folha Cotidiano': 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml'
        }
      },
      'transporte': {
        keywords: ['transporte', 'logística', 'frete', 'motorista', 'caminhoneiro', 'uber', 'taxi', 'entrega', 'modal'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml'
        }
      },
      'operacoes-financeiras': {
        keywords: ['operações financeiras', 'banco', 'financeiro', 'crédito', 'empréstimo', 'financiamento', 'caixa'],
        sources: {
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Exame': 'https://exame.com/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'construcao-civil': {
        keywords: ['construção civil', 'obra', 'engenharia civil', 'pedreiro', 'construção', 'edificação', 'reforma'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
          'InfoMoney': 'https://www.infomoney.com.br/feed/'
        }
      },
      'gastronomia': {
        keywords: ['gastronomia', 'culinária', 'restaurante', 'chef', 'cozinha', 'alimentação', 'bar', 'buffet'],
        sources: {
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/',
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'educacao-profissional': {
        keywords: ['educação', 'ensino', 'professor', 'escola', 'universidade', 'pedagogia', 'didática', 'aprendizagem'],
        sources: {
          'G1 Educação': 'https://g1.globo.com/rss/g1/educacao/',
          'Folha Educação': 'https://feeds.folha.uol.com.br/educacao/rss091.xml',
          'Agência Brasil Educação': 'http://agenciabrasil.ebc.com.br/rss/educacao/feed.xml'
        }
      },
      'portaria-recepcao': {
        keywords: ['portaria', 'recepção', 'atendimento', 'porteiro', 'recepcionista', 'concierge', 'hospitalidade'],
        sources: {
          'G1 Brasil': 'https://g1.globo.com/rss/g1/brasil/',
          'Folha Cotidiano': 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml',
          'UOL': 'https://rss.uol.com.br/feed/noticias.xml'
        }
      },
      'atendimento-cliente': {
        keywords: ['atendimento ao cliente', 'call center', 'sac', 'relacionamento', 'televendas', 'suporte'],
        sources: {
          'Exame': 'https://exame.com/feed/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'enfermagem': {
        keywords: ['enfermagem', 'enfermeiro', 'técnico em enfermagem', 'saúde', 'hospital', 'cuidados', 'paciente'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'medicina': {
        keywords: ['medicina', 'médico', 'saúde', 'hospital', 'diagnóstico', 'tratamento', 'cirurgia', 'clínica'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'tecnologia-informacao': {
        keywords: ['tecnologia da informação', 'ti', 'programação', 'desenvolvedor', 'software', 'sistemas', 'informática'],
        sources: {
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Olhar Digital': 'https://olhardigital.com.br/feed/',
          'Tecnoblog': 'https://tecnoblog.net/feed/'
        }
      },
      'agricultura': {
        keywords: ['agricultura', 'agronegócio', 'fazenda', 'plantação', 'colheita', 'agricultor', 'rural', 'campo'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
          'InfoMoney': 'https://www.infomoney.com.br/feed/'
        }
      },
      'servico-publico': {
        keywords: ['serviço público', 'concurso público', 'servidor público', 'governo', 'prefeitura', 'estado', 'federal'],
        sources: {
          'G1 Política': 'https://g1.globo.com/rss/g1/politica/',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml',
          'Folha Poder': 'https://feeds.folha.uol.com.br/poder/rss091.xml'
        }
      },
      'manutencao-reparos': {
        keywords: ['manutenção', 'reparo', 'conserto', 'técnico', 'elétrica', 'hidráulica', 'mecânica', 'assistência'],
        sources: {
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'contabilidade': {
        keywords: ['contabilidade', 'contador', 'contábil', 'fiscal', 'tributário', 'balanço', 'auditoria', 'crc'],
        sources: {
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Exame': 'https://exame.com/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'direito': {
        keywords: ['direito', 'advogado', 'advocacia', 'jurídico', 'tribunal', 'justiça', 'lei', 'processo', 'oab'],
        sources: {
          'Conjur': 'https://www.conjur.com.br/rss.xml',
          'G1 Política': 'https://g1.globo.com/rss/g1/politica/',
          'Folha Poder': 'https://feeds.folha.uol.com.br/poder/rss091.xml'
        }
      },
      'operacoes-industriais': {
        keywords: ['operações industriais', 'indústria', 'produção', 'manufatura', 'operador', 'fabrica', 'linha de produção'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml'
        }
      },
      'odontologia': {
        keywords: ['odontologia', 'dentista', 'dental', 'ortodontia', 'implante', 'prótese', 'cfo', 'consultório'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'farmacia': {
        keywords: ['farmácia', 'farmacêutico', 'medicamento', 'drogaria', 'crf', 'farmacologia', 'manipulação'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'fisioterapia': {
        keywords: ['fisioterapia', 'fisioterapeuta', 'reabilitação', 'crefito', 'terapia', 'movimento', 'exercício'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'psicologia': {
        keywords: ['psicologia', 'psicólogo', 'terapia', 'crp', 'saúde mental', 'psicoterapia', 'consultório'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'engenharia': {
        keywords: ['engenharia', 'engenheiro', 'crea', 'projeto', 'obra', 'construção', 'técnico', 'industrial'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml'
        }
      },
      'servicos-bancarios': {
        keywords: ['serviços bancários', 'bancário', 'banco', 'agência', 'caixa', 'gerente', 'conta', 'crédito'],
        sources: {
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Exame': 'https://exame.com/feed/'
        }
      },
      'imobiliario': {
        keywords: ['imobiliário', 'corretor', 'creci', 'imóvel', 'venda', 'aluguel', 'construtora', 'incorporadora'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml'
        }
      },
      'estetica-beleza': {
        keywords: ['estética', 'beleza', 'esteticista', 'cosmética', 'spa', 'salão', 'cuidados', 'tratamento'],
        sources: {
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/',
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/'
        }
      },
      'costura-confeccao': {
        keywords: ['costura', 'confecção', 'moda', 'costureira', 'alfaiate', 'têxtil', 'roupa', 'fashion'],
        sources: {
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml'
        }
      },
      'pintura-acabamento': {
        keywords: ['pintura', 'acabamento', 'pintor', 'tinta', 'verniz', 'decoração', 'parede', 'reforma'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml',
          'G1 Brasil': 'https://g1.globo.com/rss/g1/brasil/'
        }
      },
      'logistica-entregas': {
        keywords: ['logística', 'entrega', 'transporte', 'distribuição', 'armazém', 'estoque', 'supply chain'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml'
        }
      },
      'eletronica-telecomunicacoes': {
        keywords: ['eletrônica', 'telecomunicações', 'técnico eletrônico', 'telefonia', 'equipamento', 'circuito'],
        sources: {
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Olhar Digital': 'https://olhardigital.com.br/feed/',
          'Tecnoblog': 'https://tecnoblog.net/feed/'
        }
      },
      'turismo-hotelaria': {
        keywords: ['turismo', 'hotelaria', 'hotel', 'pousada', 'resort', 'hospitalidade', 'viagem', 'guia turístico'],
        sources: {
          'G1 Turismo': 'https://g1.globo.com/rss/g1/turismo-e-viagem/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Turismo': 'https://feeds.folha.uol.com.br/turismo/rss091.xml'
        }
      },
      'marketing-digital': {
        keywords: ['marketing digital', 'marketing', 'publicidade', 'propaganda', 'digital', 'redes sociais', 'seo'],
        sources: {
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Exame': 'https://exame.com/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'recursos-humanos': {
        keywords: ['recursos humanos', 'rh', 'gestão de pessoas', 'recrutamento', 'seleção', 'treinamento', 'desenvolvimento'],
        sources: {
          'Exame': 'https://exame.com/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/'
        }
      },
      'arquitetura-design': {
        keywords: ['arquitetura', 'design', 'arquiteto', 'designer', 'cau', 'projeto', 'interiores', 'urbanismo'],
        sources: {
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml'
        }
      },
      'jornalismo-comunicacao': {
        keywords: ['jornalismo', 'comunicação', 'jornalista', 'imprensa', 'mídia', 'redação', 'notícia', 'reporter'],
        sources: {
          'G1 Brasil': 'https://g1.globo.com/rss/g1/brasil/',
          'Folha Poder': 'https://feeds.folha.uol.com.br/poder/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml'
        }
      },
      'veterinaria': {
        keywords: ['veterinária', 'veterinário', 'animal', 'pet', 'clínica veterinária', 'crmv', 'saúde animal'],
        sources: {
          'G1 Natureza': 'https://g1.globo.com/rss/g1/natureza/',
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Ciência': 'https://feeds.folha.uol.com.br/ciencia/rss091.xml'
        }
      },
      'nutricao': {
        keywords: ['nutrição', 'nutricionista', 'alimentação', 'dieta', 'crn', 'saúde nutricional', 'consultório'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'consultoria': {
        keywords: ['consultoria', 'consultor', 'assessoria', 'consultoria empresarial', 'estratégia', 'negócios'],
        sources: {
          'Exame': 'https://exame.com/feed/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'artes-entretenimento': {
        keywords: ['artes', 'entretenimento', 'artista', 'cultura', 'espetáculo', 'teatro', 'dança', 'música'],
        sources: {
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/',
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',
          'Agência Brasil Cultura': 'http://agenciabrasil.ebc.com.br/rss/cultura/feed.xml'
        }
      },
      'esportes-educacao-fisica': {
        keywords: ['esportes', 'educação física', 'professor de educação física', 'cref', 'academia', 'personal'],
        sources: {
          'G1 Esportes': 'https://g1.globo.com/rss/g1/esportes/',
          'Folha Esporte': 'https://feeds.folha.uol.com.br/esporte/rss091.xml',
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/'
        }
      },
      'fotografia-audiovisual': {
        keywords: ['fotografia', 'audiovisual', 'fotógrafo', 'cinegrafista', 'produção', 'cinema', 'vídeo'],
        sources: {
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/',
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/'
        }
      },
      'musica-producao': {
        keywords: ['música', 'produção musical', 'músico', 'estúdio', 'gravação', 'som', 'áudio', 'compositor'],
        sources: {
          'G1 Pop & Arte': 'https://g1.globo.com/rss/g1/pop-arte/',
          'Rolling Stone': 'https://rollingstone.uol.com.br/feed/',
          'Folha Ilustrada': 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml'
        }
      },
      'terapias-alternativas': {
        keywords: ['terapias alternativas', 'acupuntura', 'massagem', 'reiki', 'homeopatia', 'naturoterapia'],
        sources: {
          'G1 Saúde': 'https://g1.globo.com/rss/g1/bemestar/',
          'Folha Saúde': 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml',
          'Agência Brasil Saúde': 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml'
        }
      },
      'servicos-domesticos': {
        keywords: ['serviços domésticos', 'doméstica', 'empregada', 'cuidadora', 'babá', 'diarista', 'trabalho doméstico'],
        sources: {
          'G1 Brasil': 'https://g1.globo.com/rss/g1/brasil/',
          'Folha Cotidiano': 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'pecuaria-zootecnia': {
        keywords: ['pecuária', 'zootecnia', 'gado', 'bovino', 'suíno', 'avicultura', 'criação', 'animal'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'G1 Natureza': 'https://g1.globo.com/rss/g1/natureza/'
        }
      },
      'mineracao': {
        keywords: ['mineração', 'minério', 'extração', 'mina', 'geologia', 'engenharia de minas', 'vale'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Folha Mercado': 'https://feeds.folha.uol.com.br/mercado/rss091.xml'
        }
      },
      'petroleo-gas': {
        keywords: ['petróleo', 'gás', 'offshore', 'refinaria', 'petrobras', 'energia', 'combustível'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Exame': 'https://exame.com/feed/'
        }
      },
      'energia-renovavel': {
        keywords: ['energia renovável', 'solar', 'eólica', 'sustentabilidade', 'energia limpa', 'biomassa'],
        sources: {
          'G1 Ciência': 'https://g1.globo.com/rss/g1/ciencia-e-saude/',
          'G1 Natureza': 'https://g1.globo.com/rss/g1/natureza/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/'
        }
      },
      'meio-ambiente-profissional': {
        keywords: ['meio ambiente', 'ambiental', 'sustentabilidade', 'ecologia', 'licenciamento', 'gestão ambiental'],
        sources: {
          'G1 Natureza': 'https://g1.globo.com/rss/g1/natureza/',
          'Folha Ambiente': 'https://feeds.folha.uol.com.br/ambiente/rss091.xml',
          'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml'
        }
      },
      'seguro-previdencia': {
        keywords: ['seguro', 'previdência', 'aposentadoria', 'pensão', 'inss', 'corretor de seguros'],
        sources: {
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Exame': 'https://exame.com/feed/'
        }
      },
      'cooperativismo': {
        keywords: ['cooperativismo', 'cooperativa', 'associativismo', 'ocb', 'economia solidária'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Agência Brasil Economia': 'http://agenciabrasil.ebc.com.br/rss/economia/feed.xml'
        }
      },
      'comercio-exterior': {
        keywords: ['comércio exterior', 'exportação', 'importação', 'alfândega', 'internacional', 'trading'],
        sources: {
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'Folha Mundo': 'https://feeds.folha.uol.com.br/mundo/rss091.xml'
        }
      },
      'pesquisa-desenvolvimento': {
        keywords: ['pesquisa', 'desenvolvimento', 'p&d', 'inovação', 'ciência', 'tecnologia', 'cnpq'],
        sources: {
          'G1 Ciência': 'https://g1.globo.com/rss/g1/ciencia-e-saude/',
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Folha Ciência': 'https://feeds.folha.uol.com.br/ciencia/rss091.xml'
        }
      },
      'qualidade-auditoria': {
        keywords: ['qualidade', 'auditoria', 'iso', 'certificação', 'normas', 'gestão da qualidade'],
        sources: {
          'Exame': 'https://exame.com/feed/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/'
        }
      },
      'traducao-interpretacao': {
        keywords: ['tradução', 'interpretação', 'tradutor', 'intérprete', 'idioma', 'língua', 'sintra'],
        sources: {
          'G1 Educação': 'https://g1.globo.com/rss/g1/educacao/',
          'G1 Mundo': 'https://g1.globo.com/rss/g1/mundo/',
          'Folha Mundo': 'https://feeds.folha.uol.com.br/mundo/rss091.xml'
        }
      },
      'gestao-projetos': {
        keywords: ['gestão de projetos', 'gerenciamento', 'pmp', 'pmi', 'scrum', 'agile', 'project manager'],
        sources: {
          'Exame': 'https://exame.com/feed/',
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'InfoMoney': 'https://www.infomoney.com.br/feed/'
        }
      },
      'analise-dados': {
        keywords: ['análise de dados', 'big data', 'data science', 'business intelligence', 'analytics', 'cientista de dados'],
        sources: {
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'Olhar Digital': 'https://olhardigital.com.br/feed/',
          'Tecnoblog': 'https://tecnoblog.net/feed/'
        }
      },
      'ecommerce': {
        keywords: ['e-commerce', 'comércio eletrônico', 'loja virtual', 'marketplace', 'vendas online', 'digital'],
        sources: {
          'G1 Tecnologia': 'https://g1.globo.com/rss/g1/tecnologia/',
          'G1 Economia': 'https://g1.globo.com/rss/g1/economia/',
          'Exame': 'https://exame.com/feed/'
        }
      }
    };

    // URLs gerais (sempre incluir)
    this.generalSources = {
      'UOL': 'https://rss.uol.com.br/feed/noticias.xml',
      'Agência Brasil': 'http://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
      'Opera Mundi': 'https://operamundi.uol.com.br/rss'
    };
  }

  // Analisa o perfil do usuário e identifica categorias de interesse
  analyzeUserProfile(profileDescription) {
    if (!profileDescription || profileDescription.trim().length === 0) {
      return [];
    }

    const profile = profileDescription.toLowerCase();
    const detectedCategories = [];

    for (const [category, config] of Object.entries(this.categoryMapping)) {
      const hasKeyword = config.keywords.some(keyword => profile.includes(keyword));
      if (hasKeyword) {
        detectedCategories.push(category);
      }
    }

    console.log(`🎯 Categorias detectadas no perfil: ${detectedCategories.join(', ') || 'nenhuma'}`);
    return detectedCategories;
  }

  // Gera lista de fontes personalizadas baseada no perfil (COM DESCOBERTA AUTOMÁTICA)
  async getPersonalizedSources(userCategories, useAutoDiscovery = true) {
    const sources = [];

    // SEMPRE inclui fontes gerais (2-3 notícias)
    console.log('📰 Adicionando fontes GERAIS...');
    for (const [sourceName, url] of Object.entries(this.generalSources)) {
      sources.push({
        name: sourceName,
        url: url,
        type: 'geral',
        weight: 1 // Peso normal
      });
    }

    if (userCategories.length > 0) {
      if (useAutoDiscovery) {
        // NOVO: Descoberta automática de fontes
        console.log(`🔍 DESCOBRINDO FONTES AUTOMATICAMENTE para: ${userCategories.join(', ')}`);
        
        try {
          const discoveredSources = await sourceDiscoveryService.discoverSources(userCategories, 8);
          
          for (const discoveredSource of discoveredSources) {
            sources.push({
              name: discoveredSource.name,
              url: discoveredSource.url,
              type: discoveredSource.type,
              weight: discoveredSource.weight || 3, // Peso alto para fontes descobertas
              discovered: true
            });
          }
          
          console.log(`🎯 ${discoveredSources.length} fontes descobertas automaticamente!`);
          
          // Se não encontrou fontes, usa conhecidas como fallback
          if (discoveredSources.length === 0) {
            console.log('🔄 Nenhuma fonte descoberta, usando fontes conhecidas...');
            for (const category of userCategories) {
              const knownSources = this.getKnownBrazilianSources(category);
              for (const knownSource of knownSources) {
                sources.push({
                  name: knownSource.name,
                  url: knownSource.url,
                  type: category,
                  weight: 3,
                  fallback: true
                });
              }
            }
          }
        } catch (error) {
          console.error('❌ Erro na descoberta automática:', error.message);
          console.log('🔄 Usando fontes fixas + conhecidas como fallback...');
          
          // Adiciona fontes conhecidas do Brasil como fallback
          for (const category of userCategories) {
            const knownSources = this.getKnownBrazilianSources(category);
            for (const knownSource of knownSources) {
              sources.push({
                name: knownSource.name,
                url: knownSource.url,
                type: category,
                weight: 3,
                fallback: true
              });
            }
          }
          
          useAutoDiscovery = false; // Fallback para modo fixo
        }
      }
      
      if (!useAutoDiscovery) {
        // Modo tradicional com fontes fixas
        console.log(`📊 Adicionando fontes FIXAS para: ${userCategories.join(', ')}`);
        
        for (const category of userCategories) {
          const categoryConfig = this.categoryMapping[category];
          if (categoryConfig) {
            for (const [sourceName, url] of Object.entries(categoryConfig.sources)) {
              if (url) { // Só adiciona se tem URL específica
                sources.push({
                  name: sourceName,
                  url: url,
                  type: category,
                  weight: 2 // Peso maior para interesse específico
                });
              }
            }
          }
        }
      }
    }

    // Remove duplicatas (mantém o de maior peso)
    const uniqueSources = [];
    const seenUrls = new Set();

    sources.sort((a, b) => b.weight - a.weight); // Prioriza peso maior

    for (const source of sources) {
      if (!seenUrls.has(source.url)) {
        uniqueSources.push(source);
        seenUrls.add(source.url);
      }
    }

    console.log(`✅ ${uniqueSources.length} fontes selecionadas:`);
    uniqueSources.forEach(source => {
      const discoveryTag = source.discovered ? ' 🔍' : '';
      console.log(`   ${source.name} (${source.type}) - peso ${source.weight}${discoveryTag}`);
    });

    return uniqueSources;
  }

  // Calcula distribuição de notícias por tipo
  calculateNewsDistribution(userCategories) {
    const totalNews = 6;
    
    if (userCategories.length === 0) {
      // Sem preferências: todas gerais
      return {
        geral: 6,
        especificas: {}
      };
    }

    // Com preferências: 3 gerais + 3 específicas
    const geralCount = 3;
    const specificCount = 3;
    
    const distribution = {
      geral: geralCount,
      especificas: {}
    };

    // Distribui as específicas entre as categorias
    const categoriesCount = userCategories.length;
    const newsPerCategory = Math.floor(specificCount / categoriesCount);
    const remainder = specificCount % categoriesCount;

    for (let i = 0; i < userCategories.length; i++) {
      const category = userCategories[i];
      distribution.especificas[category] = newsPerCategory + (i < remainder ? 1 : 0);
    }

    console.log('📊 Distribuição de notícias:', distribution);
    return distribution;
  }

  // Filtra notícias por categoria baseado no conteúdo
  categorizeNews(news, targetCategory) {
    if (targetCategory === 'geral') {
      return true; // Notícias gerais aceitam qualquer coisa
    }

    const categoryConfig = this.categoryMapping[targetCategory];
    if (!categoryConfig) {
      return false;
    }

    const title = news.title?.toLowerCase() || '';
    const content = news.originalContent?.toLowerCase() || '';
    const combined = title + ' ' + content;

    // Verifica se a notícia contém palavras-chave da categoria
    return categoryConfig.keywords.some(keyword => combined.includes(keyword));
  }

  // Pontuação especial para notícias que batem com interesse do usuário
  getPersonalizedScore(news, userCategories) {
    let bonus = 0;

    for (const category of userCategories) {
      if (this.categorizeNews(news, category)) {
        bonus += 15; // Bonus significativo para interesse específico
        console.log(`🎯 Bonus de ${15} pontos para "${news.title.substring(0, 30)}..." (categoria: ${category})`);
      }
    }

    return bonus;
  }

  // Fontes conhecidas do Brasil como fallback
  getKnownBrazilianSources(category) {
    const knownSources = {
      'esporte': [
        { name: 'ESPN Brasil', url: 'https://www.espn.com.br/rss/futebol.xml' },
        { name: 'Torcedores.com', url: 'https://www.torcedores.com/feed' },
        { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
        { name: 'Folha Esportes', url: 'https://feeds.folha.uol.com.br/esporte/rss091.xml' },
        { name: 'R7 Esportes', url: 'https://noticias.r7.com/esportes/feed.xml' }
      ],
      'futebol': [
        { name: 'ESPN Brasil Futebol', url: 'https://www.espn.com.br/rss/futebol.xml' },
        { name: 'Torcedores.com', url: 'https://www.torcedores.com/feed' },
        { name: 'G1 Futebol', url: 'https://g1.globo.com/rss/g1/futebol/' },
        { name: 'Folha Esportes', url: 'https://feeds.folha.uol.com.br/esporte/rss091.xml' },
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
        { name: 'Terra Esportes', url: 'https://www.terra.com.br/esportes/rss.xml' },
        { name: 'Sportv', url: 'https://sportv.globo.com/rss/sportv/' }
      ],
      'volei': [
        { name: 'ESPN Brasil Vôlei', url: 'https://www.espn.com.br/rss/volei.xml' },
        { name: 'Sportv Vôlei', url: 'https://sportv.globo.com/rss/volei/' },
        { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
        { name: 'CBV Oficial', url: 'https://www.cbv.com.br/rss' },
        { name: 'Volleyball World', url: 'https://www.volleyball.world/pt/rss' }
      ],
      'handebol': [
        { name: 'ESPN Brasil Handebol', url: 'https://www.espn.com.br/rss/handebol.xml' },
        { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
        { name: 'Sportv', url: 'https://sportv.globo.com/rss/sportv/' },
        { name: 'CBHb Oficial', url: 'https://www.cbhb.org.br/rss' },
        { name: 'Handebol Brasil', url: 'https://handebolbrasil.com.br/feed/' }
      ],
      'rugby': [
        { name: 'ESPN Brasil Rugby', url: 'https://www.espn.com.br/rss/rugby.xml' },
        { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
        { name: 'Rugby Brasil', url: 'https://www.rugbybrasil.com.br/feed/' },
        { name: 'World Rugby PT', url: 'https://www.world.rugby/pt/rss' },
        { name: 'Brasil Rugby', url: 'https://brasilrugby.com.br/feed/' }
      ],
      'futsal': [
        { name: 'ESPN Brasil Futsal', url: 'https://www.espn.com.br/rss/futsal.xml' },
        { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
        { name: 'Portal do Futsal', url: 'https://www.portaldofutsal.com.br/feed/' },
        { name: 'Futsal Brasil', url: 'https://futsalbrasil.com.br/feed/' },
        { name: 'CBFS Oficial', url: 'https://www.cbfs.com.br/rss' }
      ],
      'volei-praia': [
        { name: 'ESPN Brasil Vôlei Praia', url: 'https://www.espn.com.br/rss/volei-praia.xml' },
        { name: 'CBV Vôlei de Praia', url: 'https://www.cbv.com.br/praia/rss' },
        { name: 'G1 Esportes', url: 'https://g1.globo.com/rss/g1/esportes/' },
        { name: 'UOL Esporte', url: 'https://esporte.uol.com.br/rss.xml' },
        { name: 'Beach Volleyball', url: 'https://www.beachvolleyball.org/rss' },
        { name: 'Volleyball World Beach', url: 'https://www.volleyball.world/pt/beach/rss' }
      ],
      'politica': [
        { name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
        { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
        { name: 'Poder360', url: 'https://www.poder360.com.br/feed/' },
        { name: 'UOL Política', url: 'https://noticias.uol.com.br/politica/rss.xml' },
        { name: 'R7 Brasil', url: 'https://noticias.r7.com/brasil/feed.xml' }
      ],
      'economia': [
        { name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
        { name: 'Folha Mercado', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
        { name: 'UOL Economia', url: 'https://economia.uol.com.br/rss.xml' },
        { name: 'R7 Economia', url: 'https://noticias.r7.com/economia/feed.xml' }
      ],
      'investimentos': [
        { name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
        { name: 'Exame Invest', url: 'https://exame.com/invest/feed/' },
        { name: 'Valor Econômico', url: 'https://valor.globo.com/rss/home/' },
        { name: 'Money Times', url: 'https://www.moneytimes.com.br/feed/' },
        { name: 'Portal do Bitcoin', url: 'https://portaldobitcoin.uol.com.br/feed/' },
        { name: 'Suno Research', url: 'https://www.suno.com.br/artigos/feed/' }
      ],
      'entretenimento': [
        { name: 'G1 Pop & Arte', url: 'https://g1.globo.com/rss/g1/pop-arte/' },
        { name: 'Folha Ilustrada', url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml' },
        { name: 'Rolling Stone Brasil', url: 'https://rollingstone.uol.com.br/feed/' },
        { name: 'UOL Entretenimento', url: 'https://entretenimento.uol.com.br/rss.xml' },
        { name: 'R7 Entretenimento', url: 'https://noticias.r7.com/pop/feed.xml' }
      ],
      'seguranca': [
        { name: 'Agência Brasil Justiça', url: 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml' },
        { name: 'G1 Brasil', url: 'https://g1.globo.com/rss/g1/brasil/' },
        { name: 'Folha Cotidiano', url: 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml' },
        { name: 'UOL Notícias', url: 'https://noticias.uol.com.br/rss.xml' }
      ],
      'saude': [
        { name: 'G1 Saúde', url: 'https://g1.globo.com/rss/g1/bemestar/' },
        { name: 'Folha Saúde', url: 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml' },
        { name: 'Agência Brasil Saúde', url: 'http://agenciabrasil.ebc.com.br/rss/saude/feed.xml' },
        { name: 'UOL Saúde', url: 'https://noticias.uol.com.br/saude/rss.xml' },
        { name: 'R7 Saúde', url: 'https://noticias.r7.com/saude/feed.xml' }
      ],
      'educacao': [
        { name: 'G1 Educação', url: 'https://g1.globo.com/rss/g1/educacao/' },
        { name: 'Folha Educação', url: 'https://feeds.folha.uol.com.br/educacao/rss091.xml' },
        { name: 'Agência Brasil Educação', url: 'http://agenciabrasil.ebc.com.br/rss/educacao/feed.xml' },
        { name: 'UOL Educação', url: 'https://educacao.uol.com.br/rss.xml' },
        { name: 'R7 Educação', url: 'https://noticias.r7.com/educacao/feed.xml' }
      ],
      'tecnologia': [
        { name: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/' },
        { name: 'Canaltech', url: 'https://canaltech.com.br/rss/' },
        { name: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
        { name: 'UOL Tecnologia', url: 'https://tecnologia.uol.com.br/rss.xml' },
        { name: 'G1 Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/' },
        { name: 'Folha Tec', url: 'https://feeds.folha.uol.com.br/tec/rss091.xml' }
      ],
      'meio-ambiente': [
        { name: 'Agência Brasil Meio Ambiente', url: 'http://agenciabrasil.ebc.com.br/rss/geral/feed.xml' },
        { name: 'G1 Ciência', url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/' },
        { name: 'Folha Ambiente', url: 'https://feeds.folha.uol.com.br/ambiente/rss091.xml' },
        { name: 'UOL Ciência', url: 'https://noticias.uol.com.br/ciencia/rss.xml' }
      ],
      'cultura': [
        { name: 'G1 Pop & Arte', url: 'https://g1.globo.com/rss/g1/pop-arte/' },
        { name: 'Folha Ilustrada', url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml' },
        { name: 'Cult', url: 'https://revistacult.uol.com.br/home/feed/' },
        { name: 'Agência Brasil Cultura', url: 'http://agenciabrasil.ebc.com.br/rss/cultura/feed.xml' },
        { name: 'UOL Entretenimento', url: 'https://entretenimento.uol.com.br/rss.xml' }
      ],
      'infraestrutura': [
        { name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
        { name: 'Folha Mercado', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
        { name: 'Agência Brasil Economia', url: 'http://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
        { name: 'UOL Economia', url: 'https://economia.uol.com.br/rss.xml' }
      ],
      'justica': [
        { name: 'Conjur', url: 'https://www.conjur.com.br/rss.xml' },
        { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
        { name: 'Agência Brasil Justiça', url: 'http://agenciabrasil.ebc.com.br/rss/justica/feed.xml' },
        { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
        { name: 'UOL Política', url: 'https://noticias.uol.com.br/politica/rss.xml' }
      ],
      'religiao': [
        { name: 'Gospel Mais', url: 'https://noticias.gospelmais.com.br/feed' },
        { name: 'Gospel Prime', url: 'https://www.gospelprime.com.br/feed/' },
        { name: 'CNBB', url: 'https://www.cnbb.org.br/feed/' },
        { name: 'Canção Nova', url: 'https://noticias.cancaonova.com/feed/' }
      ]
    };

    return knownSources[category] || [];
  }
}

export default new CategoryService();