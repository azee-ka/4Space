import React, { useEffect, useState, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { useInfiniteQuery } from '@tanstack/react-query';
import './myPostsTab.css';
import { useAuth } from '../../../../../../hooks/useAuth';
import { ExpandPostProvider } from '../../../../../../components/postUI/expandPost/expandPostContext';
import { usePostContext } from '../../../../../../context/PostContext';
import VisualGridTile from '../../../../../../apps/home/explore/visual/exploreVisualPostCard';
import ThreadPostCard from '../../../../../../apps/home/explore/thread/threadPostCard';
import { fetchUserPosts } from '../../../../../../services/posts';
import { USER_POSTS } from '../../../../../../services/queryKeys';

const PAGE_SIZE = 20;

const MyPostsTab = () => {
  const { authState } = useAuth();
  const username = authState?.current?.user?.username;

  // --- Tab state ---
  const getTabFromHash = () => {
    const h = window.location.hash.replace('#', '');
    return h === 'thread' ? 'thread' : 'visual';
  };
  const [activeTab, setActiveTab] = useState(getTabFromHash());

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', '#visual');
  }, []);

  const switchToTab = (tabKey) => {
    if (tabKey !== activeTab) {
      window.location.hash = `#${tabKey}`;
      setActiveTab(tabKey);
    }
  };

  // --- Infinite Query for each tab ---
  const visualQuery = useInfiniteQuery({
    queryKey: USER_POSTS(username, 'Visual'),
    queryFn: ({ pageParam = 0 }) =>
      fetchUserPosts({ username, postType: 'Visual', pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: lastPage => {
      if (lastPage?.next) {
        const urlObj = new URL(lastPage.next, window.location.origin);
        const offset = urlObj.searchParams.get('offset');
        return offset ? parseInt(offset, 10) : undefined;
      }
      return undefined;
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
    getNextPageParam: lastPage => {
      if (lastPage?.next) {
        const urlObj = new URL(lastPage.next, window.location.origin);
        const offset = urlObj.searchParams.get('offset');
        return offset ? parseInt(offset, 10) : undefined;
      }
      return undefined;
    },
    enabled: !!username && activeTab === 'thread',
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Infinite scroll sentinel
  const sentinelRef = useRef(null);
  useEffect(() => {
    const observer = new window.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (activeTab === 'visual' && visualQuery.hasNextPage && !visualQuery.isFetchingNextPage) {
            visualQuery.fetchNextPage();
          }
          if (activeTab === 'thread' && threadQuery.hasNextPage && !threadQuery.isFetchingNextPage) {
            threadQuery.fetchNextPage();
          }
        }
      });
    }, { rootMargin: '200px' });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
    // Only needs to depend on tab & fetch functions
  }, [activeTab, visualQuery.hasNextPage, visualQuery.isFetchingNextPage, threadQuery.hasNextPage, threadQuery.isFetchingNextPage]);

  // Post expand handler
  const { handleExpandPostOpen } = usePostContext();
  const onExpand = (post, index, postsList) => {
    const currentPath = window.location.pathname + window.location.hash;
    handleExpandPostOpen(
      post.id,
      postsList.map(p => ({ id: p.id, post_type: p.post_type })),
      currentPath,
      index,
      post.post_type
    );
  };

  // Masonry
  const masonryBreakpoints = { default: 3, 1200: 3, 900: 2, 600: 1 };

  // Pick correct query result
  const isVisual = activeTab === 'visual';
  const {
    data: vData, isLoading: vLoading, isFetchingNextPage: vLoadingMore
  } = visualQuery;
  const {
    data: tData, isLoading: tLoading, isFetchingNextPage: tLoadingMore
  } = threadQuery;

  const visualPosts = (vData?.pages || []).flatMap(page => page.results || []);
  const threadPosts = (tData?.pages || []).flatMap(page => page.results || []);

  const displayedPosts = isVisual ? visualPosts : threadPosts;
  const isLoadingFirstPage = isVisual ? vLoading : tLoading;
  const isLoadingMore = isVisual ? vLoadingMore : tLoadingMore;

  return (
    <div className="my-posts-tab-container">
      {/* Tabs Header */}
      <div className="my-posts-tabs-header">
        <button
          className={`my-posts-tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => switchToTab('visual')}
        >
          Visual
        </button>
        <button
          className={`my-posts-tab-btn ${activeTab === 'thread' ? 'active' : ''}`}
          onClick={() => switchToTab('thread')}
        >
          Thread
        </button>
      </div>
      {isLoadingFirstPage ? (
        <div className="my-posts-loading">Loading your posts…</div>
      ) : (
        <>
          {displayedPosts.length === 0 ? (
            <div className="my-posts-no-posts">
              {isVisual
                ? "You haven’t posted any visual posts yet!"
                : "You haven’t posted any thread posts yet!"}
            </div>
          ) : (
            <>
              {isVisual && (
                <div className="my-posts-masonry-wrapper">
                  <Masonry
                    breakpointCols={masonryBreakpoints}
                    className="my-posts-masonry-grid"
                    columnClassName="my-posts-masonry-column"
                  >
                    {visualPosts.map((post, idx) => {
                      const firstMedia = post.post.media_files?.[0] || null;
                      const thumbnail = firstMedia
                        ? { file: firstMedia.file, media_type: firstMedia.media_type }
                        : null;
                      return (
                        <div key={post.id}>
                          <VisualGridTile
                            post={{
                              id: post.id,
                              thumbnail,
                              media_files_count: post.post.media_files?.length || 0,
                              post_type: 'Visual',
                            }}
                            onClick={() => onExpand(post, idx, visualPosts)}
                          />
                        </div>
                      );
                    })}
                  </Masonry>
                  <div ref={sentinelRef} className="my-posts-sentinel" />
                  {isLoadingMore && <div className="my-posts-loading-more">Loading more…</div>}
                </div>
              )}
              {!isVisual && (
                <div className="my-thread-list">
                  {threadPosts.map((post, idx) => (
                    <ExpandPostProvider key={post.id} postId={post.id} postData={post}>
                      <ThreadPostCard postId={post.id} index={idx} />
                    </ExpandPostProvider>
                  ))}
                  <div ref={sentinelRef} className="my-posts-sentinel" />
                  {isLoadingMore && <div className="my-posts-loading-more">Loading more…</div>}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyPostsTab;
