import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  red: 'bg-red-50 border-red-200',
  purple: 'bg-purple-50 border-purple-200',
};

const iconColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}) => {
  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4">
          {trend === 'up' && (
            <span className="inline-flex items-center text-sm font-medium text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H13a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Trending up
            </span>
          )}
          {trend === 'down' && (
            <span className="inline-flex items-center text-sm font-medium text-red-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 13a1 1 0 011 1v4a1 1 0 11-2 0v-3.586l-4.293 4.293a1 1 0 01-1.414 0l-2.293-2.293-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 13.586 14.586 10H13a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0v-3.586l-4.293 4.293z" clipRule="evenodd" />
              </svg>
              Trending down
            </span>
          )}
          {trend === 'neutral' && (
            <span className="inline-flex items-center text-sm font-medium text-gray-600">
              Stable
            </span>
          )}
        </div>
      )}
    </div>
  );
};
