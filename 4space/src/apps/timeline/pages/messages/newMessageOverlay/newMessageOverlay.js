import React, { useState } from 'react';
import axios from 'axios';
import { useAuthState } from '../../../../../general/components/Authentication/utils/AuthProvider';
import API_BASE_URL from '../../../../../config';
import './newMessageOverlay.css';
import ProfilePicture from '../../../../../general/utils/profilePicture/getProfilePicture';
import GetConfig from '../../../../../general/components/Authentication/utils/config';

const NewMessageOverlay = ({ setSendNewMessageOverlay, handlePerProfileChat }) => {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchQuery(inputValue);

        if (inputValue !== "") {
            handleSubmitSearch();
        } else {
            setSearchResults([]);
        }
    };

    const handleSubmitSearch = () => {
        axios.get(`${API_BASE_URL}api/components/search/user-search/?query=${searchQuery}`, config)
            .then((response) => {
                setSearchResults(response.data);
            })
            .catch((error) => {
                console.error('Error searching for users:', error);
            });
    };

    const handleSelectUser = (usernameToChatWith) => {
        if (selectedUsers.includes(usernameToChatWith)) {
            setSelectedUsers(selectedUsers.filter(user => user !== usernameToChatWith));
        } else {
            setSelectedUsers([...selectedUsers, usernameToChatWith]);
        }
    };

    const handleStartChat = async () => {
        if (selectedUsers.length === 0) {
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}api/apps/chats/create/`, { usernames: selectedUsers }, config);
            console.log(response.data);
            setSendNewMessageOverlay(false);
            handlePerProfileChat(response.data);
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    return (
        <div className='new-message-overlay' onClick={() => setSendNewMessageOverlay(false)}>
            <div className='new-message-overlay-card' onClick={(e) => e.stopPropagation()}>
                <div className='new-message-overlay-card-inner'>
                    <div className='new-messge-card-title'>
                        <h2>New Message</h2>
                    </div>
                    <div className='new-message-card-content'>
                        <div className='new-message-card-content-inner'>
                            <div className='new-message-card-message-to-field'>
                                <input
                                    placeholder='Send Message To...'
                                    value={searchQuery}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='new-message-user-search-list'>
                                {searchResults.map((thisUser, index) => (
                                    <div className="users-search-list-item" key={`${thisUser.username}-${index}`}>
                                        <div className="users-search-list-item-inner">
                                            <div className="users-search-list-item-profile-picture">
                                                <div className="users-search-list-item-profile-picture-inner">
                                                    <ProfilePicture src={thisUser.profile_picture} />
                                                </div>
                                            </div>
                                            <div className="users-search-list-item-username">
                                                <p>{thisUser.username}</p>
                                            </div>
                                            <div className="users-search-list-item-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(thisUser.username)}
                                                    onChange={() => handleSelectUser(thisUser.username)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleStartChat} disabled={selectedUsers.length === 0}>
                                Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewMessageOverlay;
