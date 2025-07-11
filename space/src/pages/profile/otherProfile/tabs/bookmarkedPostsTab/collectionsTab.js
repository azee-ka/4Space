import React, { useEffect, useState, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../../hooks/useAuth';
import { USER_COLLECTIONS } from '../../../../../services/queryKeys';
import { fetchUserCollections } from '../../../../../services/collections';
import './collectionsTab.css';
import { useParams } from 'react-router-dom';

const PAGE_SIZE = 20;

const CollectionsTab = () => {
  const { username } = useParams();

  const tabOptions = [
  { key: 'visualpost', label: 'Visual' },
  { key: 'threadpost', label: 'Thread' },
  { key: 'comment', label: 'Comments' },
  { key: 'exchangereply', label: 'Replies' },
  { key: 'exchangepost', label: 'Exchange' }
];

const getTabFromHash = () => {
  const h = window.location.hash.replace('#', '');
  return tabOptions.find(t => t.key === h)?.key || 'visualpost';
};

const [activeTab, setActiveTab] = useState(getTabFromHash());

useEffect(() => {
  const onHashChange = () => setActiveTab(getTabFromHash());
  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
}, []);

const switchToTab = (tabKey) => {
  if (tabKey !== activeTab) {
    window.location.hash = `#${tabKey}`;
    setActiveTab(tabKey);
  }
};


  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', '#posts');
  }, []);


  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading
  } = useInfiniteQuery({
    queryKey: USER_COLLECTIONS(username, activeTab),
    queryFn: ({ pageParam = 0 }) =>
      fetchUserCollections({ username, type: activeTab, pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: lastPage => {
      if (!lastPage?.next) return undefined;
      const url = new URL(lastPage.next, window.location.origin);
      return parseInt(url.searchParams.get('offset') || '0', 10);
    },
    enabled: !!username,
  });

  const items = (data?.pages || []).flatMap(p => p.results || []);

  const sentinelRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: '200px' });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage]);

  return (
    <div className="collections-tab-container">
     <div className="collections-tab-header">
  {tabOptions.map(tab => (
    <button
      key={tab.key}
      className={`collections-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
      onClick={() => switchToTab(tab.key)}
    >
      {tab.label}
    </button>
  ))}
</div>


      {isLoading ? (
        <div className="collections-loading">Loading collections…</div>
      ) : items.length === 0 ? (
        <div className="collections-no-data">No collections found.</div>
      ) : (
        <div className="collections-list">
          {items.map((item) => (
            <div className="collections-card" key={item.id}>
              <div className="collections-title">{item.title || item.name}</div>
              <div className="collections-meta">{item.description || 'No description.'}</div>
            </div>
          ))}
          <div ref={sentinelRef} className="collections-sentinel" />
          {isFetchingNextPage && (
            <div className="collections-loading-more">Loading more…</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionsTab;
