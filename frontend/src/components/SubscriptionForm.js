import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const SubscriptionForm = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    phone: '',
    timezone: 'America/Sao_Paulo'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData({
      ...formData,
      phone: formatted
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const phoneNumbers = formData.phone.replace(/\D/g, '');
      
      if (phoneNumbers.length !== 11) {
        setError('Digite um número de telefone válido com DDD');
        setLoading(false);
        return;
      }

      const userData = {
        ...formData,
        phone: phoneNumbers
      };

      const registerResponse = await api.post('/users/register', userData);
      
      if (registerResponse.data) {
        const preferenceResponse = await api.post('/subscriptions/create-preference', userData);
        
        if (preferenceResponse.data.initPoint) {
          window.location.href = preferenceResponse.data.initPoint;
        } else {
          setError('Erro ao gerar link de pagamento');
        }
      }

    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Erro ao processar cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="card max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              📱 Finalizar Cadastro
            </h1>
            <p className="text-gray-600">
              Complete seus dados para iniciar o trial gratuito de 2 dias
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp (com DDD)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="form-input"
                placeholder="(11) 99999-9999"
                required
              />
              <small className="text-gray-500">
                O número onde você receberá as notícias
              </small>
            </div>

            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-green-800 mb-2">
                🎁 Seu trial gratuito inclui:
              </h3>
              <ul className="text-green-700 space-y-1">
                <li>✓ 2 dias completamente grátis</li>
                <li>✓ 4 notícias principais por dia</li>
                <li>✓ Horário de entrega às 10h (personalizável)</li>
                <li>✓ Conteúdo reescrito pela IA</li>
                <li>✓ Cancele a qualquer momento</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">
                💳 Como funciona o pagamento:
              </h3>
              <ul className="text-blue-700 space-y-1">
                <li>• Você será redirecionado para o Mercado Pago</li>
                <li>• O trial de 2 dias inicia após a confirmação</li>
                <li>• Após o trial: R$ 5,00/mês automaticamente</li>
                <li>• Cancele quando quiser, sem multa</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="loading"></div>
                  Processando...
                </>
              ) : (
                <>
                  <i className="fas fa-credit-card"></i>
                  Continuar para Pagamento
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Ao continuar, você concorda com nossos termos de uso.
              <br />
              Pagamento seguro via Mercado Pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionForm;