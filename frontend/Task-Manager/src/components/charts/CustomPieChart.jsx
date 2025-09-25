import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// 1. Add 'onSliceClick' to the props to receive the handler from the parent
const CustomPieChart = ({ data = [], colors = [], onSliceClick }) => {
  const hasData = Array.isArray(data) && data.some(item => item.value > 0);

  if (!hasData) {
    return <div className="flex items-center justify-center h-[325px] text-gray-400">No data to display</div>;
  }

  // 2. This function is called when a slice is clicked
  const handlePieClick = (clickedData) => {
    // We call the function passed down from the parent (Dashboard.jsx)
    if (onSliceClick && clickedData.name) {
      onSliceClick(clickedData.name);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={325}>
      <PieChart>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(5px)',
            border: '1px solid #e0e0e0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={70}
          paddingAngle={5}
          labelLine={false}
          onClick={handlePieClick} // 3. Attach the click handler to the Pie component
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke={colors[index % colors.length]}
              style={{ cursor: 'pointer' }} // 4. Add a pointer cursor for better UX
            />
          ))}
        </Pie>
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;