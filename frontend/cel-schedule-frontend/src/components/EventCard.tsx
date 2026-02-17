import React from 'react';
import { Tag, Button, Space, Typography } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  UserOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { EventSchedule } from '../types';
import { motion } from 'framer-motion';

const { Text, Title } = Typography;

interface EventCardProps {
  event: EventSchedule;
  showCheckInButton?: boolean;
  onCheckIn?: (eventId: string) => void;
  index?: number;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  showCheckInButton = false,
  onCheckIn,
  index = 0,
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

  const getBorderColor = () => {
    if (isPastEvent) return 'rgba(64, 64, 64, 0.6)';
    if (isTodayEvent) return 'rgba(5, 107, 47, 0.12)';
    return 'rgba(64, 64, 64, 0.8)';
  };

  const getLeftBorderColor = () => {
    if (isPastEvent) return '#525252';
    if (isTodayEvent) return '#a3a3a3';
    return '#737373';
  };

  const cardClassName = `event-card-${event.id}`;

  return (
    <>
      <style>{`
        .${cardClassName} {
          background: rgba(23, 23, 23, 0.6);
          border-top: 1px solid ${getBorderColor()};
          border-right: 1px solid ${getBorderColor()};
          border-bottom: 1px solid ${getBorderColor()};
          border-left: 4px solid ${getLeftBorderColor()};
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          opacity: ${isPastEvent ? 0.7 : 1};
          transform: translate3d(0, 0, 0);
          will-change: box-shadow, transform;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
          box-shadow: 0 0 0 0 rgba(82, 82, 82, 0);
        }
        .${cardClassName}:hover {
          transform: translate3d(0, -2px, 0) scale(1.01);
          box-shadow: 0 0 0 1px rgba(82, 82, 82, 0.4) inset;
        }
      `}</style>
      <motion.div
        className={cardClassName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          duration: 0.3, 
          delay: index * 0.05,
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        onClick={handleCardClick}
      >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Title 
            level={5} 
            style={{ 
              margin: 0,
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '400',
            }}
          >
            {event.name}
          </Title>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isTodayEvent && (
              <Tag 
                style={{ 
                  background: 'rgba(163, 163, 163, 0.2)',
                  border: '1px solid rgba(163, 163, 163, 0.4)',
                  color: '#e5e5e5',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  borderRadius: '6px',
                  margin: 0,
                }}
              >
                Today
              </Tag>
            )}
            {isPastEvent && (
              <Tag 
                style={{ 
                  background: 'rgba(82, 82, 82, 0.2)',
                  border: '1px solid rgba(82, 82, 82, 0.4)',
                  color: '#a3a3a3',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  borderRadius: '6px',
                  margin: 0,
                }}
              >
                Past
              </Tag>
            )}
          </div>
        </div>

        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#737373', fontSize: '14px' }} /> 
            <Text style={{ 
              marginLeft: 0,
              color: '#d4d4d4',
              fontSize: '14px',
            }}>
              {format(eventDate, 'MMM dd, yyyy • h:mm a')}
            </Text>
          </div>

          {event.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ color: '#737373', fontSize: '14px' }} />
              <Text 
                ellipsis
                style={{ 
                  marginLeft: 0,
                  color: '#d4d4d4',
                  fontSize: '14px',
                }}
              >
                {event.location.address}
              </Text>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined style={{ color: '#737373', fontSize: '14px' }} />
            <Text style={{ 
              marginLeft: 0,
              color: '#d4d4d4',
              fontSize: '14px',
            }}>
              {totalVolunteers} volunteer{totalVolunteers !== 1 ? 's' : ''}
              {totalVolunteers < 3 && totalVolunteers > 0 && (
                <Tag 
                  style={{ 
                    background: 'rgba(115, 115, 115, 0.2)',
                    border: '1px solid rgba(115, 115, 115, 0.4)',
                    color: '#a3a3a3',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    marginLeft: 8,
                  }}
                >
                  Needs more
                </Tag>
              )}
            </Text>
          </div>
        </Space>

        {event.description && (
          <Text 
            ellipsis
            style={{ 
              fontSize: '14px',
              color: '#a3a3a3',
              marginTop: '4px',
            }}
          >
            {event.description}
          </Text>
        )}

        {showCheckInButton && isTodayEvent && (
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={handleCheckInClick}
            style={{ 
              marginTop: 12,
              background: '#262626',
              border: '1px solid #404040',
              color: '#ffffff',
              height: '40px',
              borderRadius: '8px',
              fontWeight: '500',
            }}
            block
          >
            Quick Check-in
          </Button>
        )}
      </Space>
    </motion.div>
    </>
  );
};
