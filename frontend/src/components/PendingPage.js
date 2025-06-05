import React from 'react';
import { Link } from 'react-router-dom';

const PendingPage = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="card max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">⏳</div>
          
          <h1 className="text-3xl font-bold text-yellow-600 mb-4">
            Pagamento Pendente
          </h1>
          
          <p className="text-lg text-gray-700 mb-8">
            Seu pagamento está sendo processado. Isso pode levar alguns minutos.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">
              🔄 O que está acontecendo?
            </h2>
            
            <ul className="text-left text-yellow-700 space-y-2">
              <li>• Seu pagamento está sendo verificado</li>
              <li>• O banco está processando a transação</li>
              <li>• Você receberá uma confirmação em breve</li>
              <li>• Este processo é normal e seguro</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              📧 Fique tranquilo
            </h3>
            <p className="text-blue-700">
              Você receberá um email de confirmação assim que o pagamento for aprovado.
              Também enviaremos uma mensagem no WhatsApp informando o status da sua assinatura.
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              ✅ Próximos passos
            </h3>
            <ul className="text-green-700 space-y-2">
              <li>• Aguarde a confirmação por email</li>
              <li>• Seu trial de 2 dias começará após a aprovação</li>
              <li>• Adicione nosso número na sua agenda</li>
              <li>• Prepare-se para receber as melhores notícias!</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">
                <strong>Tempo estimado:</strong> 5 a 15 minutos
                <br />
                <strong>Status:</strong> Processando pagamento...
              </p>
            </div>

            <Link to="/" className="btn btn-primary">
              <i className="fas fa-home"></i>
              Voltar ao Início
            </Link>
          </div>

          <div className="mt-8 text-gray-500 text-sm">
            <p>
              Em caso de dúvidas ou se o pagamento não for aprovado em 30 minutos,
              <br />
              entre em contato conosco via WhatsApp ou email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPage;