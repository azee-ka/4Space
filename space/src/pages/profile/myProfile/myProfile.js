import React, { useEffect, useState } from "react";
import './myProfile.css';
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { FaCog } from "react-icons/fa";
import UserListOverlay from "../../../components/userListOverlay/userListOverlay";

const MyProfile = ({ username, fetchProfileData, isCustomizing }) => {
    const navigate = useNavigate();
    const { authState } = useAuth();
    const [profileInfo, setProfileInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);  // Loading state

    const [showFollowersListOverlay, setShowFollowersListOverlay] = useState(false);
    const [showFollowingListOverlay, setShowFollowingListOverlay] = useState(false);
    const [showAffiliationsListOverlay, setShowAffiliationsListOverlay] = useState(false);

    useEffect(() => {
        setIsLoading(true);  // Set loading true when fetching starts
        fetchProfileData(username || authState.user.username, (data) => {
            setProfileInfo(data);
            setIsLoading(false);  // Set loading false when data is fetched
        });
    }, [username]);


    if (isLoading) {
        return (
            <div className="my-profile-page">
                <div className="loading-container">
                    <p>Loading profile...</p>
                    {/* You can replace this with a spinner or a more complex loading UI */}
                </div>
            </div>
        );
    }


    return !isCustomizing ? (
        <div className="my-profile-page">
            <div className="my-profile-left-panel">
                <div className="my-profile-user-info">
                    <FaCog className="icon-style" onClick={() => navigate('/settings#profile-basic-info')} />
                    <div className="my-profile-user-profile-picture">
                        <ProfilePicture src={profileInfo?.basicInfo?.profile_image} />
                    </div>
                    <Link href={`profile/${profileInfo?.basicInfo?.username}`} className="my-profile-user-username">
                        <p>@{profileInfo?.basicInfo?.username}</p>
                    </Link>
                    <div className="my-profile-user-stats">
                        <div className="my-profile-user-stat-counts">
                            <button onClick={() => setShowFollowersListOverlay(true)}>
                                <p>{profileInfo?.stats?.followers_count}</p>
                                <p>Followers</p>
                            </button>
                            <button onClick={() => setShowFollowingListOverlay(true)}>
                                <p>{profileInfo?.stats?.following_count}</p>
                                <p>Following</p>
                            </button>
                        </div>
                        <div className="my-profile-user-stat-counts">
                            <button onClick={() => setShowAffiliationsListOverlay(true)}>
                                <p>{profileInfo?.stats?.affiliated_count}0</p>
                                <p>Affiliations</p>
                            </button>
                            <button onClick={() => setShowAffiliationsListOverlay(true)}>
                                <p>{profileInfo?.stats?.affiliated_count}0</p>
                                <p>Affiliations</p>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="my-profile-metrics-container">
                    <section>
                        <h3>Stats</h3>
                        <div className="my-profile-metrics-stats">
                            <div>
                                <p>{profileInfo?.stats?.entries_count}</p>
                                <p>Entries</p>
                            </div>
                            <div>
                                <p>{profileInfo?.stats?.flares_count}</p>
                                <p>Posts</p>
                            </div>
                            <div>
                                <p>{profileInfo?.stats?.packets_count}</p>
                                <p>Packets</p>
                            </div>
                            <div>
                                <p>{profileInfo?.stats?.spaces_count}0</p>
                                <p>Spaces</p>
                            </div>
                        </div>
                    </section>
                    <section>
                        <h3>Metrics</h3>
                        <div className="my-profile-metrics-collection">
                            <div>
                                <p>0</p>
                                <p>Impact Score</p>
                            </div>
                            <div>
                                <p>0</p>
                                <p>Impact Score</p>
                            </div>
                            <div>
                                <p>0</p>
                                <p>Impact Score</p>
                            </div>
                            <div>
                                <p>0</p>
                                <p>Impact Score</p>
                            </div>
                            <div>
                                <p>0</p>
                                <p>Impact Score</p>
                            </div>
                            <div>
                                <p>0</p>
                                <p>Impact Score</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <div className="my-profile-right-panel">

            </div>
            {showFollowersListOverlay &&
                <UserListOverlay userList={profileInfo?.data?.followers} onClose={() => setShowFollowersListOverlay(false)} title={'Followers'} />
            }
            {showFollowingListOverlay &&
                <UserListOverlay userList={profileInfo?.data?.following} onClose={() => setShowFollowingListOverlay(false)} title={'Following'} />
            }
            {showAffiliationsListOverlay &&
                <UserListOverlay userList={null} onClose={() => setShowAffiliationsListOverlay(false)} title={'Affiliations'} />
            }
        </div>
    ) : (
        <div>Cutsom Self</div>
    )
}

export default MyProfile;