import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  index?: number;
}

// Animated counter hook
const useAnimatedCounter = (endValue: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const steps = 30;
    const increment = endValue / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setCount(Math.min(Math.round(increment * currentStep), endValue));
      } else {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [endValue, duration]);

  return count;
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  index = 0,
}) => {
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const animatedValue = useAnimatedCounter(numericValue);
  const displayValue = typeof value === 'number' ? animatedValue : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      whileHover={{ scale: 1.02 }}
      style={{
        background: 'rgba(23, 23, 23, 0.6)',
        border: '1px solid rgba(64, 64, 64, 0.8)',
        borderRadius: '12px',
        padding: '24px',
        cursor: 'default',
        transition: 'border-color 0.2s ease',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(82, 82, 82, 1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(64, 64, 64, 0.8)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#737373',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}>
            {title}
          </p>
          <motion.p
            initial={{ filter: 'blur(8px)', opacity: 0 }}
            animate={{ filter: 'blur(0px)', opacity: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 + 0.2 }}
            style={{
              fontSize: '36px',
              fontWeight: '300',
              color: '#ffffff',
              letterSpacing: '-0.025em',
              marginBottom: subtitle ? '4px' : '0',
            }}
          >
            {displayValue}
          </motion.p>
          {subtitle && (
            <p style={{
              fontSize: '14px',
              color: '#a3a3a3',
              fontWeight: '400',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(38, 38, 38, 0.6)',
            border: '1px solid rgba(64, 64, 64, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a3a3a3',
            fontSize: '20px',
          }}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 + 0.4 }}
          style={{ marginTop: '16px' }}
        >
          {trend === 'up' && (
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#a3a3a3',
            }}>
              <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H13a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Trending up
            </span>
          )}
          {trend === 'down' && (
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#a3a3a3',
            }}>
              <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 13a1 1 0 011 1v4a1 1 0 11-2 0v-3.586l-4.293 4.293a1 1 0 01-1.414 0l-2.293-2.293-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 13.586 14.586 10H13a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0v-3.586l-4.293 4.293z" clipRule="evenodd" />
              </svg>
              Trending down
            </span>
          )}
          {trend === 'neutral' && (
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#737373',
            }}>
              Stable
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
