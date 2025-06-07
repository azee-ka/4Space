// File: src/pages/profile/myProfile/tabs/myPostsTab/MyPostsTab.jsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import './myPostsTab.css';

import useApi from '../../../../../utils/useApi';
import { useAuth } from '../../../../../hooks/useAuth';

// ExpandPostContext (for Thread posts)
import { ExpandPostProvider } from '../../../../../components/postUI/expandPost/expandPostContext';
import { usePostContext } from '../../../../../context/PostContext';

// Re‐use the same cards from Explore:
import VisualGridTile from '../../../../../apps/home/explore/visual/exploreVisualPostCard';
import ThreadPostCard from '../../../../../apps/home/explore/thread/threadPostCard';

const PAGE_SIZE = 20;

const MyPostsTab = () => {
  const { callApi } = useApi();
  const { authState } = useAuth();
  const username = authState?.current?.user?.username;

  // — which sub‐tab is active: 'visual' or 'thread'
  //    We default to reading from window.location.hash on mount
  const getTabFromHash = () => {
    const h = window.location.hash.replace('#', '');
    return h === 'thread' ? 'thread' : 'visual';
  };
  const [activeTab, setActiveTab] = useState(getTabFromHash());

  // Whenever the hash changes in the URL bar, re‐sync activeTab:
  useEffect(() => {
    const onHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTab(newTab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // If there's no hash at all, ensure it defaults to #visual:
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#visual');
    }
  }, []);

  // Whenever activeTab changes, push the correct hash:
  const switchToTab = (tabKey) => {
    if (tabKey !== activeTab) {
      window.location.hash = `#${tabKey}`;
      // The "hashchange" listener will call setActiveTab for us,
      // but we can also set it immediately to avoid any lag:
      setActiveTab(tabKey);
    }
  };

  // ---- VISUAL POSTS STATE ----
  const [visualPosts, setVisualPosts] = useState([]);
  const [visualNextOffset, setVisualNextOffset] = useState(0);
  const [visualHasMore, setVisualHasMore] = useState(false);
  const [visualCount, setVisualCount] = useState(0);
  const [visualLoading, setVisualLoading] = useState(false);

  // ---- THREAD POSTS STATE ----
  const [threadPosts, setThreadPosts] = useState([]);
  const [threadNextOffset, setThreadNextOffset] = useState(0);
  const [threadHasMore, setThreadHasMore] = useState(false);
  const [threadCount, setThreadCount] = useState(0);
  const [threadLoading, setThreadLoading] = useState(false);

  // — sentinel ref for infinite scroll (shared)
  const sentinelRef = useRef(null);

  // — ExpandPostContext (for Thread posts)
  const { handleExpandPostOpen } = usePostContext();

  // Helper: build API URL
  const buildApiUrl = (type, offset = 0) => {
    return `profile/posts/${username}/list/?post_type=${type}&limit=${PAGE_SIZE}&offset=${offset}`;
  };

  // ─── 1) FETCH INITIAL PAGE FOR “Visual” WHEN ACTIVE ───
  useEffect(() => {
    if (!username) return;
    if (activeTab !== 'visual') return;

    // If we've already loaded a page of visuals, do not re‐fetch
    if (visualPosts.length > 0) return;

    const fetchVisualFirstPage = async () => {
      setVisualLoading(true);
      try {
        const url = buildApiUrl('Visual', 0);
        const resp = await callApi(url);
        const data = resp.data; // { results: [...], next: <url|null>, count: <int> }

        setVisualPosts(data.results || []);
        setVisualCount(data.count || 0);

        if (data.next) {
          const urlObj = new URL(data.next);
          const nextOffParam = urlObj.searchParams.get('offset');
          setVisualNextOffset(nextOffParam ? parseInt(nextOffParam, 10) : null);
          setVisualHasMore(true);
        } else {
          setVisualNextOffset(null);
          setVisualHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching visual page 1:', err);
        setVisualPosts([]);
        setVisualCount(0);
        setVisualNextOffset(null);
        setVisualHasMore(false);
      } finally {
        setVisualLoading(false);
      }
    };

    fetchVisualFirstPage();
  }, [activeTab, visualPosts.length]);

  // ─── 2) FETCH INITIAL PAGE FOR “Thread” WHEN ACTIVE ───
  useEffect(() => {
    if (!username) return;
    if (activeTab !== 'thread') return;

    // If we've already loaded a page of threads, do not re‐fetch
    if (threadPosts.length > 0) return;

    const fetchThreadFirstPage = async () => {
      setThreadLoading(true);
      try {
        const url = buildApiUrl('Thread', 0);
        const resp = await callApi(url);
        const data = resp.data;

        setThreadPosts(data.results || []);
        setThreadCount(data.count || 0);

        if (data.next) {
          const urlObj = new URL(data.next);
          const nextOffParam = urlObj.searchParams.get('offset');
          setThreadNextOffset(nextOffParam ? parseInt(nextOffParam, 10) : null);
          setThreadHasMore(true);
        } else {
          setThreadNextOffset(null);
          setThreadHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching thread page 1:', err);
        setThreadPosts([]);
        setThreadCount(0);
        setThreadNextOffset(null);
        setThreadHasMore(false);
      } finally {
        setThreadLoading(false);
      }
    };

    fetchThreadFirstPage();
  }, [username, activeTab, threadPosts.length]);

  // ─── 3) LOAD MORE (depending on activeTab) ───
  const loadMore = useCallback(async () => {
    if (activeTab === 'visual') {
      if (visualLoading) return;
      if (!visualHasMore || visualNextOffset === null) return;

      setVisualLoading(true);
      try {
        const url = buildApiUrl('Visual', visualNextOffset);
        const resp = await callApi(url);
        const data = resp.data;

        setVisualPosts(prev => [...prev, ...(data.results || [])]);

        if (data.next) {
          const urlObj = new URL(data.next);
          const nextOffParam = urlObj.searchParams.get('offset');
          setVisualNextOffset(nextOffParam ? parseInt(nextOffParam, 10) : null);
          setVisualHasMore(true);
        } else {
          setVisualNextOffset(null);
          setVisualHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching more visual posts:', err);
        setVisualHasMore(false);
      } finally {
        setVisualLoading(false);
      }
    } else {
      // activeTab === 'thread'
      if (threadLoading) return;
      if (!threadHasMore || threadNextOffset === null) return;

      setThreadLoading(true);
      try {
        const url = buildApiUrl('Thread', threadNextOffset);
        const resp = await callApi(url);
        const data = resp.data;

        setThreadPosts(prev => [...prev, ...(data.results || [])]);

        if (data.next) {
          const urlObj = new URL(data.next);
          const nextOffParam = urlObj.searchParams.get('offset');
          setThreadNextOffset(nextOffParam ? parseInt(nextOffParam, 10) : null);
          setThreadHasMore(true);
        } else {
          setThreadNextOffset(null);
          setThreadHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching more thread posts:', err);
        setThreadHasMore(false);
      } finally {
        setThreadLoading(false);
      }
    }
  }, [
    activeTab,
    visualLoading,
    visualNextOffset,
    visualHasMore,
    threadLoading,
    threadNextOffset,
    threadHasMore,
    callApi
  ]);

  // ─── 4) OBSERVER FOR “LOAD MORE” ───
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // ─── 5) EXPAND POST ───
  const onExpand = (post, index) => {
    const currentPath = window.location.pathname + window.location.hash;
    const tabPosts = activeTab === 'visual' ? visualPosts : threadPosts;
    handleExpandPostOpen(
      post.id,
      tabPosts.map(p => ({ id: p.id, post_type: p.post_type })),
      currentPath,
      index,
      post.post_type
    );
  };

  // ─── 6) RENDER ───
  const masonryBreakpoints = {
    default: 3,
    1200: 3,
    900: 2,
    600: 1,
  };

  const isVisual = activeTab === 'visual';
  const displayedPosts = isVisual ? visualPosts : threadPosts;
  const isLoadingFirstPage = isVisual
    ? visualLoading && visualPosts.length === 0
    : threadLoading && threadPosts.length === 0;
  const hasAnyMore = isVisual ? visualHasMore : threadHasMore;
  const isLoadingMore = isVisual
    ? visualLoading && visualPosts.length > 0
    : threadLoading && threadPosts.length > 0;

  return (
    <div className="my-posts-tab-container">
      {/* — Sub‐Tabs Header — */}
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

      {/* — Loading first page — */}
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
              {/* — Visual Grid — */}
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
                            onClick={() => onExpand(post, idx)}
                          />
                        </div>
                      );
                    })}
                  </Masonry>

                  {/* Sentinel for infinite scroll */}
                  <div ref={sentinelRef} className="my-posts-sentinel" />

                  {isLoadingMore && (
                    <div className="my-posts-loading-more">Loading more…</div>
                  )}
                </div>
              )}

              {/* — Thread List — */}
              {!isVisual && (
                <div className="my-thread-list">
                  {threadPosts.map((post, idx) => (
                    <ExpandPostProvider key={post.id} postId={post.id} postData={post}>
                      <ThreadPostCard postId={post.id} index={idx} />
                    </ExpandPostProvider>
                  ))}

                  {/* Sentinel at bottom */}
                  <div ref={sentinelRef} className="my-posts-sentinel" />

                  {isLoadingMore && (
                    <div className="my-posts-loading-more">Loading more…</div>
                  )}
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
