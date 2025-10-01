import React, { useState, useEffect, useRef } from 'react';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Input, Button, Card, Typography, Avatar, Spin } from 'antd';
import { ChatMessage } from '../types';
import { useDispatch } from 'react-redux';
import { addChatMessage } from '../store/slices/interviewSlice';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChatBotProps {
  missingFields: string[];
  onInfoCollected: (field: string, value: string) => void;
  onAllInfoCollected: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ 
  missingFields, 
  onInfoCollected, 
  onAllInfoCollected 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Removed unused aiService instance (was previously created but not used)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (missingFields.length > 0 && messages.length === 0) {
      const currentField = missingFields[0];
      let specificPrompt = '';
      
      if (currentField === 'Name') {
        specificPrompt = 'I need your full name to continue. Please provide your first and last name.';
      } else if (currentField === 'Email') {
        specificPrompt = 'I need your email address to continue. Please provide a valid email (e.g., "your.name@gmail.com").';
      } else if (currentField === 'Phone') {
        specificPrompt = 'I need your phone number to continue. Please provide a valid phone number (e.g., "(+91) 12123-4567").';
      }
      
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        type: 'ai',
        content: `Hello! I've processed your resume and need to collect some additional information before we can start the interview.\n\nMissing fields: ${missingFields.join(', ')}\n\nLet's start with your ${currentField.toLowerCase()}. ${specificPrompt}`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      dispatch(addChatMessage(welcomeMessage));
    }
  }, [missingFields, dispatch, messages.length]); // Added messages.length to dependencies

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

  setMessages(prev => [...prev, userMessage]);
  dispatch(addChatMessage(userMessage));
    const userInput = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    // Validate input based on current field with detailed feedback
    setTimeout(async () => {
      const currentField = missingFields[currentFieldIndex];
      let isValid = false;
      let validationMessage = '';
      
      if (currentField === 'Name') {
        isValid = validateName(userInput);
        if (isValid) {
          validationMessage = `Perfect! I have your name: "${userInput}".`;
        } else {
          // Provide specific feedback for name validation failure
          if (userInput.length < 2) {
            validationMessage = 'Please provide a longer name. I need at least your first and last name.';
          } else if (!/^[A-Za-z\s]+$/.test(userInput)) {
            validationMessage = 'Please use only letters and spaces in your name. No numbers or special characters.';
          } else if (userInput.trim().split(/\s+/).length < 2) {
            validationMessage = 'Please provide both your first and last name.';
          } else {
            validationMessage = 'Please provide a valid full name with only letters.';
          }
        }
      } else if (currentField === 'Email') {
        isValid = validateEmail(userInput);
        if (isValid) {
          validationMessage = `Great! I have your email: ${userInput.toLowerCase()}.`;
        } else {
          // Provide specific feedback for email validation failure
          if (!userInput.includes('@')) {
            validationMessage = 'Please include an @ symbol in your email address.';
          } else if (!userInput.includes('.')) {
            validationMessage = 'Please include a domain with a dot (e.g., gmail.com) in your email.';
          } else if (userInput.includes('example.com') || userInput.includes('test.com')) {
            validationMessage = 'Please provide your real email address, not an example one.';
          } else {
            validationMessage = 'Please provide a valid email address like "your.name@gmail.com".';
          }
        }
      } else if (currentField === 'Phone') {
        isValid = validatePhone(userInput);
        if (isValid) {
          // Format the phone for display
          const digitsOnly = userInput.replace(/[^\d]/g, '');
          let formattedPhone = userInput;
          if (digitsOnly.length === 10) {
            formattedPhone = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
          }
          validationMessage = `Excellent! I have your phone number: ${formattedPhone}.`;
        } else {
          // Provide specific feedback for phone validation failure
          const digitsOnly = userInput.replace(/[^\d]/g, '');
          if (digitsOnly.length < 10) {
            validationMessage = 'Please provide a phone number with at least 10 digits.';
          } else if (digitsOnly.length > 11) {
            validationMessage = 'Please provide a shorter phone number (maximum 15 digits).';
          } else {
            validationMessage = 'Please provide a valid phone number like "(+91) 12123-4567" or "(+91) 12123-4567".';
          }
        }
      }
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: validationMessage,
        timestamp: new Date().toISOString(),
      };

  setMessages(prev => [...prev, aiMessage]);
  dispatch(addChatMessage(aiMessage));
      setIsTyping(false);

      // If valid, collect the field and move to next or complete
      if (isValid && currentField) {
        // Use the properly formatted value for storage
        let valueToStore = userInput;
        if (currentField === 'Email') {
          valueToStore = userInput.toLowerCase().trim();
        } else if (currentField === 'Phone') {
          const digitsOnly = userInput.replace(/[^\d]/g, '');
          if (digitsOnly.length === 10) {
            valueToStore = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
          }
        }
        
        onInfoCollected(currentField, valueToStore);
        
        if (currentFieldIndex < missingFields.length - 1) {
          setCurrentFieldIndex(prev => prev + 1);
          setTimeout(() => {
            const nextField = missingFields[currentFieldIndex + 1];
            let nextPrompt = '';
            
            if (nextField === 'Email') {
              nextPrompt = 'Now I need your email address. Please provide your email (e.g., "your.name@gmail.com").';
            } else if (nextField === 'Phone') {
              nextPrompt = 'Finally, I need your phone number. Please provide your phone number (e.g., "(+91) 12123-4567").';
            } else if (nextField === 'Name') {
              nextPrompt = 'Now I need your full name. Please provide your first and last name.';
            }
            
            const nextFieldMessage: ChatMessage = {
              id: `next-${Date.now()}`,
              type: 'ai',
              content: nextPrompt,
              timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, nextFieldMessage]);
            dispatch(addChatMessage(nextFieldMessage));
          }, 1500);
        } else {
          setTimeout(() => {
            const completeMessage: ChatMessage = {
              id: `complete-${Date.now()}`,
              type: 'ai',
              content: 'Perfect! I now have all the information needed:\n\n' +
                      `✓ Name: Complete\n` +
                      `✓ Email: Complete\n` +
                      `✓ Phone: Complete\n\n` +
                      'You\'re all set to start the interview. Good luck!',
              timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, completeMessage]);
            dispatch(addChatMessage(completeMessage));
            onAllInfoCollected();
          }, 1500);
        }
      }
    }, 800);
  };
  
  const validateName = (name: string): boolean => {
    const trimmedName = name.trim();
    
    // Check basic requirements
    if (trimmedName.length < 2 || trimmedName.length > 50) return false;
    
    // Must contain only letters and spaces
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) return false;
    
    // Split into words and validate
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
    
    // Must have at least 2 words (first and last name)
    if (words.length < 2 || words.length > 4) return false;
    
    // Each word must be at least 2 characters and properly capitalized for validation
    const validWords = words.every(word => {
      return word.length >= 2 && /^[A-Za-z]+$/.test(word);
    });
    
    // Check against common job titles and excluded words
    const excludedWords = [
      'software', 'developer', 'engineer', 'programmer', 'designer', 'manager',
      'senior', 'junior', 'lead', 'admin', 'assistant', 'intern', 'student'
    ];
    const hasExcludedWords = words.some(word => 
      excludedWords.includes(word.toLowerCase())
    );
    
    return validWords && !hasExcludedWords;
  };
  
  const validateEmail = (email: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(trimmedEmail)) return false;
    
    // Additional validations
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) return false;
    
    const [localPart, domain] = parts;
    
    // Local part validations
    if (localPart.length < 1 || localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;
    
    // Domain validations
    if (domain.length < 4 || domain.length > 255) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    if (domain.includes('..')) return false;
    
    // Exclude obvious test/example emails
    const excludedDomains = ['example.com', 'test.com', 'sample.com', 'domain.com'];
    if (excludedDomains.includes(domain)) return false;
    
    return true;
  };
  
  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Remove + if it's not at the beginning
    const normalizedPhone = cleanPhone.replace(/^(\+?)(.*?)\+.*$/, '$1$2');
    
    // Count digits only
    const digitsOnly = normalizedPhone.replace(/\+/g, '');
    
    // Must have between 10-15 digits
    if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;
    
    // Basic format validations for common patterns
    const phonePatterns = [
      /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US format
      /^\+?91[6-9]\d{9}$/, // Indian format
      /^\+?[1-9]\d{7,14}$/ // International format
    ];
    
    return phonePatterns.some(pattern => pattern.test(normalizedPhone));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="chatbot-card">
      <Title level={4}>Complete Your Profile</Title>
      <Text type="secondary">
        I need to collect some missing information before we start the interview.
      </Text>

      <div className="chat-messages" style={{ 
        height: 300, 
        overflowY: 'auto', 
        border: '1px solid #f0f0f0', 
        borderRadius: 8, 
        padding: 16, 
        marginTop: 16,
        backgroundColor: '#fafafa'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              marginBottom: 16,
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: '80%' }}>
              {message.type === 'ai' && (
                <Avatar 
                  icon={<RobotOutlined />} 
                  style={{ backgroundColor: '#1890ff', marginRight: 8, marginTop: 4 }}
                />
              )}
              <div
                style={{
                  backgroundColor: message.type === 'user' ? '#1890ff' : '#fff',
                  color: message.type === 'user' ? '#fff' : '#000',
                  padding: '8px 12px',
                  borderRadius: 12,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                <Text style={{ color: message.type === 'user' ? '#fff' : '#000' }}>
                  {message.content}
                </Text>
              </div>
              {message.type === 'user' && (
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: '#52c41a', marginLeft: 8, marginTop: 4 }}
                />
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Avatar 
              icon={<RobotOutlined />} 
              style={{ backgroundColor: '#1890ff', marginRight: 8 }}
            />
            <div style={{ backgroundColor: '#fff', padding: '8px 12px', borderRadius: 12 }}>
              <Spin size="small" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response here..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isTyping}
        >
          Send
        </Button>
      </div>
    </Card>
  );
};

export default ChatBot;
