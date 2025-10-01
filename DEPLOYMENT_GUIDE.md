# Deployment Guide

## Environment Variables for Vercel

When deploying to Vercel, you need to set the following environment variables in your project settings:

### Required Environment Variables

1. **GEMINI_API_KEY** (Server-side)
   - This is your Google Gemini API key
   - Used by the API endpoints in the `/api` folder
   - Never exposed to the client
   - Example: `AIzaSyDZCuFvdl-0trzOIQTuZF0jUcY3UGp9wTA`

2. **REACT_APP_GEMINI_API_KEY** (Client-side indicator - optional)
   - Used to indicate to the frontend that Gemini is configured
   - Can be the same value as GEMINI_API_KEY
   - This is just an indicator - the actual API calls go through the `/api` endpoints

### How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
REACT_APP_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and use it in your environment variables

### Features Enabled with Proper Configuration

When the API key is properly configured, the application will:

✅ **Dynamic Question Generation**: Questions are generated based on the candidate's resume content, skills, and experience
✅ **Enhanced Resume Parsing**: Extracts skills, experience, education, job titles, and years of experience
✅ **AI-Powered Scoring**: Each answer is scored by Gemini AI with detailed feedback
✅ **Intelligent Summaries**: Comprehensive interview evaluation reports

### Fallback Mode

If no API key is configured, the application will still work with:
- Predefined question bank (randomly selected)
- Basic heuristic scoring
- Simple interview summaries

### Build Requirements

Make sure your `package.json` includes:
```json
"pdfjs-dist": "^3.11.174"
```

This is required for PDF resume parsing and is already included in the project.

### Vercel Deployment Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

The API endpoints are automatically deployed as Vercel serverless functions from the `/api` folder.