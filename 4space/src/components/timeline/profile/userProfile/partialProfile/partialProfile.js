import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../../../config";
import GetConfig from "../../../../general/Authentication/utils/config";
import './partialProfile.css';
import ProfilePicture from "../../../../../utils/profilePicture/getProfilePicture";
import { useAuthState } from "../../../../general/Authentication/utils/AuthProvider";

const PartialProfile = ({ userData }) => {
    const [profileData, setProfileData] = useState(userData);
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followRequested, setFollowRequested] = useState(false);

    const handleFetchUserData = async () => {
        try {
            if (userData) {
                const response = await axios.get(`${API_BASE_URL}api/user/profile/${userData.user.username}`, config);
                setProfileData(response.data.profile);
                setFollowRequested(response.data.profile.follow_request_status);
                console.log(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch profile interact data', error);
        }
    };

    useEffect(() => {
        handleFetchUserData();
        // setIsFollowing(profileData.is_following);
    }, [userData]);

    const handleFollowUnfollowToggle = async () => {
        try {
            if (!isFollowing && followRequested) {
                // Withdraw follow request
                const response = await axios.delete(`${API_BASE_URL}api/components/notifications/withdraw-follow-request/${profileData.user.id}/`, config);
                console.log(response.data);
                setFollowRequested(false);
            } else {
                // Send follow request or follow directly
                const response = await axios.post(`${API_BASE_URL}api/user/${profileData.user.id}/follow/`, null, config);
                console.log(response.data);
                setIsFollowing(response.data.message === "Followed user successfully");
                handleFetchUserData();
                if (!profileData.is_private) {
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error("Error toggling unfollow/follow", error);
        }
    };

    return userData ? (
        <div className="partial-profile-page">
            <div className="partial-profile-header">
                <div className="partial-profile-header-inner">
                    <h2>Profile</h2>
                </div>
            </div>
            <div className="partial-profile-content">
                <div className="partial-profile-content-inner">
                    <div className='partial-profile-announce'>
                        <p>This profile is private. <button onClick={() => handleFollowUnfollowToggle()}>{!isFollowing && followRequested ? "Requested" : `Follow`}</button> them to view their content.</p>
                    </div>
                    <div className="partial-profile-user-profile">
                        <div className="partial-profile-user-profile-inner">
                            <div className="partial-profile-picture">
                                <ProfilePicture src={userData.user.profile_picture} />
                            </div>
                            <div className="partial-profile-username">
                                <p>{userData.user.username}</p>
                            </div>
                            <div className="partial-profile-interact-stats">
                                <div className="partial-profile-follow-stats">
                                    <p>{userData.followers_count} followers</p>
                                    <p>{userData.following_count} following</p>
                                </div>
                                <div className="partial-profile-conenction-stats">
                                    <p>{userData.connections_count} connections</p>
                                </div>
                            </div>
                            <div className="partial-profile-follow-connect-btns">

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    );
}

export default PartialProfile;