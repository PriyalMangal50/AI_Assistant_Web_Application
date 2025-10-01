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

    // Create detailed candidate profile for better question generation
    const skills = candidate.skills?.length ? candidate.skills.join(', ') : 'General programming';
    const experience = candidate.experience?.length ? candidate.experience.join('. ') : '';
    const education = candidate.education?.length ? candidate.education.join('. ') : '';
    const jobTitle = candidate.jobTitle || 'Software Developer';
    const yearsExp = candidate.yearsOfExperience || 0;
    const summary = candidate.summary || '';

    const prompt = `You are an expert technical interviewer. Generate 6 interview questions based on this candidate profile:

CANDIDATE INFO:
- Name: ${candidate.name || 'Candidate'}
- Role: ${jobTitle}
- Experience: ${yearsExp} years
- Skills: ${skills}
- Summary: ${summary}
- Experience: ${experience}
- Education: ${education}

REQUIREMENTS:
- Generate exactly 6 questions as JSON array
- 2 easy (20s timeLimit), 2 medium (60s), 2 hard (120s)
- Questions should be relevant to candidate's skills and experience level
- Each question needs: id, text, difficulty, timeLimit, category
- Categories should match candidate's expertise (e.g., React, Node.js, System Design, etc.)
- Make questions specific to their background, not generic

EXAMPLE FORMAT:
[{"id":"q1","text":"Explain React hooks you've used","difficulty":"easy","timeLimit":20,"category":"React"}]

Return ONLY the JSON array, no other text:`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 }
    };

    const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });

    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      return res.status(502).json({ error: 'Gemini API returned empty response' });
    }
    
    console.log('Raw Gemini response:', text);
    
    // Clean the response - remove markdown code blocks and extra whitespace
    let clean = text.replace(/```json|```/g, '').trim();
    
    // Sometimes the model wraps response in extra text, try to extract JSON array
    const jsonMatch = clean.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      clean = jsonMatch[0];
    }
    
    let questions = [];
    try { 
      questions = JSON.parse(clean); 
    } catch (e) {
      console.error('JSON parsing failed:', e.message);
      return res.status(502).json({ 
        error: 'Failed to parse Gemini response as JSON', 
        raw: text,
        cleaned: clean,
        parseError: e.message
      });
    }

    // Validate the response
    if (!Array.isArray(questions)) {
      return res.status(502).json({ error: 'Gemini response is not an array', response: questions });
    }
    
    if (questions.length !== 6) {
      return res.status(502).json({ error: `Expected 6 questions, got ${questions.length}`, questions });
    }
    
    // Validate each question has required fields
    const requiredFields = ['id', 'text', 'difficulty', 'timeLimit', 'category'];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      for (const field of requiredFields) {
        if (!q[field]) {
          return res.status(502).json({ 
            error: `Question ${i + 1} missing required field: ${field}`, 
            question: q 
          });
        }
      }
    }

    return res.status(200).json({ questions });
  } catch (err) {
    console.error('Gemini question generation error', err.response?.data || err.message);
    return res.status(500).json({ error: 'Gemini generate questions failed', detail: err.message });
  }
};