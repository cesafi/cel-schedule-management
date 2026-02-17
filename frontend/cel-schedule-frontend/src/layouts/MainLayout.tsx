import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { motion } from 'framer-motion';
import { useTheme } from '../providers/ThemeProvider';

const { Content, Footer } = Layout;

export const MainLayout: React.FC = () => {
  const { mode, colorScheme } = useTheme();

  return (
    <Layout style={{ minHeight: '100vh', background: colorScheme.bgBase }}>
      <Header />
      <Content style={{ padding: '32px 48px', background: colorScheme.bgBase }}>
        <motion.div
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(5px)' }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ 
            background: colorScheme.bgOverlay, 
            border: `1px solid ${colorScheme.borderSecondary}`,
            borderRadius: '16px',
            padding: '24px', 
            minHeight: 'calc(100vh - 180px)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
          }}
        >
          <Outlet />
        </motion.div>
      </Content>
      <Footer style={{ 
        textAlign: 'center', 
        background: colorScheme.bgBase,
        color: colorScheme.textQuaternary,
        fontSize: '12px',
        letterSpacing: '0.05em',
        transition: 'all 0.3s ease',
      }}>
        CEL Volunteer Tracker ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};
