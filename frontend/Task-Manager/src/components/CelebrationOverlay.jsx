import React from 'react';

// 👇 This is the only line that changes.
// We are now pointing to the GIF file in your public folder.
const CELEBRATION_GIF_URL = '/HE.gif';

const CelebrationOverlay = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <img 
        src={CELEBRATION_GIF_URL} 
        alt="Task Completed Celebration" 
        className="max-w-md max-h-md rounded-lg"
      />
    </div>
  );
};

export default CelebrationOverlay;