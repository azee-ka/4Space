import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApi from "../../../utils/useApi";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import ChatContainer from "../chatContainer/chatContainer";
import "./requests.css";

const MessageRequests = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { callApi } = useApi();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await callApi("messages/list_conversations_requests/");
        setRequests(res.data);
      } catch (err) {
        console.error("Failed to fetch requests", err);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="requests-layout">
      <div className="requests-panel">
        <div className="requests-header-bar">
          <h2>Message Requests</h2>
        </div>

        <div className="requests-list">
          {requests.length > 0 ? (
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
