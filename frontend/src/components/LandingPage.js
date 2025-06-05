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
      <header className="container pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            📱 Newsletter WhatsApp
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Receba as principais notícias do Brasil direto no seu WhatsApp, 
            todos os dias, de forma resumida e organizada.
          </p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12">
        <div className="card max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              As 4 principais notícias do dia, direto no seu WhatsApp
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Por apenas <strong className="text-green-600">R$ 5,00/mês</strong>, 
              receba um resumo inteligente das notícias mais importantes do Brasil, 
              reescritas pela IA para fácil leitura no WhatsApp.
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-12 mb-8">
            <div className="flex items-center justify-center mb-4">
              <i className="fas fa-gift text-green-600 text-2xl mr-3"></i>
              <span className="text-xl font-semibold text-green-800">
                2 dias grátis para testar!
              </span>
            </div>
            <p className="text-green-700">
              Experimente sem compromisso. O trial começa apenas quando você confirma o pagamento.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
            <div className="form-group">
              <input
                type="email"
                placeholder="Digite seu email para começar"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              <i className="fab fa-whatsapp"></i>
              Começar Trial Grátis
            </button>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12">
        <h3 className="text-3xl font-bold text-white text-center mb-12">
          Por que escolher nossa newsletter?
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="text-xl font-semibold mb-3">IA Avançada</h4>
            <p className="text-gray-600">
              Usamos Gemini 1.5 Flash para analisar e reescrever as notícias, 
              garantindo relevância e clareza.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h4 className="text-xl font-semibold mb-3">Horário Personalizado</h4>
            <p className="text-gray-600">
              Escolha o horário que prefere receber as notícias. 
              Por padrão, enviamos às 10h da manhã.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-xl font-semibold mb-3">Fontes Confiáveis</h4>
            <p className="text-gray-600">
              Coletamos notícias do UOL, Opera Mundi e outros veículos respeitados, 
              sem duplicatas.
            </p>
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