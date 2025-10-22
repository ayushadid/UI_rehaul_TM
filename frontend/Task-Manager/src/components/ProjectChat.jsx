import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/userContext';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';
import { IoSend } from "react-icons/io5";
import { LuMessageSquarePlus } from 'react-icons/lu';

const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const ProjectChat = ({ projectId, projectName }) => {
    const { user: currentUser, socket } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!projectId) return;
            setIsLoading(true);
            try {
                const response = await axiosInstance.get(API_PATHS.PROJECTS.GET_MESSAGES(projectId));
                setMessages(response.data);
            } catch (error) {
                toast.error("Could not load chat history.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [projectId]);

    useEffect(() => {
        if (socket) {
            socket.on('new_project_message', (newMessageData) => {
                if (newMessageData.project === projectId) {
                    setMessages(prevMessages => [...prevMessages, newMessageData]);
                }
            });
        }
        return () => {
            if (socket) socket.off('new_project_message');
        };
    }, [socket, projectId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;
        setIsSending(true);
        try {
            await axiosInstance.post(API_PATHS.PROJECTS.POST_MESSAGE(projectId), {
                content: newMessage,
            });
            setNewMessage("");
        } catch (error) {
            toast.error("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold p-4 border-b border-gray-200 text-gray-800 flex-shrink-0 truncate">
                {projectName ? `${projectName} Chat` : 'Project Chat'}
            </h3>
            
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                    <p className="text-center text-slate-500">Loading messages...</p>
                ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const previousMsg = messages[index - 1];
                        const showDateSeparator = !previousMsg || new Date(msg.createdAt).toDateString() !== new Date(previousMsg.createdAt).toDateString();
                        const showFullHeader = showDateSeparator || !previousMsg || msg.sender._id !== previousMsg.sender._id;
                        const isSender = msg.sender._id === currentUser._id;
                        
                        // Format the full timestamp for the tooltip
                        const fullTimestamp = new Date(msg.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                        });

                        return (
                            <React.Fragment key={msg._id || index}>
                                {showDateSeparator && (
                                    <div className="text-center text-xs text-slate-400 font-semibold my-4">
                                        <span className="bg-slate-100 px-2 py-1 rounded-full">{formatDateSeparator(msg.createdAt)}</span>
                                    </div>
                                )}
                                <div className={`flex items-start gap-2 ${isSender ? 'justify-end' : ''} ${showFullHeader ? 'mt-4' : 'mt-1'}`}>
                                    <div className={`flex-shrink-0 w-8 ${isSender ? 'order-2' : 'order-1'}`}>
                                        {showFullHeader && !isSender && (
                                            <img src={msg.sender.profileImageUrl || `https://ui-avatars.com/api/?name=${msg.sender.name.replace(/\s/g, '+')}`} alt={msg.sender.name} className="w-8 h-8 rounded-full"/>
                                        )}
                                    </div>
                                    <div className={`max-w-xs md:max-w-md ${isSender ? 'order-1' : 'order-2'}`}>
                                        {showFullHeader && !isSender && <p className="text-xs font-bold mb-1 text-slate-600">{msg.sender.name}</p>}
                                        <div 
                                            className={`p-3 rounded-lg ${isSender ? 'bg-primary text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}
                                            title={fullTimestamp} // This is the new tooltip
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                        <LuMessageSquarePlus className="w-16 h-16 mb-4" />
                        <h4 className="font-semibold text-slate-500">Start the Conversation</h4>
                        <p className="text-sm">Send the first message in this project chat.</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-t flex-shrink-0">
                <input
                    type="text"
                    className="form-input flex-1 !rounded-full !py-2 !px-4"
                    placeholder="Type a project message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                />
                <button 
                    type="submit" 
                    className="bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform disabled:bg-gray-400 disabled:scale-100"
                    disabled={isSending || !newMessage.trim()}
                >
                    <IoSend/>
                </button>
            </form>
        </div>
    );
};

export default ProjectChat;