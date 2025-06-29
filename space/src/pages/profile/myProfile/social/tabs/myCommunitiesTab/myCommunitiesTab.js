// File: src/pages/profile/myProfile/tabs/MyCommunitiesTab.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './myCommunitiesTab.css';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { USER_EXCHANGES, USER_COMMUNITIES } from '../../../../../../services/queryKeys';
import {
  fetchUserExchanges,
  fetchUserCommunities
} from '../../../../../../services/communities';
import { formatDateTime } from '../../../../../../utils/formatDateTime';
import { timeAgo } from '../../../../../../utils/convertDateTIme';
import { FiMessageCircle, FiShare2 } from 'react-icons/fi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import RenderText from '../../../../../../utils/autoCompleteInput/renderText';
import { useAuth } from '../../../../../../hooks/useAuth';
import ProfilePicture from '../../../../../../utils/profilePicture/getProfilePicture';

const PAGE_SIZE = 20;

const MyCommunitiesTab = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [activeTab, setActiveTab] = useState(
    window.location.hash.replace('#', '') === 'communities'
      ? 'communities'
      : 'exchanges'
  );

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#exchanges');
    }
    const onHashChange = () => {
      const h = window.location.hash.replace('#', '');
      setActiveTab(h === 'communities' ? 'communities' : 'exchanges');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const switchToTab = (tab) => {
    window.location.hash = `#${tab}`;
    setActiveTab(tab);
  };

  const username = authState?.current?.user?.username;

  // ── Exchanges infinite scroll via React Query ──
  const {
    data: exchangesPages,
    isLoading: loadingExchanges,
    isError: errorExchanges,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: USER_EXCHANGES(username),
    queryFn: ({ pageParam = 0 }) =>
      fetchUserExchanges({ username, pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return parseInt(url.searchParams.get('offset') || '0', 10);
    },
    enabled: !!username && activeTab === 'exchanges'
  });

  // ── Communities static list via React Query ──
  const {
    data: communities = [],
    isLoading: loadingCommunities,
    isError: errorCommunities
  } = useQuery({
    queryKey: USER_COMMUNITIES(username),
    queryFn: () => fetchUserCommunities(username),
    enabled: !!username && activeTab === 'communities'
  });

  // Sentinel for infinite scroll
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const allExchanges = exchangesPages?.pages.flatMap((p) => p.results) || [];

  const onExpandExchange = (id) => navigate(`/communities/e/${id}`);
  const onExpandCommunity = (slug) => navigate(`/communities/c/${slug}`);

  return (
    <div className="my-communities-tab-container">
      <div className="my-communities-tabs-header">
        <button
          className={`my-communities-tab-btn ${
            activeTab === 'exchanges' ? 'active' : ''
          }`}
          onClick={() => switchToTab('exchanges')}
        >
          Exchanges
        </button>
        <button
          className={`my-communities-tab-btn ${
            activeTab === 'communities' ? 'active' : ''
          }`}
          onClick={() => switchToTab('communities')}
        >
          Communities
        </button>
      </div>

      {activeTab === 'exchanges' && (
        <>
          {loadingExchanges && allExchanges.length === 0 ? (
            <div className="my-communities-loading">Loading exchanges…</div>
          ) : errorExchanges ? (
            <div className="my-communities-no-data">Error loading exchanges.</div>
          ) : allExchanges.length === 0 ? (
            <div className="my-communities-no-data">
              You haven’t created any exchanges yet.
            </div>
          ) : (
            <div className="my-exchanges-list">
              {allExchanges.map((post) => (
                <div
                  key={post.id}
                  className="my-profile-exchange-card"
                  onClick={() => onExpandExchange(post.id)}
                >
                  <div
                    className="my-profile-exchange-save"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FontAwesomeIcon icon={faBookmark} />
                  </div>

                  <div className="my-profile-exchange-content">
                    <div
                      className="my-profile-exchange-meta-top"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RenderText
                        className="my-profile-exchange-community"
                        text={`c/${post.community.slug}`}
                      />
                      <span className="my-profile-exchange-dot">•</span>
                      <span className="my-profile-exchange-timeago">
                        {timeAgo(post.meta.created_at)}
                      </span>
                      <span className="my-profile-exchange-dot">•</span>
                      <span className="my-profile-exchange-datetime">
                        {formatDateTime(post.meta.created_at)}
                      </span>
                    </div>

                    <h2 className="my-profile-exchange-title">
                      <RenderText text={post.title} />
                    </h2>

                    <div className="my-profile-exchange-snippet">
                      <RenderText text={post.content} />
                    </div>

                    <div
                      className="my-profile-exchange-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="my-profile-exchange-comment-count-btn">
                        <FiMessageCircle className="my-profile-exchange-comment-icon" />
                        {post.stats.comments_count}{' '}
                        {post.stats.comments_count !== 1 ? 'replies' : 'reply'}
                      </button>
                      <button className="my-profile-exchange-share-btn">
                        <FiShare2 className="my-profile-exchange-share-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={sentinelRef} className="my-communities-sentinel" />
              {isFetchingNextPage && (
                <div className="my-communities-loading-more">Loading more…</div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'communities' && (
        <>
          {loadingCommunities ? (
            <div className="my-communities-loading">Loading communities…</div>
          ) : errorCommunities ? (
            <div className="my-communities-no-data">Error loading communities.</div>
          ) : communities.length === 0 ? (
            <div className="my-communities-no-data">
              You haven’t created any communities yet.
            </div>
          ) : (
            <div className="my-communities-list">
              {communities.map((comm) => (
                <div
                  key={comm.id}
                  className="my-community-lane"
                  onClick={() => onExpandCommunity(comm.slug)}
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
