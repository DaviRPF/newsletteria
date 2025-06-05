export class User {
  constructor(data) {
    this.phone = data.phone;
    this.email = data.email;
    this.name = data.name;
    this.subscriptionStatus = data.subscriptionStatus || 'inactive';
    this.subscriptionId = data.subscriptionId || null;
    this.trialStartDate = data.trialStartDate || null;
    this.trialEndDate = data.trialEndDate || null;
    this.deliveryTime = data.deliveryTime || '10:00';
    this.timezone = data.timezone || 'America/Sao_Paulo';
    this.profileDescription = data.profileDescription || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findByPhone(db, phone) {
    return await db.collection('users').findOne({ phone });
  }

  static async findByEmail(db, email) {
    return await db.collection('users').findOne({ email });
  }

  static async create(db, userData) {
    const user = new User(userData);
    const result = await db.collection('users').insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async updateSubscription(db, phone, subscriptionData) {
    return await db.collection('users').updateOne(
      { phone },
      { 
        $set: {
          ...subscriptionData,
          updatedAt: new Date()
        }
      }
    );
  }

  static async updateDeliveryTime(db, phone, deliveryTime) {
    return await db.collection('users').updateOne(
      { phone },
      { 
        $set: {
          deliveryTime,
          updatedAt: new Date()
        }
      }
    );
  }

  static async getActiveSubscribers(db) {
    return await db.collection('users').find({
      subscriptionStatus: 'active'
    }).toArray();
  }

  static async getSubscribersByTime(db, deliveryTime) {
    return await db.collection('users').find({
      subscriptionStatus: 'active',
      deliveryTime
    }).toArray();
  }

  static async updateProfileDescription(db, phone, profileDescription) {
    return await db.collection('users').updateOne(
      { phone },
      { 
        $set: {
          profileDescription,
          updatedAt: new Date()
        }
      }
    );
  }
}