import React, { useEffect, useState } from "react";
import './messages.css';
import useApi from "../../utils/useApi";
import { FaEdit, FaFacebookMessenger } from "react-icons/fa";
import CreateMessageOverlay from "./createMessage/createMessageOverlay";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ChatContainer from "./chatContainer/chatContainer";
import ProfilePicture from "../../utils/profilePicture/getProfilePicture";
import MessageRequests from "./requests/requests";
import MessageInbox from "./inbox/inbox";

const Messages = () => {
    const [showCreateMessageOverlay, setShowCreateMessageOverlay] = useState(false);

    // Use useLocation hook to get the current location (URL including hash)
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <div className="messages-pages">
            <div className="messages-top-panel">
                <h2>
                    <Link to={'/messages'}>
                        Messages
                    </Link>
                </h2>
            </div>
            {(currentPath.startsWith("/messages/requests")) ? (
                <MessageRequests />
            ) : (
                <MessageInbox setShowCreateMessageOverlay={setShowCreateMessageOverlay} />
            )
            }
            {showCreateMessageOverlay &&
                <CreateMessageOverlay onClose={() => setShowCreateMessageOverlay(false)} />
            }
        </div>
    )
}

export default Messages;