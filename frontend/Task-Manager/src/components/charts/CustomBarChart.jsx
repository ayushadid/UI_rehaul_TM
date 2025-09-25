import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Helper: Get color based on the bar's name (which is the priority)
const getBarColor = (name) => {
  switch (name) {
    case 'Low':
      return '#00BC7D'; // Green
    case 'Medium':
      return '#FE9900'; // Orange
    case 'High':
      return '#F04438'; // Red
    default:
      return '#8884d8'; // Default Recharts purple
  }
};

// Custom tooltip for a cleaner look
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/80 backdrop-blur-sm shadow-md rounded-lg p-3 border border-gray-200">
        <p className="text-sm font-semibold" style={{ color: getBarColor(data.name) }}>
          {data.name} Priority
        </p>
        <p className="text-sm text-gray-700">
          Tasks: <span className="font-bold">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Main chart component, now expecting data in the format: [{ name: '...', value: ... }]
const CustomBarChart = ({ data = [] }) => {
  // A simple check to see if there's any actual data to display
  const hasData = Array.isArray(data) && data.some(item => item.value > 0);

  if (!hasData) {
    return <div className="flex items-center justify-center h-[300px] text-gray-400">No priority data to display</div>;
  }

  return (
    <div className="bg-white mt-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name" // Changed from "priority"
            tick={{ fontSize: 12, fill: "#555" }}
            stroke="#e0e0e0"
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#555" }}
            stroke="#e0e0e0"
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(238, 242, 255, 0.6)' }} // A light indigo hover effect
          />
          <Bar
            dataKey="value" // Changed from "count"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;