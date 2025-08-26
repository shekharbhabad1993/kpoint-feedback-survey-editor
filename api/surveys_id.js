import { v4 as uuidv4 } from 'uuid';

let surveys = {};

export default function handler(req, res) {
  const surveyId = req.query.id;
  if (req.method === 'GET') {
    try {
      const survey = surveys[surveyId];
      if (!survey) {
        return res.status(404).json({ success: false, error: 'Survey not found' });
      }
      res.status(200).json({ success: true, survey });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      if (!surveys[surveyId]) {
        return res.status(404).json({ success: false, error: 'Survey not found' });
      }
      surveys[surveyId] = {
        ...surveys[surveyId],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      res.status(200).json({ success: true, survey: surveys[surveyId] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
