# AI-Powered Interview Assistant

A React application that provides an AI-powered interview experience for both candidates and interviewers. Built as part of the Swipe Internship Assignment.

## Live Demo & Video

- Live Demo: https://swipe-ai-interview-assistant-self.vercel.app/
- Demo Video: (link to 2–5 min walkthrough once recorded)


## Features

### For Interviewees
- **Resume Upload**: Upload PDF or DOCX resumes with automatic text extraction
- **Profile Completion**: AI chatbot collects missing information (Name, Email, Phone)
- **Timed Interview**: 6 questions with different difficulty levels and time limits
  - 2 Easy questions (20 seconds each)
  - 2 Medium questions (60 seconds each) 
  - 2 Hard questions (120 seconds each)
- **Real-time Scoring**: AI evaluates answers and provides feedback
- **Progress Tracking**: Visual progress indicators and timers
- **Pause/Resume**: Ability to pause and resume interviews
- **Welcome Back Modal**: Restore unfinished sessions

### For Interviewers
- **Candidate Dashboard**: View all candidates with scores and status
- **Detailed Analytics**: Individual candidate performance breakdown
- **Search & Sort**: Find candidates by name or email, sort by score
- **Interview History**: Complete question-answer history for each candidate
- **AI Summaries**: Automated candidate assessment summaries
- **Statistics**: Overall performance metrics and averages

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **UI Library**: Ant Design
- **AI Integration**: Google DeepMind Gemini API
- **File Processing**: pdf-parse, mammoth (for DOCX)
- **HTTP Client**: Axios for API calls
- **Routing**: React Router DOM
- **Persistence**: localStorage via Redux Persist

## Installation

1. Clone the repository:
```bash
git clone https://github.com/snkttrivedi/Swipe-ai-interview-assistant.git
cd ai-interview-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Configure Google Gemini API (optional for enhanced AI features):
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Copy `.env.local.template` to `.env.local`
   - Add your API key: `REACT_APP_GEMINI_API_KEY=your_api_key_here`

4. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## AI Integration

This application integrates with **Google DeepMind Gemini API** to provide intelligent interview experiences:

### Features
- **Dynamic Question Generation**: Generates personalized questions based on candidate resumes
- **Intelligent Answer Analysis**: Evaluates technical accuracy, completeness, and communication skills
- **Comprehensive Summaries**: Creates detailed candidate assessments with recommendations
- **Fallback System**: Works without API key using rule-based algorithms for demo purposes

### Configuration
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Copy `.env.local.template` to `.env.local`
3. Add your API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```
4. Restart the development server

### API Status
The application automatically detects API availability and shows status in the console:
- ✅ **Configured**: Gemini API key found, AI features active
- ⚠️ **Fallback**: No API key, using demo mode with predefined questions

## Project Structure

```
src/
├── components/           # React components
│   ├── ResumeUpload.tsx     # Resume upload and parsing
│   ├── ChatBot.tsx          # AI chatbot for info collection
│   ├── InterviewFlow.tsx    # Main interview interface
│   ├── IntervieweeTab.tsx   # Candidate-facing interface
│   ├── InterviewerTab.tsx   # Interviewer dashboard
│   └── WelcomeBackModal.tsx # Session restoration modal
├── services/            # Business logic services
│   ├── resumeParser.ts      # PDF/DOCX text extraction
│   └── aiService.ts         # Gemini API integration with fallback
├── store/               # Redux store configuration
│   ├── index.ts            # Store setup with persistence
│   └── slices/
│       └── interviewSlice.ts # Interview state management
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx              # Main application component
└── App.css              # Global styles
```

## Key Features Implementation

### Resume Processing
- Supports PDF and DOCX file formats
- Extracts text using `pdf-parse` and `mammoth` libraries
- Uses regex patterns to identify Name, Email, and Phone
- Handles missing information gracefully

### AI Services
- **Gemini API Integration**: Real-time question generation and answer evaluation
- **Intelligent Scoring**: Context-aware evaluation with detailed feedback
- **Resume-based Questions**: Personalized questions based on candidate background
- **Fallback System**: Rule-based scoring when API is unavailable
- **Error Handling**: Graceful degradation with retry mechanisms

### State Management
- Redux Toolkit for predictable state updates
- Redux Persist for data persistence across sessions
- Local storage for offline functionality

### Responsive Design
- Mobile-first approach
- Ant Design components for consistent UI
- Custom CSS for enhanced styling
- Responsive breakpoints for different screen sizes

## Usage

### For Candidates
1. Switch to the "Interviewee" tab
2. Upload your resume (PDF or DOCX)
3. Complete any missing information via the chatbot
4. Start the interview when ready
5. Answer questions within the time limits
6. Review your results and feedback

### For Interviewers
1. Switch to the "Interviewer Dashboard" tab
2. View the list of all candidates
3. Use search and sort functionality
4. Click "View Details" to see individual performance
5. Review questions, answers, scores, and AI summaries

## Data Persistence

All interview data is automatically saved to localStorage and restored when the application is reopened. This includes:
- Candidate information
- Interview progress
- Answers and scores
- Chat history
- Session state

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Limitations (Current MVP)

| Area | Current Behavior | Planned Improvement |
|------|------------------|---------------------|
| PDF Parsing | Stub returns empty string (forces chatbot collection) | Integrate real pdf parsing (server or web worker) |
| Pause / Resume | UI pause only; timer not persisted mid-question | Persist remaining seconds & resume accurately |
| Refresh Mid-Question | Timer restarts for current question | Store start timestamp & recompute remaining time |
| Question Delivery | Separate interview panel (not chat-style) | Optional: unify into conversational flow |
| AI Reliability | Falls back silently to heuristic if Gemini fails | Add user-visible badge / status indicator |
| Scoring | Single-pass; no re-score option | Add re-evaluate trigger per answer |
| Summary | Generated once at end | Support regeneration / variant summaries |
| PDF vs DOCX | DOCX parsed via Mammoth; PDF placeholder | Add pdf-parse (server) or pdfjs (client) |

> These constraints are acceptable for the internship assignment scope and intentionally prioritized for core flow completion first.

## Deployment

1. Set environment variable `GEMINI_API_KEY` in Vercel Project Settings (Production + Preview).
2. (Optional) Add `REACT_APP_GEMINI_ENABLED=true` if you want a client-side feature flag.
3. Push to `main`; Vercel auto-builds using `vercel.json` (static build + serverless functions under `/api`).
4. Verify endpoints:
   - `/api/gemini-generate-questions`
   - `/api/gemini-score-answer`
   - `/api/gemini-summary`
5. Check browser console: fallback mode logs warning if Gemini not configured.

## Security Notes

- Gemini key is never exposed to the browser (only serverless functions reference `GEMINI_API_KEY`).
- Frontend falls back gracefully without the key (static questions + heuristic scoring).
- Do not commit a real `.env.local`; only the `.env.local.template` is tracked.

## Future Enhancements

- Integration with real AI APIs (OpenAI, Claude)
- Video interview capabilities
- Advanced analytics and reporting
- Multi-language support
- Custom question sets
- Real-time collaboration features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Swipe Internship Assignment.

## Demo & Video

| Item | Status |
|------|--------|
| Live Demo | Deployed at https://swipe-ai-interview-assistant-self.vercel.app/ |
| Video | Pending recording |

Add your final video link here once published.