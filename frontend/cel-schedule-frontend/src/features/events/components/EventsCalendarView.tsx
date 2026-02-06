import React, { useMemo, useState } from 'react';
import { Calendar, Badge, Modal, List, Tag, Button, Space } from 'antd';
import { EventSchedule } from '../../../types';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CalendarOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

interface EventsCalendarViewProps {
  events: EventSchedule[];
}

export const EventsCalendarView: React.FC<EventsCalendarViewProps> = ({ events }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventSchedule[]>();
    
    events.forEach(event => {
      const dateKey = format(parseISO(event.timeAndDate), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });

    return map;
  }, [events]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  }, [selectedDate, eventsByDate]);

  const dateCellRender = (value: Dayjs) => {
    const date = value.toDate();
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = eventsByDate.get(dateKey) || [];

    if (dayEvents.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayEvents.slice(0, 3).map(event => {
          const status = event.isDisabled ? 'error' : 'success';
          const total = (event.scheduledVolunteers?.length || 0) + (event.voluntaryVolunteers?.length || 0);
          const needsHelp = total < 3;
          
          return (
            <li key={event.id} style={{ marginBottom: 4 }}>
              <Badge 
                status={needsHelp ? 'warning' : status} 
                text={
                  <span style={{ 
                    fontSize: '0.85em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100px'
                  }}>
                    {format(parseISO(event.timeAndDate), 'HH:mm')} {event.name}
                  </span>
                }
              />
            </li>
          );
        })}
        {dayEvents.length > 3 && (
          <li style={{ fontSize: '0.8em', color: '#666' }}>
            +{dayEvents.length - 3} more
          </li>
        )}
      </ul>
    );
  };

  const onSelect = (value: Dayjs) => {
    const date = value.toDate();
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = eventsByDate.get(dateKey) || [];
    
    if (dayEvents.length > 0) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  const handleEventClick = (eventId: string) => {
    setModalVisible(false);
    navigate(`/events/${eventId}`);
  };

  return (
    <>
      <Calendar 
        dateCellRender={dateCellRender}
        onSelect={onSelect}
      />

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Events on {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={selectedDateEvents}
          renderItem={event => {
            const total = (event.scheduledVolunteers?.length || 0) + (event.voluntaryVolunteers?.length || 0);
            const needsHelp = total < 3;

            return (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => handleEventClick(event.id)}>
                    View Details
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{event.name}</span>
                      {event.isDisabled && <Tag color="red">Cancelled</Tag>}
                      {!event.isDisabled && needsHelp && <Tag color="orange">Needs Help</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <div>
                        <CalendarOutlined /> {format(parseISO(event.timeAndDate), 'h:mm a')}
                      </div>
                      {event.location && (
                        <div>
                          <EnvironmentOutlined /> {event.location.address}
                        </div>
                      )}
                      {event.assignedGroups && event.assignedGroups.length > 0 && (
                        <div>
                          <TeamOutlined /> {event.assignedGroups.length} Department{event.assignedGroups.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      <div>{event.description}</div>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Modal>
    </>
  );
};
