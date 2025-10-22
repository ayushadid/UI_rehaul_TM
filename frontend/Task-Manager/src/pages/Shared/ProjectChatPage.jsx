import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProjectChat from '../../components/ProjectChat';
import axiosInstance from '../../utils/axiosinstance';
import { UserContext } from '../../context/userContext';

const ProjectChatPage = () => {
    const { projectId } = useParams();
    const { user } = useContext(UserContext);
    const [projectName, setProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjectName = async () => {
            if (!projectId || !user) return;
            
            // Determine the correct endpoint based on the user's role
            const endpoint = user.role === 'admin' 
                ? `/api/projects/${projectId}` 
                : `/api/projects/member/${projectId}`;

            try {
                const response = await axiosInstance.get(endpoint);
                setProjectName(response.data.name);
            } catch (error) {
                console.error("Failed to fetch project name for chat", error);
                setProjectName('Project'); // Fallback name
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectName();
    }, [projectId, user]);

    if (isLoading) {
        return <div className="p-6 text-center">Loading Chat...</div>;
    }

    return (
        <div className="h-[calc(100vh-10rem)]">
            <ProjectChat projectId={projectId} projectName={projectName} />
        </div>
    );
};

export default ProjectChatPage;