// File: src/pages/profile/myProfile/tabs/MyCommunitiesTab.jsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './myCommunitiesTab.css';
import useApi from '../../../../../../utils/useApi';
import { formatDateTime } from '../../../../../../utils/formatDateTime';
import ProfilePicture from '../../../../../../utils/profilePicture/getProfilePicture';
import RenderText from '../../../../../../utils/autoCompleteInput/renderText';
import { useAuth } from '../../../../../../hooks/useAuth';

const PAGE_SIZE = 20;

const MyCommunitiesTab = () => {
  const navigate = useNavigate();
  const { callApi } = useApi();
  const { authState } = useAuth();

  // 1) Derive initial tab from URL hash (exchanges or communities)
  const getTabFromHash = () => {
    const raw = window.location.hash.replace('#', '');
    return raw === 'communities' ? 'communities' : 'exchanges';
  };
  const [activeTab, setActiveTab] = useState(getTabFromHash());

  // If no hash on first load, default to #exchanges
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#exchanges');
    }
  }, []);

  // Sync activeTab when the hash changes (Back/Forward / manual edits)
  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Helper to switch tabs (push new hash + update state)
  const switchToTab = (tabKey) => {
    if (tabKey !== activeTab) {
      window.location.hash = `#${tabKey}`;
      setActiveTab(tabKey);
    }
  };

  // 2) Grab current username once
  const [username, setUsername] = useState(null);
  useEffect(() => {
    setUsername(authState?.current?.user?.username);
  }, [authState]);

  // ─── EXCHANGES (infinite scroll) ───
  const [exchanges, setExchanges] = useState([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMoreExchanges, setHasMoreExchanges] = useState(false);
  const [loadingExchanges, setLoadingExchanges] = useState(false);
  const sentinelRef = useRef(null);

  const buildExchangesUrl = (offset = 0) =>
    `profile/${username}/exchanges/?limit=${PAGE_SIZE}&offset=${offset}`;

  // Only fetch the first page of exchanges when activeTab is 'exchanges' AND we haven't loaded any yet
  useEffect(() => {
    if (!username) return;
    if (activeTab !== 'exchanges') return;
    if (exchanges.length > 0) return; 
    // <— if already have some exchanges, skip re-fetch

    const fetchFirstExchanges = async () => {
      setLoadingExchanges(true);
      try {
        const resp = await callApi(buildExchangesUrl(0));
        const data = resp.data; // { results: [...], next: <url|null>, count: <int> }

        setExchanges(data.results || []);
        if (data.next) {
          const urlObj = new URL(data.next);
          const nxt = urlObj.searchParams.get('offset');
          setNextOffset(nxt ? parseInt(nxt, 10) : null);
          setHasMoreExchanges(true);
        } else {
          setNextOffset(null);
          setHasMoreExchanges(false);
        }
      } catch (err) {
        console.error('Error fetching exchanges:', err);
        setExchanges([]);
        setHasMoreExchanges(false);
      } finally {
        setLoadingExchanges(false);
      }
    };

    fetchFirstExchanges();
  }, [username, activeTab, exchanges.length]);

  // Load more exchanges if sentinel is visible
  const loadMoreExchanges = useCallback(async () => {
    if (loadingExchanges) return;
    if (!hasMoreExchanges || nextOffset === null) return;

    setLoadingExchanges(true);
    try {
      const resp = await callApi(buildExchangesUrl(nextOffset));
      const data = resp.data;
      setExchanges(prev => [...prev, ...(data.results || [])]);

      if (data.next) {
        const urlObj = new URL(data.next);
        const nxt = urlObj.searchParams.get('offset');
        setNextOffset(nxt ? parseInt(nxt, 10) : null);
        setHasMoreExchanges(true);
      } else {
        setNextOffset(null);
        setHasMoreExchanges(false);
      }
    } catch (err) {
      console.error('Error loading more exchanges:', err);
      setHasMoreExchanges(false);
    } finally {
      setLoadingExchanges(false);
    }
  }, [loadingExchanges, nextOffset, hasMoreExchanges, username]);

  useEffect(() => {
    if (activeTab !== 'exchanges') return;
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) loadMoreExchanges();
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreExchanges, activeTab]);

  // ─── COMMUNITIES (static list) ───
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Only fetch communities list when activeTab is 'communities' AND we haven't loaded any yet
  useEffect(() => {
    if (!username) return;
    if (activeTab !== 'communities') return;
    if (communities.length > 0) return; 
    // <— if already have some communities, skip re-fetch

    setLoadingCommunities(true);
    const fetchCommunities = async () => {
      try {
        const resp = await callApi(`profile/${username}/communities/`);
        setCommunities(resp.data || []);
      } catch (err) {
        console.error('Error fetching communities:', err);
        setCommunities([]);
      } finally {
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, [activeTab, communities.length]);

  // ─── NAVIGATION HANDLERS ───
  const onExpandExchange = (exchangeId) => {
    navigate(`/communities/e/${exchangeId}`);
  };
  const onExpandCommunity = (commId) => {
    navigate(`/communities/c/${commId}`);
  };

  return (
    <div className="my-communities-tab-container">
      {/* — Sub-Tabs Header — */}
      <div className="my-communities-tabs-header">
        <button
          className={`my-communities-tab-btn ${activeTab === 'exchanges' ? 'active' : ''}`}
          onClick={() => switchToTab('exchanges')}
        >
          Exchanges
        </button>
        <button
          className={`my-communities-tab-btn ${activeTab === 'communities' ? 'active' : ''}`}
          onClick={() => switchToTab('communities')}
        >
          Communities
        </button>
      </div>

      {/* — Exchanges Tab — */}
      {activeTab === 'exchanges' && (
        <>
          {loadingExchanges && exchanges.length === 0 ? (
            <div className="my-communities-loading">Loading exchanges…</div>
          ) : exchanges.length === 0 ? (
            <div className="my-communities-no-data">
              You haven’t created any exchanges yet.
            </div>
          ) : (
            <div className="my-exchanges-list">
              {exchanges.map(post => (
                <div
                  key={post.id}
                  className="my-discussion-card"
                  onClick={() => onExpandExchange(post.id)}
                >
                  <div className="discussion-vote-panel">
                    <span className="vote-icon">▲</span>
                    <span className="vote-count">{post.upvotes}</span>
                    <span className="vote-icon">▼</span>
                  </div>
                  <div className="discussion-content">
                    <div className="discussion-header">
                      <div className="user-icon">
                        <ProfilePicture src={post.author.profile_image} />
                      </div>
                      <div className="meta">
                        <span className="username">@{post.author.username}</span>
                        <span className="timestamp">
                          {formatDateTime(post.created_at, true)}
                        </span>
                      </div>
                    </div>
                    <div className="discussion-body">
                      <h4 className="discussion-title">{post.title}</h4>
                      <div className="preview">
                        <RenderText text={post.content} />
                      </div>
                    </div>
                    <div className="discussion-footer">
                      <div className="action">
                        <span className="comment-icon">💬</span>
                        <span>{post.comments_count} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="my-communities-sentinel" />

              {loadingExchanges && exchanges.length > 0 && (
                <div className="my-communities-loading-more">Loading more…</div>
              )}
            </div>
          )}
        </>
      )}

      {/* — Communities Tab — */}
      {activeTab === 'communities' && (
        <>
          {loadingCommunities ? (
            <div className="my-communities-loading">Loading communities…</div>
          ) : communities.length === 0 ? (
            <div className="my-communities-no-data">
              You haven’t created any communities yet.
            </div>
          ) : (
            <div className="my-communities-list">
              {communities.map(comm => (
                <div
                  key={comm.id}
                  className="my-community-lane"
                  onClick={() => onExpandCommunity(comm.id)}
                >
                  <div className="lane-logo">
                    <ProfilePicture src={comm.logo} isCommunity={true} />
                  </div>
                  <div className="lane-details">
                    <div className="lane-title-row">
                      <h3 className="lane-title">{comm.name}</h3>
                      <span className="lane-category">
                        {comm.category || 'General'}
                      </span>
                    </div>
                    <p className="lane-description">
                      {comm.description || 'No description provided.'}
                    </p>
                    <div className="lane-meta">
                      <span>{comm.type}</span>
                      <span>{comm.members_count || 0} members</span>
                      <span>{formatDateTime(comm.created_at)}</span>
                    </div>
                  </div>
                  <div className="lane-actions">
                    <button className="lane-action-btn">Manage</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyCommunitiesTab;
