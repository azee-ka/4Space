import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthState } from "../../general/Authentication/utils/AuthProvider";
import MyProfile from "./myProfile/myProfile";
import UserProfile from "./userProfile/userProfile";

const Profile = ({ handleUserListTrigger, handleShowExpandedOverlayPost }) => {
    const navigate = useNavigate();
    const { user } = useAuthState();
    const { username: paramUsername } = useParams();

    const [isMyProfile, setIsMyProfile] = useState(false);

    useEffect(() => {
        console.log(user.username);
        if(user.username === paramUsername) {
            setIsMyProfile(true);
            navigate('/profile', { replace: true } );
        }
    }, []);

    return (isMyProfile || paramUsername === undefined ) ? (
            <MyProfile handleUserListTrigger={handleUserListTrigger} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost} />
    ) : (
        <UserProfile handleUserListTrigger={handleUserListTrigger} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost}/>
    )
}

export default Profile;