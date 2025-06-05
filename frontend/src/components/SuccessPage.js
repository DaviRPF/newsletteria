import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const phone = searchParams.get('external_reference');
    if (phone) {
      setUserInfo({ phone });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="card max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🎉</div>
          
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Pagamento Confirmado!
          </h1>
          
          <p className="text-lg text-gray-700 mb-8">
            Parabéns! Seu trial gratuito de 2 dias foi ativado com sucesso.
          </p>

          <div className="bg-green-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              🚀 O que acontece agora?
            </h2>
            
            <div className="text-left space-y-3 text-green-700">
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>Seu trial de 2 dias começou agora</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>Você receberá sua primeira newsletter amanhã às 10h no WhatsApp</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>Para alterar o horário, digite "configurar horario" no WhatsApp</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>Após 2 dias, será cobrado R$ 5,00/mês automaticamente</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              📱 Comandos do WhatsApp
            </h3>
            <div className="text-blue-700 space-y-2">
              <p><strong>"configurar horario"</strong> - Alterar horário de recebimento</p>
              <p><strong>"cancelar"</strong> - Informações sobre cancelamento</p>
              <p><strong>"ativar"</strong> - Reativar assinatura (se cancelada)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">
                📌 Importante
              </h4>
              <p className="text-yellow-700 text-sm">
                Guarde este número do WhatsApp em sua agenda para não perder as mensagens.
                Nosso sistema só envia mensagens para números confirmados.
              </p>
            </div>

            <Link to="/" className="btn btn-primary">
              <i className="fas fa-home"></i>
              Voltar ao Início
            </Link>
          </div>

          <div className="mt-8 text-gray-500 text-sm">
            <p>
              Dúvidas? Entre em contato conosco via WhatsApp ou email.
              <br />
              Agradecemos por escolher a Newsletter WhatsApp! 🙏
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;