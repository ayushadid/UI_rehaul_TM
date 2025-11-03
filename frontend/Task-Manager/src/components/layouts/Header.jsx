import React, { useContext } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { UserContext } from '../../context/userContext';

const Header = ({ activeMenu }) => {
  const location = useLocation();
  const params = useParams();
  const { user } = useContext(UserContext);

  const queryParams = new URLSearchParams(location.search);
  const projectId = params.projectId || queryParams.get('projectId');

  const taskListPath = user?.role === 'admin' ? '/admin/tasks' : '/user/tasks';

  // Tabs for the main "My Tasks" view (no project selected)
  const globalTaskViewTabs = [
    { label: 'List', path: taskListPath },
    { label: 'Board', path: '/board' },
  ];
  
  // Tabs for a specific project view
  const projectViewTabs = projectId ? [
    { label: 'Dashboard', path: `/projects/${projectId}/dashboard` },
    { label: 'List', path: `${taskListPath}?projectId=${projectId}` },
    { label: 'Board', path: `/projects/${projectId}/board` },
    { label: 'Chat' , path: `/projects/${projectId}/chat` },
    { label: 'Map', path: `/projects/${projectId}/map` },
    { 
      label: 'Details', 
      path: user?.role === 'admin' 
        ? `/admin/projects/${projectId}/details` 
        : `/user/projects/${projectId}/details` 
    },
  ] : [];

  // Determine which set of tabs to show
  const shouldShowGlobalTabs = ['My Tasks', 'Board'].includes(activeMenu) && !projectId;
  const shouldShowProjectTabs = !!projectId;

  const tabsToShow = shouldShowProjectTabs ? projectViewTabs : (shouldShowGlobalTabs ? globalTaskViewTabs : []);

  return (
    <header className="flex-shrink-0 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        
        {/* The <h1> that displayed the title has been removed */}
        
        {tabsToShow.length > 0 && (
          <nav className="flex items-center gap-2">
            {tabsToShow.map(tab => {
              const isActive = location.pathname === tab.path.split('?')[0] && location.search === (tab.path.split('?')[1] ? `?${tab.path.split('?')[1]}` : '');
              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      
      <div>{/* Future actions */}</div>
    </header>
  );
};

export default Header;