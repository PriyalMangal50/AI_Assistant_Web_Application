import React from 'react';
import { Alert, Typography, Card, Button, Space } from 'antd';
import { ExclamationCircleOutlined, ApiOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface APIConfigErrorProps {
  onRetry?: () => void;
}

const APIConfigError: React.FC<APIConfigErrorProps> = ({ onRetry }) => {
  return (
    <div style={{ padding: '20px 0' }}>
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ApiOutlined style={{ fontSize: '64px', color: '#ff4d4f', marginBottom: '16px' }} />
          
          <Title level={2} style={{ color: '#ff4d4f' }}>
            Gemini API Not Configured
          </Title>
          
          <Paragraph style={{ fontSize: '16px', maxWidth: '600px', margin: '0 auto 24px' }}>
            This application requires Google's Gemini AI to generate personalized interview questions 
            based on your resume. The API key is not currently configured.
          </Paragraph>

          <Alert
            message="Missing API Configuration"
            description={
              <div style={{ textAlign: 'left' }}>
                <p><strong>Environment variables required:</strong></p>
                <ul>
                  <li><code>GEMINI_API_KEY</code> - Server-side API key</li>
                  <li><code>REACT_APP_GEMINI_API_KEY</code> - Client-side indicator</li>
                </ul>
                <p><strong>How to fix:</strong></p>
                <ol>
                  <li>Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                  <li>Add both environment variables to your deployment (Vercel/Netlify)</li>
                  <li>Redeploy your application</li>
                </ol>
              </div>
            }
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            closable={false}
            style={{ textAlign: 'left', margin: '20px 0' }}
          />

          <Space>
            {onRetry && (
              <Button type="primary" onClick={onRetry}>
                Retry
              </Button>
            )}
            <Button 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank"
              rel="noopener noreferrer"
            >
              Get API Key
            </Button>
          </Space>

          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <Text type="secondary">
              <strong>Note:</strong> Without the API key, the application cannot generate personalized questions 
              based on your resume content. The AI features will not work.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default APIConfigError;