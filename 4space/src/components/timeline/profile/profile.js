import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import GetConfig from "../../general/Authentication/utils/config";
import API_BASE_URL from "../../../config";
import { useAuthState } from "../../general/Authentication/utils/AuthProvider";
import MyProfile from "./myProfile/myProfile";
import UserProfile from "./userProfile/userProfile";

const Profile = ({ handleUserListTrigger, handleShowExpandedOverlayPost }) => {
    const navigate = useNavigate();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const { username: paramUsername } = useParams();

    const [profileViewData, setProfileViewData] = useState({});


    const handleFetchUserData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/user/profile/${paramUsername ? paramUsername : user.username}`, config);
            setProfileViewData(response.data);

            console.log(response.data);
        } catch (error) {
            console.error('Failed to fetch profile interact data', error);
        }
    };

    useEffect(() => {
        handleFetchUserData();
    }, []);

    useEffect(() => {
        handleFetchUserData();

        if (user.username === paramUsername) {
            navigate('/profile', { replace: true });
        }
    }, []);

    return profileViewData ? (
        (profileViewData.view === 'self' || paramUsername === undefined) ? (
            <MyProfile profileData={profileViewData.profile} handleUserListTrigger={handleUserListTrigger} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost} />
        ) : (
            <UserProfile profileData={profileViewData} handleUserListTrigger={handleUserListTrigger} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost} />
        )
    ) : (
        <div>Loading...</div>
    )
}

export default Profile;