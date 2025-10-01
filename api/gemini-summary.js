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

    const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length;
    const answerBlock = answers.map((a, i) => 
      `Q${i+1} (${a.difficulty}): ${a.question}\nAnswer: ${a.answer}\nScore: ${a.score}% - ${a.feedback}`
    ).join('\n\n');

    const candidateProfile = `
Candidate: ${candidate.name}
Role: ${candidate.jobTitle || 'Developer'}
Experience: ${candidate.yearsOfExperience || 0} years
Skills: ${candidate.skills?.join(', ') || 'Not specified'}
Overall Score: ${Math.round(totalScore)}%
`;

    const prompt = `You are a senior technical interviewer creating a comprehensive interview evaluation report. 

CANDIDATE PROFILE:
${candidateProfile}

INTERVIEW RESULTS:
${answerBlock}

Please create a professional interview evaluation report that includes:

1. **Executive Summary**: Overall performance assessment (2-3 sentences)
2. **Technical Competencies**: Analysis of technical skills demonstrated
3. **Communication & Problem-Solving**: How well they explained their solutions
4. **Strengths**: Key positive observations
5. **Areas for Improvement**: Constructive feedback for growth
6. **Recommendation**: Hiring recommendation based on performance

Format as a professional evaluation report. Be specific, constructive, and balanced in your assessment.`;

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
