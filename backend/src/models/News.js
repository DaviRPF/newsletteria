export class News {
  constructor(data) {
    this.title = data.title;
    this.originalUrl = data.originalUrl;
    this.source = data.source;
    this.pubDate = data.pubDate;
    this.originalContent = data.originalContent;
    this.rewrittenContent = data.rewrittenContent;
    this.relevanceScore = data.relevanceScore;
    this.imageUrl = data.imageUrl;
    this.hash = data.hash;
    this.processed = data.processed || false;
    this.sent = data.sent || false;
    this.createdAt = data.createdAt || new Date();
  }

  static async create(db, newsData) {
    const news = new News(newsData);
    const result = await db.collection('news').insertOne(news);
    return { ...news, _id: result.insertedId };
  }

  static async findByHash(db, hash) {
    return await db.collection('news').findOne({ hash });
  }

  static async getTopNews(db, date, limit = 4) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.collection('news').find({
      pubDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      processed: true,
      rewrittenContent: { $exists: true }
    })
    .sort({ relevanceScore: -1 })
    .limit(limit)
    .toArray();
  }

  static async markAsSent(db, newsIds) {
    return await db.collection('news').updateMany(
      { _id: { $in: newsIds } },
      { $set: { sent: true } }
    );
  }

  static async updateProcessedContent(db, newsId, rewrittenContent, relevanceScore) {
    return await db.collection('news').updateOne(
      { _id: newsId },
      {
        $set: {
          rewrittenContent,
          relevanceScore,
          processed: true
        }
      }
    );
  }

  static async getUnprocessedNews(db) {
    return await db.collection('news').find({
      processed: false
    }).toArray();
  }
}