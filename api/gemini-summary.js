const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
  }

  try {
    const { candidate, answers } = req.body || {};
    if (!candidate || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing candidate or answers array' });
    }

    const answerBlock = answers.map((a, i) => `Q${i+1} (${a.difficulty}): ${a.question}\nA: ${a.answer}\nScore: ${a.score}%`).join('\n\n');

    const prompt = `Create a professional interview evaluation (3-4 paragraphs) for candidate ${candidate.name}. Cover: technical competence, communication, strengths, improvement areas, recommendation. Data:\n${answerBlock}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, topK: 32, topP: 0.9, maxOutputTokens: 768 }
    };

    const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ summary: text.trim() });
  } catch (err) {
    console.error('Gemini summary error', err.response?.data || err.message);
    return res.status(500).json({ error: 'Gemini summary failed', detail: err.message });
  }
};
