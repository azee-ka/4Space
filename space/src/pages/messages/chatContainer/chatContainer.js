// src/pages/messages/chatContainer/chatContainer.jsx

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import DOMPurify from "dompurify";
import RenderText from "../../../utils/autoCompleteInput/renderText";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import CustomTextarea from "./customTextarea";
import DropdownButton from "../../../utils/popperButton/DropdownButton";
import EmojiButton from "../../../utils/editor/EmojiButton";
import useWebSocket from "../../../hooks/useWebSocket";
import {
  shouldGroupMessages,
  isFirstGroupedMessage,
  isLastGroupedMessage,
} from "./messageGrouping";
import {
  fetchConversationDetails,
  fetchMessages,
  sendMessageAPI,
  acceptRequest,
  rejectRequest,
  blockRequest,
} from "../../../services/messages";
import {
  CONVO_DETAILS,
  CONVO_MESSAGES,
  REQUEST_CONVERSATIONS,
  INBOX_CONVERSATIONS,
} from "../../../services/queryKeys";
import { FaEllipsisV, FaPaperPlane } from "react-icons/fa";
import "./chatContainer.css";
import { formatDateTime } from "../../../utils/formatDateTime";

// Helper to check emoji-only
function isEmojiOnlyMessage(text) {
  const cleaned = text?.replace(/[\s\u200B]/g, "");
  if (!cleaned) return false;
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
  return [...cleaned].every(char => emojiRegex.test(char));
}
const TIME_GAP_THRESHOLD = 15 * 60 * 1000;

// Message bubble
const ChatMessage = React.memo(function ChatMessage({ message, previous, next, isOwn, centerPanelRef }) {
  const grouped = shouldGroupMessages(message, previous);
  const first = isFirstGroupedMessage(message, previous);
  const last = isLastGroupedMessage(message, next);
  const plainText = message?.text?.replace(/<\/?[^>]+(>|$)/g, "").trim();
  const isEmojiOnly = isEmojiOnlyMessage(plainText);
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

// Main container
const PAGE_SIZE = 30;
const ChatContainer = ({ conversationId }) => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const centerPanelRef = useRef(null);
  const scrollRef = useRef();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [justSent, setJustSent] = useState(false);

  // Query: conversation details
  const { data: conversation } = useQuery({
    queryKey: CONVO_DETAILS(conversationId),
    queryFn: () => fetchConversationDetails(conversationId),
    enabled: !!conversationId,
  });

  // Query: messages infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery({
    queryKey: CONVO_MESSAGES(conversationId),
    queryFn: ({ pageParam = 0 }) =>
      fetchMessages({ conversationId, offset: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const urlObj = new URL(lastPage.next, window.location.origin);
        const offset = urlObj.searchParams.get("offset");
        return offset ? parseInt(offset, 10) : undefined;
      }
      return undefined;
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
  });

  // Flatten to old-to-new order
  const messages =
    data?.pages.flatMap((page) => page.results).sort(
      (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
    ) || [];

  // Scroll & fetch next logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setUserScrolledUp(!atBottom);
      if (el.scrollTop < 150 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Auto scroll to bottom when new message
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!userScrolledUp || justSent) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        setJustSent(false);
      });
    }
  }, [messages, userScrolledUp, justSent]);

  // WebSocket: new message (update query cache)
  useWebSocket(`messages/inbox/${conversationId}/`, {
    onMessage: (data) => {
      if (data.type === "chat_message" && data.message) {
        queryClient.setQueryData(CONVO_MESSAGES(conversationId), (old) => {
          if (!old) return old;
          const alreadyExists = old.pages.some((p) =>
            p.results.some((m) => m.uuid === data.message.uuid)
          );
          if (alreadyExists) return old;
          // Add to last page
          const newPages = [...old.pages];
          newPages[newPages.length - 1] = {
            ...newPages[newPages.length - 1],
            results: [...newPages[newPages.length - 1].results, data.message],
          };
          return { ...old, pages: newPages };
        });
      }
    },
  });

  // Mutations (use your query keys for invalidation)
  const acceptMutation = useMutation({
    mutationFn: () => acceptRequest(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries(CONVO_DETAILS(conversationId));
      await queryClient.invalidateQueries(REQUEST_CONVERSATIONS);
      await queryClient.invalidateQueries(INBOX_CONVERSATIONS);
    },
  });
  const rejectMutation = useMutation({
    mutationFn: () => rejectRequest(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries(REQUEST_CONVERSATIONS);
      navigate("/messages/requests");
    },
  });
  const blockMutation = useMutation({
    mutationFn: () => blockRequest(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries(REQUEST_CONVERSATIONS);
      navigate("/messages/requests");
    },
  });
  const sendMutation = useMutation({
    mutationFn: ({ text }) => sendMessageAPI({ conversationId, text }),
    onSuccess: () => {
      setInput("");
      setJustSent(true);
      refetch();
    },
  });

  // Handlers
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMutation.mutate({ text: DOMPurify.sanitize(trimmed) });
  };
  const isOwn = (msg) =>
    msg.sender_username === authState?.current?.user?.username;

  // Footer UI
  const renderFooter = () => {
    if (!conversation) return null;
    const { view_type, conversation_status } = conversation;
    const isBlocked = conversation_status === "blocked";
    const isInvite = conversation_status === "invite";
    const isInviteAccepted = conversation_status === "allowed";
    const hasSentInvite = messages.length >= 1;

    if (isBlocked) {
      return <div className="request-warning-container">You cannot send messages in this conversation.</div>;
    }
    if (isInvite && hasSentInvite) {
      return (
        <div className="request-warning-container">
          <h3>Invite Sent</h3>
          You can send more messages once your request is accepted.
        </div>
      );
    }
    if ((isInvite || isInviteAccepted) && view_type === "inbox") {
      return (
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
          <button className="send-message-btn" onClick={handleSend} disabled={sendMutation.isLoading}>
            <FaPaperPlane />
          </button>
        </div>
      );
    }
    if (view_type === "request") {
      return (
        <div className="message-request-actions">
          <button className="request-btn primary" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isLoading}>Accept</button>
          <button className="request-btn subtle" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isLoading}>Reject</button>
          <button className="request-btn danger" onClick={() => blockMutation.mutate()} disabled={blockMutation.isLoading}>Block</button>
          <button className="request-btn danger-outline" onClick={() => blockMutation.mutate()} disabled={blockMutation.isLoading}>Report & Block</button>
        </div>
      );
    }
    return (
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
        <button className="send-message-btn" onClick={handleSend} disabled={sendMutation.isLoading}>
          <FaPaperPlane />
        </button>
      </div>
    );
  };

  // Main render
  return (
    <div className="chat-container">
      <div className="chat-header">
        {conversation?.participants?.length > 0 && (
          <>
            <div className="chat-header-avatar-group">
              {conversation.participants
                .filter((p) => p.user.id !== authState?.current?.user?.id)
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
                  .filter((p) => p.user.id !== authState?.current?.user?.id)
                  .map((p) => `${p.user.first_name} ${p.user.last_name}`)
                  .join(", ")}
              </p>
              <p className="chat-header-username">
                {conversation.participants
                  .filter((p) => p.user.id !== authState?.current?.user?.id)
                  .map((p) => `@${p.user.username}`)
                  .join(", ")}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="chat-body" ref={scrollRef}>
        {isLoading ? (
          <div className="chat-loading">Loading messages…</div>
        ) : (
          [...messages].reverse().map((msg, i, arr) => (
            <div key={msg.uuid} className={`chat-bubble-row-wrapper ${isOwn(msg) ? "own" : "other"}`}>
              <ChatMessage
                message={msg}
                previous={arr[i - 1]}
                next={arr[i + 1]}
                isOwn={isOwn(msg)}
                centerPanelRef={scrollRef}
              />
            </div>
          ))
        )}
      </div>
      <div className="chat-container-bottom-panel">{renderFooter()}</div>
    </div>
  );
};

export default ChatContainer;
