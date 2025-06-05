// File: src/pages/profile/myProfile/tabs/myPostsTab/MyPostsTab.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import './myPostsTab.css';

import useApi from '../../../../../utils/useApi';
import { useAuth } from '../../../../../hooks/useAuth';

// ExpandPostContext (for Thread posts)
import { useExpandPostContext, ExpandPostProvider } from '../../../../../components/postUI/expandPost/expandPostContext';
import { usePostContext } from '../../../../../context/PostContext';

// Re‐use the same cards from Explore:
import VisualGridTile from '../../../../../apps/home/explore/visual/exploreVisualPostCard';
import ThreadPostCard from '../../../../../apps/home/explore/thread/threadPostCard';

const PAGE_SIZE = 20;

const MyPostsTab = () => {
  const { callApi } = useApi();
  const { authState } = useAuth();
  const username = authState?.current?.user?.username;

  // 1) “allPosts” holds everything we fetched: an array of { id, post_type, post, author, stats, … }
  const [allPosts, setAllPosts] = useState([]);

  // 2) Which tab is active: 'visual' or 'thread'
  const [activeTab, setActiveTab] = useState('visual');

  // 3) How many we display so far _for the active tab_ (start by PAGE_SIZE)
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);

  // 4) Loading indicator
  const [loading, setLoading] = useState(true);

  // 5) Sentinel ref for infinite scroll
  const sentinelRef = useRef(null);

  // 6) ExpandPostContext (for Thread posts)
  const { handleExpandPostOpen } = usePostContext();

  // 7) Fetch “allPosts” once on mount
  useEffect(() => {
    const fetchAll = async () => {
      if (!username) return;
      setLoading(true);
      try {
        // Backend returns a paginated response: { count, next, previous, results: [...] }
        const resp = await callApi(`profile/posts/${username}/list/`);
        const fetched = Array.isArray(resp.data.results) ? resp.data.results : [];
        setAllPosts(fetched);
      } catch (err) {
        console.error('Error fetching profile posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [username]);

  // Whenever we switch tabs, reset displayedCount back to PAGE_SIZE:
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [activeTab]);

  // 8) Derive “filteredPosts” based on activeTab
  const filteredPosts = allPosts.filter(p => {
    if (activeTab === 'visual') return p.post_type === 'Visual';
    if (activeTab === 'thread') return p.post_type === 'Thread';
    return false;
  });

  // 9) Determine “has more?” (per‐tab)
  const hasMore = displayedCount < filteredPosts.length;

  // 10) Only show the first “displayedCount” items from filteredPosts
  const postsToShow = filteredPosts.slice(0, displayedCount);

  // 11) When sentinel comes into view, load more
  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, filteredPosts.length));
  }, [hasMore, filteredPosts.length]);

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

  // 12) Masonry breakpoints (for Visual)
  const masonryBreakpoints = {
    default: 3,
    1200: 3,
    900: 2,
    600: 1,
  };

  // 13) Handler for expanding ANY post (visual or thread):
  const onExpand = (post, index) => {
    // Build a “fullList” of just { id, post_type } – that’s what ExpandPostProvider expects
    const fullList = postsToShow.map(p => ({ id: p.id, post_type: p.post_type }));
    const currentPath = window.location.pathname + window.location.hash;
    handleExpandPostOpen(post.id, fullList, currentPath, index, post.post_type);
  };

  return (
    <div className="my-posts-tab-container">
      {/* — Tabs Header — */}
      <div className="my-posts-tabs-header">
        <button
          className={`my-posts-tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => setActiveTab('visual')}
        >
          Visual
        </button>
        <button
          className={`my-posts-tab-btn ${activeTab === 'thread' ? 'active' : ''}`}
          onClick={() => setActiveTab('thread')}
        >
          Thread
        </button>
      </div>

      {/* — Loading / No‐Posts States — */}
      {loading && allPosts.length === 0 ? (
        <div className="my-posts-loading">Loading your posts…</div>
      ) : (
        <>
          {filteredPosts.length === 0 ? (
            <div className="my-posts-no-posts">
              {activeTab === 'visual'
                ? "You haven’t posted any visual posts yet!"
                : "You haven’t posted any thread posts yet!"}
            </div>
          ) : (
            <>
              {/* — Visual Tab: Masonry Grid of Fixed‐Height Thumbnails — */}
              {activeTab === 'visual' && (
                <div className="my-posts-masonry-wrapper">
                  <Masonry
                    breakpointCols={masonryBreakpoints}
                    className="my-posts-masonry-grid"
                    columnClassName="my-posts-masonry-column"
                  >
                    {postsToShow.map((post, idx) => {
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

                  {/* Invisible sentinel for infinite‐scroll */}
                  <div ref={sentinelRef} className="my-posts-sentinel" />

                  {loading && postsToShow.length > 0 && (
                    <div className="my-posts-loading-more">Loading more…</div>
                  )}
                </div>
              )}

              {/* — Thread Tab: Vertical List (no Masonry) — */}
              {activeTab === 'thread' && (
                <div className="my-thread-list">
                  {postsToShow.map((post, idx) => (
                    <ExpandPostProvider key={post.id} postId={post.id} postData={post}>
                      <ThreadPostCard postId={post.id} index={idx} />
                    </ExpandPostProvider>
                  ))}

                  {/* Sentinel at bottom of thread list */}
                  <div ref={sentinelRef} className="my-posts-sentinel" />

                  {loading && postsToShow.length > 0 && (
                    <div className="my-posts-loading-more">Loading more…</div>
                  )}
                  {!hasMore && (
                    <div className="my-posts-end-of-list">You’ve reached the end of your posts.</div>
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
