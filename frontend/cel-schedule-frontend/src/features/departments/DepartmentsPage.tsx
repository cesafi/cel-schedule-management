import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { departmentsApi, volunteersApi } from '../../api';
import { Department, DepartmentCreateDTO, Volunteer } from '../../types';
import { useAuth } from '../auth';
import { format } from 'date-fns';
import { DepartmentFormModal } from './modals/DepartmentFormModal';

const { Title } = Typography;

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (error: any) {
      message.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const data = await volunteersApi.getAll();
      setVolunteers(data.filter(v => !v.isDisabled));
    } catch (error) {
      message.error('Failed to load volunteers');
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchVolunteers();
  }, []);

  const handleCreate = () => {
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await departmentsApi.delete(id);
      message.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      message.error('Failed to delete department');
    }
  };

  const handleSubmit = async (values: DepartmentCreateDTO) => {
    try {
      await departmentsApi.create(values);
      message.success('Department created successfully');
      setModalOpen(false);
      fetchDepartments();
    } catch (error) {
      message.error('Failed to create department');
      throw error;
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'departmentName',
      key: 'departmentName',
      sorter: (a: Department, b: Department) => a.departmentName.localeCompare(b.departmentName),
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members: any[]) => members?.length || 0,
    },
    {
      title: 'Status',
      dataIndex: 'isDisabled',
      key: 'isDisabled',
      render: (isDisabled: boolean) => (
        <Tag color={isDisabled ? 'red' : 'green'}>
          {isDisabled ? 'Inactive' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Department) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/departments/${record.id}`)}
          >
            View
          </Button>
          {isAdmin && (
            <Popconfirm
              title="Delete department"
              description="Are you sure you want to delete this department?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Departments</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Department
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={departments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <DepartmentFormModal
        open={modalOpen}
        volunteers={volunteers}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
