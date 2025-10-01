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
    const { question, answer, difficulty } = req.body || {};
    if (!question || !answer) {
      return res.status(400).json({ error: 'Missing question or answer' });
    }

    const prompt = `You are an expert technical interviewer. Evaluate this candidate's answer and provide detailed feedback.

QUESTION (${difficulty || 'medium'}): ${question}

CANDIDATE'S ANSWER: ${answer}

Evaluate based on:
- Technical accuracy
- Completeness of explanation
- Clarity and communication
- Appropriate depth for ${difficulty || 'medium'} level
- Practical understanding

Provide response as JSON only:
{
  "score": <number 0-100>,
  "feedback": "Detailed feedback explaining the score, highlighting strengths and areas for improvement. Be constructive and specific."
}

Scoring guidelines:
- 90-100: Excellent, comprehensive answer
- 80-89: Good answer with minor gaps
- 70-79: Satisfactory with some issues
- 60-69: Basic understanding, needs improvement
- Below 60: Significant gaps or errors`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.25, topK: 32, topP: 0.9, maxOutputTokens: 512 }
    };

    const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 25000 });
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();

    let result = {};
    try { result = JSON.parse(clean); } catch (e) {
      return res.status(502).json({ error: 'Failed to parse model output', raw: text });
    }

    if (typeof result.score !== 'number' || !result.feedback) {
      return res.status(502).json({ error: 'Model returned invalid scoring', result });
    }

    result.score = Math.max(0, Math.min(100, Math.round(result.score)));
    return res.status(200).json(result);
  } catch (err) {
    console.error('Gemini score error', err.response?.data || err.message);
    return res.status(500).json({ error: 'Gemini scoring failed', detail: err.message });
  }
};
