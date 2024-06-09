import React, { useEffect, useState } from "react";
import axios from 'axios';
import './fullProfile.css';
import API_BASE_URL from "../../../../../config";
import GetConfig from "../../../../general/Authentication/utils/config";
import { useAuthState } from "../../../../general/Authentication/utils/AuthProvider";
import ProfilePicture from "../../../../../utils/profilePicture/getProfilePicture";
import { formatDate } from "../../../../../utils/formatDate";
import { useParams } from "react-router-dom";
import PostsGrid from "../../../post/postGrid/postGrid";

const FullProfile = ({ userData, handleUserListTrigger, handleShowExpandedOverlayPost }) => {
    const { username } = useParams();
    const { token, user } = useAuthState();
    const config = GetConfig(token);

    return userData ? (
        <div className='full-profile-page'>
            <div className='full-profile-page-content'>
                <div className="full-profile-left-side">
                    <div className='full-profile-page-header'>
                        <div className='full-profile-page-header-inner'>
                            <div className='full-profile-page-title'>
                                <div className='full-profile-page-title-inner'>
                                    <h2>Profile</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='full-profile-picture-container'>
                        <div className='full-profile-picture-container-inner'>
                            <ProfilePicture src={userData.profile_picture} />
                        </div>
                    </div>
                    <div className='full-profile-interact-stats'>
                        <div className="full-profile-connections" onClick={() => handleUserListTrigger(userData.connections_list, "Connections")}>
                            {userData.followers_count} connections
                        </div>
                        <div className="full-profile-follow-following">
                            <div onClick={() => handleUserListTrigger(userData.following_list, "Following")}>
                                {userData.following_count} Following
                            </div>
                            <div onClick={() => handleUserListTrigger(userData.following_list, "Followers")}>
                                {userData.followers_count} Followers
                            </div>
                        </div>
                    </div>
                </div>
                <div className='full-profile-right-side'>
                    <div className='full-profile-right-side-inner'>
                    <div className='full-profile-page-date-joined'>
                        <div className='full-profile-page-date-joined-inner'>
                            <p>Member since {formatDate(userData.date_joined, false, true)}</p>
                        </div>
                    </div>
                    <div>
                        {userData && <PostsGrid posts={userData.posts} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost} />}
                    </div>
                    </div>
                    
                </div>
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    );
};

export default FullProfile;