import React, { useRef, useState } from "react";
import ReactDOM from 'react-dom';
import './createMessageOverlay.css';
import { FaTimes } from "react-icons/fa";
import useApi from "../../../utils/useApi";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { useNavigate } from "react-router-dom";

const CreateMessageOverlay = ({ onClose }) => {
    const navigate = useNavigate();
    const { callApi } = useApi();
    const [searchedRecipients, setSearchedRecipients] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [query, setQuery] = useState('');

    const searchUserInputRef = useRef(null);

    const searchRecipients = async (query) => {
        try {
            const response = await callApi(`search/user/?query=${query}`);
            setSearchedRecipients(response.data);
            console.log(response.data);
        } catch (err) {
            console.error('Error fetching recipients serach query', err);
        }
    };

    const handleStartChat = async () => {
        try {
            const response = await callApi(`messages/create_conversation/`, 'POST', { recipients: selectedRecipients });
            console.log(response.data);
            navigate(`/messages/inbox/c/${response?.data?.conversation_uuid}`);
            onClose();
        } catch (err) {
            console.error('Error fetching recipients serach query', err);
        }
    };


    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        if (value) {
            searchRecipients(value);
        } else {
            setSearchedRecipients([]);
        }
    };

    const handleSelectRecipient = (recipient) => {
        if (!selectedRecipients.some(user => user.id === recipient.id)) {
            setSelectedRecipients([...selectedRecipients, { username: recipient.username, id: recipient.id }
            ]);
        }
        setQuery('');
        setSearchedRecipients([]);
        searchUserInputRef.current.focus();
    };

    const handleRemoveRecipient = (id) => {
        setSelectedRecipients(selectedRecipients.filter(user => user.id !== id));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace' && query === '' && selectedRecipients.length > 0) {
            handleRemoveRecipient(selectedRecipients[selectedRecipients.length - 1].id);
        }
    };

    return (
        <div className="create-message-overlay" onClick={onClose}>
                <div className="create-message-card" onClick={(e) => e.stopPropagation()}>
                    <div className="create-message-top-panel">
                        <h3>Write A Message</h3>
                        <button onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="create-message-select-recipient">
                        <div className="create-message-recipient-input">
                            <h4>To:</h4>
                            <div className="input-container">
                                {selectedRecipients.map((recipient) => (
                                    <div key={`${recipient.id}-${recipient.username}`} className="recipient-block">
                                        {recipient.username}
                                        <FaTimes
                                            className="remove-recipient-icon"
                                            onClick={() => handleRemoveRecipient(recipient.id)}
                                        />
                                    </div>
                                ))}
                                <input
                                    ref={searchUserInputRef}
                                    placeholder="Search..."
                                    value={query}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                    className="recipient-input-field"
                                />
                            </div>
                        </div>
                        <div className="recipients-search-list">
                            {searchedRecipients?.length > 0 ? (
                                <ul>
                                    {searchedRecipients.map((recipient) => (
                                        <li
                                            key={`${recipient.id}-${recipient.username}`}
                                            onClick={() => handleSelectRecipient(recipient)}
                                            className="recipient-item"
                                        >
                                            <div className="recipient-profile-image">
                                                <ProfilePicture src={recipient.profile_image} />
                                            </div>
                                            <p>
                                                {recipient.username}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="no-recipients-container">
                                    <h4>No account found!</h4>
                                </div>
                            )

                            }
                        </div>
                    </div>
                    <button
                        className="start-chat-btn"
                        disabled={selectedRecipients.length === 0}
                        onClick={handleStartChat}
                    >
                        Start Conversation
                    </button>
                </div>
        </div>
    )
}

export default CreateMessageOverlay;