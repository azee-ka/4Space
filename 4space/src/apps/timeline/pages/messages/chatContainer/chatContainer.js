import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './chatContainer.css';
import { useAuthState } from '../../../../../general/components/Authentication/utils/AuthProvider';
import API_BASE_URL from '../../../../../config';
import ProfilePicture from '../../../../../general/utils/profilePicture/getProfilePicture';
import GetConfig from '../../../../../general/components/Authentication/utils/config';
import moment from 'moment';

const ChatContainer = ({ fetchUserMessagesList }) => {
    const navigate = useNavigate();
    const { uuid } = useParams();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const [messageToSend, setMessageToSend] = useState();
    const [otherUserChatInfo, setOtherUserChatInfo] = useState();
    const [messages, setMessages] = useState([]);

    const [chatExists, setChatExists] = useState(false);

    const [isRestricted, setIsRestricted] = useState(false);

    const websocket = useRef(null);
    const [socketInitialized, setSocketInitialized] = useState(false); // Track WebSocket initialization
    const isWebSocketInitialized = useRef(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const [isHandlingScroll, setIsHandlingScroll] = useState(false);

    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 20;


    const fetchPastMessages = async (newOffset = 0, append = false) => {
        let countMessage = 0;
        if (loading) return;
        // if(!chatExists) return
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/chats/${uuid}/messages/`, {
                ...config,
                params: {
                    limit,
                    offset: newOffset,
                },
            });
            const newMessages = response.data.results;
            console.log('newMessages', response.data);
            countMessage = response.data.count;
            if (newMessages.length < limit) setHasMore(false);
            setMessages((prevMessages) => append ? [...newMessages, ...prevMessages] : newMessages);
            setOffset(newOffset + limit);

        } catch (error) {
            if (error.response) {
                if (error.response.data.detail === "No Chat matches the given query.") {
                    setChatExists(false);
                }
            } else {
                console.log("err run")
                console.error('Error fetching messages:', error);
            }
        } finally {
            setLoading(false);
            setChatExists(true);
        }
        return countMessage;
    };

    const handleFetchOtherUserInfo = async () => {

            try {
                const response = await axios.get(`${API_BASE_URL}api/apps/chats/${uuid}/details`, config);
                console.log(response.data);
                setOtherUserChatInfo(response.data);
                const messageCount = await fetchPastMessages();
                setIsRestricted(response.data.restricted && response.data.participants.length !== 0 && messageCount !== 0 && response.data.inviter.participant.username !== user.username);
                setChatExists(true);
            } catch (error) {
                if (error.response) {
                    if (error.response.data.detail === "No Chat matches the given query.") {
                        setChatExists(false);
                    }
                } else {
                    console.log("err run")
                    console.error('Error fetching chat information:', error);
                }
            }
        
    }

    useEffect(() => {
        if (!isWebSocketInitialized.current) {

            websocket.current = new WebSocket(`ws://localhost:8000/ws/chat/${uuid}/`, [], config);
            setSocketInitialized(true);
            isWebSocketInitialized.current = true;
            websocket.current.onopen = () => {
                console.log('WebSocket connection established');
            };

            websocket.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log(data);
                if (!data.error) {
                    // Update messages state without duplicates
                    setMessages((prevMessages) => {
                        if (!prevMessages.some((msg) => msg.id === data.message.id)) {
                            return [...prevMessages, data.message];
                        }
                        return prevMessages;
                    });
                } else {
                    console.error(data.error);
                }
            };



        }

        websocket.current.onclose = () => {
            console.log('WebSocket closed');
            isWebSocketInitialized.current = false;
        };

        websocket.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };


        // Cleanup function
        return () => {
            if (websocket && websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };

    }, [uuid, config, socketInitialized]);

    // console.log("user", user)

    const handleSendMessage = () => {

        const dataToSend = {
            'action': 'send_message',
            'message': messageToSend,
            'user_id': user.id, // Include the user's ID
        };

        if (websocket.current && messageToSend) {
            websocket.current.send(JSON.stringify(dataToSend));
            setMessageToSend('');
        }
        console.log('messages', messages);
    };


    useEffect(() => {
        if (uuid) {
            handleFetchOtherUserInfo();
            fetchPastMessages();
        }
        // eslint-disable-next-line
    }, [uuid]);

    const formatDate = (date) => {
        return moment(date).format('MMMM Do YYYY, h:mm a');
    };

    const shouldShowTime = (currentMessage, nextMessage) => {
        if (!nextMessage) return true;
        const currentTime = moment(currentMessage.timestamp);
        const nextTime = moment(nextMessage.timestamp);
        return nextTime.diff(currentTime, 'minutes') > 9; // Adjust the time difference as needed
    };

    const shouldIncreaseSpacing = (currentMessage, nextMessage) => {
        if (!currentMessage || !nextMessage) return false;
        const currentTime = moment(currentMessage.timestamp);
        const nextTime = moment(nextMessage.timestamp);
        const diff = nextTime.diff(currentTime, 'minutes');
        return diff > 3 && diff <= 9;
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };


    const handleScroll = useCallback(() => {
        setIsHandlingScroll(true); // Set the state to true when handleScroll runs
        if (chatContainerRef.current.scrollTop === 0 && hasMore && !loading) {
            // console.log('Fetching more messages...');
            fetchPastMessages(offset, true);
        }
    }, [offset, hasMore, loading]);

    useLayoutEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            const handleScrollDebug = () => {
                // console.log('Scroll position:', chatContainer.scrollTop);
                handleScroll();
            };
            chatContainer.addEventListener('scroll', handleScrollDebug);
            return () => {
                chatContainer.removeEventListener('scroll', handleScrollDebug);
            };
        }
    }, [handleScroll]);

    useEffect(() => {
        if (!isHandlingScroll) { // Only scroll to bottom if not handling scroll
            scrollToBottom();
        }
    }, [messages, isHandlingScroll]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        setIsHandlingScroll(false); // Reset the state after scrolling to bottom
    };


    const handleAcceptChatInvitation = () => {
        const dataToSend = {
            'action': 'accept_invitation',
            'user_id': user.id,
        };

        if (websocket.current) {
            websocket.current.send(JSON.stringify(dataToSend));
            handleFetchOtherUserInfo();
        }
    };

    const handleRejectChatInvitation = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}api/apps/chats/${uuid}/reject_chat_invitation/`, null, config);
            console.log(response.data);
            navigate('/messages');
        } catch (error) {
            console.error('Error fetching chat information:', error);
        }
    }

    const handleBlockReportChatInvitation = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}api/apps/chats/${uuid}/block_report_chat_invitation/`, null, config);
            console.log(response.data);
            navigate('/timeline/messages');
        } catch (error) {
            console.error('Error fetching chat information:', error);
        }
    }

    return otherUserChatInfo && otherUserChatInfo.participants.length !== 0 ? (
        <div className="chat-container">
            <div className='user-chat-details'>
                <div className='user-chat-details-inner'>
                    <div className='user-chat-participants-profile-pics'>
                        {otherUserChatInfo.participants.map((participant, index) => (
                            <div key={index} className='other-user-chat-profile-picture'>
                                <ProfilePicture src={participant.participant.profile_picture} />
                            </div>
                        ))}
                    </div>
                    <div className='user-chat-participants-usernames'>
                        {otherUserChatInfo.participants.map((participant, index) => (
                            <div key={index} className='other-user-chat-username'>
                                <p>
                                    <Link to={`/timeline/profile/${participant.participant.username}`}>
                                        {`${participant.participant.first_name}`} {otherUserChatInfo.participants.length === 1 && participant.participant.last_name}
                                    </Link>
                                    {index < 5 && index < otherUserChatInfo.participants.length - 1 && ', '}
                                </p>
                            </div>
                        ))}
                        {otherUserChatInfo.participants.length > 5 && (
                            <div className='other-user-chat-username'>
                                <p>and {otherUserChatInfo.participants.length} more</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className='chat-space-messages' ref={chatContainerRef}>
                <div className='chat-space-messages-inner'>
                    {messages.map((message, index) => (
                        message && (
                            <React.Fragment key={`${message.id}-${index}`}>
                                {(index === 0 || shouldShowTime(messages[index - 1], message)) && (
                                    <div className="message-time">{formatDate(message.timestamp)}</div>
                                )}
                                <div
                                    className={`message-bubble ${message.sender.id === user.id ? 'sent' : 'received'} ${shouldIncreaseSpacing(messages[index - 1], message) ? 'increased-spacing' : ''}`}
                                >
                                    {message.content}
                                </div>
                            </React.Fragment>
                        )
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            {otherUserChatInfo.restricted && !isRestricted &&
                <div className='inform-user-about-restriction'>
                    <p>You can only send three message until accepted by the user. Remember to be mindful and respectful.</p>
                </div>
            }
            {!isRestricted ? (
                <div className='new-message-field-container'>

                    <div className='textarea-field-container'>
                        <div className='textarea-field-container-inner'>
                            <textarea
                                placeholder='Message...'
                                value={messageToSend}
                                onChange={(e) => setMessageToSend(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    </div>
                    <div className='send-message-btn-container'>
                        <button onClick={handleSendMessage}>
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className='restricted-chat-interact-container'>
                    {isRestricted &&
                        <div className='inform-restriction-description'>
                            <p>
                                Accept message request from <Link to={`/profile/${otherUserChatInfo.inviter.username}`}>
                                    {otherUserChatInfo.inviter.username}
                                </Link>?
                            </p>
                        </div>
                    }
                    <div className='restricted-chat-interact-container-inner'>
                        <div className='restricted-chat-interact-container-inner-inner'>
                            <button onClick={() => handleAcceptChatInvitation()}>
                                Accept
                            </button>
                            <button onClick={() => handleRejectChatInvitation()}>
                                Reject
                            </button>
                            <button onClick={() => handleBlockReportChatInvitation()}>
                                Block & Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : (
        chatExists ? (
            <div className='chat-container-loading'>Loading...</div>
        ) : (
            <div className='chat-container-unauth'>
                <h4>Error 404 (not found): Unauthorized</h4>
                <p>You are not allowed to access this chat.</p>
            </div>
        )
    )
}

export default ChatContainer;