import React, { useState, useMemo } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Space, 
  Segmented, 
  Empty,
  Spin
} from 'antd';
import { 
  CalendarOutlined, 
  TeamOutlined, 
  UserOutlined, 
  PlusOutlined,
  AlertOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { isAfter, isBefore, subDays, addDays, isToday, parseISO } from 'date-fns';
import { useAuth } from '../features/auth';
import { EventCard } from '../components/EventCard';
import { useEvents, useVolunteers, useDepartments } from '../hooks';

const { Title, Paragraph } = Typography;

type ViewMode = 'My Events' | 'All Events';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isDeptHead, userDepartments } = useAuth();
  
  const [viewMode, setViewMode] = useState<ViewMode>('My Events');
  
  // Fetch data using React Query hooks
  const { data: allEvents = [], isLoading: eventsLoading } = useEvents();
  const { data: volunteers = [], isLoading: volunteersLoading } = useVolunteers(true);
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments(true);

  const loading = eventsLoading || volunteersLoading || departmentsLoading;

  // Filter events within date range (2 days past to 7 days future) - memoized
  const relevantEvents = useMemo(() => {
    const now = new Date();
    const twoDaysAgo = subDays(now, 2);
    const oneWeekFromNow = addDays(now, 7);

    return allEvents.filter(event => {
      if (event.isDisabled) return false;
      const eventDate = parseISO(event.timeAndDate);
      return isAfter(eventDate, twoDaysAgo) && isBefore(eventDate, oneWeekFromNow);
    }).sort((a, b) => 
      new Date(a.timeAndDate).getTime() - new Date(b.timeAndDate).getTime()
    );
  }, [allEvents]);

  // Calculate statistics - memoized
  const stats = useMemo(() => {
    const now = new Date();
    
    const futureEvents = relevantEvents.filter(event => 
      isAfter(parseISO(event.timeAndDate), now) || isToday(parseISO(event.timeAndDate))
    );
    
    const needingHelp = futureEvents.filter(event => {
      const scheduled = event.scheduledVolunteers?.length || 0;
      const voluntary = event.voluntaryVolunteers?.length || 0;
      return (scheduled + voluntary) < 3;
    }).length;

    return {
      totalVolunteers: volunteers.length,
      totalDepartments: departments.length,
      upcomingEventsCount: futureEvents.length,
      eventsNeedingHelp: needingHelp,
    };
  }, [relevantEvents, volunteers, departments]);

  // Filter events based on view mode - memoized
  const filteredEvents = useMemo(() => {
    if (viewMode === 'All Events') {
      return relevantEvents;
    }

    // My Events filtering
    if (!user || !user.volunteerId) {
      return [];
    }

    return relevantEvents.filter(event => {
      // Check if user is assigned as volunteer
      const isAssignedVolunteer = 
        event.scheduledVolunteers?.includes(user.volunteerId) ||
        event.voluntaryVolunteers?.includes(user.volunteerId);

      // Check if user is dept head of assigned departments
      const isDeptHeadOfEvent = isDeptHead && userDepartments.some(dept =>
        event.assignedGroups?.includes(dept.id)
      );

      return isAssignedVolunteer || isDeptHeadOfEvent;
    });
  }, [viewMode, relevantEvents, user, isDeptHead, userDepartments]);

  const handleQuickCheckIn = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const todaysEvents = filteredEvents.filter(event => 
    isToday(parseISO(event.timeAndDate))
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <Title level={2}>Welcome to CEL Volunteer Tracker</Title>
      {user && (<Paragraph>
        Manage volunteer schedules, track attendance, and organize events efficiently.
      </Paragraph> )}

      {/* Stats Dashboard */}
      {user && (
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Upcoming Events"
              value={stats.upcomingEventsCount}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Volunteers"
              value={stats.totalVolunteers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Departments"
              value={stats.totalDepartments}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Needs Volunteers"
              value={stats.eventsNeedingHelp}
              prefix={<AlertOutlined />}
              valueStyle={{ color: stats.eventsNeedingHelp > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
      )}
      

      {/* Quick Actions */}
      {(
        <Card style={{ marginTop: 24 }} title="Quick Actions">
        <Space wrap>
          {isAdmin && (
            <>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/schedules')}
              >
                Create Event
              </Button>
              <Button 
                icon={<UserOutlined />}
                onClick={() => navigate('/volunteers')}
              >
                Manage Volunteers
              </Button>
              <Button 
                icon={<TeamOutlined />}
                onClick={() => navigate('/departments')}
              >
                Manage Departments
              </Button>
            </>
          )}
          {isDeptHead && !isAdmin && (
            <>
              <Button 
                icon={<TeamOutlined />}
                onClick={() => userDepartments[0] && navigate(`/departments/${userDepartments[0].id}`)}
              >
                My Department
              </Button>
              <Button 
                icon={<CalendarOutlined />}
                onClick={() => navigate('/schedules')}
              >
                View All Schedules
              </Button>
            </>
          )}
          {!isAdmin && !isDeptHead && (
            <>
              <Button 
                icon={<CalendarOutlined />}
                onClick={() => navigate('/schedules')}
              >
                View All Schedules
              </Button>
            </>
          )}
        </Space>
      </Card>
      )}
      

      {/* Today's Events Section */}
      {todaysEvents.length > 0 && (
        <Card 
          style={{ marginTop: 24, backgroundColor: '#f6ffed', borderColor: '#52c41a' }} 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
              <span>Today's Events</span>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            {todaysEvents.map(event => (
              <Col xs={24} sm={12} lg={8} key={event.id}>
                <EventCard
                  event={event}
                  showCheckInButton={isAuthenticated}
                  onCheckIn={handleQuickCheckIn}
                />
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Events Timeline */}
      <Card 
        style={{ marginTop: 24 }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Space>
              <CalendarOutlined />
              <span>Event Timeline</span>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: '0.9em' }}>
                (2 days past to 1 week ahead)
              </Paragraph>
            </Space>
            {isAuthenticated && (
              <Segmented
                options={['My Events', 'All Events']}
                value={viewMode}
                onChange={(value) => setViewMode(value as ViewMode)}
              />
            )}
          </div>
        }
      >
        {filteredEvents.length === 0 ? (
          <Empty 
            description={
              viewMode === 'My Events' 
                ? "No events assigned to you in this time range" 
                : "No events scheduled in this time range"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {isAdmin && (
              <Button type="primary" onClick={() => navigate('/schedules')}>
                Create New Event
              </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredEvents.map(event => (
              <Col xs={24} sm={12} lg={8} key={event.id}>
                <EventCard
                  event={event}
                  showCheckInButton={false}
                  onCheckIn={handleQuickCheckIn}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};
