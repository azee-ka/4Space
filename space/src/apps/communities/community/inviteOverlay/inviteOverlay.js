import React, { useState } from 'react';
import './inviteOverlay.css';
import useApi from '../../../../utils/useApi';

const InviteOverlay = ({ communityId, onClose }) => {
  const { callApi } = useApi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitedUserId, setInvitedUserId] = useState(null);
  const [inviteStatus, setInviteStatus] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await callApi(`/api/search/users/?query=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  };

  const sendInvite = async (userId) => {
    try {
      await callApi(`community/${communityId}/invite/`, 'POST', { user_id: userId });
      setInviteStatus('Invitation sent!');
      setInvitedUserId(userId);
    } catch (err) {
      console.error('Invite failed:', err);
      setInviteStatus('Failed to send invite.');
    }
  };

  return (
    <div className="invite-overlay"  onClick={onClose}>
      <div className="invite-card"  onClick={(e) => e.stopPropagation()}>
        <button className="invite-close-btn" onClick={onClose}>×</button>
        <h3>Invite Members</h3>
        <input
          className="invite-search-input"
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button onClick={handleSearch} className="invite-search-btn">Search</button>

        <div className="invite-results">
          {loading && <p>Searching...</p>}
          {results.map(user => (
            <div key={user.id} className="invite-user-row">
              <span>{user.username}</span>
              <button
                disabled={invitedUserId === user.id}
                onClick={() => sendInvite(user.id)}
              >
                Invite
              </button>
            </div>
          ))}
        </div>
        {inviteStatus && <p className="invite-status">{inviteStatus}</p>}
      </div>
    </div>
  );
};

export default InviteOverlay;
