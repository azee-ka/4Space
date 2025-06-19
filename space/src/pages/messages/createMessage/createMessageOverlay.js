import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { useMutation } from "@tanstack/react-query";
import { searchUsers, createConversation } from "../../../services/messages";
import "./createMessageOverlay.css";

const CreateMessageOverlay = ({ onClose }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const handleSearch = async (val) => {
    if (!val.trim()) return setResults([]);
    const users = await searchUsers(val);
    setResults(users);
  };

  const { mutate: startConversation, isLoading } = useMutation({
    mutationFn: (recipients) => createConversation(recipients),
    onSuccess: (data) => {
      navigate(`/messages/inbox/c/${data.conversation_uuid}`);
      onClose();
    },
  });

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
              handleSearch(e.target.value);
            }}
            placeholder="Type a username..."
            onKeyDown={handleKeyDown}
            disabled={isLoading}
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
          onClick={() =>
            startConversation(
              selected.map((u) => ({
                id: u.user?.id ?? u.id,
                username: u.user?.username ?? u.username,
              }))
            )
          }
          disabled={selected.length === 0 || isLoading}
          className="submit-btn"
        >
          {isLoading ? "Starting..." : "Start"}
        </button>
      </div>
    </div>
  );
};

export default CreateMessageOverlay;
