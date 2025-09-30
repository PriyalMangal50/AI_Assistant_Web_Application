export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  interviewStatus: 'not_started' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  answers: Answer[];
  chatHistory: ChatMessage[]; // persisted chat between candidate and system
  finalScore?: number;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  questionId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSpent: number;
  score?: number;
  feedback?: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds
  category: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface InterviewState {
  currentCandidate: Candidate | null;
  candidates: Candidate[];
  currentQuestion: Question | null;
  timeRemaining: number;
  isInterviewActive: boolean;
  isPaused: boolean;
  chatMessages: ChatMessage[];
  isCollectingInfo: boolean;
  missingFields: string[];
  questions?: Question[]; // store active interview question set for persistence
}
