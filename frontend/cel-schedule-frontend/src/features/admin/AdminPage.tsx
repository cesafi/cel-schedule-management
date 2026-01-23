import React, { useState } from 'react';
import { Typography, Card, Tabs, Form, Input, Button, Select, Space, message, Divider } from 'antd';
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import { authApi, volunteersApi } from '../../api';
import { AuthUserCreateDTO, VolunteerCreateDTO, AccessLevel } from '../../types';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

export const AdminPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userForm] = Form.useForm();
  const [volunteerForm] = Form.useForm();

  const handleCreateUser = async (values: any) => {
    setLoading(true);
    try {
      const data: AuthUserCreateDTO = {
        username: values.username,
        password: values.password,
        volunteerId: values.volunteerId,
        accessLevel: values.accessLevel,
      };
      await authApi.createUser(data);
      message.success('User created successfully');
      userForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVolunteer = async (values: VolunteerCreateDTO) => {
    setLoading(true);
    try {
      await volunteersApi.create(values);
      message.success('Volunteer created successfully');
      volunteerForm.resetFields();
    } catch (error) {
      message.error('Failed to create volunteer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Admin Panel</Title>
      <Paragraph>Manage system users, volunteers, and view system logs</Paragraph>

      <Tabs defaultActiveKey="users">
        <TabPane tab="User Management" key="users" icon={<UserAddOutlined />}>
          <Card title="Create New User" style={{ maxWidth: 600 }}>
            <Form form={userForm} layout="vertical" onFinish={handleCreateUser}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter password' }]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>

              <Form.Item
                name="accessLevel"
                label="Access Level"
                rules={[{ required: true, message: 'Please select access level' }]}
                initialValue={AccessLevel.DEPTHEAD}
              >
                <Select>
                  <Select.Option value={AccessLevel.ADMIN}>Admin</Select.Option>
                  <Select.Option value={AccessLevel.DEPTHEAD}>Department Head</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="volunteerId"
                label="Linked Volunteer ID"
                rules={[{ required: true, message: 'Please enter volunteer ID' }]}
              >
                <Input placeholder="Enter volunteer ID to link" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<UserAddOutlined />}>
                  Create User
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="Volunteer Management" key="volunteers" icon={<TeamOutlined />}>
          <Card title="Create New Volunteer" style={{ maxWidth: 600 }}>
            <Form form={volunteerForm} layout="vertical" onFinish={handleCreateVolunteer}>
              <Form.Item
                name="name"
                label="Volunteer Name"
                rules={[{ required: true, message: 'Please enter volunteer name' }]}
              >
                <Input placeholder="Enter volunteer name" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<TeamOutlined />}>
                  Create Volunteer
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="System Logs" key="logs">
          <Card title="System Logs">
            <Paragraph>System logging interface - Coming soon</Paragraph>
            <Paragraph type="secondary">
              Will display system events such as user creation, data changes, and errors.
              Backend needs to implement logging endpoints.
            </Paragraph>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};
