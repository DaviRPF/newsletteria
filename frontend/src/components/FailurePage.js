import React from 'react';
import { Link } from 'react-router-dom';

const FailurePage = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="card max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">😔</div>
          
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Ops! Algo deu errado
          </h1>
          
          <p className="text-lg text-gray-700 mb-8">
            Não foi possível processar seu pagamento. Mas não se preocupe, você pode tentar novamente!
          </p>

          <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-red-800 mb-4">
              Possíveis motivos:
            </h2>
            
            <ul className="text-left text-red-700 space-y-2">
              <li>• Dados do cartão incorretos</li>
              <li>• Limite insuficiente</li>
              <li>• Problema temporário no sistema</li>
              <li>• Conexão instável durante o pagamento</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              💡 O que fazer agora?
            </h3>
            <ul className="text-blue-700 space-y-2">
              <li>✓ Verifique os dados do seu cartão</li>
              <li>✓ Confirme se há limite disponível</li>
              <li>✓ Tente novamente em alguns minutos</li>
              <li>✓ Use outro método de pagamento se preferir</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Link to="/subscribe" className="btn btn-primary">
              <i className="fas fa-redo"></i>
              Tentar Novamente
            </Link>
            
            <Link to="/" className="btn btn-secondary">
              <i className="fas fa-home"></i>
              Voltar ao Início
            </Link>
          </div>

          <div className="mt-8 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">
              🤝 Precisa de ajuda?
            </h4>
            <p className="text-gray-600 text-sm">
              Entre em contato conosco via WhatsApp ou email.
              <br />
              Estamos aqui para ajudar você a resolver qualquer problema!
            </p>
          </div>

          <div className="mt-6 text-gray-500 text-sm">
            <p>
              Lembre-se: o trial de 2 dias é gratuito e você só paga após testá-lo!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailurePage;