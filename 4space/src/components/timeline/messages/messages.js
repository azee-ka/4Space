// personalProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthState } from '../../general/Authentication/utils/AuthProvider';
import './messages.css';
import API_BASE_URL from '../../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faPaperPlane, faPlus } from '@fortawesome/free-solid-svg-icons';
import NewMessageOverlay from './newMessageOverlay/newMessageOverlay';
import ChatContainer from './chatContainer/chatContainer';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import GetConfig from '../../general/Authentication/utils/config';
import { useNavigate, useParams } from 'react-router-dom';
import RequestChatsList from './requestChats/requestChats';

const Messages = () => {
    const { username, chat_id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthState();
    const config = GetConfig(token);
    const [serversList, setServersList] = useState([])

    const [messagesList, setMessagesList] = useState([]);

    const [chatToViewObj, setChatToViewObj] = useState(null);

    const [collapsed, setCollapsed] = useState(true);

    const [sendNewMessageOverlay, setSendNewMessageOverlay] = useState(false);

    const [showRequestChats, setShowRequestChats] = useState(false);

    const handleCollapseToggle = () => {
        setCollapsed(!collapsed);
    };

    const fetchUserMessagesList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/chats/list-chats/`, config);
            setMessagesList(response.data);
            console.log(response.data);

        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };

    const handlePerProfileChat = (per_message_element) => {
        setChatToViewObj(per_message_element);
        navigate('/messages/' + per_message_element.other_user.username + '/' + per_message_element.id, { replace: true });
        fetchUserMessagesList();
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
            navigate('/messages');
        } else {
            setShowRequestChats(true);
            navigate('/messages/requests/recieved');
        }
    };


    return (
        <div className={`personal-messages-container`}>
            <div className='personal-messages-container-inner'>
                <div className='personal-messages-header'>
                    <h2>Messages</h2>
                    <div className='server-container-closer-icon-container'>
                        <div className='server-container-closer-icon-container-inner' onClick={handleCollapseToggle}>
                            <FontAwesomeIcon icon={faChevronUp} className={`chevron-icon ${collapsed ? 'collapsed' : ''}`} />
                        </div>
                    </div>
                </div>
                <div className='personal-messages-content'>
                    <div className='personal-messages-content-inner'>
                        {serversList.length !== 0 &&
                            <div className={`personal-messages-content-server-container ${collapsed ? 'collapsed' : ''}`}>
                                <div className={`personal-messages-content-server-container-inner`}>
                                    {serversList.map((server, index) => (
                                        <div className='personal-messages-content-per-server' key={`${index}-${server.server_name}`}>
                                            <div className='personal-messages-content-per-server-inner'>
                                                <img src={`${API_BASE_URL}${server.server_cover_picture}`} alt='server-icon' />
                                                <div className='personal-messages-content-server-title'>
                                                    {server.server_name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }
                        <div className={`personal-messages-content-inner-inner`}>
                            {showRequestChats ? (
                                <RequestChatsList
                                    handleRequestChatsViewToggle={handleRequestChatsViewToggle}
                                    chatToViewObj={chatToViewObj}
                                    setChatToViewObj={setChatToViewObj}
                                    handlePerProfileChat={handlePerProfileChat}
                                    fetchUserMessagesList={fetchUserMessagesList}
                                />
                            ) : (
                                <div className='personal-messages-left-container'>
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
                                        <div className='personal-messages-list-container-inner'>
                                            <div className='personal-messages-per-list'>
                                                <div className='personal-messages-per-list-inner'>
                                                    {messagesList.map((per_message_element, index) => (
                                                        <div className='personal-messages-list-per-message' onClick={() => handlePerProfileChat(per_message_element)} key={`${index}-${per_message_element.other_user.username}`}  >
                                                            <div className='personal-messages-list-per-message-inner'>
                                                                <div className='personal-messages-list-per-message-inner-inner'>
                                                                    <div className='personal-messages-per-user-profile-picture-container'>
                                                                        <ProfilePicture src={per_message_element.other_user.profile_picture} />
                                                                    </div>
                                                                    <div className='personal-messages-per-user-info'>
                                                                        <div className='personal-messages-per-user-info-inner'>
                                                                            <div>
                                                                                {`${per_message_element.other_user.first_name} ${per_message_element.other_user.last_name}`}
                                                                            </div>
                                                                            <div>
                                                                                @{per_message_element.other_user.username}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                            }
                            <div className='personal-messages-right-container'>
                                {(chat_id !== undefined) ? (
                                    <ChatContainer />
                                ) : (
                                    <div></div>
                                )
                                }
                            </div>
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