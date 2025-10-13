import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import SelectUsers from '../../components/Inputs/SelectUsers';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const CreateAnnouncement = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [recipientIds, setRecipientIds] = useState([]);
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSend = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Title and content cannot be empty.");
            return;
        }
        if (!isBroadcast && recipientIds.length === 0) {
            toast.error("Please select at least one recipient or send to everyone.");
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post(API_PATHS.ANNOUNCEMENTS.CREATE, {
                title,
                content,
                recipientIds,
                isBroadcast
            });
            toast.success("Announcement sent successfully!");
            navigate('/admin/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send announcement.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="card max-w-4xl mx-auto my-6">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="announcement-title" className="text-sm font-medium text-slate-600">Title</label>
                        <input
                            id="announcement-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-input"
                            placeholder="e.g., Q4 Planning Meeting"
                        />
                    </div>
                    <div>
                        <label htmlFor="announcement-content" className="text-sm font-medium text-slate-600">Content</label>
                        <textarea
                            id="announcement-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="form-input"
                            rows={8}
                            placeholder="Write your announcement here..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Recipients</label>
                        <div className="mt-2 p-4 border rounded-lg bg-slate-50">
                            <div className="flex items-center mb-4">
                                <input
                                    id="broadcast"
                                    type="checkbox"
                                    checked={isBroadcast}
                                    onChange={(e) => setIsBroadcast(e.target.checked)}
                                    className="w-4 h-4 text-primary rounded"
                                />
                                <label htmlFor="broadcast" className="ml-2 text-sm font-medium text-slate-700">Send to Everyone</label>
                            </div>
                            {!isBroadcast && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-2">Or, select specific users:</p>
                                    <SelectUsers selectedUsers={recipientIds} setSelectedUsers={setRecipientIds} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={handleSend} disabled={isLoading} className="add-btn w-auto disabled:opacity-50">
                        {isLoading ? 'Sending...' : 'Send Announcement'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CreateAnnouncement;