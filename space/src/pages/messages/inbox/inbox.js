import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useApi from "../../../utils/useApi";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import "./inbox.css";

const MessageInbox = ({ setShowCreateMessageOverlay }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { callApi } = useApi();
  const [chats, setChats] = useState([]);

  const currentChatId = location.pathname.split("/").at(-1);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await callApi("messages/list_conversations/");
        setChats(res.data);
      } catch (err) {
        console.error("Failed to fetch inbox", err);
      }
    };
    fetchChats();
  }, []);

  return (
    <div className="inbox-wrapper">
      <div className="inbox-top">
        <h3>Inbox</h3>
        <button onClick={() => setShowCreateMessageOverlay(true)}>+ New</button>
      </div>

      <div className="inbox-chats">
        {chats.length > 0 ? (
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
                  </p>
                  <p className="chat-username">@{chat?.other_participant?.user?.username}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="inbox-empty">No conversations yet.</div>
        )}
      </div>
    </div>
  );
};

export default MessageInbox;
