import { v4 as uuidv4 } from 'uuid';

let surveys = {};

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const surveyId = uuidv4();
      const survey = {
        id: surveyId,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      surveys[surveyId] = survey;
      res.status(200).json({ success: true, surveyId, survey });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      res.status(200).json({ success: true, surveys: Object.values(surveys) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
