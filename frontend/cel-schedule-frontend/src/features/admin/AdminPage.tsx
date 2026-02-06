import React, { useState } from 'react';
import { Typography, Card, Tabs, Form, Input, Button, Select, message } from 'antd';
import { UserAddOutlined, TeamOutlined, UploadOutlined } from '@ant-design/icons';
import { authApi, volunteersApi } from '../../api';
import { AuthUserCreateDTO, VolunteerCreateDTO, AccessLevel, LogType } from '../../types';
import { BatchImportWizard, LogFilters, SystemLogsTable, LogFilterValues } from './components';
import { useQueryClient } from '@tanstack/react-query';
import { useLogs } from '../../hooks';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

export const AdminPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [batchImportVisible, setBatchImportVisible] = useState(false);
  const [userForm] = Form.useForm();
  const [volunteerForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Logs state
  const [logFilters, setLogFilters] = useState<{
    logType?: LogType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit: number;
    offset: number;
  }>({ limit: 50, offset: 0 });

  const { data: logsData, isLoading: logsLoading } = useLogs(logFilters);

  const handleCreateUser = async (values: AuthUserCreateDTO) => {
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
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
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
    } catch (err) {
      console.error('Failed to create volunteer:', err);
      message.error('Failed to create volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchImportSuccess = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    message.success('Batch import completed! Data has been refreshed.');
  };

  const handleLogFilterChange = (filters: LogFilterValues) => {
    const newFilters: typeof logFilters = {
      limit: 50,
      offset: 0,
      logType: filters.logType,
      userId: filters.userId,
    };

    if (filters.dateRange && filters.dateRange.length === 2) {
      newFilters.startDate = filters.dateRange[0].toISOString();
      newFilters.endDate = filters.dateRange[1].toISOString();
    }

    setLogFilters(newFilters);
  };

  const handleLogFilterReset = () => {
    setLogFilters({ limit: 50, offset: 0 });
  };

  const handleLogPageChange = (page: number, pageSize: number) => {
    setLogFilters((prev) => ({
      ...prev,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    }));
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

        <TabPane tab="Batch Import" key="batch-import" icon={<UploadOutlined />}>
          <Card title="Batch Import Departments & Volunteers" style={{ maxWidth: 800 }}>
            <Paragraph>
              Import multiple departments and volunteers at once from an Excel file.
              Each column in the Excel file represents a department with its head and members.
            </Paragraph>
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              size="large"
              onClick={() => setBatchImportVisible(true)}
            >
              Start Batch Import
            </Button>
          </Card>
        </TabPane>

        <TabPane tab="System Logs" key="logs">
          <Card title="System Logs">
            <Paragraph>
              View and filter system audit logs including authentication, user management, and
              access control events.
            </Paragraph>
            <LogFilters onFilterChange={handleLogFilterChange} onReset={handleLogFilterReset} />
            <SystemLogsTable
              logs={logsData?.logs || []}
              total={logsData?.total || 0}
              loading={logsLoading}
              currentPage={Math.floor(logFilters.offset / logFilters.limit) + 1}
              pageSize={logFilters.limit}
              onPageChange={handleLogPageChange}
            />
          </Card>
        </TabPane>
      </Tabs>

      <BatchImportWizard
        visible={batchImportVisible}
        onClose={() => setBatchImportVisible(false)}
        onSuccess={handleBatchImportSuccess}
      />
    </div>
  );
};
