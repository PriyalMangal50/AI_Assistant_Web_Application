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

  // Development mock questions generator with dynamic content
  private generateMockQuestions(candidateInfo: any): InterviewQuestion[] {
    const skills = candidateInfo.skills || [];
    const jobTitle = candidateInfo.jobTitle || 'Developer';
    const experience = candidateInfo.yearsOfExperience || 0;
    const candidateName = candidateInfo.name || 'candidate';
    const company = candidateInfo.company || '';
    
    console.log('📋 Generating dynamic mock questions for:', candidateName);
    console.log('📊 Profile:', { skills: skills.length, jobTitle, experience, company });
    
    // Skill categorization
    const webSkills = skills.filter((s: string) => 
      /react|vue|angular|html|css|javascript|typescript|bootstrap|tailwind/i.test(s));
    const backendSkills = skills.filter((s: string) => 
      /node|python|java|express|django|flask|spring|mongodb|sql|api/i.test(s));
    const toolSkills = skills.filter((s: string) => 
      /git|docker|kubernetes|aws|azure|jenkins|ci\/cd|webpack/i.test(s));
    
    // Question templates with variations
    const questionBank = {
      technical: [
        `Tell me about your experience with ${this.getRandomSkill(skills, 'JavaScript')}. What projects have you worked on?`,
        `How would you explain ${this.getRandomSkill(webSkills, 'React')} to someone who's new to web development?`,
        `What's the most complex feature you've implemented using ${this.getRandomSkill(skills, 'your main technology')}?`,
        `Describe your development workflow when working with ${this.getRandomSkill(toolSkills, 'Git and deployment tools')}.`,
        `What are some best practices you follow when writing ${this.getRandomSkill(backendSkills, 'server-side')} code?`
      ],
      
      experience: [
        `Describe a challenging project you worked on${company ? ` at ${company}` : ''}. What made it difficult?`,
        `Tell me about a time when you had to learn a new technology quickly. How did you approach it?`,
        `What's the biggest mistake you've made in a project, and what did you learn from it?`,
        `How do you handle tight deadlines and pressure in your development work?`,
        `Describe a situation where you had to work with a difficult team member or stakeholder.`
      ],
      
      problemSolving: [
        `Walk me through how you would debug a performance issue in a ${this.getRandomSkill(webSkills, 'web')} application.`,
        `How would you approach optimizing a slow database query in a ${this.getRandomSkill(backendSkills, 'backend')} system?`,
        `Describe your process for troubleshooting a bug that only happens in production.`,
        `How do you handle conflicting requirements from different stakeholders?`,
        `What steps would you take to improve the security of an existing application?`,
        `How would you set up ${this.getRandomSkill(toolSkills, 'CI/CD')} pipeline for a team project?`
      ],
      
      design: [
        `Design a ${jobTitle.toLowerCase().includes('full') ? 'full-stack' : 'web'} application for ${this.getRandomDomain()}. What architecture would you choose?`,
        `How would you design a RESTful API for ${this.getRandomDomain()}? What endpoints would you create?`,
        `Explain how you would implement real-time notifications in a web application.`,
        `Design a caching strategy for a high-traffic ${this.getRandomSkill(skills, 'web')} application.`,
        `How would you structure the database schema for a ${this.getRandomDomain()} platform?`
      ],
      
      leadership: experience > 2 ? [
        `How do you mentor junior developers and help them grow their skills?`,
        `Describe a time when you had to make a technical decision that affected the whole team.`,
        `How do you handle code reviews? What do you look for?`,
        `Tell me about a project where you had to coordinate with multiple teams.`,
        `How do you stay updated with new technologies and share knowledge with your team?`
      ] : [
        `How do you approach learning new technologies in your spare time?`,
        `What coding standards and practices do you think are most important?`,
        `How do you organize your code to make it maintainable?`,
        `What resources do you use to improve your programming skills?`,
        `How do you test your code to ensure it works correctly?`
      ]
    };
    
    // Generate 6 varied questions
    const questions: InterviewQuestion[] = [];
    const usedQuestions = new Set<string>();
    
    // Always include 1-2 technical questions based on skills
    this.addUniqueQuestion(questions, usedQuestions, questionBank.technical, 'easy', 'Technical', 30);
    this.addUniqueQuestion(questions, usedQuestions, questionBank.technical, 'medium', 'Technical', 45);
    
    // Add experience-based question
    this.addUniqueQuestion(questions, usedQuestions, questionBank.experience, 'easy', 'Experience', 60);
    
    // Add problem-solving question
    this.addUniqueQuestion(questions, usedQuestions, questionBank.problemSolving, 'medium', 'Problem Solving', 90);
    
    // Add design question
    this.addUniqueQuestion(questions, usedQuestions, questionBank.design, 'hard', 'System Design', 120);
    
    // Add leadership/growth question
    this.addUniqueQuestion(questions, usedQuestions, questionBank.leadership, 
      experience > 2 ? 'medium' : 'easy', 'Professional Growth', 60);
    
    console.log('✅ Generated 6 unique questions covering different areas');
    return questions;
  }
  
  private getRandomSkill(skills: string[], fallback: string): string {
    if (!skills || skills.length === 0) return fallback;
    return skills[Math.floor(Math.random() * skills.length)] || fallback;
  }
  
  private getRandomDomain(): string {
    const domains = [
      'an e-commerce platform', 'a social media app', 'a project management tool',
      'a blog platform', 'an online learning system', 'a task management app',
      'a restaurant booking system', 'a fitness tracking app', 'a financial dashboard'
    ];
    return domains[Math.floor(Math.random() * domains.length)];
  }
  
  private addUniqueQuestion(
    questions: InterviewQuestion[], 
    usedQuestions: Set<string>, 
    pool: string[], 
    difficulty: 'easy' | 'medium' | 'hard',
    category: string,
    timeLimit: number
  ): void {
    let attempts = 0;
    let questionText: string;
    
    do {
      questionText = pool[Math.floor(Math.random() * pool.length)];
      attempts++;
    } while (usedQuestions.has(questionText) && attempts < 10);
    
    if (!usedQuestions.has(questionText)) {
      usedQuestions.add(questionText);
      questions.push({
        id: `q${questions.length + 1}`,
        text: questionText,
        difficulty,
        timeLimit,
        category
      });
    }
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
