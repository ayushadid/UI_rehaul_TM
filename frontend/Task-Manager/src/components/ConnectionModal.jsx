import React from 'react';
import { LuUser, LuEye } from 'react-icons/lu';

const ConnectionModal = ({ taskTitle, userName, onSelect, onCancel }) => {
  if (!taskTitle || !userName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h3 className="text-lg font-semibold text-slate-800">New Connection</h3>
        <p className="text-sm text-slate-600 mt-1">
          Connect task <strong className="text-primary">"{taskTitle}"</strong> to user <strong className="text-primary">"{userName}"</strong> as:
        </p>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => onSelect('assign')}
            className="flex w-full items-center gap-3 rounded-lg border p-4 text-left text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          >
            <LuUser className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-semibold">Assignee</p>
              <p className="text-xs text-slate-500">User will be assigned to this task.</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('review')}
            className="flex w-full items-center gap-3 rounded-lg border p-4 text-left text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          >
            <LuEye className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-semibold">Reviewer</p>
              <p className="text-xs text-slate-500">User will review this task.</p>
            </div>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="w-full text-center text-sm text-slate-600 hover:text-red-500 mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConnectionModal;