import React, { useEffect } from "react";
import "./profile.css";
import { useNavigate, useParams } from "react-router-dom";
import OtherProfile from "./otherProfile/otherProfile";
import { useAuth } from "../../hooks/useAuth";
import MyProfile from "./myProfile/myProfile";
import useApi from "../../utils/useApi";

const Profile = ({ enforceViewType = '', isCustomizing = false }) => {
    const { username } = useParams();
    const { authState } = useAuth();
    const navigate = useNavigate();
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
    



    const handleStartChat = async (selectedRecipients) => {
        console.log('Selected recipients:', selectedRecipients);
        try {
            const response = await callApi(`messages/create_conversation/`, 'POST', { recipients: selectedRecipients });
            console.log(response.data);
            navigate(`/messages/inbox/c/${response?.data?.conversation_uuid}`);
        } catch (err) {
            console.error('Error starting chat', err);
        }
    };


    return enforceViewType === '' ? (
        (!username || authState.user.username === username || window.location.pathname === "/profile") ? (
        <MyProfile username={username} fetchProfileData={fetchProfileData} isCustomizing={isCustomizing} />
    ) : (
        <OtherProfile username={username} fetchProfileData={fetchProfileData} isCustomizing={isCustomizing} handleStartChat={handleStartChat} />
    )
    ) : (
        enforceViewType === 'self' ? (
            <MyProfile username={authState.user.username} fetchProfileData={fetchProfileData} isCustomizing={isCustomizing} />
        ) : (
            <OtherProfile username={authState.user.username} fetchProfileData={fetchProfileData} enforceViewType={enforceViewType} isCustomizing={isCustomizing} handleStartChat={handleStartChat} />
        )
    )

};

export default Profile;