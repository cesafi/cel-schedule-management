import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Descriptions, Table, Button, Tag, Spin, message, Popconfirm, Tabs, Row, Col } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CalendarOutlined, TeamOutlined, LineChartOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { departmentsApi, volunteersApi } from '../../api';
import { Department, StatusHistoryItem, Volunteer, MembershipType, AddMemberDTO } from '../../types';
import { format } from 'date-fns';
import { AddMemberModal } from './modals/AddMemberModal';
import { useAuth } from '../auth';
import { StatsCard, AttendancePieChart, AttendanceTrendChart, DateRangePicker } from '../../components';
import { useDepartmentAnalytics, useUpcomingEvents } from '../../hooks';
import { filterEventsByDateRange } from '../../utils/analytics';

const { Title } = Typography;

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isHeadOfDepartment } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Use analytics hooks
  const { stats, distribution, trendData, memberPerformance, isLoading: analyticsLoading } = useDepartmentAnalytics(id || '');
  const { upcomingEvents, isLoading: upcomingLoading } = useUpcomingEvents({ departmentId: id });

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
    } catch (err) {
      console.error('Failed to load department data:', err);
      message.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // fetchData is stable as it doesn't use any state/props except id

  // Check if user can manage this department
  const canManage = isAdmin || (id ? isHeadOfDepartment(id) : false);

  // Filter history by date range - moved before early returns
  const filteredHistory = useMemo(() => {
    if (!startDate && !endDate) return history;
    
    return history.filter(item => {
      const itemDate = new Date(item.timeAndDate);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate)) return false;
      return true;
    });
  }, [history, startDate, endDate]);

  // Available volunteers - moved before early returns
  const availableVolunteers = useMemo(() => {
    return volunteers.filter(
      v => !department?.volunteerMembers?.some(m => m.volunteerID === v.id)
    );
  }, [volunteers, department]);

  const handleAddMember = async (values: AddMemberDTO) => {
    if (!id) return;
    
    try {
      await departmentsApi.addMember(id, values);
      message.success('Member added successfully');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add member:', err);
      message.error('Failed to add member');
      throw err;
    }
  };

  const handleRemoveMember = async (volunteerId: string) => {
    if (!id) return;
    
    try {
      await departmentsApi.removeMember(id, volunteerId);
      message.success('Member removed successfully');
      fetchData();
    } catch (err) {
      console.error('Failed to remove member:', err);
      message.error('Failed to remove member');
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
        const performance = memberPerformance.find(p => p.volunteerId === volunteerId);
        return volunteer ? (
          <div>
            <Button type="link" onClick={() => navigate(`/volunteers/${volunteerId}`)}>
              {volunteer.name}
            </Button>
            {performance && performance.eventsAttended > 0 && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {performance.eventsAttended} events
              </div>
            )}
          </div>
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
      title: 'Attendance Rate',
      key: 'attendanceRate',
      render: (_: unknown, record: { volunteerID: string }) => {
        const performance = memberPerformance.find(p => p.volunteerId === record.volunteerID);
        if (!performance || performance.eventsAttended === 0) return '-';
        return (
          <Tag color={performance.attendanceRate >= 80 ? 'green' : performance.attendanceRate >= 60 ? 'orange' : 'red'}>
            {performance.attendanceRate}%
          </Tag>
        );
      },
      sorter: (a: { volunteerID: string }, b: { volunteerID: string }) => {
        const perfA = memberPerformance.find(p => p.volunteerId === a.volunteerID);
        const perfB = memberPerformance.find(p => p.volunteerId === b.volunteerID);
        return (perfA?.attendanceRate || 0) - (perfB?.attendanceRate || 0);
      },
    },
    {
      title: 'Punctuality Rate',
      key: 'punctualityRate',
      render: (_: unknown, record: { volunteerID: string }) => {
        const performance = memberPerformance.find(p => p.volunteerId === record.volunteerID);
        if (!performance || performance.eventsAttended === 0) return '-';
        return `${performance.punctualityRate}%`;
      },
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
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: { volunteerID: string }) => {
        if (!canManage) return null;
        return (
          <Popconfirm
            title="Remove member"
            description="Are you sure you want to remove this member from the department?"
            onConfirm={() => handleRemoveMember(record.volunteerID)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        );
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
      render: (_: unknown, record: StatusHistoryItem) => (
        <Button type="link" onClick={() => navigate(`/events/${record.eventId}`)}>
          View Event
        </Button>
      ),
    },
  ];

  const upcomingEventsColumns = [
    {
      title: 'Event',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'timeAndDate',
      key: 'timeAndDate',
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy HH:mm'),
    },
    {
      title: 'Scheduled Members',
      key: 'scheduledCount',
      render: (_: unknown, record: any) => {
        const deptMembers = department.volunteerMembers?.map(m => m.volunteerID) || [];
        const scheduled = (record.scheduledVolunteers || []).filter((v: string) => deptMembers.includes(v));
        return `${scheduled.length} / ${deptMembers.length}`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Button type="link" onClick={() => navigate(`/events/${record.id}`)}>
          View Event
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <LineChartOutlined /> Overview
        </span>
      ),
      children: (
        <div>
          {/* Analytics Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Total Events"
                value={stats?.totalEvents || 0}
                icon={<CalendarOutlined />}
                color="blue"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Active Members"
                value={`${stats?.activeMembers || 0} / ${stats?.totalMembers || 0}`}
                subtitle="Last 30 days"
                icon={<TeamOutlined />}
                color="green"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Attendance Rate"
                value={`${stats?.attendanceRate || 0}%`}
                icon={<CheckCircleOutlined />}
                color={stats && stats.attendanceRate >= 80 ? 'green' : stats && stats.attendanceRate >= 60 ? 'yellow' : 'red'}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Punctuality Score"
                value={`${stats?.punctualityRate || 0}%`}
                color={stats && stats.punctualityRate >= 80 ? 'green' : stats && stats.punctualityRate >= 60 ? 'yellow' : 'red'}
              />
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {distribution && (
              <Col xs={24} lg={12}>
                <AttendancePieChart distribution={distribution} />
              </Col>
            )}
            {trendData.length > 0 && (
              <Col xs={24} lg={12}>
                <AttendanceTrendChart data={trendData} />
              </Col>
            )}
          </Row>

          {/* Upcoming Events Section */}
          <Card 
            title={
              <span>
                <CalendarOutlined /> Upcoming Events
              </span>
            }
            className="mb-6"
          >
            {upcomingLoading ? (
              <Spin />
            ) : upcomingEvents.length === 0 ? (
              <p className="text-gray-500">No upcoming events assigned to this department</p>
            ) : (
              <Table
                columns={upcomingEventsColumns}
                dataSource={upcomingEvents}
                rowKey="id"
                pagination={false}
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'members',
      label: (
        <span>
          <TeamOutlined /> Members
        </span>
      ),
      children: (
        <Card
          title="Department Members"
          extra={
            canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                Add Member
              </Button>
            )
          }
        >
          <Table
            columns={memberColumns}
            dataSource={department.volunteerMembers}
            rowKey="volunteerID"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <CalendarOutlined /> Event History
        </span>
      ),
      children: (
        <Card title="Event History">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={() => {
              setStartDate('');
              setEndDate('');
            }}
          />
          <Table
            style={{ marginTop: 16 }}
            columns={historyColumns}
            dataSource={filteredHistory}
            rowKey="eventId"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
  ];

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

      <Card style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="overview" items={tabItems} />
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
