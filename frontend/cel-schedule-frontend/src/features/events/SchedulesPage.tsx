import React, { useState, useCallback } from 'react';
import { Typography, Button, Space, Empty } from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { EventSchedule, EventCreateDTO } from '../../types';
import { useAuth } from '../auth';
import { EventFormModal } from './modals/EventFormModal';
import { 
  EventFilters, 
  ViewModeSelector, 
  EventsTableView, 
  EventsCardView, 
  EventsCalendarView,
  EventStatistics
} from './components';
import { useViewMode } from './hooks/useViewMode';
import { useEvents, useDepartments, useEventFilters, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks';

const { Title } = Typography;

export const SchedulesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventSchedule | null>(null);
  const { isAdmin } = useAuth();
  const [viewMode, setViewMode] = useViewMode();

  // Fetch data using React Query hooks
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: departments = [], isLoading: deptsLoading } = useDepartments();

  // Mutations
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(editingEvent?.id || '');
  const deleteEvent = useDeleteEvent();

  // Filtering
  const {
    filters,
    filteredEvents,
    setSearchTerm,
    setDateRange,
    setCustomDateRange,
    setDepartments,
    setStatuses,
    setHasLocation,
    resetFilters,
    hasActiveFilters,
  } = useEventFilters(events);

  const handleCreate = useCallback(() => {
    setEditingEvent(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((event: EventSchedule) => {
    setEditingEvent(event);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    deleteEvent.mutate(id);
  }, [deleteEvent]);

  const handleSubmit = useCallback(async (data: EventCreateDTO) => {
    if (editingEvent) {
      await updateEvent.mutateAsync(data);
    } else {
      await createEvent.mutateAsync(data);
    }
    setModalOpen(false);
    setEditingEvent(null);
  }, [editingEvent, createEvent, updateEvent]);

  const handleModalCancel = useCallback(() => {
    setModalOpen(false);
    setEditingEvent(null);
  }, []);

  const loading = eventsLoading || deptsLoading;

  return (
    <div style={{ padding: '0 8px' }}>
      <style>{`
        @media (max-width: 768px) {
          .schedules-header {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .schedules-header h2 {
            font-size: 20px !important;
            margin-bottom: 12px !important;
          }
          .schedules-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
        @media (max-width: 576px) {
          .schedules-header h2 {
            font-size: 18px !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="schedules-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '16px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <CalendarOutlined /> Event Schedules
        </Title>
        <Space className="schedules-actions" wrap>
          <ViewModeSelector value={viewMode} onChange={setViewMode} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Create Event
            </Button>
          )}
        </Space>
      </div>

      {/* Statistics */}
      <EventStatistics events={filteredEvents} />

      {/* Filters */}
      <EventFilters
        searchTerm={filters.searchTerm}
        dateRange={filters.dateRange}
        customDateStart={filters.customDateStart}
        customDateEnd={filters.customDateEnd}
        departments={filters.departments}
        statuses={filters.statuses}
        hasLocation={filters.hasLocation}
        availableDepartments={departments}
        onSearchChange={setSearchTerm}
        onDateRangeChange={setDateRange}
        onCustomDateChange={setCustomDateRange}
        onDepartmentsChange={setDepartments}
        onStatusesChange={setStatuses}
        onLocationChange={setHasLocation}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Content - Render based on view mode */}
      {filteredEvents.length === 0 && !loading ? (
        <Empty
          description={
            hasActiveFilters 
              ? "No events match your filters" 
              : "No events found"
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 48 }}
        >
          {isAdmin && !hasActiveFilters && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Create Your First Event
            </Button>
          )}
          {hasActiveFilters && (
            <Button onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </Empty>
      ) : (
        <>
          {viewMode === 'table' && (
            <EventsTableView
              events={filteredEvents}
              departments={departments}
              isAdmin={isAdmin}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          
          {viewMode === 'cards' && (
            <EventsCardView events={filteredEvents} />
          )}
          
          {viewMode === 'calendar' && (
            <EventsCalendarView events={filteredEvents} />
          )}
        </>
      )}

      {/* Event Form Modal */}
      <EventFormModal
        open={modalOpen}
        event={editingEvent}
        departments={departments}
        onCancel={handleModalCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
