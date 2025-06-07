import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ProfilePage = () => {
  const { phone } = useParams();
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, [phone]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Debug: vamos ver o que está sendo chamado
      console.log('Tentando carregar perfil para:', phone);
      console.log('URL da API:', `${api.defaults.baseURL}/users/profile/${phone}`);
      
      // Carrega dados reais do usuário
      const userResponse = await api.get(`/users/profile/${phone}`);
      console.log('Resposta da API:', userResponse.data);
      const user = userResponse.data.user;
      
      setProfile({
        phone: user.phone,
        name: user.name,
        email: user.email,
        deliveryTime: user.deliveryTime || '10:00',
        profileDescription: user.profileDescription || ''
      });
      
      setProfileDescription(user.profileDescription || '');
      
      // Tenta carregar status da assinatura
      try {
        const subscriptionResponse = await api.get(`/subscriptions/status/${phone}`);
        setSubscription(subscriptionResponse.data);
      } catch (subError) {
        // Se não conseguir carregar assinatura, usa valores padrão
        setSubscription({
          subscriptionStatus: 'inactive',
          isInTrial: false,
          daysLeft: 0
        });
      }

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      
      // Se der erro 404, usuário não existe
      if (error.response?.status === 404) {
        setError('Perfil não encontrado. Por favor, cadastre-se primeiro.');
      } else {
        setError('Erro ao carregar informações do perfil');
      }
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

  const handleSaveProfile = async () => {
    if (!profileDescription.trim()) {
      setSaveMessage('Por favor, preencha a descrição do seu perfil');
      return;
    }

    if (profileDescription.length > 500) {
      setSaveMessage('A descrição não pode ter mais de 500 caracteres');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Salva perfil via API
      await api.put(`/users/profile-description/${phone}`, { profileDescription });
      
      setSaveMessage('✅ Perfil salvo com sucesso! Suas notícias agora serão personalizadas.');
      
      // Atualiza o profile local
      setProfile(prev => ({ ...prev, profileDescription }));
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      
      if (error.response?.status === 404) {
        setSaveMessage('❌ Usuário não encontrado. Por favor, faça o cadastro primeiro.');
      } else if (error.response?.data?.error) {
        setSaveMessage(`❌ ${error.response.data.error}`);
      } else {
        setSaveMessage('❌ Erro ao salvar. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
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
          <span className="status-badge status-trial">
            🎁 Trial Ativo ({subscription.daysLeft} dias restantes)
          </span>
        );
      }
      return (
        <span className="status-badge status-active">
          ✅ Assinatura Ativa
        </span>
      );
    } else if (subscription?.subscriptionStatus === 'cancelled') {
      return (
        <span className="status-badge bg-red-100 text-red-800">
          ❌ Assinatura Cancelada
        </span>
      );
    } else if (subscription?.subscriptionStatus === 'demo') {
      return (
        <span className="status-badge status-trial">
          🚀 Modo Demonstração
        </span>
      );
    }
    return (
      <span className="status-badge status-inactive">
        ⚪ Não Cadastrado
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header Centralizado */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <span className="text-3xl text-white">👤</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Meu Perfil
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Gerencie sua conta da Newsletter WhatsApp
          </p>
        </div>

        {/* Conteúdo Principal Centralizado */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Coluna 1: Status e Informações */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600 text-lg">📊</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Status da Conta</h2>
                </div>
                <div className="text-center py-4">
                  {getStatusBadge()}
                  {subscription?.subscriptionStatus === 'active' && subscription?.isInTrial && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800 font-medium">
                        Trial termina em <strong>{subscription.daysLeft} dias</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Pessoais */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-lg">ℹ️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Dados da Conta</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">WhatsApp:</span>
                    <span className="text-gray-900 font-semibold">{formatPhone(phone)}</span>
                  </div>
                  {profile?.name && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Nome:</span>
                      <span className="text-gray-900 font-semibold">{profile.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Horário:</span>
                    <span className="text-gray-900 font-semibold">{profile?.deliveryTime || '10:00'}</span>
                  </div>
                </div>
              </div>

              {/* Comandos WhatsApp */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600 text-lg">📱</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Comandos</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                    <code className="text-green-700 font-semibold">"status"</code>
                    <p className="text-sm text-gray-600 mt-1">Ver informações do perfil</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <code className="text-blue-700 font-semibold">"configurar horario"</code>
                    <p className="text-sm text-gray-600 mt-1">Alterar horário das notícias</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 2-3: Personalização */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Personalização IA</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Conte sobre você para receber análises personalizadas de como cada notícia pode impactar sua vida
                  </p>
                </div>
                
                <div className="max-w-3xl mx-auto">
                  <div className="mb-8">
                    <label className="block text-lg font-semibold text-gray-800 mb-4">
                      Descreva seu perfil profissional e interesses
                    </label>
                    <textarea
                      value={profileDescription}
                      onChange={(e) => setProfileDescription(e.target.value)}
                      placeholder="Ex: Sou médico cardiologista de 35 anos, trabalho em hospital público e me interesso por políticas de saúde, tecnologia médica e investimentos..."
                      className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none text-lg leading-relaxed"
                      rows="6"
                      maxLength="500"
                    />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500 font-medium">
                        {profileDescription.length}/500 caracteres
                      </span>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                      >
                        {isSaving ? '💾 Salvando...' : '💾 Salvar Perfil'}
                      </button>
                    </div>
                  </div>
                  
                  {saveMessage && (
                    <div className={`p-6 rounded-xl mb-8 text-center ${
                      saveMessage.includes('✅') 
                        ? 'bg-green-50 text-green-800 border-2 border-green-200' 
                        : 'bg-red-50 text-red-800 border-2 border-red-200'
                    }`}>
                      <p className="text-lg font-semibold">{saveMessage}</p>
                    </div>
                  )}
                  
                  {/* Como funciona */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-100">
                    <div className="text-center mb-4">
                      <span className="text-2xl">💡</span>
                      <h4 className="text-xl font-bold text-blue-900 mt-2">Como a IA Personaliza</h4>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                      <div className="p-4">
                        <div className="text-3xl mb-2">📝</div>
                        <p className="text-blue-800 font-medium">Você descreve seu perfil profissional</p>
                      </div>
                      <div className="p-4">
                        <div className="text-3xl mb-2">🤖</div>
                        <p className="text-blue-800 font-medium">IA analisa cada notícia para você</p>
                      </div>
                      <div className="p-4">
                        <div className="text-3xl mb-2">🎯</div>
                        <p className="text-blue-800 font-medium">Recebe insights específicos e práticos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Centralizados */}
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                {!subscription || subscription.subscriptionStatus !== 'active' ? (
                  <Link 
                    to="/subscribe" 
                    className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center"
                  >
                    <span className="mr-2">💳</span>
                    Assinar Agora
                  </Link>
                ) : null}
                
                <Link 
                  to="/" 
                  className="px-8 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center"
                >
                  <span className="mr-2">🏠</span>
                  Voltar ao Início
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;