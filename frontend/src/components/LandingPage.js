import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      navigate('/subscribe', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container pt-12 pb-8">
        <div className="text-center">
          <div className="animate-float mb-6">
            <div className="text-8xl mb-4">📱</div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Newsletter <span className="gradient-text bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">WhatsApp</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            🚀 Receba as <strong>6 principais notícias</strong> do Brasil direto no seu WhatsApp, 
            <br className="hidden md:block" />
            <span className="text-cyan-300">personalizadas por IA</span> e entregues no horário que você escolher
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Notícias reescritas por IA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Análise personalizada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>Horário customizável</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-16">
        <div className="card max-w-5xl mx-auto text-center shadow-glow">
          <div className="mb-10">
            <div className="animate-pulse-glow inline-block p-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-6">
              <div className="text-6xl">🤖</div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              As <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">6 principais notícias</span> do dia,
              <br />personalizadas para <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">você</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Por apenas <strong className="text-green-600 text-2xl">R$ 5,00/mês</strong>, 
              receba notícias selecionadas por IA avançada, reescritas para WhatsApp e 
              <span className="font-semibold text-blue-600"> analisadas especificamente para seu perfil</span>
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl mb-10 border border-green-200">
            <div className="flex items-center justify-center mb-6">
              <div className="animate-bounce">
                <span className="text-4xl mr-4">🎁</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                7 dias grátis para testar!
              </span>
            </div>
            <p className="text-green-700 text-lg">
              ✨ Experimente todos os recursos sem compromisso
              <br />
              <span className="text-sm text-green-600">O trial começa apenas quando você confirma o pagamento</span>
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="max-w-lg mx-auto">
            <div className="form-group mb-6">
              <input
                type="email"
                placeholder="✉️ Digite seu email para começar"
                className="form-input text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full text-lg py-4 animate-pulse-glow">
              <i className="fab fa-whatsapp text-xl"></i>
              🚀 Começar Trial Grátis Agora
            </button>
            <p className="text-sm text-gray-500 mt-4">
              💳 Sem cartão de crédito necessário para o trial
            </p>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Por que escolher nossa <span className="gradient-text bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">newsletter</span>?
          </h3>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Tecnologia de ponta para entregar exatamente o que você precisa saber
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center group hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <div className="text-3xl">🧠</div>
            </div>
            <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              IA Avançada
            </h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Usamos <strong>Gemini 1.5 Flash</strong> para analisar, filtrar e reescrever as notícias, 
              garantindo máxima relevância e clareza.
            </p>
            <div className="text-sm text-blue-600 font-semibold">
              ✨ Powered by Google AI
            </div>
          </div>

          <div className="card text-center group hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <div className="text-3xl">🎯</div>
            </div>
            <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Análise Personalizada
            </h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Cada notícia vem com uma análise de <strong>como ela afeta você</strong> especificamente, 
              baseada no seu perfil e interesses.
            </p>
            <div className="text-sm text-green-600 font-semibold">
              🎨 Feito sob medida para você
            </div>
          </div>

          <div className="card text-center group hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <div className="text-3xl">⏰</div>
            </div>
            <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Total Controle
            </h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Escolha seu horário ideal, gerencie tudo pelo WhatsApp e 
              <strong> cancele quando quiser</strong>. Sem burocracias.
            </p>
            <div className="text-sm text-purple-600 font-semibold">
              📱 Gerenciamento via WhatsApp
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-12">
        <div className="card max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Como funciona?</h3>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cadastre-se e escolha seu plano</h4>
                <p className="text-gray-600">
                  Preencha seus dados e inicie o trial gratuito de 2 dias.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-2">Receba as notícias no WhatsApp</h4>
                <p className="text-gray-600">
                  Todos os dias no horário escolhido, você receberá as 4 principais notícias.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-2">Configure como quiser</h4>
                <p className="text-gray-600">
                  Digite "configurar horario" no WhatsApp para mudar quando receber as mensagens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-12">
        <div className="card max-w-lg mx-auto text-center">
          <h3 className="text-2xl font-bold mb-6">Plano Simples e Transparente</h3>
          
          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-8 rounded-16 mb-6">
            <div className="text-4xl font-bold mb-2">R$ 5,00</div>
            <div className="text-lg opacity-90">por mês</div>
            <div className="mt-4 text-sm opacity-75">
              + 2 dias grátis para testar
            </div>
          </div>

          <ul className="text-left space-y-3 mb-8">
            <li className="flex items-center">
              <i className="fas fa-check text-green-600 mr-3"></i>
              4 notícias principais por dia
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-600 mr-3"></i>
              Conteúdo reescrito pela IA
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-600 mr-3"></i>
              Horário personalizável
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-600 mr-3"></i>
              Cancele quando quiser
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-600 mr-3"></i>
              Suporte via WhatsApp
            </li>
          </ul>

          <button 
            onClick={() => navigate('/subscribe')}
            className="btn btn-primary w-full"
          >
            <i className="fab fa-whatsapp"></i>
            Começar Agora - Trial Grátis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-8 text-center text-white/70">
        <p>&copy; 2024 Newsletter WhatsApp. Todos os direitos reservados.</p>
        <p className="mt-2">
          Dúvidas? Entre em contato via WhatsApp ou email.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;