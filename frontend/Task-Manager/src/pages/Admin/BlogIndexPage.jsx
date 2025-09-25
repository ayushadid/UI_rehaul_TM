// Create a new file: src/pages/BlogIndexPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../../utils/axiosinstance'; // <-- Use the new blogApi instance
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import moment from 'moment';

const BlogIndexPage = () => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const response = await blogApi.get(API_PATHS.BLOG.GET_ALL_POSTS);
                
                // --- THIS IS THE CRITICAL LINE ---
                // We access the .blogs property from the response object.
                setPosts(response.data?.blogs || []);

            } catch (error) {
                console.error("Error fetching blog posts:", error);
                setPosts([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <DashboardLayout activeMenu="Blog">
            <div className="my-5">
                <h2 className="text-2xl font-semibold mb-6">Knowledge Base & Updates</h2>
                
                {isLoading ? (
                    <div className="text-center py-20 text-slate-500">Loading posts...</div>
                ) : posts.length > 0 ? (
                    <div className="space-y-6">
                        {posts.map(post => (
                            <Link to={`/admin/blog/${post.slug}`} key={post._id} className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{post.title}</h3>
                                <p className="text-slate-600 mb-4">{post.excerpt || `${post.content.substring(0, 150)}...`}</p>
                                <div className="text-xs text-slate-400">
                                    <span>By {post.author || 'Admin'}</span> &middot; <span>{moment(post.createdAt).format('MMMM Do, YYYY')}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-500 bg-white rounded-lg border">No posts found.</div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BlogIndexPage;

