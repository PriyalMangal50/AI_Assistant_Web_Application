import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, Layout, Tabs, Typography } from 'antd';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';
import { store, persistor } from './store';
import IntervieweeTab from './components/IntervieweeTab';
import InterviewerTab from './components/InterviewerTab';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const tabItems = [
    {
      key: 'interviewee',
      label: (
        <span>
          <UserOutlined />
          Interviewee
        </span>
      ),
      children: <IntervieweeTab />,
    },
    {
      key: 'interviewer',
      label: (
        <span>
          <DashboardOutlined />
          Interviewer Dashboard
        </span>
      ),
      children: <InterviewerTab />,
    },
  ];

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
            },
          }}
        >
          <Layout className="app-layout">
            <Header className="app-header">
              <div className="header-content">
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  AI-Powered Interview Assistant
                </Title>
                <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Swipe Internship Assignment
                </Typography.Text>
              </div>
            </Header>
            <Content className="app-content">
              <Tabs
                defaultActiveKey="interviewee"
                items={tabItems}
                size="large"
                className="main-tabs"
              />
            </Content>
          </Layout>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;