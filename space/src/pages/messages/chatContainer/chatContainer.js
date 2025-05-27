import React, { useEffect, useRef, useState } from "react";
import useApi from "../../../utils/useApi";
import DOMPurify from "dompurify";
import "./chatContainer.css";
import { FaEllipsisV, FaPaperPlane, FaRegSmile } from "react-icons/fa";
import { useAuth } from "../../../hooks/useAuth";
import RenderText from "../../../utils/autoCompleteInput/renderText";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import CustomTextarea from "./customTextarea";
import {
    shouldGroupMessages,
    isFirstGroupedMessage,
    isLastGroupedMessage,
} from "./messageGrouping";
import { formatDateTime } from "../../../utils/formatDateTime";
import useWebSocket from "../../../hooks/useWebSocket";
import EmojiButton from "../../../utils/editor/EmojiButton";
import CustomEditor from "../../../utils/editor/editor";
import { useNavigate } from "react-router-dom";
import DropdownButton from "../../../utils/popperButton/DropdownButton";

const TIME_GAP_THRESHOLD = 15 * 60 * 1000;

const ChatMessage = React.memo(({ message, previous, next, isOwn, centerPanelRef
}) => {
    const grouped = shouldGroupMessages(message, previous);
    const first = isFirstGroupedMessage(message, previous);
    const last = isLastGroupedMessage(message, next);
    const plainText = message?.text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const isEmojiOnly = /^[\p{Emoji}\u200B\s]+$/u.test(plainText);
    const timeGap =
        !grouped ||
        new Date(message.sent_at) - new Date(previous?.sent_at || 0) > TIME_GAP_THRESHOLD;

    const containerClasses = [
        "chat-bubble-row",
        isOwn ? "own" : "other",
        grouped ? "grouped" : "separate",
    ].join(" ");

    const bubbleClasses = [
        "chat-bubble",
        grouped ? "grouped" : "separate",
        first && "first",
        last && "last",
        isOwn ? "own" : "other",
        isEmojiOnly && "emoji-only",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <>
            {timeGap && (
                <div className="chat-timestamp">
                    {formatDateTime(message.sent_at, true)}
                </div>
            )}
            <div className={containerClasses}>
                <div className="bubble-wrapper">
                    <div className={bubbleClasses}>
                        <RenderText text={message.text} />
                    </div>

                    <div className="message-action-btns">
                        <DropdownButton
                            boundaryRef={centerPanelRef?.current}
                            toggleContent={
                                <button className="ellipsis-btn">
                                    <FaEllipsisV />
                                </button>
                            }
                            placement={isOwn ? "left-start" : "right-start"}
                        >
                            <div className="message-dropdown">
                                <div className="message-time">{formatDateTime(message.sent_at, true)}</div>
                                <div className="dropdown-options">
                                    <button>Forward</button>
                                    {isOwn ? (
                                        <button className="unsend-btn">Unsend</button>
                                    ) : (
                                        <button className="report-btn">Report</button>
                                    )}
                                </div>
                            </div>
                        </DropdownButton>
                    </div>
                </div>
            </div>


        </>
    );
});

const ChatContainer = ({ conversationId }) => {
    const { callApi } = useApi();
    const { authState } = useAuth();
    const navigate = useNavigate();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const endRef = useRef();

    const centerPanelRef = useRef(null);

    const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
        onMessage: (data) => {
            if (!messages.some((m) => m.uuid === data.uuid)) {
                setMessages((prev) => [...prev, data]);
            }
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            const [convRes, msgRes] = await Promise.all([
                callApi(`messages/get_conversation_details/${conversationId}`),
                callApi(`messages/get_messages/${conversationId}/`),
            ]);
            setConversation(convRes.data);
            setMessages(msgRes.data);
        };
        fetchData();
    }, [conversationId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        const safe = DOMPurify.sanitize(trimmed);
        sendMessage({
            text: safe,
            sender_username: authState?.current?.user?.username,
        });
        setInput("");
    };

    const handleAcceptRequest = async () => {
        await callApi(`messages/request/${conversationId}/accept/`, "POST");
        const updated = await callApi(`messages/get_conversation_details/${conversationId}`);
        setConversation(updated.data);
    };

    const handleRejectRequest = async () => {
        await callApi(`messages/request/${conversationId}/reject/`, "POST");
        navigate("/messages/requests");
    };

    const handleBlockRequest = async () => {
        await callApi(`messages/request/${conversationId}/block/`, "POST");
    };

    const isOwn = (msg) =>
        msg.sender_username === authState?.current?.user?.username;

    const recipient = conversation?.participants?.find(
        (p) => p.user.id !== authState?.current?.user?.id
    );

    const renderFooter = () => {
        if (!conversation) return null;

        const { view_type, conversation_status } = conversation;
        const isBlocked = conversation_status === "blocked";
        const isInvite = conversation_status === "invite";
        const isInviteAccepted = conversation_status === "allowed";
        const inviteSent = messages.length >= 1;

        if (isBlocked) {
            return (
                <div className="request-warning-container">
                    You cannot send messages in this conversation.
                </div>
            );
        }

        if (isInvite && inviteSent) {
            return (
                <div className="request-warning-container">
                    <h3>Invite Sent</h3>
                    You can send more messages once your request is accepted.
                </div>
            );
        }

        if ((isInvite && !inviteSent && view_type === "inbox") || (isInviteAccepted && view_type === "inbox")) {
            return (
                <>
                    {isInvite && messages.length === 0 && (
                        <div className="request-warning-container invite">
                            You can only send <strong>one</strong> message as an invitation until your request is accepted.
                        </div>
                    )}
                    <div className="write-message-container">
                        <EmojiButton />
                        <CustomTextarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="chat-textarea"
                        />
                        <button className="send-message-btn" onClick={handleSend}>
                            <FaPaperPlane />
                        </button>
                    </div>
                </>
            );
        }

        if (view_type === "request") {
            return (
                <div className="message-request-btns">
                    <button onClick={handleAcceptRequest} className="accept-request-btn">Accept</button>
                    <button onClick={handleRejectRequest} className="reject-request-btn">Reject</button>
                    <button onClick={handleBlockRequest} className="block-request-btn">Block</button>
                    <button onClick={() => { handleBlockRequest(); }} className="report-request-btn">Report & Block</button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                {recipient && (
                    <>
                        <ProfilePicture
                            src={recipient?.user?.profile_image}
                            className="chat-header-avatar"
                        />
                        <div className="chat-header-info">
                            <p className="chat-header-name">
                                {recipient?.user?.first_name} {recipient?.user?.last_name}
                            </p>
                            <p className="chat-header-username">
                                @{recipient?.user?.username}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="chat-body" ref={centerPanelRef}>
                {messages.map((msg, i) => (
                    <ChatMessage
                        key={msg?.uuid}
                        message={msg}
                        previous={messages[i - 1]}
                        next={messages[i + 1]}
                        isOwn={isOwn(msg)}
                        centerPanelRef={centerPanelRef}
                    />
                ))}
                <div ref={endRef} />
            </div>

            <div className="chat-container-bottom-panel">
                {renderFooter()}
            </div>
        </div>
    );
};

export default ChatContainer;
