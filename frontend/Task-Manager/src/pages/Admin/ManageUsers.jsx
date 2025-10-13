import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { LuEllipsis, LuTrash2, LuUserCheck, LuUserX } from 'react-icons/lu';
import ConfirmationAlert from '../../components/ConfirmationAlert';

// =================================================================================
// == Main ManageUsers Component
// =================================================================================
const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for modals
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToUpdateRole, setUserToUpdateRole] = useState(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(API_PATHS.USERS.GET_MANAGE_USERS);
            setUsers(response.data || []);
        } catch (error) {
            toast.error("Could not load team members.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleUpdateRole = async () => {
        if (!userToUpdateRole) return;
        try {
            const newRole = userToUpdateRole.role === 'admin' ? 'member' : 'admin';
            await axiosInstance.put(API_PATHS.USERS.UPDATE_ROLE(userToUpdateRole._id), { role: newRole });
            toast.success(`${userToUpdateRole.name}'s role has been updated to ${newRole}.`);
            setUserToUpdateRole(null);
            fetchUsers(); // Re-fetch to update the list
        } catch (error) {
            toast.error("Failed to update role.");
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(userToDelete._id));
            toast.success(`${userToDelete.name} has been deleted.`);
            setUserToDelete(null);
            fetchUsers(); // Re-fetch to update the list
        } catch (error) {
            toast.error("Failed to delete user.");
        }
    };

    const filteredUsers = useMemo(() => 
        users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [users, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Team Members</h2>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="form-input w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500">Loading members...</div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Active Task Load</th>
                                <th className="px-6 py-3">Weekly Capacity (40h)</th>
                                <th className="px-6 py-3">Joined On</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <UserRow 
                                    key={user._id} 
                                    user={user} 
                                    onSetRoleClick={() => setUserToUpdateRole(user)}
                                    onDeleteClick={() => setUserToDelete(user)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmationAlert
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
            />
            
            <ConfirmationAlert
                isOpen={!!userToUpdateRole}
                onClose={() => setUserToUpdateRole(null)}
                onConfirm={handleUpdateRole}
                title="Change Role"
                message={`Are you sure you want to change ${userToUpdateRole?.name}'s role to ${userToUpdateRole?.role === 'admin' ? 'Member' : 'Admin'}?`}
            />
        </div>
    );
};


// =================================================================================
// == Sub-Components for the Table
// =================================================================================
const UserRow = ({ user, onSetRoleClick, onDeleteClick }) => {
    const navigate = useNavigate();
    const capacity = (user.weeklyEstimatedHours / 40) * 100;
    
    let capacityColor = 'bg-green-500';
    if (capacity > 75) capacityColor = 'bg-yellow-500';
    if (capacity > 100) capacityColor = 'bg-red-500';

    // Date formatting without moment.js
    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
    
    return (
        <tr className="bg-white border-b hover:bg-slate-50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img 
                        src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}`} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <button onClick={() => navigate(`/admin/users/${user._id}/tasks`)} className="font-semibold text-slate-800 text-left hover:underline">{user.name}</button>
                        <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                    {user.role}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="text-xs">Pending: <span className="font-semibold">{user.taskCounts.pending}</span></div>
                <div className="text-xs">In Progress: <span className="font-semibold">{user.taskCounts.inProgress}</span></div>
            </td>
            <td className="px-6 py-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5" title={`${capacity.toFixed(0)}% capacity filled`}>
                    <div className={`${capacityColor} h-2.5 rounded-full`} style={{ width: `${Math.min(capacity, 100)}%` }}></div>
                </div>
                <div className="text-xs mt-1 text-slate-500">{user.weeklyEstimatedHours.toFixed(1)} / 40h this week</div>
            </td>
            <td className="px-6 py-4">{joinedDate}</td>
            <td className="px-6 py-4 text-center">
                <ActionsMenu user={user} onSetRoleClick={onSetRoleClick} onDeleteClick={onDeleteClick} />
            </td>
        </tr>
    );
};

const ActionsMenu = ({ user, onSetRoleClick, onDeleteClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="relative inline-block text-left">
            <button onClick={() => setIsOpen(!isOpen)} onBlur={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-200">
                <LuEllipsis />
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                        <button onClick={onSetRoleClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            {user.role === 'admin' ? <LuUserX/> : <LuUserCheck/>}
                            Make {user.role === 'admin' ? 'Member' : 'Admin'}
                        </button>
                        <button onClick={onDeleteClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <LuTrash2/>
                            Delete User
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;