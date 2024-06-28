import React, { useEffect, useState } from "react";
import axios from 'axios';
import './myProfile.css';
import GetConfig from "../../../../../general/components/Authentication/utils/config";
import { useAuthState } from "../../../../../general/components/Authentication/utils/AuthProvider";
import ProfilePicture from "../../../../../general/utils/profilePicture/getProfilePicture";
import { formatDate } from "../../../../../general/utils/formatDate";
import PostsGrid from "../../post/postGrid/postGrid";
import { useNavigate } from "react-router-dom";

const MyProfile = ({ profileData, handleUserListTrigger, handleExpandPostTrigger }) => {
    const navigate = useNavigate();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    

    const handleRedirect = (path) => {
        navigate(path);
    };


    return profileData ? (
        <div className='my-profile-page'>
            <div className='my-profile-page-content'>
                <div className="my-profile-left-side">
                    <div className='my-profile-page-header'>
                        <div className='my-profile-page-header-inner'>
                            <div className='my-profile-page-title'>
                                <div className='my-profile-page-title-inner'>
                                    <h2>My Profile</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='my-profile-picture-container'>
                        <div className='my-profile-picture-container-inner'>
                            <ProfilePicture src={profileData.user.profile_picture} />
                        </div>
                    </div>
                    <div className="my-profile-user-info-container">
                        <p onClick={() => handleRedirect(`/timeline/profile/${profileData.user.username}`)}>{profileData.user.username}</p>
                        <p></p>
                    </div>
                    <div className='my-profile-interact-stats'>
                        <div className="my-profile-connections" onClick={() => handleUserListTrigger(profileData.connections_list, "Connections")}>
                            {profileData.connections_count} connections
                        </div>
                        <div className="my-profile-follow-following">
                            <div onClick={() => handleUserListTrigger(profileData.following_list, "Following")}>
                                {profileData.following_count} Following
                            </div>
                            <div onClick={() => handleUserListTrigger(profileData.followers_list, "Followers")}>
                                {profileData.followers_count} Followers
                            </div>
                        </div>
                    </div>
                </div>
                <div className='my-profile-right-side'>
                    <div className='my-profile-right-side-inner'>
                        <div className='my-profile-page-date-joined'>
                            <div className='my-profile-page-date-joined-inner'>
                                <p>Member since {formatDate(profileData.user.date_joined, false, true)}</p>
                            </div>
                        </div>
                        <div className='my-profile-display-posts-grid'>
                            {profileData && profileData.posts && <PostsGrid posts={profileData.posts} handleExpandPostTrigger={handleExpandPostTrigger} />}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    );
};

export default MyProfile;