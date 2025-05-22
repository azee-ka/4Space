import React, { useState, useEffect } from 'react';
import './inviteOverlay.css';
import useApi from '../../../../utils/useApi';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';


let debounceTimeout;

const InviteOverlay = ({ communityId, onClose }) => {
  const { callApi } = useApi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitedUserId, setInvitedUserId] = useState(null);
  const [inviteStatus, setInviteStatus] = useState('');

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
      try {
        const response = await callApi(`search/user-search/?query=${query}`);
        setResults(response.data);
        console.log(response.data);
      } catch (err) {
        console.error('Search failed:', err);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const sendInvite = async (userId) => {
    try {
      await callApi(`community/${communityId}/invite/`, 'POST', { user_id: userId });
      setInviteStatus(`Invited ${userId} successfully!`);
      setInvitedUserId(userId);
    } catch (err) {
      console.error('Invite failed:', err);
      setInviteStatus('Failed to send invite.');
    }
  };

  return (
    <div className="invite-overlay" onClick={onClose}>
      <div className="invite-card" onClick={(e) => e.stopPropagation()}>
        <button className="invite-close-btn" onClick={onClose}>×</button>
        <h2 className="invite-title">Invite Members</h2>

        <div className="invite-search-bar">
          <input
            className="invite-search-input"
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="invite-results">
          {loading && <p className="invite-status">Searching...</p>}
          {!loading && results.length === 0 && query && (
            <p className="invite-status">No results found.</p>
          )}
          {results.map(user => (
            <div key={user.id} className="invite-user-row">
              <div className="invite-user-info">
                <ProfilePicture src={user.profile_image} className="invite-avatar"/>
                <div className="invite-user-meta">
                  <span className="invite-fullname">{user.first_name} {user.last_name}</span>
                  <span className="invite-username">@{user.username}</span>
                </div>
              </div>
              <button
                className="invite-action-btn"
                disabled={invitedUserId === user.id}
                onClick={() => sendInvite(user.id)}
              >
                {invitedUserId === user.id ? 'Invited' : 'Invite'}
              </button>
            </div>
          ))}
        </div>

        {inviteStatus && <p className="invite-status final">{inviteStatus}</p>}
      </div>
    </div>
  );
};

export default InviteOverlay;
