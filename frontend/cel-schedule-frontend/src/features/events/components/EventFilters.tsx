import React, { useState } from 'react';
import { Card, Input, Select, Space, Button, DatePicker, Row, Col, Badge } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Department } from '../../../types';
import { DateRangeFilter } from '../../../hooks/useEventFilters';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface EventFiltersProps {
  searchTerm: string;
  dateRange: DateRangeFilter;
  customDateStart: Date | null;
  customDateEnd: Date | null;
  departments: string[];
  statuses: string[];
  hasLocation: boolean | null;
  availableDepartments: Department[];
  onSearchChange: (value: string) => void;
  onDateRangeChange: (range: DateRangeFilter) => void;
  onCustomDateChange: (start: Date | null, end: Date | null) => void;
  onDepartmentsChange: (departments: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
  onLocationChange: (hasLocation: boolean | null) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  searchTerm,
  dateRange,
  customDateStart,
  customDateEnd,
  departments,
  statuses,
  hasLocation,
  availableDepartments,
  onSearchChange,
  onDateRangeChange,
  onCustomDateChange,
  onDepartmentsChange,
  onStatusesChange,
  onLocationChange,
  onReset,
  hasActiveFilters,
}) => {
  const [searchValue, setSearchValue] = useState(searchTerm);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Debounce search
    const timer = setTimeout(() => {
      onSearchChange(value);
    }, 300);

    return () => clearTimeout(timer);
  };

  const handleDateRangeSelect = (value: DateRangeFilter) => {
    onDateRangeChange(value);
  };

  const handleCustomDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onCustomDateChange(dates[0].toDate(), dates[1].toDate());
    } else {
      onCustomDateChange(null, null);
    }
  };

  return (
    <Card 
      style={{ marginBottom: 16 }}
      bodyStyle={{ paddingBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Row gutter={[16, 16]}>
          {/* Search Input */}
          <Col xs={24} sm={24} md={8}>
            <Input
              placeholder="Search events by name or description..."
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={handleSearchChange}
              allowClear
            />
          </Col>

          {/* Date Range Filter */}
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by date range"
              value={dateRange}
              onChange={handleDateRangeSelect}
              options={[
                { label: 'All Events', value: 'all' },
                { label: 'Past Events', value: 'past' },
                { label: 'Today', value: 'today' },
                { label: 'Upcoming', value: 'upcoming' },
                { label: 'This Week', value: 'this-week' },
                { label: 'This Month', value: 'this-month' },
                { label: 'Custom Range', value: 'custom' },
              ]}
            />
          </Col>

          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && (
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                value={customDateStart && customDateEnd ? [dayjs(customDateStart), dayjs(customDateEnd)] : null}
                onChange={handleCustomDateChange as any}
              />
            </Col>
          )}

          {/* Department Filter */}
          <Col xs={24} sm={12} md={dateRange === 'custom' ? 12 : 8}>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Filter by departments"
              value={departments}
              onChange={onDepartmentsChange}
              maxTagCount="responsive"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={availableDepartments.map(d => ({
                label: d.departmentName,
                value: d.id,
              }))}
            />
          </Col>

          {/* Status Filter */}
          <Col xs={24} sm={12} md={dateRange === 'custom' ? 12 : 6}>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={statuses}
              onChange={onStatusesChange}
              maxTagCount="responsive"
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Needs Volunteers', value: 'needs-volunteers' },
              ]}
            />
          </Col>

          {/* Location Filter */}
          <Col xs={24} sm={12} md={dateRange === 'custom' ? 12 : 6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Location"
              value={hasLocation === null ? undefined : hasLocation ? 'has-location' : 'no-location'}
              onChange={(value) => {
                if (value === 'has-location') onLocationChange(true);
                else if (value === 'no-location') onLocationChange(false);
                else onLocationChange(null);
              }}
              allowClear
              options={[
                { 
                  label: (
                    <Space>
                      <EnvironmentOutlined />
                      <span>Has Location</span>
                    </Space>
                  ), 
                  value: 'has-location' 
                },
                { label: 'No Location', value: 'no-location' },
              ]}
            />
          </Col>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Col xs={24} sm={12} md={dateRange === 'custom' ? 12 : 6}>
              <Button 
                icon={<ClearOutlined />} 
                onClick={onReset}
                block
              >
                Reset Filters
              </Button>
            </Col>
          )}
        </Row>

        {/* Active Filters Badge */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined style={{ color: '#1890ff' }} />
            <Badge 
              count={
                (searchTerm ? 1 : 0) +
                (dateRange !== 'all' ? 1 : 0) +
                departments.length +
                statuses.length +
                (hasLocation !== null ? 1 : 0)
              } 
              style={{ backgroundColor: '#1890ff' }}
            />
            <span style={{ color: '#666', fontSize: '0.9em' }}>active filters</span>
          </div>
        )}
      </Space>
    </Card>
  );
};
