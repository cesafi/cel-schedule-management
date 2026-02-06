import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Descriptions, Table, Button, Tag, Spin, message, Tabs, Row, Col } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, TeamOutlined, LineChartOutlined, CheckCircleOutlined, FireOutlined, FileTextOutlined } from '@ant-design/icons';
import { volunteersApi } from '../../api';
import { Volunteer, StatusHistoryItem, Department, MembershipType, EventSchedule } from '../../types';
import { format } from 'date-fns';
import { StatsCard, AttendancePieChart, AttendanceTrendChart, DateRangePicker, LogsTable } from '../../components';
import { useVolunteerAnalytics, useUpcomingEvents, useDepartments, useEntityLogs } from '../../hooks';
import { useAuth } from '../auth/AuthContext';
import { AttendanceType } from '../../types/enums';

const { Title } = Typography;

export const VolunteerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('ALL');
  const [logPage, setLogPage] = useState(1);
  const logPageSize = 20;

  // Use analytics hooks
  const { stats, distribution, trendData } = useVolunteerAnalytics(id || '');
  const { upcomingEvents, isLoading: upcomingLoading } = useUpcomingEvents({ volunteerId: id });
  
  // Fetch all departments to show volunteer memberships
  const { data: departments, isLoading: deptsLoading } = useDepartments();
  
  // Fetch logs for admin users only
  const { data: logsData, isLoading: logsLoading } = useEntityLogs(
    'volunteer',
    id || '',
    { 
      limit: logPageSize, 
      offset: (logPage - 1) * logPageSize,
      enabled: isAdmin && !!id 
    }
  );
  
  // Find departments where this volunteer is a member
  const volunteerDepartments = useMemo(() => {
    if (!id || !departments) return [];
    return departments.filter(dept => 
      dept.volunteerMembers?.some(m => m.volunteerID === id)
    );
  }, [departments, id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [volunteerData, historyData] = await Promise.all([
          volunteersApi.getById(id),
          volunteersApi.getStatusHistory(id),
        ]);
        setVolunteer(volunteerData);
        setHistory(historyData);
      } catch (err) {
        console.error('Failed to fetch volunteer data:', err);
        message.error('Failed to load volunteer data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Filter history by date range and attendance type - moved before early returns
  const filteredHistory = useMemo(() => {
    let filtered = history;
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timeAndDate);
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    // Filter by attendance type
    if (attendanceFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status.attendanceType === attendanceFilter);
    }
    
    return filtered;
  }, [history, startDate, endDate, attendanceFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!volunteer) {
    return <div>Volunteer not found</div>;
  }

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
      title: 'Attendance',
      dataIndex: ['status', 'attendanceType'],
      key: 'attendanceType',
      render: (type: string) => {
        const colors: Record<string, string> = {
          PRESENT: 'green',
          LATE: 'orange',
          EXCUSED: 'blue',
          ABSENT: 'red',
        };
        return type ? <Tag color={colors[type] || 'default'}>{type}</Tag> : <Tag>Not Checked In</Tag>;
      },
    },
    {
      title: 'Time In',
      dataIndex: ['status', 'timeIn'],
      key: 'timeIn',
      render: (time: string) => time ? format(new Date(time), 'HH:mm') : '-',
    },
    {
      title: 'Time Out',
      dataIndex: ['status', 'timeOut'],
      key: 'timeOut',
      render: (time: string) => time ? format(new Date(time), 'HH:mm') : '-',
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

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (name: string, record: Department) => (
        <Button type="link" onClick={() => navigate(`/departments/${record.id}`)}>
          {name}
        </Button>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_: unknown, record: Department) => {
        const member = record.volunteerMembers?.find(m => m.volunteerID === id);
        return member ? (
          <Tag color={member.membershipType === MembershipType.HEAD ? 'blue' : 'default'}>
            {member.membershipType}
          </Tag>
        ) : '-';
      },
    },
    {
      title: 'Joined',
      key: 'joinedDate',
      render: (_: unknown, record: Department) => {
        const member = record.volunteerMembers?.find(m => m.volunteerID === id);
        if (!member?.joinedDate) return '-';
        try {
          return format(new Date(member.joinedDate), 'MMM dd, yyyy');
        } catch {
          return '-';
        }
      },
    },
    {
      title: 'Members',
      key: 'memberCount',
      render: (_: unknown, record: Department) => record.volunteerMembers?.length || 0,
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
      title: 'Departments',
      key: 'departments',
      render: (_: unknown, record: EventSchedule) => {
        const deptNames = (record.assignedGroups || [])
          .map((groupId: string) => {
            const dept = (departments || []).find(d => d.id === groupId);
            return dept?.departmentName;
          })
          .filter(Boolean)
          .join(', ');
        return deptNames || '-';
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: EventSchedule) => {
        const isScheduled = id ? record.scheduledVolunteers?.includes(id) : false;
        const isVoluntary = id ? record.voluntaryVolunteers?.includes(id) : false;
        return (
          <Tag color={isScheduled ? 'blue' : 'green'}>
            {isScheduled ? 'Scheduled' : isVoluntary ? 'Voluntary' : 'Assigned'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: EventSchedule) => (
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
                title="Attendance Rate"
                value={`${stats?.attendanceRate || 0}%`}
                icon={<CheckCircleOutlined />}
                color={stats && stats.attendanceRate >= 80 ? 'green' : stats && stats.attendanceRate >= 60 ? 'yellow' : 'red'}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Punctuality Rate"
                value={`${stats?.punctualityRate || 0}%`}
                color={stats && stats.punctualityRate >= 80 ? 'green' : stats && stats.punctualityRate >= 60 ? 'yellow' : 'red'}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Current Streak"
                value={stats?.currentStreak || 0}
                subtitle="Consecutive attendances"
                icon={<FireOutlined />}
                color="purple"
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

          {/* Department Memberships Section */}
          <Card 
            title={
              <span>
                <TeamOutlined /> Department Memberships
              </span>
            }
            style={{ marginBottom: 24 }}
          >
            {deptsLoading ? (
              <Spin />
            ) : volunteerDepartments.length === 0 ? (
              <p className="text-gray-500">Not a member of any department</p>
            ) : (
              <Table
                columns={departmentColumns}
                dataSource={volunteerDepartments}
                rowKey="id"
                pagination={false}
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'upcoming',
      label: (
        <span>
          <CalendarOutlined /> Upcoming Events ({upcomingEvents.length})
        </span>
      ),
      children: (
        <Card title="Scheduled Events">
          {upcomingLoading ? (
            <Spin />
          ) : upcomingEvents.length === 0 ? (
            <p className="text-gray-500">No upcoming events scheduled</p>
          ) : (
            <Table
              columns={upcomingEventsColumns}
              dataSource={upcomingEvents}
              rowKey="id"
              pagination={false}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <CalendarOutlined /> Attendance History
        </span>
      ),
      children: (
        <Card title="Attendance History">
          <div className="mb-4 space-y-4">
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All</option>
                <option value={AttendanceType.PRESENT}>Present</option>
                <option value={AttendanceType.LATE}>Late</option>
                <option value={AttendanceType.EXCUSED}>Excused</option>
                <option value="ABSENT">Not Checked In</option>
              </select>
            </div>
          </div>
          <Table
            columns={historyColumns}
            dataSource={filteredHistory}
            rowKey="eventId"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No attendance records match the current filters' }}
          />
        </Card>
      ),
    },
    ...(isAdmin ? [{
      key: 'logs',
      label: (
        <span>
          <FileTextOutlined /> Activity Log
        </span>
      ),
      children: (
        <Card title="System Activity Log">
          {logsLoading ? (
            <Spin />
          ) : (
            <LogsTable
              logs={logsData?.logs || []}
              loading={logsLoading}
              pagination={{
                current: logPage,
                pageSize: logPageSize,
                total: logsData?.total || 0,
                onChange: (page) => setLogPage(page),
              }}
            />
          )}
        </Card>
      ),
    }] : []),
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/volunteers')}
        style={{ marginBottom: 16 }}
      >
        Back to Volunteers
      </Button>

      <Card>
        <Title level={2}>{volunteer.name}</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">{volunteer.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={volunteer.isDisabled ? 'red' : 'green'}>
              {volunteer.isDisabled ? 'Inactive' : 'Active'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Department Memberships">
            {volunteerDepartments.length}
          </Descriptions.Item>
          <Descriptions.Item label="Upcoming Events">
            {upcomingEvents.length}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {format(new Date(volunteer.createdAt), 'MMM dd, yyyy HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {format(new Date(volunteer.lastUpdated), 'MMM dd, yyyy HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>
    </div>
  );
};
