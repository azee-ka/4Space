import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthState } from '../../../general/Authentication/utils/AuthProvider';
import API_BASE_URL from '../../../../config';
import './newMessageOverlay.css';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import GetConfig from '../../../general/Authentication/utils/config';

const NewMessageOverlay = ({ setSendNewMessageOverlay }) => {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const [sendMessageToField, setSendMessageToField] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [sendMessageContentField, setSendMessageContentField] = useState('');

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchQuery(inputValue);

        if (inputValue !== "") {
            handleSubmitSearch();
        } else {
            setSearchResults([]);
        }

    };

    const handleSubmitSearch = (e) => {
        // Make an API request to search for users

        axios.get(`${API_BASE_URL}api/components/search/user-search/?query=${searchQuery}`, config)
    .then((response) => {
        setSearchResults(response.data);
    })
    .catch((error) => {
        console.error('Error searching for users:', error);
    });

    };


    const handleSelectUserToStartChat = async (usernameToChatWith) => {
        console.log(usernameToChatWith);

        try { 
            const response = await axios.post(`${API_BASE_URL}api/apps/chats/create/${usernameToChatWith}/`, null, config);
            console.log(response.data);
            
        } catch (error) {
            console.error('Error sending message:', error);
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
                                ></input>
                            </div>
                            <div className='new-message-user-search-list'>
                                {searchResults.map((thisUser, index) => (
                                    <div className="users-search-list-item" onClick={() => handleSelectUserToStartChat(thisUser.username)} key={`${thisUser.username}-${index}`}>
                                        <div className="users-search-list-item-inner">
                                            <div className="users-search-list-item-profile-picture">
                                                <div className="users-search-list-item-profile-picture-inner">
                                                    <ProfilePicture src={thisUser.profile_picture} />
                                                </div>
                                            </div>
                                            <div className="users-search-list-item-username">
                                                <p>{thisUser.username}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewMessageOverlay;