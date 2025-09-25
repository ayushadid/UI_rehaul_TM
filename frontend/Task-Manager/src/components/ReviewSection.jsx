import React, { useState, useContext } from 'react';
import { UserContext } from '../context/userContext';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';
import moment from 'moment';

const ReviewSection = ({ task, onTaskReviewed, onSubmitForReview }) => {
    const { user: currentUser } = useContext(UserContext);
    const [reviewComment, setReviewComment] = useState("");

    if (!task || !currentUser?._id) {
        return null;
    }

    const handleReviewDecision = async (decision) => {
        if (decision === 'ChangesRequested' && !reviewComment.trim()) {
            toast.error("A comment is required when requesting changes.");
            return;
        }
        try {
            let response;
            if (task.reviewStatus === 'PendingReview') {
                response = await axiosInstance.put(API_PATHS.TASKS.PROCESS_REVIEW(task._id), { decision, reviewComment });
            } else if (task.reviewStatus === 'PendingFinalApproval') {
                response = await axiosInstance.put(API_PATHS.TASKS.FINAL_APPROVE_TASK(task._id), { decision, reviewComment });
            } else if (task.reviewStatus === 'Approved' && decision === 'ChangesRequested') {
                response = await axiosInstance.put(API_PATHS.TASKS.FINAL_APPROVE_TASK(task._id), { decision, reviewComment });
            }
            
            if (response?.data) {
                toast.success(`Task status updated!`);
                onTaskReviewed();
                setReviewComment("");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred.");
        }
    };

    const isAssignee = task.assignedTo?.some(a => a._id === currentUser._id);
    const isReviewer = task.reviewers?.some(r => r._id === currentUser._id);
    const isCreator = task.createdBy?._id === currentUser._id;
    const isAdmin = currentUser.role === 'admin';

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            {/* Assignee's "Submit for Review" Button */}
            {(task.reviewStatus === 'NotSubmitted' || task.reviewStatus === 'ChangesRequested') && 
             isAssignee && task.reviewers?.length > 0 && (
                <div className="p-4 bg-gray-50 border rounded-lg text-center mb-6">
                    <h4 className="font-semibold text-gray-800">Ready to Submit?</h4>
                    <p className="text-sm text-gray-600 mt-1 mb-3">Your work is complete. Submit this task to the reviewers for approval.</p>
                    <button onClick={onSubmitForReview} className="add-btn">
                        Submit for Review
                    </button>
                </div>
            )}

            <h3 className="text-lg font-semibold text-slate-800 mb-2">Review & Approval</h3>
            
            {task.revisionHistory && task.revisionHistory.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-slate-600 mb-2">Revision History ({task.revisionCount})</p>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 border-l-2 border-slate-200 pl-4">
                        {task.revisionHistory.slice().reverse().map(rev => (
                            <div key={rev._id} className="bg-slate-100 p-3 rounded-md">
                                <p className="text-sm text-slate-800 italic">"{rev.comment}"</p>
                                <p className="text-xs text-slate-500 mt-2 text-right font-medium">- {rev.madeBy?.name} on {moment(rev.createdAt).format('MMM D, YYYY')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Area for a Reviewer */}
            {task.reviewStatus === 'PendingReview' && isReviewer && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="font-bold text-orange-800">Action Required: Review Task</h4>
                    <p className="text-sm text-orange-700 mt-1 mb-3">This task is awaiting your review.</p>
                    <textarea className="form-input w-full text-sm" placeholder="Add a comment (required for changes)..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                    <div className="flex gap-3 mt-3">
                        <button onClick={() => handleReviewDecision('Approved')} className="add-btn bg-lime-600 hover:bg-lime-700">Approve Review</button>
                        <button onClick={() => handleReviewDecision('ChangesRequested')} className="add-btn bg-amber-500 hover:bg-amber-600">Request Changes</button>
                    </div>
                </div>
            )}
            
            {/* Action Area for the Final Approver (Creator) */}
            {task.reviewStatus === 'PendingFinalApproval' && isCreator && (
                 <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800">Action Required: Final Approval</h4>
                    <p className="text-sm text-blue-700 mt-1 mb-3">This task has been reviewed and is awaiting your final sign-off.</p>
                    <textarea className="form-input w-full text-sm" placeholder="Add a final comment (optional)..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                    <div className="flex gap-3 mt-3">
                        <button onClick={() => handleReviewDecision('Approved')} className="add-btn bg-lime-600 hover:bg-lime-700">Final Approve</button>
                        <button onClick={() => handleReviewDecision('ChangesRequested')} className="add-btn bg-amber-500 hover:bg-amber-600">Request Changes</button>
                    </div>
                </div>
            )}

            {/* Action Area for Reverting an Approved Task */}
            {task.reviewStatus === 'Approved' && (isAdmin || isCreator) && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-bold text-red-800">Reopen Task</h4>
                    <p className="text-sm text-red-700 mt-1 mb-3">This task has been approved, but you can reopen it by requesting changes.</p>
                    <textarea 
                        className="form-input w-full text-sm" 
                        placeholder="Add a comment explaining why this is being reopened..." 
                        value={reviewComment} 
                        onChange={e => setReviewComment(e.target.value)} 
                    />
                    <div className="flex justify-end gap-3 mt-3">
                        <button onClick={() => handleReviewDecision('ChangesRequested')} className="add-btn bg-red-600 hover:bg-red-700">Request Changes</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewSection;