import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

const { Content, Footer } = Layout;

export const MainLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '24px 48px' }}>
        <div style={{ background: '#fff', padding: 24, minHeight: 'calc(100vh - 134px)' }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        CEL Volunteer Tracker ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};
