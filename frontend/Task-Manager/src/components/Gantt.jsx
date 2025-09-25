import React, { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

const Gantt = ({ tasks }) => {
    const ganttContainer = useRef(null);

    useEffect(() => {
        // --- One-Time Gantt Configuration ---
        gantt.config.readonly = true;
        gantt.config.date_format = "%Y-%m-%d %H:%i";
        gantt.config.columns = [
            { name: "text", label: "Task name", tree: true, width: '*' },
            { name: "start_date", label: "Start", align: "center", width: 90 },
        ];
        
        // This is the crucial part for React Strict Mode compatibility
        let ganttInstance = gantt.getGanttInstance();
        ganttInstance.init(ganttContainer.current);

        // Cleanup function to prevent memory leaks and errors
        return () => {
            if (ganttInstance) {
                ganttInstance.destructor();
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    // This useEffect loads and reloads data whenever the 'tasks' prop changes
    useEffect(() => {
        let ganttInstance = gantt.getGanttInstance();
        ganttInstance.clearAll();
        ganttInstance.parse(tasks);
    }, [tasks]);

    return (
        <div 
            ref={ganttContainer} 
            style={{ width: '100%', height: '100%' }}
        ></div>
    );
};

export default Gantt;