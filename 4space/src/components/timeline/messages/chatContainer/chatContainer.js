import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './chatContainer.css';
import { useAuthState } from '../../../general/Authentication/utils/AuthProvider';
import API_BASE_URL from '../../../../config';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import GetConfig from '../../../general/Authentication/utils/config';
import moment from 'moment';
import useWebSocket from '../../../../utils/websocket/websocket';

const ChatContainer = () => {
    const { chat_id } = useParams();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const [messageToSend, setMessageToSend] = useState();
    const [otherUserChatInfo, setOtherUserChatInfo] = useState();
    const [messages, setMessages] = useState([]);

    const websocket = useRef(null);
    const [socketInitialized, setSocketInitialized] = useState(false); // Track WebSocket initialization
    const isWebSocketInitialized = useRef(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    const fetchPastMessages = async (newOffset = 0, append = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/chats/${chat_id}/messages/`, {
                ...config,
                params: {
                    limit,
                    offset: newOffset,
                },
            });
            const newMessages = response.data.results;
            console.log('newMessages', response.data)
            if (newMessages.length < limit) setHasMore(false);
            setMessages((prevMessages) => append ? [...newMessages, ...prevMessages] : newMessages);
            setOffset(newOffset + limit);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleFetchOtherUserInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/chats/${chat_id}/`, config);
            // console.log(response.data);
            setOtherUserChatInfo(response.data);
        } catch (error) {
            console.error('Error fetching chat information:', error);
        }
    }

    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [messages]);

    useEffect(() => {
        if (!isWebSocketInitialized.current) {

            websocket.current = new WebSocket(`ws://localhost:8000/ws/chat/${chat_id}/`, [], config);
            setSocketInitialized(true);
            isWebSocketInitialized.current = true;
            websocket.current.onopen = () => {
                console.log('WebSocket connection established');
            };

            websocket.current.onmessage = (event) => {
                const data = JSON.parse(event.data);


                // Update messages state without duplicates
                setMessages((prevMessages) => {
                    if (!prevMessages.some((msg) => msg.id === data.message.id)) {
                        return [...prevMessages, data.message];
                    }
                    return prevMessages;
                });
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

    }, [chat_id, config, socketInitialized]);

    // console.log("user", user)

    const handleSendMessage = () => {

        const dataToSend = {
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
        handleFetchOtherUserInfo();
        fetchPastMessages();
        // eslint-disable-next-line
    }, [chat_id]);

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




    return otherUserChatInfo ? (
        <div className="chat-container">
            <div className='user-chat-details'>
                <div className='user-chat-details-inner'>
                    <div className='other-user-chat-profile-picture'>
                        <ProfilePicture src={otherUserChatInfo.other_user.profile_picture} />
                    </div>
                    <div className='other-user-chat-info'>
                        <p>
                            <Link to={`/profile/${otherUserChatInfo.other_user.username}`}>
                                {`${otherUserChatInfo.other_user.first_name} ${otherUserChatInfo.other_user.last_name}`}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            <div className='chat-space-messages' ref={chatContainerRef}>
                <div className='chat-space-messages-inner'>
                    {messages.map((message, index) => (
                        <React.Fragment key={`${message.id}-${index}`}>
                            {(index === 0 || shouldShowTime(messages[index - 1], message)) && (
                                <div className="message-time">{formatDate(message.timestamp)}</div>
                            )}
                            <div
                                className={`message-bubble ${message.sender && message.sender.id === user.id ? 'sent' : 'received'} ${shouldIncreaseSpacing(messages[index - 1], message) ? 'increased-spacing' : ''}`}
                                key={`${message.id}-${index}`}
                            >
                                {message.content}
                            </div>
                        </React.Fragment>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
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
        </div>
    ) : (
        <div>Loading...</div>
    )
}

export default ChatContainer;