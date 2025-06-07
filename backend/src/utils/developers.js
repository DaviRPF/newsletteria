import dotenv from 'dotenv';
dotenv.config(); // Força carregamento do .env

class DeveloperManager {
  constructor() {
    this.developers = this.loadDevelopers();
    this.developerSettings = new Map(); // Armazena configurações temporárias
  }

  loadDevelopers() {
    const devNumbers = process.env.DEVELOPER_NUMBERS || '';
    console.log('🔧 Carregando desenvolvedores do .env:', devNumbers);
    console.log('📍 Diretório atual:', process.cwd());
    console.log('🔍 Todas as vars de ambiente:', process.env.DEVELOPER_NUMBERS);
    
    if (!devNumbers) {
      console.log('⚠️ DEVELOPER_NUMBERS não encontrado no .env');
      // Fallback - adiciona você como desenvolvedor por padrão
      return ['558481843434'];
    }
    
    return devNumbers
      .split(',')
      .map(num => num.trim())
      .filter(num => num.length > 0);
  }

  isDeveloper(phone) {
    // Remove @c.us, +, e qualquer formatação
    const cleanPhone = phone.replace('@c.us', '').replace(/\D/g, '');
    
    console.log(`🔍 Verificando se ${cleanPhone} é desenvolvedor...`);
    console.log(`📋 Desenvolvedores registrados: ${this.developers.join(', ')}`);
    
    const isMatch = this.developers.some(devNumber => {
      const cleanDevNumber = devNumber.replace(/\D/g, '');
      const match = cleanPhone === cleanDevNumber || 
                   cleanPhone.endsWith(cleanDevNumber) ||
                   cleanDevNumber.endsWith(cleanPhone);
      
      if (match) {
        console.log(`✅ Match encontrado: ${cleanPhone} ↔ ${cleanDevNumber}`);
      }
      
      return match;
    });
    
    console.log(`🎯 Resultado: ${isMatch ? 'É DESENVOLVEDOR' : 'NÃO é desenvolvedor'}`);
    return isMatch;
  }

  addDeveloper(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!this.developers.includes(cleanPhone)) {
      this.developers.push(cleanPhone);
    }
  }

  removeDeveloper(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    this.developers = this.developers.filter(dev => dev !== cleanPhone);
  }

  getDevelopers() {
    return [...this.developers];
  }

  // Configura horário de entrega para desenvolvedor
  setDeveloperDeliveryTime(phone, time) {
    const cleanPhone = phone.replace(/\D/g, '');
    this.developerSettings.set(cleanPhone, { deliveryTime: time });
    console.log(`⏰ Horário de ${cleanPhone} configurado para ${time}`);
  }

  // Obtém horário de entrega do desenvolvedor
  getDeveloperDeliveryTime(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const settings = this.developerSettings.get(cleanPhone);
    return settings?.deliveryTime || '10:00'; // Padrão 10:00
  }

  // Obtém desenvolvedores que devem receber no horário específico
  getDevelopersForTime(time) {
    return this.developers.filter(devPhone => {
      const deliveryTime = this.getDeveloperDeliveryTime(devPhone);
      return deliveryTime === time;
    });
  }

  // Cria um usuário desenvolvedor fake para o sistema
  createDeveloperUser(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return {
      phone: cleanPhone,
      name: 'Developer',
      email: 'dev@newsletter.com',
      subscriptionStatus: 'active',
      isDeveloper: true,
      deliveryTime: this.getDeveloperDeliveryTime(cleanPhone),
      timezone: 'America/Sao_Paulo',
      trialStartDate: new Date('2020-01-01'), // Data antiga
      trialEndDate: new Date('2099-12-31'), // Nunca expira
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export default new DeveloperManager();