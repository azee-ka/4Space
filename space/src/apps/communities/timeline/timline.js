import React, { useEffect, useState } from 'react';
import './timeline.css';
import useApi from '../../../utils/useApi';
import { formatDateTime } from '../../../utils/formatDateTime';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { Link } from 'react-router-dom';

const CommunitiesTimeline = () => {
  const { callApi } = useApi();
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await callApi('community/timeline/get-communities/');
        setCommunities(response.data);
      } catch (error) {
        console.error("Error fetching communities:", error);
      }
    };

    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(comm =>
    comm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="communities-page-wrapper">
      <div className="community-main-content">
        <div className="communities-timeline-header">
          <h2>Discover Communities</h2>
        </div>

        <div className="community-topbar">
          <div className="tabs">
            <button className="active">All</button>
            <button>Joined</button>
            <button>Recommended</button>
            <button>New</button>
          </div>
          <input
            type="text"
            className="community-search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="timeline-feed">
          {filteredCommunities.length === 0 ? (
            <div className="loading">No communities found.</div>
          ) : (
            filteredCommunities.map((comm) => (
              <Link to={`/communities/c/${comm.id}`} className="community-lane" key={comm.id}>
                <div className="lane-logo">
                  <ProfilePicture src={comm.logo} isCommunity={true} />
                </div>

                <div className="lane-details">
                  <div className="lane-title-row">
                    <h3 className="lane-title">{comm.name}</h3>
                    <span className="lane-category">{comm.category || 'General'}</span>
                  </div>
                  <p className="lane-description">
                    {comm.description || 'No description provided.'}
                  </p>
                  <div className="lane-meta">
                    <span>{comm.type}</span>
                    <span>{comm.members_count || 0} members</span>
                    <span>By {comm.created_by || 'Unknown'}</span>
                    <span>{formatDateTime(comm.created_at)}</span>
                  </div>
                </div>

                <div className="lane-actions">
                  <button className="lane-action-btn">Join</button>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      <aside className="community-timeline-sidebar">
  <h4>Explore & Filter</h4>

  <div className="filter-group">
    <label htmlFor="category">Category</label>
    <select id="category">
      <option>All</option>
      <option>Tech</option>
      <option>Gaming</option>
      <option>Art</option>
    </select>
  </div>

  <div className="filter-group">
    <label htmlFor="type">Type</label>
    <select id="type">
      <option>All</option>
      <option>Public</option>
      <option>Private</option>
      <option>Invite Only</option>
    </select>
  </div>

  <div className="sidebar-summary">
    <span><strong>Total</strong> {communities.length}</span>
    <span><strong>Public</strong> {communities.filter(c => c.type === 'Public').length}</span>
    <span><strong>Private</strong> {communities.filter(c => c.type === 'Private').length}</span>
  </div>

  <div className="sidebar-actions">
    <button>Create Community</button>
    <button>Manage Joined</button>
  </div>
</aside>

    </div>
  );
};

export default CommunitiesTimeline;
