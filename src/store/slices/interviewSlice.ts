import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InterviewState, Candidate, Answer, Question, ChatMessage } from '../../types';

const initialState: InterviewState = {
  currentCandidate: null,
  candidates: [],
  currentQuestion: null,
  timeRemaining: 0,
  isInterviewActive: false,
  isPaused: false,
  chatMessages: [],
  isCollectingInfo: false,
  missingFields: [],
  questions: undefined,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      // ensure chatHistory array exists
      const candidate: Candidate = { ...action.payload, chatHistory: action.payload.chatHistory || [] };
      state.candidates.push(candidate);
      state.currentCandidate = candidate;
    },
    updateCandidate: (state, action: PayloadAction<Partial<Candidate>>) => {
      if (state.currentCandidate) {
        state.currentCandidate = { ...state.currentCandidate, ...action.payload };
        const index = state.candidates.findIndex(c => c.id === state.currentCandidate?.id);
        if (index !== -1) {
          state.candidates[index] = state.currentCandidate;
        }
      }
    },
    setCurrentQuestion: (state, action: PayloadAction<Question>) => {
      state.currentQuestion = action.payload;
      state.timeRemaining = action.payload.timeLimit;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    setInterviewActive: (state, action: PayloadAction<boolean>) => {
      state.isInterviewActive = action.payload;
    },
    setPaused: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatMessages.push(action.payload);
      if (state.currentCandidate) {
        state.currentCandidate.chatHistory.push(action.payload);
        const idx = state.candidates.findIndex(c => c.id === state.currentCandidate?.id);
        if (idx !== -1) state.candidates[idx] = { ...state.currentCandidate };
      }
    },
    clearChatMessages: (state) => {
      state.chatMessages = [];
    },
    setCollectingInfo: (state, action: PayloadAction<boolean>) => {
      state.isCollectingInfo = action.payload;
    },
    setMissingFields: (state, action: PayloadAction<string[]>) => {
      state.missingFields = action.payload;
    },
    addAnswer: (state, action: PayloadAction<Answer>) => {
      if (state.currentCandidate) {
        state.currentCandidate.answers.push(action.payload);
        state.currentCandidate.currentQuestionIndex += 1;
        state.currentCandidate.updatedAt = new Date();
        const idx = state.candidates.findIndex(c => c.id === state.currentCandidate?.id);
        if (idx !== -1) state.candidates[idx] = { ...state.currentCandidate };
      }
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    completeInterview: (state, action: PayloadAction<{ score: number; summary: string }>) => {
      if (state.currentCandidate) {
        state.currentCandidate.interviewStatus = 'completed';
        state.currentCandidate.finalScore = action.payload.score;
        state.currentCandidate.summary = action.payload.summary;
        state.isInterviewActive = false;
        state.currentQuestion = null;
        state.timeRemaining = 0;
        
        // Also update the candidate in the candidates array
        const candidateIndex = state.candidates.findIndex(c => c.id === state.currentCandidate?.id);
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex] = { ...state.currentCandidate };
        }
      }
    },
    resetInterview: (state) => {
      state.currentQuestion = null;
      state.timeRemaining = 0;
      state.isInterviewActive = false;
      state.isPaused = false;
      state.chatMessages = [];
      state.isCollectingInfo = false;
      state.missingFields = [];
      state.questions = undefined;
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  setCurrentQuestion,
  updateTimeRemaining,
  setInterviewActive,
  setPaused,
  addChatMessage,
  clearChatMessages,
  setCollectingInfo,
  setMissingFields,
  addAnswer,
  completeInterview,
  setQuestions,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;
