import React, { useState } from "react";
import './partialProfile.css';
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { Link, useNavigate } from "react-router-dom";
import useApi from "../../../../utils/useApi";

const PartialProfile = ({ profileInfo }) => {
    const { callApi } = useApi();
    const navigate = useNavigate();
    const [isPendingFollowing, setIsPendingFollowing] = useState(profileInfo?.interact?.follow_request_status === 'pending' && !profileInfo?.interact?.is_following);

    const [isFollowing, setIsFollowing] = useState(profileInfo?.interact?.is_following);

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


    return (
        <div className="partial-profile-page">
            <div className="partial-profile-container">
                <div className="partial-profile-image">
                    <ProfilePicture src={profileInfo?.basicInfo?.profile_image} />
                </div>

                <div className="partial-profile-info">
                    <Link to={`/profile/${profileInfo?.basicInfo?.username}`}>
                        <h2>@{profileInfo?.basicInfo?.username}</h2>
                    </Link>

                    {profileInfo?.basicInfo?.display_name && (
                        <p className="display-name">{profileInfo.basicInfo.display_name}</p>
                    )}

                    <div className="stats-grid">
                        <div>
                            <strong>{profileInfo?.stats?.followers_count || 0}</strong>
                            <span>Followers</span>
                        </div>
                        <div>
                            <strong>{profileInfo?.stats?.following_count || 0}</strong>
                            <span>Following</span>
                        </div>
                    </div>

                    <div className="private-profile-message">
                        <p>This profile is private.</p>
                        <p>Follow to see more information.</p>
                    </div>

                    <div className="action-buttons">
                    <button className="follow-btn" onClick={() => handleFollowProfile()}>
                            {isPendingFollowing ? 'Requested': 'Follow'}
                        </button>
                        <Link to={`/messages/${profileInfo?.basicInfo?.username}`}>
                            <button className="message-btn">Message</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartialProfile;
