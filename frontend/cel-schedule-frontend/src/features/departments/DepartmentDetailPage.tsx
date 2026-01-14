import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Descriptions, Table, Button, Tag, Spin, message } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { departmentsApi, volunteersApi } from '../../api';
import { Department, StatusHistoryItem, Volunteer, MembershipType, AddMemberDTO } from '../../types';
import { format } from 'date-fns';
import { AddMemberModal } from './modals/AddMemberModal';

const { Title } = Typography;

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [deptData, historyData, volunteersData] = await Promise.all([
        departmentsApi.getById(id),
        departmentsApi.getStatusHistory(id),
        volunteersApi.getAll(),
      ]);
      setDepartment(deptData);
      setHistory(historyData);
      setVolunteers(volunteersData.filter(v => !v.isDisabled));
    } catch (error) {
      message.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddMember = async (values: AddMemberDTO) => {
    if (!id) return;
    
    try {
      await departmentsApi.addMember(id, values);
      message.success('Member added successfully');
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Failed to add member');
      throw error;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!department) {
    return <div>Department not found</div>;
  }

  const memberColumns = [
    {
      title: 'Volunteer',
      dataIndex: 'volunteerID',
      key: 'volunteerID',
      render: (volunteerId: string) => {
        const volunteer = volunteers.find(v => v.id === volunteerId);
        return volunteer ? (
          <Button type="link" onClick={() => navigate(`/volunteers/${volunteerId}`)}>
            {volunteer.name}
          </Button>
        ) : volunteerId;
      },
    },
    {
      title: 'Role',
      dataIndex: 'membershipType',
      key: 'membershipType',
      render: (type: MembershipType) => (
        <Tag color={type === MembershipType.HEAD ? 'blue' : 'default'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
      render: (date: string) => {
        if (!date) return '-';
        try {
          return format(new Date(date), 'MMM dd, yyyy');
        } catch {
          return '-';
        }
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => {
        if (!date) return '-';
        try {
          return format(new Date(date), 'MMM dd, yyyy');
        } catch {
          return '-';
        }
      },
    },
  ];

  const historyColumns = [
    {
      title: 'Event',
      dataIndex: 'eventName',
      key: 'eventName',
    },
    {
      title: 'Date',
      dataIndex: 'timeAndDate',
      key: 'timeAndDate',
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: StatusHistoryItem) => (
        <Button type="link" onClick={() => navigate(`/events/${record.eventId}`)}>
          View Event
        </Button>
      ),
    },
  ];

  const availableVolunteers = volunteers.filter(
    v => !department.volunteerMembers?.some(m => m.volunteerID === v.id)
  );

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/departments')}
        style={{ marginBottom: 16 }}
      >
        Back to Departments
      </Button>

      <Card>
        <Title level={2}>{department.departmentName}</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">{department.id}</Descriptions.Item>
          <Descriptions.Item label="Department Head">
            {(() => {
              const head = department.volunteerMembers?.find(m => m.membershipType === MembershipType.HEAD);
              if (head) {
                const headVolunteer = volunteers.find(v => v.id === head.volunteerID);
                return headVolunteer ? (
                  <Button type="link" onClick={() => navigate(`/volunteers/${head.volunteerID}`)}>
                    {headVolunteer.name}
                  </Button>
                ) : head.volunteerID;
              }
              return 'None';
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={department.isDisabled ? 'red' : 'green'}>
              {department.isDisabled ? 'Inactive' : 'Active'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Total Members">
            {department.volunteerMembers?.length || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {format(new Date(department.createdAt), 'MMM dd, yyyy HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card 
        style={{ marginTop: 24 }} 
        title="Members"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Add Member
          </Button>
        }
      >
        <Table
          columns={memberColumns}
          dataSource={department.volunteerMembers}
          rowKey="volunteerID"
          pagination={false}
        />
      </Card>

      <Card style={{ marginTop: 24 }} title="Event History">
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="eventId"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <AddMemberModal
        open={modalOpen}
        availableVolunteers={availableVolunteers}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleAddMember}
      />
    </div>
  );
};
