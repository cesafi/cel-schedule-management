import React from 'react';
import { Card, Tag, Button, Space, Typography } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  UserOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { EventSchedule } from '../types';

const { Text, Title } = Typography;

interface EventCardProps {
  event: EventSchedule;
  showCheckInButton?: boolean;
  onCheckIn?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  showCheckInButton = false,
  onCheckIn 
}) => {
  const navigate = useNavigate();
  const eventDate = new Date(event.timeAndDate);
  const isPastEvent = isPast(eventDate) && !isToday(eventDate);
  const isTodayEvent = isToday(eventDate);
  
  const totalVolunteers = 
    (event.scheduledVolunteers?.length || 0) + (event.voluntaryVolunteers?.length || 0);

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  const handleCheckInClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCheckIn) {
      onCheckIn(event.id);
    }
  };

  const getCardStyle = () => {
    if (isPastEvent) {
      return { 
        opacity: 0.7, 
        cursor: 'pointer',
        borderLeft: '4px solid #d9d9d9'
      };
    }
    if (isTodayEvent) {
      return { 
        cursor: 'pointer',
        borderLeft: '4px solid #52c41a',
        backgroundColor: '#f6ffed'
      };
    }
    return { 
      cursor: 'pointer',
      borderLeft: '4px solid #1890ff'
    };
  };

  return (
    <Card
      hoverable
      style={getCardStyle()}
      onClick={handleCardClick}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Title level={5} style={{ margin: 0 }}>
            {event.name}
          </Title>
          {isTodayEvent && <Tag color="success">Today</Tag>}
          {isPastEvent && <Tag color="default">Past</Tag>}
        </div>

        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <CalendarOutlined /> 
            <Text style={{ marginLeft: 8 }}>
              {format(eventDate, 'MMM dd, yyyy • h:mm a')}
            </Text>
          </div>

          {event.location && (
            <div>
              <EnvironmentOutlined />
              <Text style={{ marginLeft: 8 }} ellipsis>
                {event.location.address}
              </Text>
            </div>
          )}

          <div>
            <UserOutlined />
            <Text style={{ marginLeft: 8 }}>
              {totalVolunteers} volunteer{totalVolunteers !== 1 ? 's' : ''}
              {totalVolunteers < 3 && totalVolunteers > 0 && (
                <Tag color="warning" style={{ marginLeft: 8 }}>Needs more</Tag>
              )}
            </Text>
          </div>
        </Space>

        {event.description && (
          <Text type="secondary" ellipsis style={{ fontSize: '0.9em' }}>
            {event.description}
          </Text>
        )}

        {showCheckInButton && isTodayEvent && (
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={handleCheckInClick}
            style={{ marginTop: 8 }}
            block
          >
            Quick Check-in
          </Button>
        )}
      </Space>
    </Card>
  );
};
