import React, { useMemo } from 'react';
import { Row, Col } from 'antd';
import { EventSchedule } from '../../../types';
import { EventCard } from '../../../components/EventCard';

interface EventsCardViewProps {
  events: EventSchedule[];
  onEventClick?: (eventId: string) => void;
  isAdmin?: boolean;
}

export const EventsCardView: React.FC<EventsCardViewProps> = ({ events, onEventClick, isAdmin = false }) => {
  // Sort events by date
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => 
      new Date(a.timeAndDate).getTime() - new Date(b.timeAndDate).getTime()
    );
  }, [events]);

  return (
    <Row gutter={[16, 16]}>
      {sortedEvents.map((event, i) => (
        <Col xs={24} sm={12} lg={8} key={event.id}>
          <EventCard
            event={event}
            showCheckInButton={false}
            onCheckIn={onEventClick}
            isAdmin={isAdmin}
            index={i}
          />
        </Col>
      ))}
    </Row>
  );
};
