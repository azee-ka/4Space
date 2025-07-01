// src/pages/profile/myProfile/tabs/postsTab/PostsTab.jsx

import React, { useEffect, useState, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import './postsTab.css';

import { ExpandPostProvider } from '../../../../../components/postUI/expandPost/expandPostContext';
import { usePostContext } from '../../../../../context/PostContext';
import VisualGridTile from '../../../../../apps/home/explore/visual/exploreVisualPostCard';
import ThreadPostCard from '../../../../../apps/home/explore/thread/threadPostCard';

import { fetchUserPosts } from '../../../../../services/posts';
import { USER_POSTS } from '../../../../../services/queryKeys';

const PAGE_SIZE = 20;

const PostsTab = () => {
  // pull the profile‐name from the URL, not from authState
  const { username } = useParams();

  // ── Tab state (persist in hash) ──
  const getTabFromHash = () => {
    const h = window.location.hash.replace('#', '');
    return h === 'thread' ? 'thread' : 'visual';
  };
  const [activeTab, setActiveTab] = useState(getTabFromHash());

  useEffect(() => {
    const handler = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#visual');
    }
  }, []);
  const switchToTab = (tabKey) => {
    if (tabKey !== activeTab) {
      window.location.hash = `#${tabKey}`;
      setActiveTab(tabKey);
    }
  };

  // ── Infinite Queries ──
  const visualQuery = useInfiniteQuery({
    queryKey: USER_POSTS(username, 'Visual'),
    queryFn: ({ pageParam = 0 }) =>
      fetchUserPosts({ username, postType: 'Visual', pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: last => {
      if (!last.next) return undefined;
      const url = new URL(last.next, window.location.origin);
      return parseInt(url.searchParams.get('offset') || '0', 10);
    },
    enabled: !!username && activeTab === 'visual',
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const threadQuery = useInfiniteQuery({
    queryKey: USER_POSTS(username, 'Thread'),
    queryFn: ({ pageParam = 0 }) =>
      fetchUserPosts({ username, postType: 'Thread', pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: last => {
      if (!last.next) return undefined;
      const url = new URL(last.next, window.location.origin);
      return parseInt(url.searchParams.get('offset') || '0', 10);
    },
    enabled: !!username && activeTab === 'thread',
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // ── Infinite-scroll sentinel ──
  const sentinelRef = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return;
        if (activeTab === 'visual' && visualQuery.hasNextPage && !visualQuery.isFetchingNextPage) {
          visualQuery.fetchNextPage();
        }
        if (activeTab === 'thread' && threadQuery.hasNextPage && !threadQuery.isFetchingNextPage) {
          threadQuery.fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [
    activeTab,
    visualQuery.hasNextPage,
    visualQuery.isFetchingNextPage,
    threadQuery.hasNextPage,
    threadQuery.isFetchingNextPage
  ]);

  // ── Expand post handler ──
  const { handleExpandPostOpen } = usePostContext();
  const onExpand = (post, idx, list) => {
    const currentPath = window.location.pathname + window.location.hash;
    handleExpandPostOpen(
      post.id,
      list.map(p => ({ id: p.id, post_type: p.post_type })),
      currentPath,
      idx,
      post.post_type
    );
  };

  // ── Masonry breakpoints ──
  const masonryBreakpoints = { default: 3, 1200: 3, 900: 2, 600: 1 };

  // ── Pick the right query and flatten pages ──
  const isVisual = activeTab === 'visual';
  const { data: vData, isLoading: vLoading, isFetchingNextPage: vLoadingMore } = visualQuery;
  const { data: tData, isLoading: tLoading, isFetchingNextPage: tLoadingMore } = threadQuery;

  const visualPosts = (vData?.pages || []).flatMap(p => p.results || []);
  const threadPosts = (tData?.pages || []).flatMap(p => p.results || []);

  const displayedPosts = isVisual ? visualPosts : threadPosts;
  const isLoadingFirstPage = isVisual ? vLoading : tLoading;
  const isLoadingMore = isVisual ? vLoadingMore : tLoadingMore;

  return (
    <div className="other-posts-tab-container">
      {/* Tabs Header */}
      <div className="other-posts-tabs-header">
        <button
          className={`other-posts-tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => switchToTab('visual')}
        >
          Visual
        </button>
        <button
          className={`other-posts-tab-btn ${activeTab === 'thread' ? 'active' : ''}`}
          onClick={() => switchToTab('thread')}
        >
          Thread
        </button>
      </div>

      {/* First‐page loading */}
      {isLoadingFirstPage ? (
        <div className="other-posts-loading">Loading posts…</div>
      ) : (
        <>
          {displayedPosts.length === 0 ? (
            <div className="other-posts-no-posts">
              {isVisual ? "No visual posts yet!" : "No thread posts yet!"}
            </div>
          ) : (
            <>
              {isVisual && (
                <div className="other-posts-masonry-wrapper">
                  <Masonry
                    breakpointCols={masonryBreakpoints}
                    className="other-posts-masonry-grid"
                    columnClassName="other-posts-masonry-column"
                  >
                    {visualPosts.map((post, idx) => {
                      const firstMedia = post.post.media_files?.[0] || null;
                      const thumb = firstMedia
                        ? { file: firstMedia.file, media_type: firstMedia.media_type }
                        : null;
                      return (
                        <div key={post.id}>
                          <VisualGridTile
                            post={{
                              id: post.id,
                              thumbnail: thumb,
                              media_files_count: post.post.media_files?.length || 0,
                              post_type: 'Visual',
                            }}
                            onClick={() => onExpand(post, idx, visualPosts)}
                          />
                        </div>
                      );
                    })}
                  </Masonry>
                  <div ref={sentinelRef} className="other-posts-sentinel" />
                  {isLoadingMore && <div className="other-posts-loading-more">Loading more…</div>}
                </div>
              )}

              {!isVisual && (
                <div className="my-thread-list">
                  {threadPosts.map((post, idx) => (
                    <ExpandPostProvider key={post.id} postId={post.id} postData={post}>
                      <ThreadPostCard postId={post.id} index={idx} />
                    </ExpandPostProvider>
                  ))}
                  <div ref={sentinelRef} className="other-posts-sentinel" />
                  {isLoadingMore && <div className="other-posts-loading-more">Loading more…</div>}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PostsTab;
