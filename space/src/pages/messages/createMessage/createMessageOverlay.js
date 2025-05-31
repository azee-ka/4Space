import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import useApi from "../../../utils/useApi";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import "./createMessageOverlay.css";
import { useAuth } from "../../../hooks/useAuth";

const CreateMessageOverlay = ({ onClose }) => {
  const { callApi } = useApi();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");

  const inputRef = useRef(null);

  const search = async (val) => {
    if (!val.trim()) return setResults([]);
    try {
      const res = await callApi(`search/user-search/?query=${val}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search error", err);
    }
  };

  const handleSelect = (user) => {
    if (selected.some((s) => s.id === user.id)) return;
    setSelected((prev) => [...prev, user]);
    setQuery("");
    setResults([]);
  };

  const handleRemove = (id) => {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && !query && selected.length) {
      handleRemove(selected[selected.length - 1].id);
    }
  };


const startConversation = async () => {
  try {
    console.log("Starting conversation with:", selected);
    const payload = selected.map((u) => ({
      id: u.user?.id ?? u.id,
      username: u.user?.username ?? u.username,
    }));

    const res = await callApi("messages/create_conversation/", "POST", {
      recipients: payload,
    });

    navigate(`/messages/inbox/c/${res.data.conversation_uuid}`);
    onClose();
  } catch (err) {
    console.error("Start conversation error", err.response?.data || err);
  }
};



  return (
    <div className="msg-overlay" onClick={onClose}>
      <div className="msg-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-header">
          <span>New Chat</span>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="recipient-bar">
          {selected.map((r) => (
            <span key={r.id} className="pill">
              {r.username}
              <FaTimes onClick={() => handleRemove(r.id)} />
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            placeholder="Type a username..."
            onKeyDown={handleKeyDown}
          />
        </div>

        {results.length > 0 && (
          <ul className="results-list">
            {results.map((user) => (
              <li key={user.id} onClick={() => handleSelect(user)}>
                <ProfilePicture src={user.profile_image} />
                <span>{user.username}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={startConversation}
          disabled={selected.length === 0}
          className="submit-btn"
        >
          Start
        </button>
      </div>
    </div>
  );
};

export default CreateMessageOverlay;
