import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import ChatContainer from "../chatContainer/chatContainer";
import { fetchRequestConversations } from "../../../services/messages";
import { REQUEST_CONVERSATIONS } from "../../../services/queryKeys";
import "./requests.css";

const MessageRequests = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const { data: requests, isLoading } = useQuery({
    queryKey: REQUEST_CONVERSATIONS,
    queryFn: fetchRequestConversations,
  });

  return (
    <div className="requests-layout">
      <div className="requests-panel">
        <div className="requests-header-bar">
          <h2>Message Requests</h2>
        </div>

        <div className="requests-list">
          {isLoading ? (
            <div className="requests-empty">Loading…</div>
          ) : requests?.length > 0 ? (
            requests.map((chat) => (
              <div
                key={chat.uuid}
                className={`chat-request-item ${
                  chat.uuid === conversationId ? "active" : ""
                }`}
                onClick={() => navigate(`/messages/requests/c/${chat.uuid}`)}
              >
                <ProfilePicture
                  src={chat?.other_participant?.user?.profile_image}
                  className="chat-avatar"
                />
                <div className="chat-info">
                  <p className="chat-name">
                    {chat?.other_participant?.user?.first_name}{" "}
                    {chat?.other_participant?.user?.last_name}
                    {chat?.group_participant_count > 1 && (
                      <span> +{chat.group_participant_count - 1}</span>
                    )}
                  </p>
                  <p className="chat-username">
                    @{chat?.other_participant?.user?.username}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="requests-empty">No message requests.</div>
          )}
        </div>
      </div>

      <div className="requests-chat-panel">
        {conversationId ? (
          <ChatContainer conversationId={conversationId} />
        ) : (
          <div className="requests-placeholder">
            <p>Select a request to preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageRequests;
