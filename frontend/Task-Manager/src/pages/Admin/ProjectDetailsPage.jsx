import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/userContext'; // 1. Import UserContext
import SelectUsers from '../../components/Inputs/SelectUsers'; // 2. Import SelectUsers component

const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useContext(UserContext); // 3. Get the current user
    const [project, setProject] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // 4. New state for the "Add Members" UI
    const [isAddingMembers, setIsAddingMembers] = useState(false);
    const [membersToAdd, setMembersToAdd] = useState([]);

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

    // 5. New function to handle adding members
    const handleAddMembers = async () => {
        if (membersToAdd.length === 0) {
            setIsAddingMembers(false); // Just close the UI if no one is selected
            return;
        }
        try {
            const response = await axiosInstance.put(API_PATHS.PROJECTS.ADD_MEMBERS(projectId), {
                memberIds: membersToAdd
            });
            toast.success("Members added successfully!");
            setProject(response.data.project); // Update the project state with the new member list
            setMembersToAdd([]); // Reset the selection
            setIsAddingMembers(false); // Close the UI
        } catch (error) {
            toast.error("Failed to add members.");
        }
    };

    // 6. Check for permissions
    const isOwner = currentUser?._id === project?.owner?._id;
    const isAdmin = currentUser?.role === 'admin';

    if (isLoading) {
        return <div className="p-6">Loading project details...</div>;
    }

    return (
        <div className="card max-w-4xl mx-auto">
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
                <div>
                    <label htmlFor="projectName" className="text-sm font-medium text-slate-600">Project Name</label>
                    <input id="projectName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input"/>
                </div>
                <div>
                    <label htmlFor="projectDescription" className="text-sm font-medium text-slate-600">Description</label>
                    <textarea id="projectDescription" value={description} onChange={(e) => setDescription(e.target.value)} className="form-input" rows={5} placeholder="Add a description for your project..."/>
                </div>
                <div>
                    <div className="flex justify-between items-center mt-6 mb-3">
                        <h3 className="text-lg font-semibold">Members ({project?.members.length})</h3>
                        {/* 7. Conditionally show the "Add Members" button */}
                        {(isAdmin || isOwner) && !isAddingMembers && (
                            <button onClick={() => setIsAddingMembers(true)} className="add-btn text-xs px-3 py-1">
                                Add Members
                            </button>
                        )}
                    </div>
                    
                    {/* 8. The new UI for adding members */}
                    {isAddingMembers && (
                        <div className="p-4 bg-slate-50 rounded-lg border mb-4">
                            <label className="text-sm font-medium text-slate-600">Select users to add to this project</label>
                            <SelectUsers
                                selectedUsers={membersToAdd}
                                setSelectedUsers={setMembersToAdd}
                                excludedIds={project.members.map(m => m._id)}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setIsAddingMembers(false)} className="btn-secondary text-xs px-3 py-1">Cancel</button>
                                <button onClick={handleAddMembers} className="add-btn text-xs px-3 py-1">Confirm</button>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-slate-500 mb-4">Members are automatically added when assigned a task, or can be added manually here.</p>
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