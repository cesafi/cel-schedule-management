import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { departmentsApi, volunteersApi } from '../../api';
import { Department, DepartmentCreateDTO, DepartmentUpdateDTO, Volunteer } from '../../types';
import { useAuth } from '../auth';
import { format } from 'date-fns';
import { DepartmentFormModal } from './modals/DepartmentFormModal';
import { DepartmentEditModal } from './modals/DepartmentEditModal';

const { Title } = Typography;

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchDepartments = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = isAdmin
        ? await departmentsApi.getAllIncludingDisabled()
        : await departmentsApi.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
      message.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await volunteersApi.getAll();
      setVolunteers(data.filter(v => !v.isDisabled));
    } catch (err) {
      console.error('Failed to load volunteers:', err);
      message.error('Failed to load volunteers');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchDepartments();
    fetchVolunteers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, isAdmin]);

  const handleCreate = () => {
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await departmentsApi.delete(id);
      message.success('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department:', err);
      message.error('Failed to delete department');
    }
  };

  const handleSubmit = async (values: DepartmentCreateDTO) => {
    try {
      await departmentsApi.create(values);
      message.success('Department created successfully');
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to create department:', err);
      message.error('Failed to create department');
      throw err;
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
  };

  const handleEditSubmit = async (values: DepartmentUpdateDTO) => {
    if (!editingDepartment) return;
    try {
      await departmentsApi.update(editingDepartment.id, values);
      message.success('Department updated successfully');
      setEditingDepartment(null);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to update department:', err);
      message.error('Failed to update department');
      throw err;
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'departmentName',
      key: 'departmentName',
      sorter: (a: Department, b: Department) => a.departmentName.localeCompare(b.departmentName),
      render: (name: string, record: Department) => (
        <Space size="small">
          <span style={{
            textDecoration: record.isDisabled ? 'line-through' : undefined,
            color: record.isDisabled ? '#999' : undefined,
          }}>{name}</span>
          {isAdmin && record.isDisabled && <Tag color="red">Deleted</Tag>}
        </Space>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'volunteerMembers',
      key: 'members',
      render: (members: unknown[]) => (Array.isArray(members) ? members.length : 0),
    },
    // WIP TODO
    // {
    //   title: 'Head',
    //   dataIndex: 'volunteerMembers',
    //   key: 'members',
    //   render: (members: MembershipInfo[]) => members === MembershipType.Head ? 1 : 0,
    // },


    {
      title: 'Status',
      dataIndex: 'isDisabled',
      key: 'isDisabled',
      render: (isDisabled: boolean) => (
        <Tag color={isDisabled ? 'red' : 'green'}>
          {isDisabled ? 'Deleted' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '-' : format(d, 'MMM dd, yyyy');
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Department) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/departments/${record.id}`)}
          >
            View
          </Button>
          {isAdmin && !record.isDisabled && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {isAdmin && !record.isDisabled && (
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

  const rowClassName = (record: Department) =>
    record.isDisabled ? 'department-row-deleted' : '';

  return (
    <div>
      <style>{`
        .department-row-deleted > td {
          background-color: rgba(255, 77, 79, 0.07) !important;
          opacity: 0.65;
        }
        .department-row-deleted {
          border-left: 4px solid #ff4d4f;
        }
        .department-row-deleted:hover > td {
          background-color: rgba(255, 77, 79, 0.12) !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Departments</Title>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Department
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={departments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName={rowClassName}
      />

      <DepartmentFormModal
        open={modalOpen}
        volunteers={volunteers}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <DepartmentEditModal
        open={!!editingDepartment}
        department={editingDepartment}
        onCancel={() => setEditingDepartment(null)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

