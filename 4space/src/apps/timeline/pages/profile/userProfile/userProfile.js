import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../../../../../config";
import FullProfile from "./fullProfile/fullProfile";
import PartialProfile from "./partialProfile/partialProfile";
import MyProfile from "../myProfile/myProfile";


const UserProfile = ({ profileData, handleUserListTrigger, handleShowExpandedOverlayPost }) => {
    // const { token, user } = useAuthState();
    // const config = GetConfig(token);
    // const { username: paramUsername } = useParams();

    // const [profileData, setProfileData] = useState({});


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