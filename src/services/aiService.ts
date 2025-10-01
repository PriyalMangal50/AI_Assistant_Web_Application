/* eslint-disable unicode-bom */
import axios from 'axios';

export interface InterviewQuestion {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  category: string;
}

interface ScoreResult { score: number; feedback: string; }

export class AIService {
  private static instance: AIService;
  private readonly hasServerAI: boolean;

  private constructor() {
    // Check if Gemini API is configured (client-side indicator)
    this.hasServerAI = Boolean(process.env.REACT_APP_GEMINI_API_KEY);
    
    // Log API configuration status
    if (this.hasServerAI) {
      console.log('✅ Gemini API configured - Dynamic questions enabled');
    } else {
      console.warn('⚠️ GEMINI API NOT CONFIGURED - Using development mock');
      console.warn('� Set GEMINI_API_KEY and REACT_APP_GEMINI_API_KEY in your environment variables');
      console.warn('🔗 Get your API key from: https://makersuite.google.com/app/apikey');
    }
  }

  static getInstance(): AIService {
    if (!AIService.instance) AIService.instance = new AIService();
    return AIService.instance;
  }

  // Development mock questions generator
  private generateMockQuestions(candidateInfo: any): InterviewQuestion[] {
    const skills = candidateInfo.skills || [];
    const jobTitle = candidateInfo.jobTitle || 'Developer';
    const experience = candidateInfo.yearsOfExperience || 0;
    
    console.log('📋 Generating mock questions based on:', { skills, jobTitle, experience });
    
    // Create skill-based questions
    const primarySkill = skills[0] || 'JavaScript';
    const secondarySkill = skills[1] || 'React';
    
    const mockQuestions: InterviewQuestion[] = [
      {
        id: 'q1',
        text: `What is your experience with ${primarySkill}? Can you explain a recent project where you used it?`,
        difficulty: 'easy',
        timeLimit: 20,
        category: primarySkill
      },
      {
        id: 'q2', 
        text: experience > 2 ? `How do you handle version control and code reviews in ${secondarySkill} projects?` : `What are the main concepts of ${secondarySkill} that you're familiar with?`,
        difficulty: 'easy',
        timeLimit: 20,
        category: secondarySkill
      },
      {
        id: 'q3',
        text: `Describe a challenging bug you encountered while working with ${primarySkill} and how you solved it.`,
        difficulty: 'medium',
        timeLimit: 60,
        category: 'Problem Solving'
      },
      {
        id: 'q4',
        text: experience > 3 ? 'How do you approach performance optimization in web applications?' : 'What strategies do you use to write clean, maintainable code?',
        difficulty: 'medium', 
        timeLimit: 60,
        category: 'Best Practices'
      },
      {
        id: 'q5',
        text: `Design a scalable architecture for a ${jobTitle.toLowerCase().includes('full') ? 'full-stack' : 'web'} application that handles user authentication and data management.`,
        difficulty: 'hard',
        timeLimit: 120,
        category: 'System Design'
      },
      {
        id: 'q6',
        text: experience > 2 ? 'How would you implement real-time features in a web application?' : 'Explain how you would structure a medium-sized web application project.',
        difficulty: 'hard',
        timeLimit: 120,
        category: 'Architecture'
      }
    ];
    
    return mockQuestions;
  }

  private fallbackScore(question: string, answer: string, difficulty?: string): ScoreResult {
    if (!answer || answer.trim().length < 10) return { score: 0, feedback: 'Answer too short' };
    let base = Math.min(60, answer.length / 4);
    const keywords = ['javascript','react','node','api','component','state'];
    const matches = keywords.filter(k => answer.toLowerCase().includes(k)).length;
    base += matches * 8;
    if (difficulty === 'easy') base += 10; else if (difficulty === 'hard') base -= 5;
    const score = Math.max(0, Math.min(100, Math.round(base)));
    return { score, feedback: score >= 75 ? 'Strong answer!' : score >= 55 ? 'Decent answer, add more depth.' : 'Needs more technical detail.' };
  }

  private fallbackSummary(candidate: any, answers: any[]): { score: number; summary: string } {
    const total = answers.reduce((s,a)=> s + (a.score||0), 0);
    const avg = answers.length ? Math.round(total / answers.length) : 0;
    return {
      score: avg,
      summary: `${candidate.name} completed the interview with an overall score of ${avg}%. This summary is generated using fallback logic (AI proxy unavailable).`
    };
  }

  // --------------- API Helpers ---------------
  private async postJSON<T>(url: string, body: any): Promise<T> {
    const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    return resp.data as T;
  }

  // --------------- Public Methods ---------------
  async generateQuestions(candidateInfo: any): Promise<InterviewQuestion[]> {
    console.log('🚀 Generating questions with Gemini API for candidate:', candidateInfo.name);
    console.log('📄 Candidate Profile:', {
      skills: candidateInfo.skills?.length || 0,
      experience: candidateInfo.yearsOfExperience || 0,
      jobTitle: candidateInfo.jobTitle || 'Not specified',
      resumeTextLength: candidateInfo.resumeText?.length || 0
    });
    
    // In development mode or without API key, use mock questions
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (!this.hasServerAI || isDevelopment) {
      console.warn('🛠️ Development mode: Using mock question generation');
      if (!candidateInfo.resumeText || candidateInfo.resumeText.length < 50) {
        console.warn('⚠️ Limited resume data, generating basic mock questions');
      }
      return this.generateMockQuestions(candidateInfo);
    }
    
    // Ensure we have minimum resume data for real API
    if (!candidateInfo.resumeText || candidateInfo.resumeText.length < 50) {
      throw new Error('❌ Insufficient resume data. Please upload a detailed resume with your experience and skills.');
    }
    
    try {
      const data = await this.postJSON<{ questions: InterviewQuestion[] }>('/api/gemini-generate-questions', { candidate: candidateInfo });
      
      if (!Array.isArray(data.questions) || data.questions.length !== 6) {
        console.error('❌ Invalid questions payload from API:', data);
        throw new Error('Gemini API returned invalid questions format');
      }
      
      // Validate each question has required fields
      const validQuestions = data.questions.filter(q => 
        q.id && q.text && q.difficulty && q.timeLimit && q.category
      );
      
      if (validQuestions.length !== 6) {
        console.error('❌ Some questions missing required fields');
        throw new Error('Some generated questions are missing required fields');
      }
      
      console.log('✅ Successfully generated dynamic questions from Gemini API');
      console.log('📋 Generated questions:', data.questions.map(q => `${q.difficulty}: ${q.text.substring(0, 50)}...`));
      
      return data.questions;
    } catch (e) {
      console.error('❌ Gemini API failed:', e);
      
      if (e instanceof Error) {
        if (e.message.includes('fetch') || e.message.includes('network')) {
          throw new Error('❌ Network error: Unable to connect to Gemini API. Please check your internet connection and try again.');
        }
        if (e.message.includes('402') || e.message.includes('403')) {
          throw new Error('❌ API key error: Invalid or expired Gemini API key. Please check your configuration.');
        }
        if (e.message.includes('429')) {
          throw new Error('❌ Rate limit exceeded: Too many requests to Gemini API. Please try again later.');
        }
        throw new Error(`❌ Gemini API error: ${e.message}`);
      }
      
      throw new Error('❌ Unknown error occurred while generating questions');
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty?: string): Promise<ScoreResult> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development mode, use fallback scoring
    if (isDevelopment) {
      console.warn('🛠️ Development mode: Using fallback scoring');
      return this.fallbackScore(question, answer, difficulty);
    }

    try {
      console.log('🎯 Scoring answer with Gemini API...');
      const data = await this.postJSON<ScoreResult>('/api/gemini-score-answer', { question, answer, difficulty });
      if (typeof data.score !== 'number') throw new Error('Invalid score payload');
      console.log('✅ Successfully scored answer:', data.score);
      return data;
    } catch (e) {
      console.error('❌ Gemini scoring failed:', (e as Error).message);
      // For scoring, we can provide a basic fallback since it's less critical than questions
      console.warn('⚠️ Falling back to basic scoring due to API failure');
      return this.fallbackScore(question, answer, difficulty);
    }
  }

  async generateSummary(candidate: any, answers: any[]): Promise<{ score: number; summary: string }> {
    const total = answers.reduce((s,a)=> s + (a.score||0), 0);
    const avg = answers.length ? Math.round(total / answers.length) : 0;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development mode, use fallback summary
    if (isDevelopment) {
      console.warn('🛠️ Development mode: Using fallback summary generation');
      return this.fallbackSummary(candidate, answers);
    }

    try {
      console.log('📝 Generating summary with Gemini API...');
      const data = await this.postJSON<{ summary: string }>('/api/gemini-summary', { candidate, answers });
      if (!data.summary) throw new Error('Missing summary');
      console.log('✅ Successfully generated AI summary');
      return { score: avg, summary: data.summary };
    } catch (e) {
      console.error('❌ Gemini summary failed:', (e as Error).message);
      console.warn('⚠️ Falling back to basic summary');
      return this.fallbackSummary(candidate, answers);
    }
  }

  async generateChatResponse(message: string, context: any): Promise<string> {
    const field = context.currentField;
    if (field === 'Name') return 'Please provide your full name.';
    if (field === 'Email') return 'Please provide your email.';
    if (field === 'Phone') return 'Please provide your phone.';
    return 'Please provide the information.';
  }
}
