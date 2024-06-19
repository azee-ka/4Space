// personalProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthState } from '../../../general/Authentication/utils/AuthProvider';
import './requestChats.css';
import API_BASE_URL from '../../../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faPaperPlane, faPlus, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import ChatContainer from '../chatContainer/chatContainer';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import GetConfig from '../../../general/Authentication/utils/config';
import { useNavigate, useParams } from 'react-router-dom';

const RequestChatsList = ({ handleRequestChatsViewToggle, chatToViewObj, setChatToViewObj, handlePerProfileChat }) => {
    const { username, chat_id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [receivedRequestChats, setReceivedRequestedChats] = useState([]);
    const [sentRequestChats, setSentRequestedChats] = useState([]);

    const [showSentRequests, setShowSentRequests] = useState(false);


    const fetchReceivedRequestChatList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/chats/pending-received-list-chats/`, config);
            setReceivedRequestedChats(response.data);
            console.log(response.data);

        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };


    const fetchSentRequestChatList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/chats/pending-sent-list-chats/`, config);
            setSentRequestedChats(response.data);
            console.log(response.data);

        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };


    useEffect(() => {
        fetchReceivedRequestChatList();
        fetchSentRequestChatList();
    }, []);

    // const handlePerProfileChat = (per_message_element) => {
    //     setChatToViewObj(per_message_element);
    //     navigate('/messages' + '/request/' + per_message_element.other_user.username, { replace: true });
    // };


    const handleToggleShowSentRequests = () => {
        if (showSentRequests) {
            setShowSentRequests(false);
            fetchReceivedRequestChatList();
            navigate('/messages/requests/recieved');
        } else {
            console.log("csdsd sent");
            setShowSentRequests(true);
            fetchSentRequestChatList();
            navigate('/messages/requests/sent');
        }
    }


    return (
        <div className='requested-chat-left-container'>
            <div className='requested-chat-send-new'>
                <div className='requested-chat-send-new-inner'>
                    <div className='request-chat-go-back-icon'>
                        <FontAwesomeIcon icon={faChevronLeft} onClick={() => handleRequestChatsViewToggle()} />
                    </div>
                    <h3>Requests</h3>
                </div>
            </div>
            <div className='requested-chat-list-container'>
                <div className='requested-chat-list-container-inner'>
                    <div className='requested-chat-per-list'>
                        {sentRequestChats.length !== 0 &&
                            <div className='recieve-sent-filters'>
                                <button
                                    className={`${showSentRequests ? '' : 'active'}`}
                                    onClick={() => handleToggleShowSentRequests()}
                                >
                                    Recieved
                                </button>
                                <button
                                    className={`${showSentRequests ? 'active' : ''}`}
                                    onClick={() => handleToggleShowSentRequests()}
                                >
                                    Sent
                                </button>
                            </div>
                        }
                        {/* {!showSentRequests ? ( */}
                            <div className='requested-chat-per-list-inner'>
                                {(showSentRequests ? sentRequestChats : receivedRequestChats).map((per_message_element, index) => (
                                    <div className='requested-chat-list-per-message' onClick={() => handlePerProfileChat(per_message_element)} key={`${index}-${per_message_element.other_user.username}`}>
                                        <div className='requested-chat-list-per-message-inner'>
                                            <div className='requested-chat-list-per-message-inner-inner'>
                                                <div className='requested-chat-per-user-profile-picture-container'>
                                                    <ProfilePicture src={per_message_element.other_user.profile_picture} />
                                                </div>
                                                <div className='requested-chat-per-user-info'>
                                                    <div className='requested-chat-per-user-info-inner'>
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
                        {/* ) : (
                                <div className='no-requests-default'>
                                No Requests
                            </div>
                            
                        )} */}
                    </div>
                </div>
            </div>
        </div>

    );
};

export default RequestChatsList;