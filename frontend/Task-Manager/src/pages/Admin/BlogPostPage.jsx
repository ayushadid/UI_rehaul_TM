// Create a new file: src/pages/BlogPostPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogApi } from '../../utils/axiosinstance'; // <-- Use the new blogApi instance
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import moment from 'moment';
import { IoArrowBack } from "react-icons/io5";

const BlogPostPage = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { slug } = useParams();
    useEffect(() => {
        if (!slug) return;
        const fetchPost = async () => {
            setIsLoading(true);
            try {
    const response = await blogApi.get(API_PATHS.BLOG.GET_POST_BY_ID(slug)); // <-- Use slug
                setPost(response.data);
            } catch (error) {
                console.error(`Error fetching post with ID ${slug}:`, error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    return (
        <DashboardLayout activeMenu="Blog">
            <div className="my-5">
                <Link to="/admin/blog" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6">
                    <IoArrowBack />
                    Back to All Posts
                </Link>

                {isLoading ? (
                    <div className="text-center py-20 text-slate-500">Loading post...</div>
                ) : post ? (
                    <div className="p-8 bg-white rounded-lg shadow-sm border border-slate-200">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{post.title}</h1>
                        <div className="text-sm text-slate-400 mb-8 border-b pb-4">
                            <span>By {post.author?.name || 'Admin'}</span> &middot; <span>{moment(post.createdAt).format('MMMM Do, YYYY')}</span>
                        </div>
                        <div className="prose max-w-none text-slate-700">
                            {/* For plain text content, this is the safest way to render */}
                            <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-500 bg-white rounded-lg border">Post not found.</div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BlogPostPage;