import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../../../../../config";
import FullProfile from "./fullProfile/fullProfile";
import PartialProfile from "./partialProfile/partialProfile";
import MyProfile from "../myProfile/myProfile";


const UserProfile = ({ profileData, handleUserListTrigger, handleExpandPostTrigger }) => {
    // const { token, user } = useAuthState();
    // const config = GetConfig(token);
    // const { username: paramUsername } = useParams();

    // const [profileData, setProfileData] = useState({});
    console.log(profileData)

    return (profileData && profileData.viewable === "full") ? (
        <FullProfile
            userData={profileData.profile}
            handleUserListTrigger={handleUserListTrigger}
            handleExpandPostTrigger={handleExpandPostTrigger}
        />
    ) : (
        <PartialProfile
            userData={profileData.profile}
        />
    );
};

export default UserProfile;