// userListOverlay.js
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import API_BASE_URL from '../../../../config';
import ProfilePicture from '../../../../general/utils/profilePicture/getProfilePicture';
import './userListOverlay.css'; // Import the CSS file
import crossIcon from '../../../../assets/cross-icon.png';

const UserListOverlay = ({ userList, onClose, title }) => {
    const navigate = useNavigate();

    return userList ? (
        <div id="user-list-overlay" className="user-list-overlay" onClick={() => onClose()}>
            <div className='user-list-container' onClick={(e) => e.stopPropagation()} >
                <button className="user-close-button" onClick={onClose}>
                    <img src={crossIcon} alt="Clear" />
                </button>
                <div className="user-list-header">
                    <h2>{title}</h2>
                    <div className='user-overlay-line-seperator'></div>
                </div>
                {userList.length !== 0 && (
                    <div className="user-list">
                        {userList.map((thisUser, index) => (
                            <a href={`/timeline/profile/${thisUser.username}`} key={index}>
                                <div className="user-list-item">
                                    <ProfilePicture src={thisUser.profile_picture} />
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
