import React, { useEffect, useState, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import './explore.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchExplorePosts } from '../../../services/home';
import { EXPLORE_FEED } from '../../../services/queryKeys';
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger';

import VisualGridTile from './visual/exploreVisualPostCard';
import ThreadPostCard from './thread/threadPostCard';
import { usePostContext } from '../../../context/PostContext';
import { ExpandPostProvider } from '../../../components/postUI/expandPost/expandPostContext';

const tabOptions = [
  { key: 'visual', label: 'Visual' },
  { key: 'thread', label: 'Thread' },
];

const PAGE_SIZE = 20;

const Explore = () => {
  const { handleExpandPostOpen } = usePostContext();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (tabOptions.some(t => t.key === hash)) return hash;
    return 'visual';
  });

  // Infinite Query per tab
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: EXPLORE_FEED(activeTab),
    queryFn: ({ pageParam = 0 }) =>
      fetchExplorePosts({ postType: activeTab.charAt(0).toUpperCase() + activeTab.slice(1), pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next, window.location.origin);
        return parseInt(url.searchParams.get('offset'), 10);
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  // Flatten posts
  const posts = useMemo(() => data?.pages?.flatMap(page => page.results) ?? [], [data]);

  // Infinite scroll trigger
  const infiniteScrollRef = useInfiniteScrollTrigger(
    () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); },
    hasNextPage,
    isFetchingNextPage
  );

  // Scroll to top and sync hash on tab switch
  useEffect(() => {
    window.scrollTo({ top: 0 });
    window.location.hash = activeTab;
  }, [activeTab]);

  // Hash sync
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (tabOptions.some(t => t.key === hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Post click handler
  const handlePostClick = (post, index) => {
    handleExpandPostOpen(post.id, posts, window.location.pathname + window.location.hash, index, post.post_type);
  };

  const masonryBreakpoints = { default: 4, 1200: 3, 900: 2, 600: 2 };

  return (
    <div className="explore-page">
      <div className="explore-page-inner">
        {/* tab header */}
        <div className="explore-header-row">
          <h2 className="explore-header-title">Explore</h2>
          <div className="explore-tabs-inline">
            {tabOptions.map(tab => (
              <button
                key={tab.key}
                className={`explore-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="explore-header-filler"></div>
        </div>
        {/* posts */}
        {isLoading && posts.length === 0 ? (
          <div className="loading">Loading posts...</div>
        ) : (
          <div className="posts-container">
            {posts.length === 0 ? (
              <div className="no-posts">No posts available.</div>
            ) : (
              <>
                {activeTab === 'visual' ? (
                  <>
                    <Masonry
                      breakpointCols={masonryBreakpoints}
                      className="explore-masonry-grid"
                      columnClassName="explore-masonry-column"
                    >
                      {posts.map((post, idx) => (
                        <VisualGridTile
                          key={post.id}
                          post={post}
                          onClick={() => handlePostClick(post, idx)}
                        />
                      ))}
                    </Masonry>
                    <div ref={infiniteScrollRef}></div>
                  </>
                ) : (
                  <div className="thread-posts-list">
                    {posts.map((post, idx) => (
                      <ExpandPostProvider key={post.id} postId={post.id} postData={post}>
                        <ThreadPostCard postId={post.id} index={idx} />
                      </ExpandPostProvider>
                    ))}
                    <div ref={infiniteScrollRef}></div>
                  </div>
                )}
              </>
            )}
            {isFetchingNextPage && <div className="loading">Loading more...</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
