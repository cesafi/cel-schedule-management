import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendDataPoint } from '../utils/analytics';

interface AttendanceTrendChartProps {
  data: TrendDataPoint[];
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-gray-200">
        <p className="text-gray-500">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number | undefined, name: string | undefined) => {
              const val = value || 0;
              if (name === 'attendanceRate') return [`${val}%`, 'Attendance Rate'];
              return [val, name || ''];
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="attendanceRate" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Attendance Rate"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="present" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Present"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="late" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="Late"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="excused" 
            stroke="#6366f1" 
            strokeWidth={2}
            name="Excused"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="absent" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Absent"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
