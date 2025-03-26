import React, { useEffect, useRef, useState } from "react";
import useApi from "../../../utils/useApi";
import DOMPurify from 'dompurify';
import './chatContainer.css';
import { FaEllipsisV, FaReply } from "react-icons/fa";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { useAuth } from "../../../hooks/useAuth";
import RenderText from "../../../utils/autoCompleteInput/renderText";
import DropdownButton from "../../../utils/popperButton/DropdownButton";
import { formatDateTime } from "../../../utils/formatDateTime";
import { useReportOverlayContext } from "../../../context/ReportOverlayContext";
import { useNavigate } from "react-router-dom";
import { shouldGroupMessages, isFirstGroupedMessage, isLastGroupedMessage } from "./messageGrouping";
import renderSendMessagePanel from "./renderSendMessagePanel";
import useWebSocket from "../../../hooks/useWebSocket";


const Message = React.memo(({
    message, 
    previousMessage, 
    nextMessage, 
    authState, 
    centerPanelRef, 
    handleReport,
    handleCopy,
}) => {
    const TIME_THRESHOLD = 15 * 60 * 1000; // 10 minutes in milliseconds

    const timeDifferenceExceedsThreshold = (currentMessage, previousMessage) => {
        if (!previousMessage || !currentMessage) return false;
        const timeDifference = new Date(currentMessage.sent_at) - new Date(previousMessage.sent_at);
        return timeDifference >= TIME_THRESHOLD; // Return true if time difference exceeds the threshold
    };


    // Determine whether the message should be grouped or separated
    const isGrouped = shouldGroupMessages(message, previousMessage);
    const isFirstGrouped = isFirstGroupedMessage(message, previousMessage);
    const isLastGrouped = isLastGroupedMessage(message, nextMessage);

    // Determine whether the message is completely separated or partially separated
    const isSeparatedFromPrevious = !isGrouped;
    const isSeparatedFromNext = !shouldGroupMessages(nextMessage, message);

    // Determine class names based on the message position (first, middle, last, or separated)
    let classNameCustom = '';

    // Handle grouped messages first
    if (isGrouped) {
        if (isFirstGrouped) {
            classNameCustom += ' first-grouped'; // First message in a group
        }
        if (isLastGrouped) {
            classNameCustom += ' last-grouped'; // Last message in a group
        }
        if (!isFirstGrouped && !isLastGrouped) {
            classNameCustom += ' middle-grouped'; // Middle message in a group
        }
    }
    // Handle separated messages
    else {
        if (isSeparatedFromPrevious && isSeparatedFromNext) {
            classNameCustom += ' completely-separated'; // Completely separated message
        } else if (isSeparatedFromPrevious && !isSeparatedFromNext) {
            classNameCustom += ' separated-from-previous'; // Separated from previous, grouped with next
        } else if (!isSeparatedFromPrevious && isSeparatedFromNext) {
            classNameCustom += ' separated-from-next'; // Separated from next, grouped with previous
        }
    }

    const plainText = message?.text.replace(/<\/?[^>]+(>|$)/g, '').trim();  // Strips HTML tags
    const isEmojiOnly = /^[\p{Emoji}\u200B\s]+$/u.test(plainText);
        console.log('isEmojiOnly', isEmojiOnly)
    // Add specific classes for sent vs received messages
    const senderClass = message.sender_username === authState.user.username ? 'sent' : 'received';


    return (
        <>
            {timeDifferenceExceedsThreshold(message, previousMessage) &&
                <div className="time-separator">
                    {formatDateTime(message.sent_at, true)} {/* Format the timestamp accordingly */}
                </div>}
            <div
                className={`message ${senderClass} ${classNameCustom}`}
            >

                {message?.sender_username === authState.user.username &&
                    <div className="message-action-btns">
                        <DropdownButton
                            toggleContent={
                                <button className="ellipsis-btn">
                                    <FaEllipsisV className="icon-style" />
                                </button>
                            }
                            boundaryRef={centerPanelRef}
                            placement="bottom-end"
                        >
                            <div className="message-more-dropdown">
                                <div className="message-time">
                                    {formatDateTime(message.sent_at, true)}
                                </div>
                                <div className="more-menu-btns">
                                    <button>
                                        Forward
                                    </button>
                                    <button onClick={() => handleCopy(message.text)}>
                                        Copy
                                    </button>
                                </div>
                                <div className="report-button-container">
                                    <button>
                                        Unsend
                                    </button>
                                </div>
                            </div>
                        </DropdownButton>
                        <button>
                            <FaReply />
                        </button>
                    </div>
                }
                <div className={`message-content ${isEmojiOnly ? 'emoji-only' : ''}`}>
                    <RenderText text={message?.text} />
                </div>
                {message?.sender_username !== authState.user.username &&
                    <div className="message-action-btns">
                        <button>
                            <FaReply />
                        </button>
                        <DropdownButton
                            toggleContent={
                                <button className="ellipsis-btn">
                                    <FaEllipsisV className="icon-style" />
                                </button>
                            }
                            boundaryRef={centerPanelRef}
                            placement="top-start"
                        >
                            <div className="message-more-dropdown">
                                <div className="message-time">
                                    {formatDateTime(message.sent_at, true)}
                                </div>
                                <div className="more-menu-btns">
                                    <button>
                                        Forward
                                    </button>
                                    <button onClick={() => handleCopy(message.text)}>
                                        Copy
                                    </button>
                                </div>
                                <div className="report-button-container">
                                    <button onClick={() => handleReport('message', message.uuid)} >
                                        Report
                                    </button>
                                </div>
                            </div>
                        </DropdownButton>
                    </div>
                }
            </div>
        </>
    );
});





const ChatContainer = ({ conversationId }) => {
    const socketRef = useRef(null);
    const navigate = useNavigate();
    const centerPanelRef = useRef(null);
    const { authState } = useAuth();
    const { callApi } = useApi();
    const { openReportOverlay } = useReportOverlayContext();
    const [typeMessageContent, setTypeMessageContent] = useState('');
    const [conversationDetails, setConversationDetails] = useState();
    const [messages, setMessages] = useState([]);

    // Fetch messages when the conversation changes
    const fetchMessages = async (conversationId) => {
        try {
            const response = await callApi(`messages/get_messages/${conversationId}/`);
            setMessages(response.data);
            console.log(response.data);
        } catch (err) {
            console.error("Error fetching messages", err);
        }
    };

    const fetchConversationDetails = async (conversationId) => {
        try {
            const response = await callApi(`messages/get_conversation_details/${conversationId}`);
            console.log(response.data);
            setConversationDetails(response.data);
        } catch (err) {
            console.error('Error fetching messages', err);
        }
    };

    useEffect(() => {
        fetchConversationDetails(conversationId);
        fetchMessages(conversationId);
    }, [conversationId]);




    // Using useWebSocket hook
    const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
        onMessage: (data) => {
            const { text, sender_username, sent_at, uuid } = data;
            setMessages(prevMessages => {
                if (prevMessages.some(msg => msg.uuid === uuid)) {
                    return prevMessages;
                }
                return [...prevMessages, { text, sender_username, sent_at, uuid }];
            });
        }
    });

    const handleSendMessage = () => {
        if (typeMessageContent.trim() !== '') {
            const messageData = {
                text: DOMPurify.sanitize(typeMessageContent),
                sender_username: authState.user.username,
            };
            sendMessage(messageData);  // Send the message through the WebSocket
            setTypeMessageContent('');  // Clear the input field
        }
    };



    const handleUnsend = async (messageId) => {
        try {
            const response = await callApi(`messages/unsend/${messageId}`, 'POST');
            console.log(response.data);
            // Update the local state to reflect the unsent message
        } catch (err) {
            console.error('Error unsending message', err);
        }
    };

    const handleReport = async (contentType = 'message', messageId) => {
        openReportOverlay(contentType, messageId);
    };

    const handleCopy = (htmlText) => {
        // Strip HTML tags using DOMPurify
        const plainText = DOMPurify.sanitize(htmlText, { ALLOWED_TAGS: [] });
    
        navigator.clipboard.writeText(plainText)
            .then(() => alert('Message copied to clipboard'))
            .catch(err => console.error('Error copying text to clipboard', err));
    };

    return (
        <div className="chat-container">
            <div className="chat-container-top-panel">
                <div className="chat-profiles-list-container">
                    <div className={`participants-profile-image-container`}>
                        {conversationDetails?.participants?.slice(0, 2).map((participant, index) => (
                            <ProfilePicture
                                key={index}
                                src={participant?.profile_image}
                                className={`profile-image profile-image-${index}`}
                            />
                        ))}
                    </div>
                    <div className="participants-profile-username-container">
                        {conversationDetails?.participants?.map((participant, index, arr) => (
                            <span key={index} className="participant-username">
                                {participant?.user?.username}
                                {index < arr.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="conversation-info-container">

                </div>
            </div>
            <div className="chat-container-center-panel" ref={centerPanelRef} >
                {messages?.map((message, index) => {
                    return (
                        <Message
                            key={message.uuid} // Use UUID as key for better list reconciliation
                            message={message}
                            previousMessage={messages[index - 1]}
                            nextMessage={messages[index + 1]}
                            authState={authState}
                            centerPanelRef={centerPanelRef}
                            handleReport={handleReport}
                            handleCopy={handleCopy}
                        />
                    )
                })}
            </div>

            <div className="chat-container-bottom-panel">
                {renderSendMessagePanel(
                    conversationId,
                    conversationDetails,
                    setConversationDetails,
                    messages.length,
                    typeMessageContent,
                    setTypeMessageContent,
                    callApi,
                    navigate,
                    handleSendMessage
                )}
            </div>
        </div>
    )
}

export default ChatContainer;