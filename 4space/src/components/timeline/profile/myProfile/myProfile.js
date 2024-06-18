import React, { useEffect, useState } from "react";
import axios from 'axios';
import './myProfile.css';
import API_BASE_URL from "../../../../config";
import GetConfig from "../../../general/Authentication/utils/config";
import { useAuthState } from "../../../general/Authentication/utils/AuthProvider";
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { formatDate } from "../../../../utils/formatDate";

const MyProfile = ({ handleUserListTrigger }) => {
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const [userData, setUserData] = useState({});
    const [userInteractData, setUserInteractData] = useState({});

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    const handleFetchInteractData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/user/interact-data/${user.id}/`, config);
            setUserInteractData(response.data);
            console.log(response.data)
        } catch (error) {
            console.error('Failed to fetch profile interact data', error);
        }
    };

    const handleFetchUserData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/user/get-user-info/`, config);
            // const response = await axios.get(`${API_BASE_URL}api/user/interact-data/${user.id}/`, config);
            setUserData(response.data);

            console.log(response.data)
        } catch (error) {
            console.error('Failed to fetch profile interact data', error);
        }
    };

    useEffect(() => {
        handleFetchUserData();
        handleFetchInteractData();
    }, []);

    const handleUpdateProfile = async () => {
        try {
            const updatedData = {
                first_name: firstName,
                last_name: lastName,
                email: email,
            };

            const response = await axios.patch(`${API_BASE_URL}api/update-user-profile/`, updatedData, config);
            console.log(response.data);
            setUserData(response.data)
            // Optionally, fetch the profile data again to reflect changes
        } catch (error) {
            console.error('Failed to update profile data', error);
        }
    };

    useEffect(() => {
        if (userData && Object.keys(userData).length !== 0) {
            setFirstName(userData.first_name);
            setLastName(userData.last_name);
            setEmail(userData.email);
        }
    }, [userData]);



    return userData ? (
        <div className='profile-page'>
            <div className='profile-page-header'>
                <div className='profile-page-header-inner'>
                    <div className='profile-page-title'>
                        <div className='profile-page-title-inner'>
                            <h2>My Profile</h2>
                        </div>
                    </div>
                    <div className='profile-page-date-joined'>
                        <div className='profile-page-date-joined-inner'>
                            <p>Member since {formatDate(userData.date_joined)}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='profile-page-content'>
                <div className='profile-picture-container'>
                    <div className='profile-picture-container-inner'>
                        <ProfilePicture src={userData.profile_picture} />
                    </div>
                </div>
                <div className='profile-basic-info'>
                    <div className='profile-basic-info-inner'>
                        <div className='profile-basic-info-inner-inner'>
                            <div className='user-name-container'>
                                <input
                                    placeholder='First name'
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                                <input
                                    placeholder='Last name'
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            <div className='email-container'>
                                <input
                                    placeholder='Email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className='save-btn-container'>
                                <button onClick={handleUpdateProfile}>Save</button>
                            </div>
                        </div>
                    </div>
                    <div className='profile-interaction-data-container'>
                        <div className='profile-interaction-data-container-inner'>
                            <div className='profile-stats-title'>
                                <div className='profile-stats-title-inner'>
                                    <h3>Stats</h3>
                                </div>
                            </div>
                            <div className='profile-interaction-stats-content'>
                                <div className='profile-interaction-stats-content-inner'>
                                    <div className='profile-interact-stats'>
                                        <div className="profile-connections" onClick={() => handleUserListTrigger(userInteractData.connections_list, "Connections")}>
                                            {userInteractData.connections_count} connections
                                        </div>
                                        <div className="profile-follow-following">
                                            <div onClick={() => handleUserListTrigger(userInteractData.following_list, "Following")}>
                                                {userInteractData.following_count} Following
                                            </div>
                                            <div onClick={() => handleUserListTrigger(userInteractData.followers_list, "Followers")}>
                                                {userInteractData.followers_count} Followers
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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