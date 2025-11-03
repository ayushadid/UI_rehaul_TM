import React from 'react';
import { Handle, Position } from 'reactflow';
import moment from 'moment';
import { GoDotFill } from 'react-icons/go';

// Helper to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return 'text-lime-500';
    case 'In Progress': return 'text-cyan-500';
    case 'Pending':
    default:
      return 'text-violet-500';
  }
};

// This is the component for your Task leaf nodes
const TaskNode = ({ data }) => {
  // 1. Destructure the isHighlighted prop
  const { title, status, dueDate, isHighlighted } = data;
  const colorClass = getStatusColor(status);

  // 2. Add the highlight logic to the container class
  return (
    <div className={`w-64 bg-white p-3 border border-slate-200 rounded-lg shadow-sm transition-opacity duration-300 ${
        isHighlighted === false ? 'opacity-30' : 'opacity-100'
      }`}
    >
      {/* This handle is for INCOMING edges (e.g., from a User) */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400" />
      
      <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t">
        <span className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
          <GoDotFill />
          {status}
        </span>
        <span className="text-xs text-slate-500">
          {moment(dueDate).format('MMM Do')}
        </span>
      </div>

      {/* 👇 --- THIS IS THE FIX --- 👇
        Add this handle for OUTGOING edges (e.g., to a Reviewer) 
      */}
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400" />
    </div>
  );
};

export default React.memo(TaskNode);