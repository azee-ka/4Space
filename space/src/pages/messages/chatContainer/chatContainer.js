import React, { useCallback, useEffect, useRef, useState } from "react";
import useApi from "../../../utils/useApi";
import DOMPurify from "dompurify";
import { Virtuoso } from 'react-virtuoso';
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
import { usePaginatedList } from "../../../hooks/usePaginatedList";
import { useInfiniteScrollTrigger } from "../../../hooks/useInfiniteScrollTrigger";

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




const SCROLL_TRIGGER_PX = 150;

const ChatContainer = ({ conversationId }) => {
    const { callApi } = useApi();
    const { authState } = useAuth();
    const navigate = useNavigate();

    const [conversation, setConversation] = useState(null);
    const [input, setInput] = useState("");
    const endRef = useRef();
    const textareaRef = useRef();
    const centerPanelRef = useRef(null);

    // 1. Paginated Messages Hook
    const {
        items: messages,
        loadMore,
        hasMore,
        loading,
        setItems,
    } = usePaginatedList(
        async ({ page, pageSize }) => {
            const offset = page * pageSize;
            const resp = await callApi(
                `messages/get_messages/${conversationId}/?limit=${pageSize}&offset=${offset}`
            );
            console.log(resp);
            return {
                results: resp.data.results,
                next: resp.data.next,
                count: resp.data.count
            };
        },
        { pageSize: 10, immediate: true, resetDeps: [conversationId] }
    );



    // 3. Fetch conversation details (not messages)
    useEffect(() => {
        const fetchConvoDetails = async () => {
            try {
                const res = await callApi(`messages/get_conversation_details/${conversationId}`);
                // console.log(res.data);
                setConversation(res.data);
            } catch (err) {
                console.error('Error fetching convo details', err);
            }
        }
        fetchConvoDetails();
    }, [conversationId]);



    const scrollRef = useRef();


    const [hasScrolled, setHasScrolled] = useState(false);

useEffect(() => {
  const el = scrollRef.current;
  if (!el || hasScrolled) return;
  if (messages.length && el.scrollHeight > el.clientHeight) {
    el.scrollTop = el.scrollHeight;
    setHasScrolled(true);
  }
}, [messages, hasScrolled]);

const handleScroll = useCallback(() => {
  const el = scrollRef.current;
  if (!el || loading || !hasMore) return;
  if (el.scrollTop < SCROLL_TRIGGER_PX) {
    const prevScrollHeight = el.scrollHeight;
    loadMore().then(() => {
      requestAnimationFrame(() => {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeight + el.scrollTop;
      });
    });
  }
}, [loading, hasMore, loadMore]);

  // 2. Attach the scroll handler
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);



    // 4. Scroll to bottom on new messages
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // 5. WebSocket for incoming messages (append at end, dedupe by uuid)
    const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
        onMessage: (data) => {
            setItems(prev => {
                if (prev.some((m) => m.uuid === data.uuid)) return prev;
                return [...prev, data]; // append at end, so after reverse it's at the bottom
            });
        }
    });

    const handleLoadMore = useCallback(() => {
        if (!centerPanelRef.current) return;
        const node = centerPanelRef.current;
        const prevScrollHeight = node.scrollHeight;
        const prevScrollTop = node.scrollTop;
        loadMore().then(() => {
            // After loading, wait a frame then fix scroll position
            requestAnimationFrame(() => {
                const newScrollHeight = node.scrollHeight;
                node.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
            });
        });
    }, [loadMore]);


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
        try {
            await callApi(`messages/request/${conversationId}/accept/`, "POST");
            const updated = await callApi(`messages/get_conversation_details/${conversationId}`);
            setConversation(updated.data);
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    const handleRejectRequest = async () => {
        try {
            await callApi(`messages/request/${conversationId}/reject/`, "POST");
            navigate("/messages/requests");
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    };

    const handleBlockRequest = async () => {
        try {
            await callApi(`messages/request/${conversationId}/block/`, "POST");
            navigate("/messages/requests");
        } catch (error) {
            console.error("Error blocking request:", error);
        }
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
        const isInboxView = view_type === "inbox";
        const isRequestView = view_type === "request";
        const hasSentInvite = messages.length >= 1;

        if (isBlocked) {
            return (
                <div className="request-warning-container">
                    You cannot send messages in this conversation.
                </div>
            );
        }

        if (isInvite && hasSentInvite) {
            return (
                <div className="request-warning-container">
                    <h3>Invite Sent</h3>
                    You can send more messages once your request is accepted.
                </div>
            );
        }

        if ((isInvite || isInviteAccepted) && isInboxView) {
            return (
                <>
                    {isInvite && (
                        <div className="invite-info-panel">
                            {messages.length === 0 ? (
                                <>
                                    <h4 className="invite-heading">New Chat Request</h4>
                                    <p className="invite-description">
                                        You can send <strong>one message</strong> as a request. The recipient must accept it before further replies.
                                    </p>
                                </>
                            ) : (
                                <p className="invite-description">
                                    Your message has been sent. You’ll be able to continue once your request is accepted.
                                </p>
                            )}
                        </div>
                    )}
                    <div className="write-message-container">
                        <EmojiButton inputRef={textareaRef} value={input} onChange={setInput} />
                        <CustomTextarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
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

        if (isRequestView) {
            return (
                <div className="message-request-actions">
                    <button className="request-btn primary" onClick={handleAcceptRequest}>Accept</button>
                    <button className="request-btn subtle" onClick={handleRejectRequest}>Reject</button>
                    <button className="request-btn danger" onClick={handleBlockRequest}>Block</button>
                    <button className="request-btn danger-outline" onClick={handleBlockRequest}>Report & Block</button>
                </div>

            );
        }

        return null;
    };


    return (
        <div className="chat-container">
            <div className="chat-header">
                {conversation?.participants?.length > 0 && (
                    <>
                        <div className="chat-header-avatar-group">
                            {conversation.participants
                                .filter(p => p.user.id !== authState?.current?.user?.id)
                                .slice(0, 3)
                                .map((p, idx) => (
                                    <ProfilePicture
                                        key={p.user.id}
                                        src={p.user.profile_image}
                                        className={`chat-header-avatar stacked-avatar stacked-avatar-${idx}`}
                                    />
                                ))}
                            {conversation.participants.length > 4 && (
                                <div className="stacked-avatar stacked-avatar-3 stacked-extra">
                                    +{conversation.participants.length - 3}
                                </div>
                            )}

                        </div>
                        <div className="chat-header-info">
                            <p className="chat-header-name">
                                {conversation.participants
                                    .filter(p => p.user.id !== authState?.current?.user?.id)
                                    .map(p => `${p.user.first_name} ${p.user.last_name}`)
                                    .join(", ")}
                            </p>
                            <p className="chat-header-username">
                                {conversation.participants
                                    .filter(p => p.user.id !== authState?.current?.user?.id)
                                    .map(p => `@${p.user.username}`)
                                    .join(", ")}
                            </p>
                        </div>
                    </>
                )}
            </div>
            <div
        className="chat-body"
        ref={scrollRef}
      >
        {messages.map((msg, i) => (
          <div
            key={msg.uuid}
            className={`chat-bubble-row-wrapper ${isOwn(msg) ? "own" : "other"}`}
          >
            <ChatMessage
              message={msg}
              previous={messages[i - 1]}
              next={messages[i + 1]}
              isOwn={isOwn(msg)}
              centerPanelRef={scrollRef}
            />
          </div>
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