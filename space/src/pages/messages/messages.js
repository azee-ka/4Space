import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaInbox, FaUserPlus, FaPlus } from "react-icons/fa";
import CreateMessageOverlay from "./createMessage/createMessageOverlay";
import MessageInbox from "./inbox/inbox";
import MessageRequests from "./requests/requests";
import ChatContainer from "./chatContainer/chatContainer";
import "./messages.css";

const Messages = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const isInbox =
    location.pathname.startsWith("/messages/inbox") ||
    location.pathname === "/messages";
  const isRequests = location.pathname.startsWith("/messages/requests");

  return (
    <>
    <div className="messages-layout">
      <div className="messages-app-card">
        <aside className="messages-sidebar-mini left">
          <div className="messages-sidebar-item">
            <button
              className={isInbox ? "active" : ""}
              onClick={() => navigate("/messages/inbox")}
            >
              <FaInbox />
            </button>
            <div className="tooltip">Inbox</div>
          </div>
          <div className="messages-sidebar-item">
            <button
              className={isRequests ? "active" : ""}
              onClick={() => navigate("/messages/requests")}
            >
              <FaUserPlus />
            </button>
            <div className="tooltip">Requests</div>
          </div>
          <div className="messages-sidebar-item">
            <button onClick={() => setShowOverlay(true)}>
              <FaPlus />
            </button>
            <div className="tooltip">New Chat</div>
          </div>
        </aside>

        <main className="messages-main">
          {isRequests ? (
            <MessageRequests />
          ) : (
            <>
              <div className="inbox-pane">
                <div className="messages-header-bar">
                  <h2>Your Conversations</h2>
                </div>
                <MessageInbox setShowCreateMessageOverlay={setShowOverlay} />
              </div>

              {/* <div className="chat-pane"> */}
                {conversationId ? (
                  <ChatContainer conversationId={conversationId} />
                ) : (
                  <div className="chat-placeholder">
                    <p>Select a conversation to begin</p>
                  </div>
                )}
              {/* </div> */}
            </>
          )}
        </main>
      </div>
    </div>
        {showOverlay && <CreateMessageOverlay onClose={() => setShowOverlay(false)} />}
    </>
  );
};

export default Messages;
