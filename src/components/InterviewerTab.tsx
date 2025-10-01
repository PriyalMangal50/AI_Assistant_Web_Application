import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Tag, 
  Button, 
  Input, 
  Space, 
  Modal, 
  Descriptions, 
  Progress,
  Empty,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  TrophyOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Candidate, Answer, ChatMessage } from '../types';

const { Title, Text } = Typography;
const { Search } = Input;

const InterviewerTab: React.FC = () => {
  const { candidates } = useSelector((state: RootState) => state.interview);
  const [searchText, setSearchText] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredCandidates = candidates
    .filter(candidate => 
      candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      // Handle cases where finalScore might be undefined
      const scoreA = a.finalScore ?? 0;
      const scoreB = b.finalScore ?? 0;
      
      if (sortOrder === 'asc') {
        return scoreA - scoreB;
      } else {
        return scoreB - scoreA;
      }
    });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Candidate) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'interviewStatus',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          'not_started': { color: 'default', text: 'Not Started' },
          'in_progress': { color: 'processing', text: 'In Progress' },
          'completed': { color: 'success', text: 'Completed' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Score',
      dataIndex: 'finalScore',
      key: 'score',
      render: (score: number | undefined) => (
        score ? (
          <div>
            <Text strong style={{ fontSize: 18, color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f' }}>
              {score}%
            </Text>
            <br />
            <Progress 
              percent={score} 
              size="small" 
              strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
              showInfo={false}
            />
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Interview Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Candidate) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setModalVisible(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a';
      case 'medium': return '#faad14';
      case 'hard': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const completedCandidates = candidates.filter(c => c.interviewStatus === 'completed');
  const averageScore = completedCandidates.length > 0 
    ? Math.round(completedCandidates.reduce((sum, c) => sum + (c.finalScore || 0), 0) / completedCandidates.length)
    : 0;

  return (
    <div className="interviewer-tab">
      <Card>
        <Title level={2}>Interview Dashboard</Title>
        <Text type="secondary">
          Monitor and review candidate interviews and performance.
        </Text>

        {/* Statistics */}
        <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Candidates"
                value={candidates.length}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed Interviews"
                value={completedCandidates.length}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={averageScore}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: getScoreColor(averageScore) }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={candidates.filter(c => c.interviewStatus === 'in_progress').length}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and Sort */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="Search candidates..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              Sort by Score {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Space>
        </div>

        {/* Candidates Table */}
        <Table
          columns={columns}
          dataSource={filteredCandidates}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                description="No candidates found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />

        {/* Candidate Details Modal */}
        <Modal
          title={`Interview Details - ${selectedCandidate?.name}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedCandidate && (
            <div>
              <Descriptions title="Candidate Information" bordered column={2} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={selectedCandidate.interviewStatus === 'completed' ? 'success' : 'processing'}>
                    {selectedCandidate.interviewStatus === 'completed' ? 'Completed' : 'In Progress'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Final Score" span={2}>
                  {selectedCandidate.finalScore ? (
                    <div>
                      <Text strong style={{ fontSize: 24, color: getScoreColor(selectedCandidate.finalScore) }}>
                        {selectedCandidate.finalScore}%
                      </Text>
                      <Progress 
                        percent={selectedCandidate.finalScore} 
                        strokeColor={getScoreColor(selectedCandidate.finalScore)}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  ) : (
                    <Text type="secondary">Not completed</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>

              {selectedCandidate.answers.length > 0 && (
                <div>
                  <Title level={4}>Interview Questions & Answers</Title>
                  {selectedCandidate.answers.map((answer: Answer, index: number) => (
                    <Card key={answer.questionId} style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Question {index + 1}:</Text>
                        <Tag 
                          color={getDifficultyColor(answer.difficulty)} 
                          style={{ marginLeft: 8 }}
                        >
                          {answer.difficulty.toUpperCase()}
                        </Tag>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          Time spent: {answer.timeSpent}s
                        </Text>
                      </div>
                      <Text style={{ display: 'block', marginBottom: 12 }}>
                        {answer.question}
                      </Text>
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Answer:</Text>
                        <div style={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: 12, 
                          borderRadius: 4, 
                          marginTop: 4 
                        }}>
                          {answer.answer}
                        </div>
                      </div>
                      {answer.score && (
                        <div style={{ marginBottom: 8 }}>
                          <Text strong>Score: </Text>
                          <Text style={{ color: getScoreColor(answer.score) }}>
                            {answer.score}%
                          </Text>
                        </div>
                      )}
                      {answer.feedback && (
                        <div>
                          <Text strong>Feedback: </Text>
                          <Text>{answer.feedback}</Text>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {selectedCandidate.interviewSummary && (
                <div style={{ marginTop: 32 }}>
                  <Title level={4}>AI Summary</Title>
                  <Card>
                    <Text>{selectedCandidate.interviewSummary}</Text>
                  </Card>
                </div>
              )}

              {selectedCandidate.chatHistory && selectedCandidate.chatHistory.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <Title level={4}>Chat History (Profile Collection)</Title>
                  <Card style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {selectedCandidate.chatHistory.map((msg: ChatMessage) => (
                      <div key={msg.id} style={{ marginBottom: 8 }}>
                        <Text strong style={{ color: msg.type === 'user' ? '#1890ff' : '#52c41a' }}>
                          {msg.type === 'user' ? 'Candidate' : 'System'}:
                        </Text>{' '}
                        <Text>{msg.content}</Text>
                      </div>
                    ))}
                  </Card>
                </div>
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default InterviewerTab;
