import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OtherProfile from "./otherProfile/otherProfile";
import { useAuth } from "../../hooks/useAuth";
import MyProfile from "./myProfile/myProfile";
import useApi from "../../utils/useApi";

const Profile = ({ enforceViewType = '', isCustomizing = false }) => {
    const { username } = useParams();
    const { authState } = useAuth();
    const { callApi } = useApi();

    const fetchProfileData = async (username, setProfileInfo) => {
        // if (!username) return;
        try {
            const response = await callApi(`profile/${username}/`);
            console.log(response.data);
            setProfileInfo(response.data);
        } catch (err) {
            console.error('Erre fetching profile data', err);
        }
    };

    const cleanUrl = () => {
        // Get the current pathname and hash
        const pathname = window.location.pathname;
        const hash = window.location.hash;

        // Remove the username part between '/profile/' and any hash
        const profilePath = "/profile"; // Base path for the profile
        if (pathname.includes(profilePath) && pathname.split('/').length > 2) {
            // Update the URL without the username part
            const cleanPath = `${profilePath}${hash ? hash : ''}`;
            window.history.replaceState(null, "", cleanPath);
        }
    };

    useEffect(() => {
        if (
            window.location.pathname.includes('profile') &&
            !enforceViewType &&
            (!username || authState.user.username === username)
        ) {
            cleanUrl();
        }
    }, [enforceViewType, username, authState.user.username]);
    


    return enforceViewType === '' ? (
        (!username || authState.user.username === username || window.location.pathname === "/profile") ? (
        <MyProfile username={username} fetchProfileData={fetchProfileData} isCustomizing={isCustomizing} />
    ) : (
        <OtherProfile username={username} fetchProfileData={fetchProfileData} isCustomizing={isCustomizing} />
    )
    ) : (
        enforceViewType === 'self' ? (
            <MyProfile username={authState.user.username} fetchProfileData={fetchProfileData} isCustomizing={isCustomizing} />
        ) : (
            <OtherProfile username={authState.user.username} fetchProfileData={fetchProfileData} enforceViewType={enforceViewType} isCustomizing={isCustomizing} />
        )
    )

};

export default Profile;