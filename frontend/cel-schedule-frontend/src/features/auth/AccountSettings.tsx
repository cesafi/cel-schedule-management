import React, { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Divider,
  message,
  Space,
  Form,
  Input,
  Tag,
} from 'antd';
import {
  GoogleOutlined,
  GithubOutlined,
  WindowsOutlined,
  LinkOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { authApi } from '../../api';

const { Title, Text } = Typography;

const PROVIDER_META: Record<
  string,
  { label: string; icon: React.ReactNode; id: 'google.com' | 'github.com' | 'microsoft.com' }
> = {
  'google.com': { label: 'Google', icon: <GoogleOutlined />, id: 'google.com' },
  'github.com': { label: 'GitHub', icon: <GithubOutlined />, id: 'github.com' },
  'microsoft.com': { label: 'Microsoft', icon: <WindowsOutlined />, id: 'microsoft.com' },
};

export const AccountSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [linking, setLinking] = useState<string | null>(null);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm] = Form.useForm();

  if (!user) return null;

  const linkedProviderIds = user.providers ?? [];

  const handleLink = async (providerId: 'google.com' | 'github.com' | 'microsoft.com') => {
    setLinking(providerId);
    try {
      await authApi.linkProvider(providerId);
      await refreshUser();
      message.success(`${PROVIDER_META[providerId].label} account linked successfully`);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'auth/credential-already-in-use') {
        message.error('This account is already linked to another user.');
      } else if (e.code !== 'auth/popup-closed-by-user') {
        message.error(e.message ?? 'Failed to link account');
      }
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (providerId: string) => {
    // Prevent unlinking the last provider
    if (linkedProviderIds.length <= 1) {
      message.error('You must keep at least one sign-in method.');
      return;
    }
    setLinking(providerId);
    try {
      await authApi.unlinkProvider(providerId);
      await refreshUser();
      message.success(`${PROVIDER_META[providerId]?.label ?? providerId} unlinked`);
    } catch (err) {
      const e = err as { message?: string };
      message.error(e.message ?? 'Failed to unlink');
    } finally {
      setLinking(null);
    }
  };

  const handleChangePassword = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setChangingPw(true);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      message.success('Password changed successfully');
      pwForm.resetFields();
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'auth/wrong-password') {
        message.error('Current password is incorrect.');
      } else {
        message.error(e.message ?? 'Failed to change password');
      }
    } finally {
      setChangingPw(false);
    }
  };

  const hasPasswordProvider = linkedProviderIds.includes('password');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Title level={2}>Account Settings</Title>

      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>Account Information</Title>
        <Space direction="vertical" size="small">
          <div>
            <Text strong>Display Name: </Text>
            <Text>{user.username}</Text>
          </div>
          <div>
            <Text strong>Email: </Text>
            <Text>{user.email}</Text>
          </div>
          <div>
            <Text strong>Access Level: </Text>
            <Tag color={user.accessLevel === 1 ? 'red' : 'blue'}>
              {user.accessLevel === 1 ? 'Admin' : 'Department Head'}
            </Tag>
          </div>
        </Space>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>Connected Sign-In Methods</Title>
        <Divider />
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {Object.entries(PROVIDER_META).map(([id, meta]) => {
            const isLinked = linkedProviderIds.includes(id);
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{meta.icon}</span>
                <div style={{ flex: 1 }}>
                  <Text strong>{meta.label}</Text>
                  <br />
                  {isLinked ? (
                    <Text style={{ color: '#52c41a' }}>Connected</Text>
                  ) : (
                    <Text type="secondary">Not connected</Text>
                  )}
                </div>
                {isLinked ? (
                  <Button
                    icon={<DisconnectOutlined />}
                    danger
                    size="small"
                    loading={linking === id}
                    onClick={() => handleUnlink(id)}
                  >
                    Unlink
                  </Button>
                ) : (
                  <Button
                    icon={<LinkOutlined />}
                    size="small"
                    loading={linking === id}
                    onClick={() => handleLink(meta.id)}
                  >
                    Link
                  </Button>
                )}
              </div>
            );
          })}
        </Space>
      </Card>

      {hasPasswordProvider && (
        <Card>
          <Title level={4}>Change Password</Title>
          <Form
            form={pwForm}
            layout="vertical"
            onFinish={handleChangePassword}
            style={{ maxWidth: 400 }}
          >
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={changingPw}>
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

