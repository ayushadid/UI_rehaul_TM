import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';

const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjectDetails = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/api/projects/${projectId}`);
            setProject(response.data);
            setName(response.data.name);
            setDescription(response.data.description || '');
        } catch (error) {
            toast.error("Failed to load project details.");
            navigate('/board');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, navigate]);

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    const handleSaveChanges = async () => {
        try {
            await axiosInstance.put(`/api/projects/${projectId}`, { name, description });
            toast.success("Project updated successfully!");
            fetchProjectDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update project.");
        }
    };

    if (isLoading) {
        return <div className="p-6">Loading project details...</div>;
    }

    return (
        <div className="card max-w-4xl mx-auto">
            {/* Project Header */}
            <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">{project?.name}</h2>
                
                {/* 👇 THIS BLOCK IS NEW */}
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
                <div>
                    <label htmlFor="projectName" className="text-sm font-medium text-slate-600">Project Name</label>
                    <input
                        id="projectName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                    />
                </div>
                <div>
                    <label htmlFor="projectDescription" className="text-sm font-medium text-slate-600">Description</label>
                    <textarea
                        id="projectDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="form-input"
                        rows={5}
                        placeholder="Add a description for your project..."
                    />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mt-6 mb-3">Members ({project?.members.length})</h3>
                    <p className="text-sm text-slate-500 mb-4">Members are automatically added to a project when they are assigned a task within it.</p>
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
            <div className="flex justify-end mt-6">
                <button onClick={handleSaveChanges} className="add-btn w-auto">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ProjectDetailsPage;