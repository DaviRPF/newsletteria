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

          {/* Perfil Personalizado */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">🎯 Perfil Personalizado</h3>
            <p className="text-gray-600 mb-4">
              Conte um pouco sobre você para receber análises personalizadas sobre como as notícias podem te afetar:
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição do seu perfil
                </label>
                <textarea
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  placeholder="Ex: Tenho 28 anos, sou médico recém-formado trabalhando no SUS. Me interesso por políticas de saúde pública e como elas afetam minha profissão..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows="4"
                  maxLength="500"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {profileDescription.length}/500 caracteres
                  </span>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="btn btn-primary px-6"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Salvar Perfil
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {saveMessage && (
                <div className={`p-4 rounded-lg ${
                  saveMessage.includes('✅') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {saveMessage}
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Como funciona?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Descreva sua idade, profissão, interesses e situação atual</li>
                  <li>• Nossa IA analisará como cada notícia pode impactar sua vida</li>
                  <li>• Você receberá uma seção personalizada em cada notícia</li>
                  <li>• Exemplo: "Como isso afeta você como estudante de medicina"</li>
                </ul>
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

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;