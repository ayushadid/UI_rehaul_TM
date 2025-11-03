import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';

// This is the temporary node that appears on right-click.
const TaskCreatorNode = ({ data }) => {
  const { onCreate } = data; // Get the callback function from props
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the input field when the node is created
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // On Enter, call the onCreate function and pass the title
      if (title.trim()) {
        onCreate(title.trim());
      }
    }
    if (e.key === 'Escape') {
      // On Escape, cancel by calling onCreate with no title
      onCreate(null);
    }
  };

  const handleBlur = () => {
    // On click-away (blur), cancel the creation
    onCreate(null);
  };

  return (
    <div className="w-64 bg-white p-3 border-2 border-primary border-dashed rounded-lg shadow-lg">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400" />
      
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Enter new task title..."
        className="w-full text-sm font-semibold text-slate-800 outline-none"
      />
      <p className="text-xs text-slate-500 mt-1">Hit 'Enter' to save, 'Escape' to cancel.</p>
      
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400" />
    </div>
  );
};

export default React.memo(TaskCreatorNode);