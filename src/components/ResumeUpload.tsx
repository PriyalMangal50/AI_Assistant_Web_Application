import React, { useState } from 'react';
import { FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Upload as AntUpload, Card, Typography, Alert, Spin } from 'antd';
import { parseResume, ExtractedInfo } from '../services/resumeParser';

const { Title, Text } = Typography;
const { Dragger } = AntUpload;

interface ResumeUploadProps {
  onResumeParsed: (info: ExtractedInfo) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onResumeParsed }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setExtractedInfo(null);
    
    // Validate file type before processing
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document (.pdf, .docx, .doc)');
      setLoading(false);
      return false;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be smaller than 10MB');
      setLoading(false);
      return false;
    }
    
    try {
      const info = await parseResume(file);
      
      // Count successfully extracted and validated fields
      const extractedFields = getExtractedFields(info);
      const missingFields = getMissingFields(info);
      
      setExtractedInfo(info);
      
      if (extractedFields.length > 0) {
        if (missingFields.length === 0) {
          // All fields found
          console.log('Resume processed successfully! All required information was found.');
        } else {
          // Some fields found, some missing
          console.log(`Resume processed! Found: ${extractedFields.join(', ')}. Still need: ${missingFields.join(', ')}.`);
        }
      } else {
        // No fields were extracted
        console.log('Resume processed but no contact information could be automatically extracted.');
      }
      
      onResumeParsed(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
    
    return false; // Prevent default upload behavior
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.docx,.doc',
    beforeUpload: handleFileUpload,
    showUploadList: false,
    disabled: loading,
  };

  const getMissingFields = (info: ExtractedInfo) => {
    const missing = [];
    // Use the same validation logic as the main parsing
    if (!info.name || info.name.trim().length < 2) missing.push('Name');
    if (!info.email || !info.email.includes('@')) missing.push('Email');
    if (!info.phone || info.phone.replace(/[^\d]/g, '').length < 10) missing.push('Phone');
    return missing;
  };

  const getExtractedFields = (info: ExtractedInfo) => {
    const extracted = [];
    // Use the same validation logic as the main parsing
    if (info.name && info.name.trim().length >= 2) extracted.push('Name');
    if (info.email && info.email.includes('@')) extracted.push('Email');
    if (info.phone && info.phone.replace(/[^\d]/g, '').length >= 10) extracted.push('Phone');
    return extracted;
  };

  return (
    <Card className="resume-upload-card">
      <Title level={3}>Upload Your Resume</Title>
      <Text type="secondary">
        Please upload your resume in PDF or Word format. We'll extract your contact information automatically using advanced text parsing.
      </Text>
      
      <div style={{ marginTop: 24 }}>
        <Dragger {...uploadProps} style={{ padding: '40px 20px' }}>
        <p className="ant-upload-drag-icon">
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for PDF and Word documents (.pdf, .docx, .doc) up to 10MB
          </p>
        </Dragger>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Spin size="large" />
          <p>Parsing your resume...</p>
        </div>
      )}

      {error && (
        <Alert
          message="Upload Error"
          description={error}
          type="error"
          showIcon
          closable={false}
          style={{ marginTop: 16 }}
        />
      )}

      {extractedInfo && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Extracted Information</Title>
          
          <div style={{ marginBottom: 16 }}>
            {getExtractedFields(extractedInfo).includes('Name') ? (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong>Name: {extractedInfo.name}</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <Text type="warning">Name: Not found</Text>
              </div>
            )}
            
            {getExtractedFields(extractedInfo).includes('Email') ? (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong>Email: {extractedInfo.email}</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <Text type="warning">Email: Not found</Text>
              </div>
            )}
            
            {getExtractedFields(extractedInfo).includes('Phone') ? (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong>Phone: {extractedInfo.phone}</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <Text type="warning">Phone: Not found</Text>
              </div>
            )}
          </div>

          {getMissingFields(extractedInfo).length > 0 && (
            <Alert
              message="Missing Information"
              description={`We couldn't find the following information in your resume: ${getMissingFields(extractedInfo).join(', ')}. Our AI assistant will help you provide this information before starting the interview.`}
              type="warning"
              showIcon
              closable={false}
            />
          )}
          
          {getMissingFields(extractedInfo).length === 0 && (
            <Alert
              message="All Information Found"
              description="Great! We found all the required information in your resume. You can proceed to start the interview."
              type="success"
              showIcon
              closable={false}
            />
          )}
        </div>
      )}
    </Card>
  );
};

export default ResumeUpload;
