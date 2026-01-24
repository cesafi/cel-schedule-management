import React, { useState } from 'react';
import { Card, Button, Typography, Divider, message, Space } from 'antd';
import { GoogleOutlined, LinkOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { authApi } from '../../api';

const { Title, Text } = Typography;

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      // Verify user is logged in
      if (!user) {
        message.error('Please login first');
        return;
      }

      // Get Google OAuth URL
      const { url } = await authApi.getGoogleLoginURL();
      
      // Store flag that we're linking (not logging in)
      localStorage.removeItem('oauth_action'); // Clear any old value
      localStorage.setItem('oauth_action', 'link');
      
      console.log('Redirecting to Google for account linking...');
      
      // Redirect to Google OAuth
      window.location.href = url;
    } catch (error: any) {
      console.error('Failed to initiate Google linking:', error);
      message.error('Failed to initiate Google linking');
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Title level={2}>Account Settings</Title>

      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>Account Information</Title>
        <Space direction="vertical" size="small">
          <div>
            <Text strong>Username: </Text>
            <Text>{user.username}</Text>
          </div>
          <div>
            <Text strong>User ID: </Text>
            <Text type="secondary">{user.id}</Text>
          </div>
          <div>
            <Text strong>Access Level: </Text>
            <Text>{user.accessLevel === 1 ? 'Admin' : 'Department Head'}</Text>
          </div>
        </Space>
      </Card>

      <Card>
        <Title level={4}>Connected Accounts</Title>
        <Divider />
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space align="center">
              <GoogleOutlined style={{ fontSize: 24, color: user.thirdAuth?.provider === 'google' ? '#4285F4' : undefined }} />
              <div>
                <Text strong>Google Account</Text>
                <br />
                {user.thirdAuth?.provider === 'google' ? (
                  <Text style={{ color: '#52c41a' }}>
                    Connected: {user.thirdAuth.email}
                  </Text>
                ) : (
                  <Text type="secondary">
                    Link your Google account to sign in with Google
                  </Text>
                )}
              </div>
            </Space>
            
            {!user.thirdAuth?.provider && (
              <div style={{ marginTop: 10 }}>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={handleLinkGoogle}
                  loading={loading}
                >
                  Link Google Account
                </Button>
              </div>
            )}
          </div>
        </Space>
      </Card>
    </div>
  );
};
