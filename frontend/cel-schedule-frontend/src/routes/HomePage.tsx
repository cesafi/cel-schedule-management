import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { CalendarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const HomePage: React.FC = () => {
  return (
    <div>
      <Title level={2}>Welcome to CEL Volunteer Tracker</Title>
      <Paragraph>
        Manage volunteer schedules, track attendance, and organize events efficiently.
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col xs={24} md={8}>
          <Card>
            <CalendarOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={4}>Schedule Events</Title>
            <Paragraph>
              Create and manage event schedules, assign volunteers and departments.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <UserOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={4}>Track Attendance</Title>
            <Paragraph>
              Check-in volunteers, monitor attendance, and generate reports.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <TeamOutlined style={{ fontSize: 48, color: '#722ed1' }} />
            <Title level={4}>Manage Departments</Title>
            <Paragraph>
              Organize volunteers into departments and track performance.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
