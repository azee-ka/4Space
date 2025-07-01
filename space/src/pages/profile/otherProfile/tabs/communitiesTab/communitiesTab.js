import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './communitiesTab.css';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { USER_EXCHANGES, USER_COMMUNITIES } from '../../../../../services/queryKeys';
import {
  fetchUserExchanges,
  fetchUserCommunities
} from '../../../../../services/communities';
import { formatDateTime } from '../../../../../utils/formatDateTime';
import { timeAgo } from '../../../../../utils/convertDateTIme';
import { FiMessageCircle, FiShare2 } from 'react-icons/fi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import RenderText from '../../../../../utils/autoCompleteInput/renderText';
import { useAuth } from '../../../../../hooks/useAuth';
import ProfilePicture from '../../../../../utils/profilePicture/getProfilePicture';

const PAGE_SIZE = 20;

const CommunitiesTab = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();

  const getTabFromHash = () =>
    window.location.hash.replace('#', '') === 'communities'
      ? 'communities'
      : 'exchanges';

  const [activeTab, setActiveTab] = useState(getTabFromHash());

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#exchanges');
      setActiveTab('exchanges');
    }
    const onHash = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchToTab = tab => {
    window.location.hash = `#${tab}`;
    setActiveTab(tab);
  };

  const username = authState?.current?.user?.username;

  // ── Exchanges (infinite scroll) ──
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
    getNextPageParam: lastPage => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next, window.location.origin);
      return parseInt(url.searchParams.get('offset') || '0', 10);
    },
    enabled: !!username && activeTab === 'exchanges'
  });

  // ── Communities (static list) ──
  const {
    data: communities = [],
    isLoading: loadingCommunities,
    isError: errorCommunities
  } = useQuery({
    queryKey: USER_COMMUNITIES(username),
    queryFn: () => fetchUserCommunities(username),
    enabled: !!username && activeTab === 'communities'
  });

  // — sentinel for infinite scroll —
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { rootMargin: '200px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const allExchanges = exchangesPages?.pages.flatMap(p => p.results) || [];

  const onExpandExchange = id => navigate(`/communities/e/${id}`);
  const onExpandCommunity = slug => navigate(`/communities/c/${slug}`);

  return (
    <div className="other-communities-tab-container">
      <div className="other-communities-tabs-header">
        <button
          className={`other-communities-tab-btn ${activeTab==='exchanges'?'active':''}`}
          onClick={()=>switchToTab('exchanges')}
        >Exchanges</button>
        <button
          className={`other-communities-tab-btn ${activeTab==='communities'?'active':''}`}
          onClick={()=>switchToTab('communities')}
        >Communities</button>
      </div>

      {activeTab==='exchanges' ? (
        loadingExchanges && allExchanges.length===0 ? (
          <div className="other-communities-loading">Loading exchanges…</div>
        ) : errorExchanges ? (
          <div className="other-communities-no-data">Error loading exchanges.</div>
        ) : allExchanges.length===0 ? (
          <div className="other-communities-no-data">You haven’t created any exchanges yet.</div>
        ) : (
          <div className="other-communities-exchanges-list">
            {allExchanges.map(post=>(
              <div
                key={post.id}
                className="other-communities-exchange-card"
                onClick={()=>onExpandExchange(post.id)}
              >
                <div
                  className="other-communities-exchange-save"
                  onClick={e=>e.stopPropagation()}
                >
                  <FontAwesomeIcon icon={faBookmark}/>
                </div>
                <div className="other-communities-exchange-content">
                  <div
                    className="other-communities-exchange-meta-top"
                    onClick={e=>e.stopPropagation()}
                  >
                    <RenderText
                      className="other-communities-exchange-community"
                      text={`c/${post.community.slug}`}
                    />
                    <span className="other-communities-exchange-dot">•</span>
                    <span className="other-communities-exchange-timeago">
                      {timeAgo(post.meta.created_at)}
                    </span>
                    <span className="other-communities-exchange-dot">•</span>
                    <span className="other-communities-exchange-datetime">
                      {formatDateTime(post.meta.created_at)}
                    </span>
                  </div>
                  <h2 className="other-communities-exchange-title">
                    <RenderText text={post.title}/>
                  </h2>
                  <div className="other-communities-exchange-snippet">
                    <RenderText text={post.content}/>
                  </div>
                  <div
                    className="other-communities-exchange-actions"
                    onClick={e=>e.stopPropagation()}
                  >
                    <button className="other-communities-exchange-comment-count-btn">
                      <FiMessageCircle className="other-communities-exchange-comment-icon"/>
                      {post.stats.comments_count} {post.stats.comments_count!==1?'comments':'comment'}
                    </button>
                    <button className="other-communities-exchange-share-btn">
                      <FiShare2 className="other-communities-exchange-share-icon"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={sentinelRef} className="other-communities-sentinel"/>
            {isFetchingNextPage && <div className="other-communities-loading-more">Loading more…</div>}
          </div>
        )
      ) : (
        loadingCommunities ? (
          <div className="other-communities-loading">Loading communities…</div>
        ) : errorCommunities ? (
          <div className="other-communities-no-data">Error loading communities.</div>
        ) : communities.length===0 ? (
          <div className="other-communities-no-data">You haven’t created any communities yet.</div>
        ) : (
          <div className="other-communities-list">
            {communities.map(comm=>(
              <div
                key={comm.id}
                className="other-community-lane"
                onClick={()=>onExpandCommunity(comm.slug)}
              >
                <div className="lane-logo">
                  <ProfilePicture src={comm.logo} isCommunity/>
                </div>
                <div className="lane-details">
                  <div className="lane-title-row">
                    <h3 className="lane-title">{comm.name}</h3>
                    <span className="lane-category">{comm.category||'General'}</span>
                  </div>
                  <p className="lane-description">{comm.description||'No description provided.'}</p>
                  <div className="lane-meta">
                    <span>{comm.type}</span>
                    <span>{comm.members_count||0} members</span>
                    <span>{formatDateTime(comm.created_at)}</span>
                  </div>
                </div>
                <div className="lane-actions">
                  <button className="lane-action-btn">Manage</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default CommunitiesTab;
