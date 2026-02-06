import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AttendanceDistribution } from '../utils/analytics';

interface AttendancePieChartProps {
  distribution: AttendanceDistribution;
}

const COLORS = {
  present: '#10b981', // green
  late: '#f59e0b', // yellow
  excused: '#3b82f6', // blue
  absent: '#ef4444', // red
};

const LABELS = {
  present: 'Present',
  late: 'Late',
  excused: 'Excused',
  absent: 'Absent',
};

export const AttendancePieChart: React.FC<AttendancePieChartProps> = ({ distribution }) => {
  const data = [
    { name: LABELS.present, value: distribution.present, color: COLORS.present },
    { name: LABELS.late, value: distribution.late, color: COLORS.late },
    { name: LABELS.excused, value: distribution.excused, color: COLORS.excused },
    { name: LABELS.absent, value: distribution.absent, color: COLORS.absent },
  ].filter(item => item.value > 0); // Only show non-zero values

  if (distribution.total === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-gray-200">
        <p className="text-gray-500">No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number | undefined) => `${value || 0} events`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total Events:</span>
          <span className="ml-2 font-semibold">{distribution.total}</span>
        </div>
        <div>
          <span className="text-gray-600">Attendance Rate:</span>
          <span className="ml-2 font-semibold">
            {distribution.total > 0
              ? Math.round(((distribution.present + distribution.late + distribution.excused) / distribution.total) * 100)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};
