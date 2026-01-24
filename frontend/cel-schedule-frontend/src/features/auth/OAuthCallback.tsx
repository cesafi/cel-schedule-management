import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Alert, Typography, message } from 'antd';
import { authApi } from '../../api';
import { useAuth } from './AuthContext';

const { Title } = Typography;

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions using ref
      if (hasProcessed.current) {
        console.log('Already processed, skipping...');
        return;
      }
      hasProcessed.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      // Read and immediately log the action BEFORE any async operations
      const action = localStorage.getItem('oauth_action');
      console.log('=== OAUTH CALLBACK START ===');
      console.log('Raw oauth_action from localStorage:', action);
      console.log('Code:', code);
      console.log('State:', state);
      
      const finalAction = action || 'login';
      console.log('Final action will be:', finalAction);

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        if (finalAction === 'link') {
          // Linking Google to existing account
          console.log('=== BRANCH: LINK ===');
          localStorage.removeItem('oauth_action');
          
          // Check if user is still logged in
          const token = localStorage.getItem('token');
          console.log('Token exists:', !!token);
          
          if (!token) {
            setError('Session expired. Please login again and try linking.');
            return;
          }
          
          console.log('Calling authApi.linkGoogleAccount...');
          const result = await authApi.linkGoogleAccount(code);
          console.log('Link successful:', result);
          
          // Refresh user data to get the updated thirdAuth info
          const updatedUser = await authApi.getCurrentUser();
          setUser(updatedUser);
          
          message.success(`Google account linked: ${result.email}`);
          navigate('/settings', { replace: true });
        } else {
          // Regular login/signup
          console.log('=== BRANCH: LOGIN ===');
          console.log('Calling authApi.googleCallback...');
          const response = await authApi.googleCallback(code, state || '');
          
          // Store token
          localStorage.setItem('token', response.token);
          setToken(response.token);

          // Get full user details
          const userDetails = await authApi.getCurrentUser();
          setUser(userDetails);

          // Navigate to home
          navigate('/', { replace: true });
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        console.error('Error response:', err.response?.data);
        const errorMessage = err.response?.data?.error || 'Failed to complete Google operation';
        setError(errorMessage);
        localStorage.removeItem('oauth_action'); // Clean up
      }
    };

    handleCallback();
  }, []); // Empty dependency array - run only once

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}>
        <Alert
          message="Login Failed"
          description={error}
          type="error"
          showIcon
          style={{ maxWidth: 500, marginBottom: 20 }}
        />
        <a href="/login">Return to Login</a>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}>
      <Spin size="large" />
      <Title level={4} style={{ marginTop: 20 }}>
        Completing Google Sign In...
      </Title>
    </div>
  );
};
