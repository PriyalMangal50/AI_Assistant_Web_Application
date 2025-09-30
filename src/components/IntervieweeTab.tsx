import React, { useState, useEffect } from 'react';
import { Card, Typography, Steps, Button } from 'antd';
import { UserOutlined, FileTextOutlined, MessageOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  addCandidate, 
  updateCandidate, 
  setCollectingInfo, 
  setMissingFields,
  setInterviewActive,
  addAnswer,
  completeInterview,
  resetInterview,
  setQuestions
} from '../store/slices/interviewSlice';
import { ExtractedInfo } from '../services/resumeParser';
import { AIService } from '../services/aiService';
import ResumeUpload from './ResumeUpload';
import ChatBot from './ChatBot';
import InterviewFlow from './InterviewFlow';
import WelcomeBackModal from './WelcomeBackModal';

const { Title, Text } = Typography;

const IntervieweeTab: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    currentCandidate, 
    isCollectingInfo, 
    missingFields, 
    isInterviewActive,
    isPaused,
    questions: storedQuestions
  } = useSelector((state: RootState) => state.interview);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setLocalQuestions] = useState<any[]>(storedQuestions || []);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [, setCollectedInfo] = useState<{[key: string]: string}>({});
  const aiService = AIService.getInstance();

  useEffect(() => {
    // Check for existing interview session only once when component mounts
    if (currentCandidate && currentCandidate.interviewStatus === 'in_progress' && !isInterviewActive) {
      setShowWelcomeBack(true);
    }
  }, [currentCandidate, isInterviewActive]);

  const handleResumeParsed = (info: ExtractedInfo) => {
    // Check for missing or empty fields with strict validation
    const missing = [];
    if (!info.name || info.name.trim() === '' || info.name.length < 2) {
      missing.push('Name');
    }
    if (!info.email || info.email.trim() === '' || !info.email.includes('@')) {
      missing.push('Email');
    }
    if (!info.phone || info.phone.trim() === '' || info.phone.replace(/[^\d]/g, '').length < 10) {
      missing.push('Phone');
    }

    // Create candidate with only the successfully extracted and validated fields
    const candidate = {
      id: Date.now().toString(),
      name: (info.name && info.name.trim().length >= 2) ? info.name.trim() : '',
      email: (info.email && info.email.includes('@')) ? info.email.trim().toLowerCase() : '',
      phone: (info.phone && info.phone.replace(/[^\d]/g, '').length >= 10) ? info.phone.trim() : '',
      resumeText: info.text,
      interviewStatus: 'not_started' as const,
      currentQuestionIndex: 0,
      answers: [],
      chatHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch(addCandidate(candidate));
    dispatch(setMissingFields(missing));
    
    if (missing.length > 0) {
      // Need to collect missing information via chatbot
      setCurrentStep(1);
      dispatch(setCollectingInfo(true));
    } else {
      // All information found, can proceed to interview setup
      setCurrentStep(2);
    }
  };

  const handleInfoCollected = (field: string, value: string) => {
    setCollectedInfo(prev => ({ ...prev, [field]: value }));
    
    if (currentCandidate) {
      const updateData: any = {};
      if (field === 'Name') updateData.name = value;
      if (field === 'Email') updateData.email = value;
      if (field === 'Phone') updateData.phone = value;
      
      dispatch(updateCandidate(updateData));
    }
  };

  const handleAllInfoCollected = () => {
    dispatch(setCollectingInfo(false));
    setCurrentStep(2);
  };

  const startInterview = async () => {
    if (!currentCandidate) return;

    try {
      const generatedQuestions = await aiService.generateQuestions({
        name: currentCandidate.name,
        email: currentCandidate.email,
        phone: currentCandidate.phone,
        resumeText: currentCandidate.resumeText
      });

  setLocalQuestions(generatedQuestions);
  dispatch(setQuestions(generatedQuestions));
      dispatch(setInterviewActive(true));
      dispatch(updateCandidate({ interviewStatus: 'in_progress' }));
      setCurrentStep(3);
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const handleAnswerSubmit = (answer: any) => {
    dispatch(addAnswer(answer));
  };

  const handleInterviewComplete = async (answers: any[]) => {
    if (!currentCandidate) return;

    try {
      const { score, summary } = await aiService.generateSummary(currentCandidate, answers);
      dispatch(completeInterview({ score, summary }));
      setCurrentStep(4);
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  const handleResumeInterview = () => {
    setShowWelcomeBack(false);
    setCurrentStep(3);
    dispatch(setInterviewActive(true));
  };

  const handleStartNew = () => {
    dispatch(resetInterview());
    setCurrentStep(0);
    setQuestions([]);
    setCollectedInfo({});
    setShowWelcomeBack(false);
  };

  const handlePause = () => {
    // Pause logic would be implemented here
  };

  const handleResume = () => {
    // Resume logic would be implemented here
  };

  const steps = [
    {
      title: 'Upload Resume',
      icon: <FileTextOutlined />,
      description: 'Upload your resume to get started'
    },
    {
      title: 'Complete Profile',
      icon: <MessageOutlined />,
      description: 'Fill in missing information'
    },
    {
      title: 'Start Interview',
      icon: <PlayCircleOutlined />,
      description: 'Begin your AI-powered interview'
    },
    {
      title: 'Interview',
      icon: <UserOutlined />,
      description: 'Answer questions and get scored'
    }
  ];

  return (
    <div className="interviewee-tab">
      <Card>
        <Title level={2}>AI-Powered Interview Assistant</Title>
        <Text type="secondary">
          Welcome! Let's get you set up for your full-stack developer interview.
        </Text>

        <div style={{ marginTop: 24, marginBottom: 32 }}>
          <Steps current={currentStep} items={steps} />
        </div>

        {currentStep === 0 && (
          <ResumeUpload onResumeParsed={handleResumeParsed} />
        )}

        {currentStep === 1 && isCollectingInfo && (
          <ChatBot
            missingFields={missingFields}
            onInfoCollected={handleInfoCollected}
            onAllInfoCollected={handleAllInfoCollected}
          />
        )}

        {currentStep === 2 && (
          <Card>
            <Title level={3}>Ready to Start?</Title>
            <Text>
              Great! I have all the information I need. Your interview will consist of 6 questions:
              2 Easy (20s each), 2 Medium (60s each), and 2 Hard (120s each).
            </Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" size="large" onClick={startInterview}>
                Start Interview
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 3 && isInterviewActive && (
          <InterviewFlow
            questions={questions}
            currentQuestionIndex={currentCandidate?.currentQuestionIndex || 0}
            onAnswerSubmit={handleAnswerSubmit}
            onInterviewComplete={handleInterviewComplete}
            onPause={handlePause}
            onResume={handleResume}
            isPaused={isPaused}
            currentCandidate={currentCandidate}
          />
        )}

        {currentStep === 4 && (
          <Card>
            <Title level={3}>Interview Complete!</Title>
            <Text>
              Congratulations! You've completed the interview. Your results are being processed.
            </Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={handleStartNew}>
                Start New Interview
              </Button>
            </div>
          </Card>
        )}

        {showWelcomeBack && !isInterviewActive && (
          <WelcomeBackModal
            visible={showWelcomeBack}
            onResume={handleResumeInterview}
            onStartNew={handleStartNew}
          />
        )}
      </Card>
    </div>
  );
};

export default IntervieweeTab;
