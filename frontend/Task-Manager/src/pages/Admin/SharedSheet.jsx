import React, { useState, useRef } from 'react';
import { LuMaximize } from 'react-icons/lu'; // Icon for the fullscreen button

// 1. All sheets are now in a single array for easier management.
const SHEETS = [
  {
    name: "ADID Calendar",
    url: "https://docs.google.com/spreadsheets/d/10JbucHYJ2V32cr68QI8coaHLunksKWQYve8ryxJZRi4/edit",
  },
  {
    name: "Website Development",
    url: "https://docs.google.com/spreadsheets/d/1yTOg_ONNysaF2Z-EwHkPmPbcGTQIHqc5BB3WBzr3hmY/edit",
  },
  {
    name: "Website Maintenance",
    url: "https://docs.google.com/spreadsheets/d/1MNWTglJmYcmRfvmv-23mN3-ogwER_1sHYRiyuIOIAUk/edit",
  },
];

const SharedSheet = () => {
  // State to hold the currently active sheet, defaulting to the first one
  const [activeSheet, setActiveSheet] = useState(SHEETS[0]);
  const iframeContainerRef = useRef(null); // Ref for the fullscreen element

  // We add "?rm=minimal" to hide the Google Sheets menus
// Use the original URL to show the full Google Sheets UI
const embedUrl = activeSheet.url;
  // 3. A "Fullscreen" button and its handler have been added.
  const handleFullScreen = () => {
    if (iframeContainerRef.current) {
      if (iframeContainerRef.current.requestFullscreen) {
        iframeContainerRef.current.requestFullscreen();
      } else if (iframeContainerRef.current.webkitRequestFullscreen) { /* Safari */
        iframeContainerRef.current.webkitRequestFullscreen();
      } else if (iframeContainerRef.current.msRequestFullscreen) { /* IE11 */
        iframeContainerRef.current.msRequestFullscreen();
      }
    }
  };

  // Function to create the button style based on whether it's active
  const getButtonClass = (sheet) => {
    const baseClass = "px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none transition-colors duration-200";
    if (sheet.url === activeSheet.url) {
      return `${baseClass} bg-white border-b-2 border-white text-primary`; // Active tab
    }
    return `${baseClass} bg-gray-50 text-gray-500 hover:bg-gray-200`; // Inactive tab
  };

  return (
    <>
      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Shared Spreadsheets</h2>
        {/* 2. The descriptive text has been removed and the fullscreen button is added here. */}
        <button 
          onClick={handleFullScreen}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
          title="View Fullscreen"
        >
          <LuMaximize />
        </button>
      </div>

      {/* Buttons to switch between sheets */}
      <div className="mt-4 border-b border-gray-200">
        <nav className="flex space-x-2">
          {/* 4. The buttons are now generated dynamically using .map(). */}
          {SHEETS.map((sheet) => (
            <button
              key={sheet.name}
              onClick={() => setActiveSheet(sheet)}
              className={getButtonClass(sheet)}
            >
              {sheet.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Embedded Sheet Iframe */}
      {/* 5. The iframe container is now taller and referenced by the fullscreen handler. */}
      <div ref={iframeContainerRef} className="w-full h-[80vh] bg-white pt-1">
        <iframe
          key={activeSheet.url}
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 'none' }}
          allowFullScreen
        >
          Loading…
        </iframe>
      </div>
    </>
  );
};

export default SharedSheet;