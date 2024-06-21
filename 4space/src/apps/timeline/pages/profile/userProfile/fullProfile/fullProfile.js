import React, { useEffect, useState } from "react";
import axios from 'axios';
import './fullProfile.css';
import API_BASE_URL from "../../../../../../config";
import GetConfig from "../../../../../../general/components/Authentication/utils/config";
import { useAuthState } from "../../../../../../general/components/Authentication/utils/AuthProvider";
import ProfilePicture from "../../../../../../general/utils/profilePicture/getProfilePicture";
import { formatDate } from "../../../../../../general/utils/formatDate";
import { useNavigate, useParams } from "react-router-dom";
import PostsGrid from "../../../post/postGrid/postGrid";

const FullProfile = ({ userData, handleUserListTrigger, handleShowExpandedOverlayPost }) => {
    const { username } = useParams();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(userData);

    const [isFollowing, setIsFollowing] = useState(userData.is_following);
    const [isConnected, setIsConnected] = useState(userData.is_connected);

    const handleFetchUserData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/user/profile/${userData.user.username}`, config);
            setProfileData(response.data.profile);

            console.log(response.data);
        } catch (error) {
            console.error('Failed to fetch profile interact data', error);
        }
    };

    useEffect(() => {
        handleFetchUserData();
        setIsFollowing(profileData.is_following);
        setIsConnected(profileData.is_connected);
    }, []);

    const handleFollowUnfollowToggle = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}api/user/${profileData.user.id}/follow/`, null, config);
            console.log(response.data);
            setIsFollowing(response.data.message === "Followed user successfully");
            handleFetchUserData();
            if (profileData.is_private) {
                window.location.reload()
            }
        } catch (error) {
            console.error("Error toggling unfollow/follow", error);
        }
    };


    const handleConnectDisconnectToggle = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}api/user/${profileData.user.id}/connect/`, null, config);
            console.log(response.data);
            setIsConnected(response.data.message === "Connected with user successfully");
            handleFetchUserData();
        } catch (error) {
            console.error("Error toggling disconnect/connect", error);
        }
    };



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
                                    <h2>Profile</h2>
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
                        <div className="full-profile-follow-connect-btn">
                            <button onClick={() => handleFollowUnfollowToggle()} >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                            <button onClick={() => handleConnectDisconnectToggle()} >
                                {isConnected ? 'Remove Connection' : 'Connect'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className='full-profile-right-side'>
                    <div className='full-profile-right-side-inner'>
                        <div className='full-profile-page-date-joined'>
                            <div className='full-profile-page-date-joined-inner'>
                                <p>Member since {formatDate(profileData.user.date_joined, false, true)}</p>
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

export default FullProfile;