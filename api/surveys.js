
import { v4 as uuidv4 } from 'uuid';
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
  if (!uri) {
    return res.status(500).json({ success: false, error: 'MongoDB URI not set' });
  }
  if (req.method === 'POST') {
    let client;
    try {
      const { collection, client: dbClient } = await getSurveyCollection();
      client = dbClient;
      const surveyId = uuidv4();
      const survey = {
        id: surveyId,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      await collection.insertOne(survey);
      res.status(200).json({ success: true, surveyId, survey });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) await client.close();
    }
  } else if (req.method === 'GET') {
    let client;
    try {
      const { collection, client: dbClient } = await getSurveyCollection();
      client = dbClient;
      const surveys = await collection.find({}).toArray();
      res.status(200).json({ success: true, surveys });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) await client.close();
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
