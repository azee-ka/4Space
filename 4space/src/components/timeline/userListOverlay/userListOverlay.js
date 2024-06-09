// userListOverlay.js
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useAuthState } from '../../general/Authentication/utils/AuthProvider';
import API_BASE_URL from '../../../config';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import './userListOverlay.css'; // Import the CSS file
import crossIcon from '../../../assets/cross-icon.png';

const UserListOverlay = ({ userList, onClose, title }) => {
    const { user } = useAuthState(); // Use the setUser function from the user context

    useEffect(() => {
        document.addEventListener('mousedown', handleCloseOverlay);
        return () => document.removeEventListener('mousedown', handleCloseOverlay);
    }, []);

    const handleCloseOverlay = (event) => {
        if (event.target.classList.contains('user-list-overlay')) {
            onClose();
        }
    };


    const myUsernameIsNotSameUser = (thisUser) => {
        return !(user.username === thisUser);
    }

    // console.log(userList);

    return userList ? (
        <div id="user-list-overlay" className="user-list-overlay">
            <div className='user-list-container'>
                <button className="user-close-button" onClick={onClose}>
                    <img src={crossIcon} alt="Clear" />
                </button>
                <div className="user-list-header">
                    <h2>{title}</h2>
                    <div className='user-overlay-line-seperator'></div>
                </div>
                {userList.length !== 0 && (
                    <div className="user-list">
                        {userList.map((thisUser) => (
                            <a href={myUsernameIsNotSameUser(thisUser.username) ? `http://localhost:3000/profile/${thisUser.username}` : `http://localhost:3000/profile`} key={thisUser.id}>
                                <div className="user-list-item">
                                    <ProfilePicture src={`${API_BASE_URL}/${thisUser.profile_picture}`} />
                                    <span>{thisUser.username}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
                {userList.length === 0 &&
                    <div className="no-user">
                        <p>{`No ${title}`}</p>
                    </div>
                }
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    )
};

export default UserListOverlay;
