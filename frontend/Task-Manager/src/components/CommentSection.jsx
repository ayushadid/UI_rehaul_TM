import React, { useState, useContext, useEffect, useRef } from 'react';
import { UserContext } from '../context/userContext';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';
import moment from 'moment';
import { IoSend } from "react-icons/io5";

const formatDateSeparator = (date) => {
    const messageDate = moment(date);
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    if (messageDate.isSame(today, 'd')) return 'Today';
    if (messageDate.isSame(yesterday, 'd')) return 'Yesterday';
    return messageDate.format('MMMM D, YYYY');
};

const CommentSection = ({ taskId, comments = [], onCommentAdded }) => {
    // 1. Get the global socket connection from the UserContext
    const { user: currentUser, socket } = useContext(UserContext);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef(null);

    // 2. This component now manages its own state for displaying comments
    const [displayedComments, setDisplayedComments] = useState(comments);

    // This effect syncs the internal state if the initial list of comments changes
    useEffect(() => {
        setDisplayedComments(comments);
    }, [comments]);

    // 3. This new useEffect listens for real-time comment updates from the server
    useEffect(() => {
        if (socket) {
            socket.on('new_comment', (data) => {
                // If the incoming comment belongs to this task, add it to our display
                if (data.taskId === taskId) {
                    setDisplayedComments(prevComments => [...prevComments, data.comment]);
                }
            });
        }
        
        // Cleanup the listener when the component is no longer on the screen
        return () => {
            if (socket) {
                socket.off('new_comment');
            }
        };
    }, [socket, taskId]);

    // This effect automatically scrolls to the bottom when new comments are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayedComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            const response = await axiosInstance.post(API_PATHS.TASKS.ADD_COMMENT(taskId), { text: newComment });
            // This updates the parent page's data, which will re-sync our 'displayedComments'
            onCommentAdded(response.data);
            setNewComment("");
        } catch (error) {
            toast.error("Failed to post comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col h-[600px] bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex-shrink-0">Collaboration</h3>
            
            <div ref={scrollRef} className="flex-grow overflow-y-auto pr-2 mb-4">
                {/* 4. This now maps over the internal 'displayedComments' state */}
                {displayedComments.map((comment, index) => {
                    const isMyComment = comment.madeBy?._id === currentUser?._id;
                    const previousComment = index > 0 ? displayedComments[index - 1] : null;
                    const showAvatar = !previousComment || previousComment.madeBy?._id !== comment.madeBy?._id || !moment(comment.createdAt).isSame(previousComment.createdAt, 'minute');
                    
                    let dateSeparator = null;
                    const currentMessageDate = moment(comment.createdAt);
                    if (!previousComment || !currentMessageDate.isSame(moment(previousComment.createdAt), 'day')) {
                        dateSeparator = (
                            <div className="flex justify-center my-4">
                                <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                                    {formatDateSeparator(comment.createdAt)}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <React.Fragment key={comment._id || `comment-${index}`}>
                            {dateSeparator}
                            <div className={`flex items-end gap-2.5 max-w-full ${isMyComment ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}>
                                <div className={`w-8 flex-shrink-0 ${isMyComment ? 'order-2' : 'order-1'}`}>
                                    {showAvatar && (
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${(comment.madeBy?.name || '').replace(/\s/g, '+') || 'A'}`} 
                                            alt={comment.madeBy?.name} 
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    )}
                                </div>
                                <div
                                  className={`p-3 w-fit max-w-full break-words rounded-2xl ${
                                    isMyComment
                                      ? 'order-1 bg-gray-800 text-white rounded-br-lg self-end'
                                      : 'order-2 bg-gray-200 text-gray-800 rounded-bl-lg self-start'
                                  }`}
                                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                >
                                  {showAvatar && !isMyComment && (
                                    <p className="font-bold text-sm text-gray-900 mb-1">
                                      {comment.madeBy?.name}
                                    </p>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                                  <p
                                    className={`text-xs mt-2 opacity-70 ${
                                      isMyComment ? 'text-right' : 'text-left'
                                    }`}
                                  >
                                    {moment(comment.createdAt).format('h:mm A')}
                                  </p>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-4 border-t flex-shrink-0">
                <input
                    type="text"
                    className="form-input flex-1 !rounded-full !py-2 !px-4"
                    placeholder="Type a message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                    type="submit" 
                    className="bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110 disabled:bg-gray-400" 
                    disabled={isSubmitting || !newComment.trim()}
                >
                    <IoSend className="text-lg"/>
                </button>
            </form>
        </div>
    );
};

export default CommentSection;