import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { fetchInboxConversations } from "../../../services/messages";
import { INBOX_CONVERSATIONS } from "../../../services/queryKeys";
import "./inbox.css";

const MessageInbox = ({ setShowCreateMessageOverlay }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentChatId = location.pathname.split("/").at(-1);

  const { data: chats, isLoading } = useQuery({
    queryKey: INBOX_CONVERSATIONS,
    queryFn: fetchInboxConversations,
  });

  return (
    <div className="inbox-wrapper">
      <div className="inbox-top">
        <h3>Inbox</h3>
        <button onClick={() => setShowCreateMessageOverlay(true)}>+ New</button>
      </div>
      <div className="inbox-chats-container">
        <div className="inbox-chats">
          {isLoading ? (
            <div className="inbox-empty">Loading...</div>
          ) : chats?.length > 0 ? (
            chats.map((chat) => {
              const isActive = currentChatId === chat.uuid;
              return (
                <div
                  key={chat.uuid}
                  className={`chat-card ${isActive ? "active" : ""}`}
                  onClick={() => navigate(`/messages/inbox/c/${chat.uuid}`)}
                >
                  <ProfilePicture
                    src={chat?.other_participant?.user?.profile_image}
                    className="chat-avatar"
                  />
                  <div className="chat-meta">
                    <p className="chat-name">
                      {chat?.other_participant?.user?.first_name}{" "}
                      {chat?.other_participant?.user?.last_name}
                      {chat?.group_participant_count > 1 && (
                        <span> +{chat?.group_participant_count - 1}</span>
                      )}
                    </p>
                    <p className="chat-username">
                      @{chat?.other_participant?.user?.username}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="inbox-empty">No conversations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInbox;
