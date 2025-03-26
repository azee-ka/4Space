import React, { useState } from "react";
import './partialProfile.css';
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { Link, useNavigate } from "react-router-dom";
import useApi from "../../../../utils/useApi";
import CustomPartialProfile from "./customPartialProfile";

const PartialProfile = ({ profileInfo, isCustomizing }) => {
    const { callApi } = useApi();
    const navigate = useNavigate();
    const [isPendingFollowing, setIsPendingFollowing] = useState(profileInfo?.interact?.follow_request_status === 'pending' && !profileInfo?.interact?.is_following);

    const handleFollowProfile = async () => {
        try {
            setIsPendingFollowing(prevState => !prevState);
            const response = await callApi(`profile/follow-toggle/${profileInfo?.basicInfo?.username}/`, 'POST');
            console.log(response.data);
            navigate(`/profile/${profileInfo?.basicInfo?.username}`, { state: { refreshed: true } });
        } catch (err) {
            console.error('Error toggling follow', err);
            setIsPendingFollowing(prevState => !prevState);
        }
    };

    return !isCustomizing ? (
        <div className="partial-profile-page">
            <div className="partial-profile-panel">
                <div className="partial-profile-panel-profile-image">
                    <ProfilePicture src={profileInfo?.basicInfo?.profile_image} />
                </div>
                <div className="partial-profile-panel-profile-info">
                    <Link to={`/profile/${profileInfo?.basicInfo?.username}`}>
                        <p>@{profileInfo?.basicInfo?.username}</p>
                    </Link>
                    <div className="partial-profile-panel-profile-stats">
                        <div>
                            <p>{profileInfo?.stats?.followers_count} followers</p>
                            <p>{profileInfo?.stats?.following_count} following</p>
                        </div>
                        <div>
                            <p>0{profileInfo?.stats?.contributions_count} contributions</p>
                        </div>
                    </div>
                    <div className="partial-profile-follow-button">
                        <button onClick={() => handleFollowProfile()}>
                            {isPendingFollowing ? 'Requested': 'Follow'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <CustomPartialProfile 
            profileInfo={profileInfo} 
            handleFollowProfile={handleFollowProfile} 
        />
    )
};

export default PartialProfile;