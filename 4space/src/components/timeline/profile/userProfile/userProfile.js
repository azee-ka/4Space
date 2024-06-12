import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../../../../config";
import GetConfig from "../../../general/Authentication/utils/config";
import { useAuthState } from "../../../general/Authentication/utils/AuthProvider";
import FullProfile from "./fullProfile/fullProfile";
import PartialProfile from "./partialProfile/partialProfile";


const UserProfile = ({ handleUserListTrigger, handleShowExpandedOverlayPost }) => {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const { username: paramUsername } = useParams();

    const [profileData, setProfileData] = useState({});

    const handleFetchUserData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/user/profile/${paramUsername}`, config);
            setProfileData(response.data);

            console.log(response.data);
        } catch (error) {
            console.error('Failed to fetch profile interact data', error);
        }
    };

    useEffect(() => {
        handleFetchUserData();
    }, []);


    return profileData.viewable === "full" ? (
        <FullProfile
            userData={profileData.profile}
            handleUserListTrigger={handleUserListTrigger}
            handleShowExpandedOverlayPost={handleShowExpandedOverlayPost}
        />
    ) : (
        <PartialProfile
            userData={profileData.profile}
        />
    );
};

export default UserProfile;