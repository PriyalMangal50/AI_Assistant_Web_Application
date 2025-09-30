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
    const { candidate } = req.body || {};
    if (!candidate || !candidate.resumeText) {
      return res.status(400).json({ error: 'Missing candidate resumeText' });
    }

    const prompt = `You are an expert technical interviewer for full-stack roles. Based on the resume below, generate 6 JSON objects: 2 easy (20s), 2 medium (60s), 2 hard (120s). Fields: id, text, difficulty, timeLimit, category. Return ONLY JSON array.
Resume:\n${candidate.resumeText.slice(0,1200)}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 }
    };

    const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });

    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    let questions = [];
    try { questions = JSON.parse(clean); } catch (e) {
      return res.status(502).json({ error: 'Failed to parse model output', raw: text });
    }

    if (!Array.isArray(questions) || questions.length !== 6) {
      return res.status(502).json({ error: 'Model returned invalid questions', questions });
    }

    return res.status(200).json({ questions });
  } catch (err) {
    console.error('Gemini question generation error', err.response?.data || err.message);
    return res.status(500).json({ error: 'Gemini generate questions failed', detail: err.message });
  }
};
