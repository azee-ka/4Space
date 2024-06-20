import React, { useEffect, useState } from "react";
import axios from 'axios';
import './myProfile.css';
import API_BASE_URL from "../../../../config";
import GetConfig from "../../../general/Authentication/utils/config";
import { useAuthState } from "../../../general/Authentication/utils/AuthProvider";
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { formatDate } from "../../../../utils/formatDate";
import PostsGrid from "../../post/postGrid/postGrid";
import { useNavigate } from "react-router-dom";

const MyProfile = ({ profileData, handleUserListTrigger, handleShowExpandedOverlayPost }) => {
    const navigate = useNavigate();
    const { token, user } = useAuthState();
    const config = GetConfig(token);

    // const [profileData, setProfileData] = useState();


    // const handleFetchProfileData= async () => {
    //     try {
    //         const response = await axios.get(`${API_BASE_URL}api/user/profile/${user.username}`, config);
    //         setProfileData(response.data.profile);
    //         console.log(response.data);
    //     } catch (error) {
    //         console.error('Failed to fetch profile interact data', error);
    //     }
    // };

    // useEffect(() => {
    //     handleFetchProfileData();
    // }, []);
    

    const handleRedirect = (path) => {
        navigate(path);
    };


    return profileData ? (
        <div className='full-profile-page'>
            <div className='full-profile-page-content'>
                <div className="full-profile-left-side">
                    <div className='full-profile-page-header'>
                        <div className='full-profile-page-header-inner'>
                            <div className='full-profile-page-title'>
                                <div className='full-profile-page-title-inner'>
                                    <h2>My Profile</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='full-profile-picture-container'>
                        <div className='full-profile-picture-container-inner'>
                            <ProfilePicture src={profileData.user.profile_picture} />
                        </div>
                    </div>
                    <div className="full-profile-user-info-container">
                        <p onClick={() => handleRedirect(`/profile/${profileData.user.username}`)}>{profileData.user.username}</p>
                        <p></p>
                    </div>
                    <div className='full-profile-interact-stats'>
                        <div className="full-profile-connections" onClick={() => handleUserListTrigger(profileData.connections_list, "Connections")}>
                            {profileData.connections_count} connections
                        </div>
                        <div className="full-profile-follow-following">
                            <div onClick={() => handleUserListTrigger(profileData.following_list, "Following")}>
                                {profileData.following_count} Following
                            </div>
                            <div onClick={() => handleUserListTrigger(profileData.followers_list, "Followers")}>
                                {profileData.followers_count} Followers
                            </div>
                        </div>
                    </div>
                </div>
                <div className='full-profile-right-side'>
                    <div className='full-profile-right-side-inner'>
                        <div className='full-profile-page-date-joined'>
                            <div className='full-profile-page-date-joined-inner'>
                                <p>Member since {formatDate(profileData.date_joined, false, true)}</p>
                            </div>
                        </div>
                        <div>
                            {profileData && profileData.posts && <PostsGrid posts={profileData.posts} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost} />}
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