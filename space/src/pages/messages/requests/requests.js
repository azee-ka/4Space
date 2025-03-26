import React, { useEffect, useState } from "react";
import useApi from "../../../utils/useApi";
import './requests.css';
import { FaArrowCircleLeft, FaArrowLeft, FaChevronLeft, FaFacebookMessenger } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import ChatContainer from "../chatContainer/chatContainer";

const MessageRequests = () => {
    const navigate = useNavigate();
    const { conversationId } = useParams();
    const { callApi } = useApi();

    const [messageRequests, setMessagesRequests] = useState([]);

    // Fetch messages when the conversation changes
    const fetchMessageRequests = async () => {
        try {
            const response = await callApi(`messages/list_conversations_requests/`);
            setMessagesRequests(response.data);
            console.log(response.data);
        } catch (err) {
            console.error("Error fetching messages", err);
        }
    };

    useEffect(() => {
        fetchMessageRequests();
    }, []);

    const handleRequestNavigation = (requestId) => {
        navigate(`/messages/requests/c/${requestId}`);
    };

    return (
        <div className="messages-bottom-panel">
            <div className="message-requests-left-panel">
                <div className="message-requests-left-panel-top">
                    <Link to={'/messages/inbox'} >
                        <FaArrowLeft className="icon-style" />
                    </Link>
                    <h3>Requests</h3>
                </div>
                <div className="message-requests-left-panel-bottom">
                    {messageRequests?.length > 0 ? (
                        <div className="chats-list">
                            {messageRequests.map((chat, index) => (
                                <div
                                    key={index}
                                    className="chats-list-per-chat"
                                    onClick={() => handleRequestNavigation(chat.uuid)}
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
                            <h3>No Requests!</h3>
                        </div>
                    )
                    }
                </div>
            </div>
            <div className="message-requests-right-panel">
            {conversationId ? (
                    <ChatContainer conversationId={conversationId} />
                ) : (
                    <div className="no-conversation-selected-panel">
                        <div className="no-conversation-message-icon">
                            <FaFacebookMessenger className="icon-style" />
                        </div>
                        <h3>Select a Request</h3>
                    </div>
                )
                }
            </div>
        </div>
    )
};

export default MessageRequests;