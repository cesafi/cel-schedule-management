import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, AlertOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { EventSchedule } from '../../../types';
import { isAfter, isToday, parseISO } from 'date-fns';

interface EventStatisticsProps {
  events: EventSchedule[];
}

export const EventStatistics: React.FC<EventStatisticsProps> = ({ events }) => {
  const stats = useMemo(() => {
    const now = new Date();
    
    const total = events.length;
    
    const upcoming = events.filter(event => {
      const eventDate = parseISO(event.timeAndDate);
      return isAfter(eventDate, now) || isToday(eventDate);
    }).length;
    
    const needsVolunteers = events.filter(event => {
      if (event.isDisabled) return false;
      const eventDate = parseISO(event.timeAndDate);
      if (!isAfter(eventDate, now) && !isToday(eventDate)) return false;
      
      const total = 
        (event.scheduledVolunteers?.length || 0) + 
        (event.voluntaryVolunteers?.length || 0);
      return total < 3;
    }).length;
    
    const today = events.filter(event => 
      isToday(parseISO(event.timeAndDate))
    ).length;

    return {
      total,
      upcoming,
      needsVolunteers,
      today,
    };
  }, [events]);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Events"
            value={stats.total}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Upcoming Events"
            value={stats.upcoming}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Needs Volunteers"
            value={stats.needsVolunteers}
            prefix={<AlertOutlined />}
            valueStyle={{ color: '#ff9800' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Events Today"
            value={stats.today}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: stats.today > 0 ? '#52c41a' : '#999' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
