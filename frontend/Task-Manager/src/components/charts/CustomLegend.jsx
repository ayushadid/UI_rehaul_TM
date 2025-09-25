import React from 'react';

const CustomLegend = ({ payload = [] }) => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full" // Made the color swatch slightly larger
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm text-gray-600">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CustomLegend;import React from 'react';

const CustomLegend = ({ payload = [] }) => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full" // Made the color swatch slightly larger
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm text-gray-600">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CustomLegend;