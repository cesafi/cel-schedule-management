import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Divider, Space } from 'antd';
import { MailOutlined, LockOutlined, GoogleOutlined, GithubOutlined, WindowsOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { LoginDTO } from '../../types';

const { Title } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: LoginDTO) => {
    setLoading(true);
    setError(null);
    try {
      await login(values);
      navigate('/');
    } catch (err) {
      const e = err as { code?: string; message?: string };
      setError(
        e.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : e.message ?? 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (
    providerId: 'google.com' | 'github.com' | 'microsoft.com',
  ) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithProvider(providerId);
      navigate('/');
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(e.message ?? 'OAuth login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>CEL Volunteer Tracker</Title>
          <Typography.Text type="secondary">Sign in to your account</Typography.Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider>OR</Divider>

        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Button
            icon={<GoogleOutlined />}
            size="large"
            block
            onClick={() => handleOAuthLogin('google.com')}
            loading={loading}
            style={{ backgroundColor: '#fff', color: '#000', borderColor: '#ddd' }}
          >
            Continue with Google
          </Button>
          <Button
            icon={<GithubOutlined />}
            size="large"
            block
            onClick={() => handleOAuthLogin('github.com')}
            loading={loading}
          >
            Continue with GitHub
          </Button>
          <Button
            icon={<WindowsOutlined />}
            size="large"
            block
            onClick={() => handleOAuthLogin('microsoft.com')}
            loading={loading}
          >
            Continue with Microsoft
          </Button>
        </Space>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            CEL Volunteer Tracker - Secure Login
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
};

