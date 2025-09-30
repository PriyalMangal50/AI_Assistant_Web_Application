import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface WelcomeBackModalProps {
  visible: boolean;
  onResume: () => void;
  onStartNew: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  visible,
  onResume,
  onStartNew
}) => {
  return (
    <Modal
      title="Welcome Back!"
      open={visible}
      footer={null}
      closable={false}
      centered
      width={500}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3}>You have an unfinished interview session</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Would you like to continue where you left off or start fresh?
        </Text>
        
        <Space size="large">
          <Button 
            type="primary" 
            size="large" 
            icon={<PlayCircleOutlined />}
            onClick={onResume}
          >
            Resume Interview
          </Button>
          <Button 
            size="large" 
            icon={<ReloadOutlined />}
            onClick={onStartNew}
          >
            Start New
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;
