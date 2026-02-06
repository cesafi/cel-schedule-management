import React, { useState, useEffect } from 'react';
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
  Spin,
  message 
} from 'antd';
import { 
  CalendarOutlined, 
  TeamOutlined, 
  UserOutlined, 
  PlusOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { isAfter, isBefore, subDays, addDays, isToday, parseISO } from 'date-fns';
import { useAuth } from '../features/auth';
import { EventSchedule } from '../types';
import { eventsApi, volunteersApi, departmentsApi } from '../api';
import { EventCard } from '../components/EventCard';

const { Title, Paragraph } = Typography;

type ViewMode = 'My Events' | 'All Events';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isDeptHead, userDepartments } = useAuth();
  
  const [events, setEvents] = useState<EventSchedule[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventSchedule[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('My Events');
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [eventsNeedingHelp, setEventsNeedingHelp] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, viewMode, user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [eventsData, volunteersData, departmentsData] = await Promise.all([
        eventsApi.getAll(),
        volunteersApi.getAll(),
        departmentsApi.getAll()
      ]);

      // Filter events within date range (2 days past to 7 days future)
      const now = new Date();
      const twoDaysAgo = subDays(now, 2);
      const oneWeekFromNow = addDays(now, 7);

      const relevantEvents = eventsData.filter(event => {
        if (event.isDisabled) return false;
        const eventDate = parseISO(event.timeAndDate);
        return isAfter(eventDate, twoDaysAgo) && isBefore(eventDate, oneWeekFromNow);
      }).sort((a, b) => 
        new Date(a.timeAndDate).getTime() - new Date(b.timeAndDate).getTime()
      );

      setEvents(relevantEvents);
      setTotalVolunteers(volunteersData.length);
      setTotalDepartments(departmentsData.length);
      
      // Calculate upcoming events (future only, not past)
      const futureEvents = relevantEvents.filter(event => 
        isAfter(parseISO(event.timeAndDate), now) || isToday(parseISO(event.timeAndDate))
      );
      setUpcomingEventsCount(futureEvents.length);
      
      // Events needing help (less than 3 volunteers)
      const needingHelp = futureEvents.filter(event => {
        const scheduled = event.scheduledVolunteers?.length || 0;
        const voluntary = event.voluntaryVolunteers?.length || 0;
        return (scheduled + voluntary) < 3;
      }).length;
      setEventsNeedingHelp(needingHelp);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    if (viewMode === 'All Events') {
      setFilteredEvents(events);
      return;
    }

    // My Events filtering
    if (!user || !user.volunteerId) {
      setFilteredEvents([]);
      return;
    }

    const myEvents = events.filter(event => {
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

    setFilteredEvents(myEvents);
  };

  const handleQuickCheckIn = async (eventId: string) => {
    try {
      if (!user?.volunteerId) {
        message.warning('Please log in to check in');
        return;
      }
      
      // Navigate to event detail page where they can check in
      navigate(`/events/${eventId}`);
    } catch (error) {
      console.error('Check-in failed:', error);
      message.error('Failed to check in');
    }
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
      <Paragraph>
        Manage volunteer schedules, track attendance, and organize events efficiently.
      </Paragraph>

      {/* Stats Dashboard */}
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Upcoming Events"
              value={upcomingEventsCount}
              prefix={<CalendarOutlined />}
              styles={{ value: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Volunteers"
              value={totalVolunteers}
              prefix={<UserOutlined />}
              styles={{ value: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Departments"
              value={totalDepartments}
              prefix={<TeamOutlined />}
              styles={{ value: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Needs Volunteers"
              value={eventsNeedingHelp}
              prefix={<AlertOutlined />}
              styles={{ value: { color: eventsNeedingHelp > 0 ? '#faad14' : '#52c41a' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
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
              <Button 
                icon={<UserOutlined />}
                onClick={() => user?.volunteerId && navigate(`/volunteers/${user.volunteerId}`)}
              >
                My Profile
              </Button>
            </>
          )}
        </Space>
      </Card>

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
