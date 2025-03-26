import React, { useEffect, useState } from "react";
import useApi from "../../../utils/useApi";
import { useAuth } from "../../../hooks/useAuth";
import PartialProfile from "./partialProfile/partialProfile";
import FullProfile from "./fullProfile/fullProfile";
import { useLocation } from "react-router-dom";

const OtherProfile = ({ username, fetchProfileData, enforceViewType = '', isCustomizing }) => {
    const [profileInfo, setProfileInfo] = useState({});
    const location = useLocation();

    useEffect(() => {
        if (location.state?.refreshed) {
            fetchProfileData(username, setProfileInfo);
        }
    }, [location.state]);

    useEffect(() => {
        fetchProfileData(username, setProfileInfo);
        // console.log(profileInfo);
    }, []);


    return enforceViewType === '' ? (
        profileInfo?.view_type === 'partial' ? (
            <PartialProfile profileInfo={profileInfo} isCustomizing={isCustomizing} />
        ) : (
            profileInfo?.view_type === 'full' ? (
                <FullProfile profileInfo={profileInfo} isCustomizing={isCustomizing} />
            ) : (
                <div>Loading...</div>
            )
        )
    ) : (
        enforceViewType === 'partial' ? (
            <PartialProfile profileInfo={profileInfo} isCustomizing={isCustomizing} />
        ) : (
            enforceViewType === 'full' ? (
                <FullProfile profileInfo={profileInfo} isCustomizing={isCustomizing} />
            ) : (
                <div>Loading...</div>
            )
        )
    )
}

export default OtherProfile;