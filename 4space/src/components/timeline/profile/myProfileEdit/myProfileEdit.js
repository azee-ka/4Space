import React, { useEffect, useState } from "react";
import axios from 'axios';
import './myProfileEdit.css';
import API_BASE_URL from "../../../../config";
import GetConfig from "../../../general/Authentication/utils/config";
import { useAuthState } from "../../../general/Authentication/utils/AuthProvider";
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { formatDate } from "../../../../utils/formatDate";

const MyProfileEdit = ({ handleUserListTrigger }) => {
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
            console.error('Failed to fetch Profile interact data', error);
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
        <div className='profile-edit-page'>
            <div className='profile-edit-page-header'>
                <div className='profile-edit-page-header-inner'>
                    <div className='profile-edit-page-title'>
                        <div className='profile-edit-page-title-inner'>
                            <h2>My Profile</h2>
                        </div>
                    </div>
                    <div className='profile-edit-page-date-joined'>
                        <div className='profile-edit-page-date-joined-inner'>
                            <p>Member since {formatDate(userData.date_joined)}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='profile-edit-page-content'>
                <div className='profile-edit-picture-container'>
                    <div className='profile-edit-picture-container-inner'>
                        <ProfilePicture src={userData.profile_picture} />
                    </div>
                </div>
                <div className='profile-edit-basic-info'>
                    <div className='profile-edit-basic-info-inner'>
                        <div className='profile-edit-basic-info-inner-inner'>
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
                    <div className='profile-edit-interaction-data-container'>
                        <div className='profile-edit-interaction-data-container-inner'>
                            <div className='profile-edit-stats-title'>
                                <div className='profile-edit-stats-title-inner'>
                                    <h3>Stats</h3>
                                </div>
                            </div>
                            <div className='profile-edit-interaction-stats-content'>
                                <div className='profile-edit-interaction-stats-content-inner'>
                                    <div className='profile-edit-interact-stats'>
                                        <div className="profile-edit-connections" onClick={() => handleUserListTrigger(userInteractData.connections_list, "Connections")}>
                                            {userInteractData.connections_count} connections
                                        </div>
                                        <div className="profile-edit-follow-following">
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

export default MyProfileEdit;