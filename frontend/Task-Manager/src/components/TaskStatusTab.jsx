import React from 'react';

const TaskStatusTab = ({ tabs, activeTab, setActiveTab }) => {
  // This function determines the appropriate CSS classes for each tab based on its state.
  const getTabStyle = (tabLabel) => {
    const isActive = activeTab === tabLabel;

    // Base style for all tab buttons
    const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    // --- Styling for the "Overdue" tab ---
    if (tabLabel === 'Overdue') {
      return isActive
        ? `${baseStyle} bg-red-600 text-white shadow-md focus:ring-red-500` // Active Overdue
        : `${baseStyle} bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500`; // Inactive Overdue
    }

    // --- Styling for all other tabs ---
    return isActive
      ? `${baseStyle} bg-primary text-white shadow-md focus:ring-primary` // Active standard tab
      : `${baseStyle} bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 focus:ring-primary`; // Inactive standard tab
  };

  // This function styles the count badge within each tab.
  const getBadgeStyle = (tabLabel) => {
    const isActive = activeTab === tabLabel;

    if (isActive) {
      return "bg-white/20 text-white"; // Badge style for any active tab
    }
    if (tabLabel === 'Overdue') {
      return "bg-red-200/60 text-red-800"; // Badge for inactive Overdue tab
    }
    return "bg-slate-200/70 text-slate-700"; // Badge for other inactive tabs
  };

  return (
    <div className='my-2'>
      <div className='flex flex-wrap items-center gap-3'>
        {tabs.map((tab) => (
          // Render the tab only if its count is greater than 0, or if it's the "All" tab.
          (tab.count > 0 || tab.label === 'All') && (
            <button 
              key={tab.label}
              className={getTabStyle(tab.label)}
              onClick={() => setActiveTab(tab.label)}
            >
              <span>{tab.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getBadgeStyle(tab.label)}`}>
                {tab.count}
              </span>
            </button>
          )
        ))}
      </div>
    </div>
  );
};

export default TaskStatusTab;