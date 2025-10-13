import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import uploadImage from '../../utils/uploadImage';

import ProfilePhotoSelector from '../../components/layouts/Inputs/ProfilePhotoSelector';
import Input from '../../components/layouts/Inputs/Input';

const ProfilePage = () => {
    const { user, updateUser } = useContext(UserContext);

    const [profilePic, setProfilePic] = useState(null);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (newPassword && newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            let profileImageUrl = user.profileImageUrl;
            if (profilePic) {
                const imgUploadRes = await uploadImage(profilePic);
                profileImageUrl = imgUploadRes.imageUrl || profileImageUrl;
            }

            const payload = { name, email, profileImageUrl };
            if (newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            const response = await axiosInstance.put(API_PATHS.AUTH.GET_PROFILE, payload);
            
            // Update the global user context with the new data
            updateUser(response.data);
            
            toast.success("Profile updated successfully!");
            // Clear password fields after successful save
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setProfilePic(null);

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card max-w-2xl mx-auto my-6">
            <h2 className="text-2xl font-bold mb-6">My Profile</h2>
            <form onSubmit={handleSave}>
                <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} initialPreview={user?.profileImageUrl} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input value={name} onChange={({target}) => setName(target.value)} label="Full Name" type="text" />
                    <Input value={email} onChange={({target}) => setEmail(target.value)} label="Email Address" type="email" />
                </div>

                <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-2">Change Password</h3>
                    <div className="space-y-4">
                        <Input value={currentPassword} onChange={({target}) => setCurrentPassword(target.value)} label="Current Password" type="password" placeholder="Enter your current password" />
                        <Input value={newPassword} onChange={({target}) => setNewPassword(target.value)} label="New Password" type="password" placeholder="Enter a new password" />
                        <Input value={confirmPassword} onChange={({target}) => setConfirmPassword(target.value)} label="Confirm New Password" type="password" placeholder="Confirm the new password" />
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button type="submit" disabled={isLoading} className="add-btn w-auto disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;