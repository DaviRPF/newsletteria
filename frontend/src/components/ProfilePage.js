import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ProfilePage = () => {
  const { phone } = useParams();
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [phone]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Por enquanto sem MongoDB, vamos simular
      // const userResponse = await api.get(`/users/profile/${phone}`);
      // const subscriptionResponse = await api.get(`/subscriptions/status/${phone}`);
      
      // Dados simulados
      setProfile({
        phone: phone,
        name: 'Usuário',
        email: 'usuario@email.com',
        deliveryTime: '10:00'
      });
      
      setSubscription({
        subscriptionStatus: 'demo',
        isInTrial: true,
        daysLeft: 2
      });

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setError('Erro ao carregar informações do perfil');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone) => {
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="container">
          <div className="card max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
            <Link to="/" className="btn btn-primary">
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (subscription?.subscriptionStatus === 'active') {
      if (subscription.isInTrial) {
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            Trial Ativo ({subscription.daysLeft} dias restantes)
          </span>
        );
      }
      return (
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
          Assinatura Ativa
        </span>
      );
    } else if (subscription?.subscriptionStatus === 'cancelled') {
      return (
        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
          Assinatura Cancelada
        </span>
      );
    } else if (subscription?.subscriptionStatus === 'demo') {
      return (
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          Modo Demonstração
        </span>
      );
    }
    return (
      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
        Não Cadastrado
      </span>
    );
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="card max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Meu Perfil
            </h1>
            <p className="text-gray-600">Newsletter WhatsApp</p>
          </div>

          {/* Status */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 text-center">
            <h2 className="text-xl font-semibold mb-3">Status da Assinatura</h2>
            {getStatusBadge()}
          </div>

          {/* Informações Pessoais */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Informações Pessoais</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">WhatsApp:</span>
                <span className="font-semibold">{formatPhone(phone)}</span>
              </div>
              {profile?.name && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-semibold">{profile.name}</span>
                </div>
              )}
              {profile?.email && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold">{profile.email}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Horário de Entrega:</span>
                <span className="font-semibold">{profile?.deliveryTime || '10:00'}</span>
              </div>
            </div>
          </div>

          {/* Comandos WhatsApp */}
          <div className="bg-green-50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">📱 Comandos WhatsApp</h3>
            <p className="text-gray-700 mb-3">
              Envie estes comandos no WhatsApp para gerenciar sua conta:
            </p>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded border border-green-200">
                <code className="text-green-600 font-mono">"configurar horario"</code>
                <span className="text-gray-600 ml-2">- Alterar horário de entrega</span>
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <code className="text-green-600 font-mono">"status"</code>
                <span className="text-gray-600 ml-2">- Ver status da assinatura</span>
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <code className="text-green-600 font-mono">"cancelar"</code>
                <span className="text-gray-600 ml-2">- Informações sobre cancelamento</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4">
            {!subscription || subscription.subscriptionStatus !== 'active' ? (
              <Link to="/subscribe" className="btn btn-primary flex-1">
                <i className="fas fa-credit-card"></i>
                Assinar Agora
              </Link>
            ) : (
              <button className="btn btn-secondary flex-1">
                <i className="fas fa-cog"></i>
                Gerenciar Assinatura
              </button>
            )}
            
            <Link to="/" className="btn btn-secondary flex-1">
              <i className="fas fa-home"></i>
              Voltar ao Início
            </Link>
          </div>

          {/* Info */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>
              Este é o modo demonstração. Com MongoDB configurado,
              <br />
              você verá suas informações reais aqui.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;