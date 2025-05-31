// followListOverlay.js
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import './userListOverlay.scss'; // Import the CSS file
import ProfilePicture from '../../utils/profilePicture/getProfilePicture';
import { FaTimes } from 'react-icons/fa';

const UserListOverlay = ({ userList, onClose, title }) => {

    useEffect(() => {
        document.addEventListener('mousedown', handleCloseOverlay);
        return () => document.removeEventListener('mousedown', handleCloseOverlay);
    }, []);

    const handleCloseOverlay = (event) => {
        if (event.target.classList.contains('follow-list-overlay')) {
            onClose();
        }
    };

    return (
        <div className="follow-list-overlay">
            <div className='follow-list-container' onClick={(e) => e.stopPropagation()}>
                <button className="follow-close-button" onClick={onClose}>
                    <FaTimes className='icon-style' />
                </button>
                <div className="follow-list-header">
                    <h2>{title}</h2>
                    <div className='follow-overlay-line-seperator'></div>
                </div>
                {userList && userList?.length !== 0 ? (
                    <div className="follow-list">
                        {userList?.map((thisUser, index) => (
                            <Link key={index} to={`/profile/${thisUser?.username}`}>
                                <div className="follow-list-item">
                                    <div className='profile-picture-img-container-user-list-overlay'>
                                        <ProfilePicture src={thisUser?.profile_picture} />
                                    </div>
                                    <span>{thisUser?.username}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="no-follow">
                        <p>{`No ${title}`}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserListOverlay;
