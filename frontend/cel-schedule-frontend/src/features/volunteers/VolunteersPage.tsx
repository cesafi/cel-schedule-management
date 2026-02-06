import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { volunteersApi } from '../../api';
import { Volunteer, VolunteerCreateDTO } from '../../types';
import { useAuth } from '../auth';
import { format } from 'date-fns';
import { VolunteerFormModal } from './modals/VolunteerFormModal';

const { Title } = Typography;

export const VolunteersPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const data = await volunteersApi.getAll();
      setVolunteers(data);
    } catch (err) {
      console.error('Failed to load volunteers:', err);
      message.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleCreate = () => {
    setEditingVolunteer(null);
    setModalOpen(true);
  };

  const handleEdit = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await volunteersApi.delete(id);
      message.success('Volunteer deleted successfully');
      fetchVolunteers();
    } catch (err) {
      console.error('Failed to delete volunteer:', err);
      message.error('Failed to delete volunteer');
    }
  };

  const handleSubmit = async (values: VolunteerCreateDTO) => {
    try {
      if (editingVolunteer) {
        await volunteersApi.update(editingVolunteer.id, values);
        message.success('Volunteer updated successfully');
      } else {
        await volunteersApi.create(values);
        message.success('Volunteer created successfully');
      }
      setModalOpen(false);
      fetchVolunteers();
    } catch (err) {
      console.error(`Failed to ${editingVolunteer ? 'update' : 'create'} volunteer:`, err);
      message.error(`Failed to ${editingVolunteer ? 'update' : 'create'} volunteer`);
      throw err;
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Volunteer, b: Volunteer) => a.name.localeCompare(b.name),
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
      render: (_: unknown, record: Volunteer) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/volunteers/${record.id}`)}
          >
            View
          </Button>
          {isAdmin && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete volunteer"
                description="Are you sure you want to delete this volunteer?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Volunteers</Title>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Volunteer
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={volunteers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <VolunteerFormModal
        open={modalOpen}
        volunteer={editingVolunteer}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
