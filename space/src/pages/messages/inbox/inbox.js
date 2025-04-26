import React, { useEffect, useState } from "react";
import './inbox.css';
import { Link, useNavigate, useParams } from "react-router-dom";
import useApi from "../../../utils/useApi";
import { FaEdit, FaFacebookMessenger } from "react-icons/fa";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import ChatContainer from "../chatContainer/chatContainer";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

const MessageInbox = ({ setShowCreateMessageOverlay }) => {
    const navigate = useNavigate();
    const { callApi } = useApi();
    const { conversationId } = useParams();
    const [chatsList, setChatsList] = useState(null);

    const [socket, setSocket] = useState(null);

    const fetchChatsList = async () => {
        try {
            const response = await callApi(`messages/list_conversations/`);
            console.log(response.data);
            setChatsList(response.data);
        } catch (err) {
            console.error('Error fetching messages list', err)
        }
    };

    useEffect(() => {
        fetchChatsList();;
    }, []);


    // useEffect(() => {

    //     // Create the WebSocket connection
    //     const socket = new WebSocket(`ws://127.0.0.1:8000/ws/messages/inbox/${conversationId}/`);

    //     socket.onopen = () => {
    //         console.log('WebSocket connected');
    //     };


    //     socket.onmessage = (event) => {
    //         const data = JSON.parse(event.data);
    //         if (data.type === 'new_conversation') {
    //             // Directly add the new conversation to the list without fetching the entire list
    //             setChatsList((prevChatsList) => [
    //                 ...prevChatsList,
    //                 { 
    //                     uuid: data.conversation_uuid,
    //                     conversation_name: data.conversation_name,
    //                     // Add any other necessary details
    //                 }
    //             ]);
    //         }
    //     };        





    //     socket.onclose = (event) => {
    //         console.log('WebSocket closed:', event);
    //         // You can handle cleanup or retries here if needed
    //     };

    //     socket.onerror = (error) => {
    //         console.error('WebSocket error:', error);
    //     };

    //     setSocket(socket); // Update the state with the socket instance

    //     return () => {
    //         if (socket && socket.readyState === WebSocket.OPEN) {
    //             socket.close();
    //         }
    //     };
    // }, []);

    const handleChatNavigation = (conversation_uuid) => {
        navigate(`/messages/inbox/c/${conversation_uuid}`);
    };

    return (
        <div className="messages-bottom-panel">
            <div className="messages-left-panel">
                <div className="chats-top-panel">
                    <h4>Inbox</h4>
                    <button onClick={() => setShowCreateMessageOverlay(true)} >
                        <FaEdit />
                    </button>
                </div>
                <div className="chats-bottom-panel">
                    <div className="chats-bottom-panel-top">
                        <Link to={`/messages/requests`}>
                            Requests
                        </Link>
                    </div>
                    {chatsList?.length > 0 ? (
                        <div className="chats-list">
                            {chatsList.map((chat, index) => (
                                <div
                                    key={index}
                                    className="chats-list-per-chat"
                                    onClick={() => handleChatNavigation(chat.uuid)}
                                >
                                    <div className="per-chat-profile-image">
                                        <ProfilePicture src={chat?.other_participant?.user?.profile_image} />
                                    </div>
                                    <div className="per-chat-info">
                                        <p>
                                            {chat?.other_participant?.user?.first_name} {chat?.other_participant?.user?.last_name}
                                            <span>{chat?.group_participant_count > 1 ? ` and ${chat?.group_participant_count - 1} more` : ''}</span>
                                        </p>
                                        <p>@{chat?.other_participant?.user?.username}</p>
                                    </div>
                                </div>
                            ))
                            }
                        </div>
                    ) : (
                        <div className="no-chats-panel">
                            <h3>No Conversations Yet!</h3>
                        </div>
                    )
                    }
                </div>
            </div>
            <div className="messages-right-panel">
                {conversationId ? (
                    <ChatContainer conversationId={conversationId} />
                ) : (
                    <div className="no-conversation-selected-panel">
                        <div className="no-conversation-message-icon">
                            <ChatBubbleLeftRightIcon className="chat-icon" />
                        </div>
                        <h3>Select or Start a New Conversation</h3>
                        <button onClick={() => setShowCreateMessageOverlay(true)}>
                            Start Conversation
                        </button>
                    </div>
                )
                }
            </div>
        </div>
    )
};

export default MessageInbox;