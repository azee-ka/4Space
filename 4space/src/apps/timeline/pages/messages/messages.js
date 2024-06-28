// personalProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import './messages.css';
import API_BASE_URL from '../../../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faPaperPlane, faPlus, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import NewMessageOverlay from './newMessageOverlay/newMessageOverlay';
import ChatContainer from './chatContainer/chatContainer';
import ProfilePicture from '../../../../general/utils/profilePicture/getProfilePicture';
import GetConfig from '../../../../general/components/Authentication/utils/config';
import { useNavigate, useParams } from 'react-router-dom';
import RequestChatsList from './requestChats/requestChats';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const Messages = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const [serversList, setServersList] = useState([])

    const [chatsList, setChatsList] = useState([]);

    const [chatToViewObj, setChatToViewObj] = useState(null);

    const [collapsed, setCollapsed] = useState(true);

    const [sendNewMessageOverlay, setSendNewMessageOverlay] = useState(false);

    const [showRequestChats, setShowRequestChats] = useState(false);

    const [unreadChats, setUnreadChats] = useState({});

    const handleCollapseToggle = () => {
        setCollapsed(!collapsed);
    };

    const fetchUserMessagesList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/chats/list_user_chats/`, config);
            setChatsList(response.data);
            console.log(response.data);

        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };

    const handlePerProfileChat = (per_message_element) => {
        if (window.location.pathname !== '/messages/' + per_message_element.uuid) {
            setChatToViewObj(per_message_element);
            navigate('/timeline/messages/' + per_message_element.uuid, { replace: true });
            fetchUserMessagesList();
        }
    };

    useEffect(() => {
        fetchUserMessagesList();
        if (window.location.pathname.includes('requests')) {
            setShowRequestChats(true);
        }
    }, []);


    const handleRequestChatsViewToggle = () => {
        if (showRequestChats) {
            setShowRequestChats(false);
            navigate('/timeline/messages');
        } else {
            setShowRequestChats(true);
            navigate('/timeline/messages/requests/recieved');
        }
    };


    const determineUser = (message) => {
        // console.log(message);
        if (message.participants.length !== 0) {
            const inviter = message.inviter.participant.user;
            return (inviter.id === user.id) ? message.participants[0].participant.user : message.inviter.participant.user;
        }
    };



    return (
        <div className={`personal-messages-container`}>
            <div className='personal-messages-container-inner'>
                <div className='personal-messages-header'>
                    <h2>Messages</h2>
                </div>
                <div className='personal-messages-content'>
                    <div className='personal-messages-content-inner'>
                        <div className='personal-messages-left-container'>
                            {showRequestChats ? (
                                <RequestChatsList
                                    handleRequestChatsViewToggle={handleRequestChatsViewToggle}
                                    chatToViewObj={chatToViewObj}
                                    setChatToViewObj={setChatToViewObj}
                                    handlePerProfileChat={handlePerProfileChat}
                                    fetchUserMessagesList={fetchUserMessagesList}
                                    determineUser={determineUser}
                                />
                            ) : (
                                <div className='personal-messages-left-container-inner'>
                                    <div className='personal-messages-send-new'>
                                        <div className='personal-messages-send-new-inner'>
                                            <div className='requested-chats-button'>
                                                <button onClick={() => handleRequestChatsViewToggle()}>Requests</button>
                                            </div>
                                            <FontAwesomeIcon
                                                className='send-new-message-icon'
                                                icon={faPlus}
                                                onClick={() => setSendNewMessageOverlay(true)}
                                            />
                                        </div>
                                    </div>
                                    <div className='personal-messages-list-container'>
                                        <div className='personal-messages-per-list'>
                                            <div className='personal-messages-per-list-inner'>
                                                {chatsList.map((per_message_element, index) => (
                                                    <div className='personal-messages-list-per-message' onClick={() => handlePerProfileChat(per_message_element)} key={`${index}-${per_message_element.id}`}>
                                                        {per_message_element.participants.length !== 0 &&
                                                            <div className='personal-messages-list-per-message-inner'>
                                                                <div className='personal-messages-list-per-message-inner-inner'>
                                                                    <div className='personal-messages-per-user-profile-picture-container'>
                                                                        <ProfilePicture src={determineUser(per_message_element).profile_picture} />
                                                                    </div>
                                                                    <div className='personal-messages-per-user-info'>
                                                                        <div className='personal-messages-per-user-info-inner'>
                                                                            <div>
                                                                                {`${determineUser(per_message_element).first_name} ${determineUser(per_message_element).last_name}`}
                                                                            </div>
                                                                            <div>
                                                                                <p>@{determineUser(per_message_element).username}</p>
                                                                                {per_message_element.participants.length > 1 &&
                                                                                    <p>and {per_message_element.participants.length - 1} more</p>
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className='personal-messages-right-container'>
                            {(uuid !== undefined) ? (
                                <ChatContainer fetchUserMessagesList={fetchUserMessagesList} />
                            ) : (
                                <div className='personal-messages-chat-default'>
                                    <ChatBubbleLeftRightIcon className='chat-icon' />
                                    <p>Messages</p>
                                    <button onClick={() => setSendNewMessageOverlay(true)}>Send Message</button>
                                    <p>Send a message to start a chat.</p>
                                </div>
                            )
                            }
                        </div>
                    </div>
                </div>
            </div>
            {sendNewMessageOverlay &&
                <NewMessageOverlay setSendNewMessageOverlay={setSendNewMessageOverlay} handlePerProfileChat={handlePerProfileChat} />
            }
        </div>
    );
};

export default Messages;