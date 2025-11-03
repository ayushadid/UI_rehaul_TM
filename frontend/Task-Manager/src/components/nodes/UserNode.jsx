import React from 'react';
import { Handle, Position } from 'reactflow';

const UserNode = ({ data }) => {
  // 👈 1. Destructure the new prop
  const { user, isOwner, isHighlighted } = data;

  const profileImageUrl = user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+') || 'A'}`;

  // 👈 2. Add highlight logic to the container class
  return (
    <div className={`flex items-center gap-3 bg-white p-3 border rounded-lg shadow-md transition-opacity duration-300 ${
        isOwner ? 'border-primary border-2' : 'border-slate-200'
      } ${
        isHighlighted === false ? 'opacity-30' : 'opacity-100' // 👈 This is the new line
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400" />
      
      <img 
          src={profileImageUrl} 
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
      />
      <div>
          <p className="font-semibold text-slate-800">{user.name}</p>
          {isOwner && <p className="text-xs text-primary font-medium">Project Owner</p>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400" />
    </div>
  );
};

export default React.memo(UserNode);