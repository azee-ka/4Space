import React, { useEffect, useState } from 'react';
import './timeline.css';
import useApi from '../../../utils/useApi';
import { formatDateTime } from '../../../utils/formatDateTime';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { Link } from 'react-router-dom';

const CommunitiesTimeline = () => {
  const { callApi } = useApi();
  const [communities, setCommunities] = useState([]);

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

  return (
    <div className="communities-timeline-page">
      <div className="communities-timeline-header">
        <h2>Community Timeline</h2>
      </div>

      <div className="timeline-feed">
        {communities.length === 0 ? (
          <div className="loading">Loading communities...</div>
        ) : (
          <div className="community-feed">
            {communities.map((comm) => (
              <Link
                to={`/communities/c/${comm.id}`}
                className="community-post-link"
                key={comm.id}
              >
                <div className="community-card community-post">
                  <div className="community-post-body">
                    <div className="community-header">
                      <ProfilePicture
                        src={comm.logo}
                        isCommunity={true}
                        className="community-header-logo"
                      />
                      <div className="community-title">
                        <h3>{comm.name}</h3>
                        <span className="community-meta">
                          {comm.category || 'General'} •{' '}
                          {formatDateTime(comm.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="community-description">
                      {comm.description || 'No description available.'}
                    </p>
                    <div className="community-tags">
                      <span>{comm?.type}</span>
                      <span>{comm?.members_count || 0} members</span>
                      <span>By {comm?.created_by || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitiesTimeline;
