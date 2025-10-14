import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import toast from 'react-hot-toast';

const UserProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjectDetails = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            // Use the new "member" endpoint
            const response = await axiosInstance.get(`/api/projects/member/${projectId}`);
            setProject(response.data);
        } catch (error) {
            toast.error("Failed to load project details.");
            navigate('/board'); // Go back if project not found or not authorized
        } finally {
            setIsLoading(false);
        }
    }, [projectId, navigate]);

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    if (isLoading) {
        return <div className="p-6">Loading project details...</div>;
    }

    return (
        <div className="card max-w-4xl mx-auto">
            {/* Project Header */}
            <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">{project?.name}</h2>
                {project?.owner && (
                    <div className="flex items-center gap-2 mt-2">
                        <img src={project.owner.profileImageUrl || `https://ui-avatars.com/api/?name=${project.owner.name}`} alt={project.owner.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-sm text-slate-500">
                            Owned by <span className="font-medium text-slate-700">{project.owner.name}</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Read-only Description */}
                <div>
                    <label className="text-sm font-medium text-slate-600">Description</label>
                    <p className="prose prose-sm max-w-none mt-1 whitespace-pre-wrap">{project?.description || 'No description provided.'}</p>
                </div>

                {/* Read-only Members List */}
                <div>
                    <h3 className="text-lg font-semibold mt-6 mb-3">Members ({project?.members.length})</h3>
                    <div className="flex flex-wrap gap-4">
                        {project?.members.map(member => (
                            <div key={member._id} className="flex items-center gap-3 bg-slate-100 p-2 pr-4 rounded-full">
                                <img src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${member.name}`} alt={member.name} className="w-9 h-9 rounded-full object-cover" />
                                <div>
                                    <p className="text-sm font-medium">{member.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProjectDetails;