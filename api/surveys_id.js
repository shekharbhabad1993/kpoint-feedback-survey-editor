
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'surveydb';
const collectionName = 'surveys';

async function getSurveyCollection() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  return { collection: db.collection(collectionName), client };
}

export default async function handler(req, res) {
  const surveyId = req.query.id;
  if (!uri) {
    return res.status(500).json({ success: false, error: 'MongoDB URI not set' });
  }
  if (req.method === 'GET') {
    let client;
    try {
      const { collection, client: dbClient } = await getSurveyCollection();
      client = dbClient;
      const survey = await collection.findOne({ id: surveyId });
      if (!survey) {
        return res.status(404).json({ success: false, error: 'Survey not found' });
      }
      res.status(200).json({ success: true, survey });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) await client.close();
    }
  } else if (req.method === 'PUT') {
    let client;
    try {
      const { collection, client: dbClient } = await getSurveyCollection();
      client = dbClient;
      const survey = await collection.findOne({ id: surveyId });
      if (!survey) {
        return res.status(404).json({ success: false, error: 'Survey not found' });
      }
      const updatedSurvey = {
        ...survey,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      await collection.updateOne({ id: surveyId }, { $set: updatedSurvey });
      res.status(200).json({ success: true, survey: updatedSurvey });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) await client.close();
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
