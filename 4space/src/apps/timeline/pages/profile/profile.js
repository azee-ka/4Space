import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import API_BASE_URL from "../../../../config";
import { useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import MyProfile from "./myProfile/myProfile";
import UserProfile from "./userProfile/userProfile";

const Profile = ({ handleUserListTrigger, handleExpandPostTrigger }) => {
    const navigate = useNavigate();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const { username: paramUsername } = useParams();

    const [finalUserId, setFinalUserId] = useState();
    const [profileViewData, setProfileViewData] = useState({});


    const handleFetchUserId = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/user/get-user-id/${paramUsername ? paramUsername : user.username}`, config);
            setFinalUserId(response.data.user_id);

            console.log(response.data);
        } catch (error) {
            console.error('Failed to fetch profile interact data', error);
        }
    };

    const handleFetchUserData = async () => {
        if (finalUserId) {
            try {
                const response = await axios.get(`${API_BASE_URL}api/user/profile/${finalUserId}`, config);
                setProfileViewData(response.data);

                console.log(response.data);
            } catch (error) {
                console.error('Failed to fetch profile interact data', error);
            }
        }
    };


    useEffect(() => {
        handleFetchUserId();
    }, []);


    useEffect(() => {
        handleFetchUserData();
    }, [finalUserId]);

    useEffect(() => {
        handleFetchUserData();

        if (user.username === paramUsername) {
            navigate('/profile', { replace: true });
        }
    }, [finalUserId]);

    return profileViewData ? (
        (profileViewData.view === 'self' || paramUsername === undefined) ? (
            <MyProfile profileData={profileViewData.profile} handleUserListTrigger={handleUserListTrigger} handleExpandPostTrigger={handleExpandPostTrigger} />
        ) : (
            <UserProfile profileData={profileViewData} handleUserListTrigger={handleUserListTrigger} handleExpandPostTrigger={handleExpandPostTrigger} />
        )
    ) : (
        <div>Loading...</div>
    )
}

export default Profile;