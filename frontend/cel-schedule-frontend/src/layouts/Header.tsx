import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Tooltip } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuth } from '../features/auth';
import { useTheme } from '../providers/ThemeProvider';

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, colorScheme, toggleTheme } = useTheme();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: '/schedules',
      icon: <CalendarOutlined />,
      label: 'Schedules',
    },
    {
      key: '/departments',
      icon: <TeamOutlined />,
      label: 'Departments',
    },
    {
      key: '/volunteers',
      icon: <UserOutlined />,
      label: 'Volunteers',
    },
  ];

  // Add admin menu for admins only
  // TODO: Re-enable when admin check is ready
  // if (isAdmin) {
  if (user) {
    menuItems.push({
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Admin',
    });
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate(`/volunteers/${user?.volunteerId}`),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account Settings',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: mode === 'night' 
          ? 'rgba(23, 23, 23, 0.8)' 
          : '#0050B3',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colorScheme.borderSecondary}`,
        padding: '0 32px',
        height: '64px',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div
          style={{
            color: mode === 'day' ? '#ffffff' : colorScheme.text,
            fontSize: '18px',
            fontWeight: '300',
            letterSpacing: '-0.025em',
            marginRight: '48px',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => e.currentTarget.style.color = mode === 'day' ? 'rgba(255, 255, 255, 0.85)' : colorScheme.textSecondary}
          onMouseLeave={(e) => e.currentTarget.style.color = mode === 'day' ? '#ffffff' : colorScheme.text}
        >
          CEL Volunteer Tracker
        </div>

        <Menu
          theme={mode === 'night' ? 'dark' : 'dark'}
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ 
            flex: 1, 
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
            fontWeight: '400',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Tooltip title={mode === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}>
          <Button
            type="text"
            icon={mode === 'night' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{
              color: mode === 'day' ? '#ffffff' : colorScheme.text,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          />
        </Tooltip>
        {
          user && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'background 0.2s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = mode === 'night' 
              ? 'rgba(38, 38, 38, 0.5)' 
              : 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Avatar 
              icon={<UserOutlined />} 
              style={{ 
                marginRight: 8,
                background: mode === 'day' ? 'rgba(255, 255, 255, 0.2)' : colorScheme.bgElevated,
                border: mode === 'day' ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid ${colorScheme.border}`,
                color: mode === 'day' ? '#ffffff' : undefined,
              }} 
            />
            <span style={{ 
              color: mode === 'day' ? '#ffffff' : colorScheme.text,
              fontSize: '14px',
              fontWeight: '400',
            }}>
              {user?.username}
            </span>
          </div>
        </Dropdown>
          )
        }
        
      </div>
    </AntHeader>
  );
};
