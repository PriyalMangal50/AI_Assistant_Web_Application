import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Card, Button, Typography, Progress, Input, Space, Alert, Spin } from 'antd';
import { Question, Answer } from '../types';
import { AIService } from '../services/aiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface InterviewFlowProps {
  questions: Question[];
  currentQuestionIndex: number;
  onAnswerSubmit: (answer: Answer) => void;
  onInterviewComplete: (answers: Answer[]) => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
  currentCandidate: any;
}

const InterviewFlow: React.FC<InterviewFlowProps> = ({
  questions,
  currentQuestionIndex,
  onAnswerSubmit,
  onInterviewComplete,
  onPause,
  onResume,
  isPaused,
  currentCandidate
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const aiService = AIService.getInstance();

  const currentQuestion = questions[currentQuestionIndex];

  const submitAnswer = useCallback(async (answer: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsScoring(true);

    try {
      const { score, feedback } = await aiService.scoreAnswer(
        currentQuestion.text,
        answer,
        currentQuestion.difficulty
      );

      const answerObj: Answer = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer,
        difficulty: currentQuestion.difficulty,
        timeSpent: currentQuestion.timeLimit - timeRemaining,
        score,
        feedback
      };

      onAnswerSubmit(answerObj);

      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question
        setTimeout(() => {
          setCurrentAnswer('');
          setIsSubmitting(false);
          setIsScoring(false);
        }, 2000);
      } else {
        // Interview complete - get all answers from the candidate
        setTimeout(() => {
          // Get all answers from the current candidate
          const allAnswers = [...(currentCandidate?.answers || []), answerObj];
          onInterviewComplete(allAnswers);
          setIsSubmitting(false);
          setIsScoring(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error scoring answer:', error);
      setIsSubmitting(false);
      setIsScoring(false);
    }
  }, [isSubmitting, aiService, currentQuestion, currentQuestionIndex, questions.length, currentCandidate, onAnswerSubmit, onInterviewComplete, timeRemaining]);

  const handleTimeUp = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await submitAnswer(currentAnswer || 'No answer provided');
  }, [isSubmitting, currentAnswer, submitAnswer]);

  useEffect(() => {
    if (currentQuestion) {
      setTimeRemaining(currentQuestion.timeLimit);
      setCurrentAnswer('');
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (timeRemaining > 0 && !isPaused && !isSubmitting) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRemaining, isPaused, isSubmitting, handleTimeUp]);

  const handleSubmit = () => {
    if (currentAnswer.trim() && !isSubmitting) {
      submitAnswer(currentAnswer);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a';
      case 'medium': return '#faad14';
      case 'hard': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  if (!currentQuestion) {
    return (
      <Card>
        <Title level={3}>Interview Complete!</Title>
        <Text>Thank you for completing the interview. Your results are being processed.</Text>
      </Card>
    );
  }

  return (
    <Card className="interview-flow-card">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3}>Interview Question {currentQuestionIndex + 1} of {questions.length}</Title>
          <Button
            type={isPaused ? 'primary' : 'default'}
            icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            onClick={isPaused ? onResume : onPause}
            disabled={isSubmitting}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>
        
        <Progress 
          percent={getProgressPercentage()} 
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <div>
            <Text 
              strong 
              style={{ 
                color: getDifficultyColor(currentQuestion.difficulty),
                fontSize: 16,
                textTransform: 'uppercase'
              }}
            >
              {currentQuestion.difficulty}
            </Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              • {currentQuestion.category}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined />
            <Text 
              strong 
              style={{ 
                color: timeRemaining < 30 ? '#ff4d4f' : '#1890ff',
                fontSize: 18
              }}
            >
              {formatTime(timeRemaining)}
            </Text>
          </div>
        </div>

        <Card style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            {currentQuestion.text}
          </Title>
        </Card>
      </div>

      {isScoring && (
        <Alert
          message="Scoring your answer..."
          description="Please wait while we evaluate your response."
          type="info"
          icon={<Spin size="small" />}
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Your Answer:
        </Text>
        <TextArea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={6}
          disabled={isSubmitting || isPaused}
          style={{ marginBottom: 16 }}
        />
        
        <Space>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!currentAnswer.trim() || isSubmitting || isPaused}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
          
          {timeRemaining < 30 && timeRemaining > 0 && (
            <Text type="warning">
              ⚠️ Time is running out! Consider submitting your answer soon.
            </Text>
          )}
        </Space>
      </div>

      {timeRemaining === 0 && !isSubmitting && (
        <Alert
          message="Time's up!"
          description="Your answer has been automatically submitted."
          type="warning"
          showIcon
        />
      )}
    </Card>
  );
};

export default InterviewFlow;
