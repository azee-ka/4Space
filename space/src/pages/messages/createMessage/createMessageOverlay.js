// src/apps/community/tabs/general/CreateMessageOverlay.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { useMutation } from "@tanstack/react-query";
import { createConversation } from "../../../services/messages";
import { searchUsers } from "../../../services/user";
import Modal from "../../../components/modal/Modal";
import "./createMessageOverlay.css";

const CreateMessageOverlay = ({ onClose }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const handleSearch = async (val) => {
    if (!val.trim()) {
      setResults([]);
      return;
    }
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
    inputRef.current?.focus();
  };

  const handleRemove = (id) => {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && !query && selected.length) {
      handleRemove(selected[selected.length - 1].id);
    }
  };

  const footer = (
    <button
      className="submit-btn"
      onClick={() =>
        startConversation(
          selected.map((u) => ({
            id: u.user?.id ?? u.id,
            username: u.user?.username ?? u.username,
          }))
        )
      }
      disabled={selected.length === 0 || isLoading}
    >
      {isLoading ? "Starting..." : "Start"}
    </button>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="New Chat"
      footer={footer}
      size="md"
      // maxWidth={"600px"}
    >
      <div className="recipient-bar">
        {selected.map((r) => (
          <span key={r.id} className="pill">
            {r.username}
            <span className="pill-remove" onClick={() => handleRemove(r.id)}>×</span>
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
    </Modal>
  );
};

export default CreateMessageOverlay;
