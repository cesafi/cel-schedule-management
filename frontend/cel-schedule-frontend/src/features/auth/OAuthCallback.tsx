import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography } from 'antd';

const { Title } = Typography;

/**
 * OAuthCallback is no longer needed — Firebase Auth handles the OAuth popup
 * flow entirely client-side via signInWithPopup / linkWithPopup.
 *
 * This component now simply redirects to the home page. Any routes that still
 * point to /oauth/callback will land here and be bounced to /.
 */
export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Spin size="large" />
      <Title level={4} style={{ marginTop: 20 }}>
        Redirecting...
      </Title>
    </div>
  );
};

