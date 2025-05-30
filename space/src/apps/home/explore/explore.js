import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import './explore.css';
import useApi from '../../../utils/useApi';
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger';
import { usePaginatedList } from '../../../hooks/usePaginatedList';

import VisualGridTile from './visual/visualPostsGrid';
import ThreadPostCard from './thread/threadPosts';
import { usePostContext } from '../../../context/PostContext';

const tabOptions = [
    { key: 'Visual', label: 'Visual' },
    { key: 'Thread', label: 'Thread' },
];

const Explore = () => {
    const { callApi } = useApi();
    const [activeTab, setActiveTab] = useState('Visual');
    const { handleExpandPostOpen } = usePostContext();

    // Post click handler (expand logic, etc)
    const handlePostClick = (post, index) => {
        handleExpandPostOpen(post.id, posts, window.location.pathname + window.location.hash, index, post.post_type);
    };

    // Paginated fetch function
    const fetchPageFn = async ({ page, pageSize }) => {
        const offset = page * pageSize;
        const resp = await callApi(
            `posts/explore/get-posts/?limit=${pageSize}&offset=${offset}`
        );
        return {
            results: resp.data.results,
            next: resp.data.next,
            count: resp.data.count
        };
    };

    // Use paginated list
    const {
        items: posts,
        loadMore,
        hasMore,
        loading
    } = usePaginatedList(fetchPageFn, { pageSize: 20 });

    // Infinite scroll trigger
    const infiniteScrollRef = useInfiniteScrollTrigger(loadMore, hasMore, loading);

    // Only show posts for selected tab
    const filteredPosts = posts.filter(post => post.post_type === activeTab);

    const masonryBreakpoints = {
        default: 4,
        1200: 3,
        900: 2,
        600: 2,
    };

    return (
        <div className="explore-page">
            <div className="explore-page-inner">
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

                {loading && posts.length === 0 ? (
                    <div className="loading">Loading posts...</div>
                ) : (
                    <div className="posts-container">
                        {filteredPosts.length === 0 ? (
                            <div className="no-posts">No posts available.</div>
                        ) : (
                            <>
                                {activeTab === 'Visual' ? (
                                    <Masonry
                                        breakpointCols={masonryBreakpoints}
                                        className="explore-masonry-grid"
                                        columnClassName="explore-masonry-column"
                                    >
                                        {filteredPosts.map((post, idx) => (
                                            <VisualGridTile
                                                key={post.id}
                                                post={post}
                                                onClick={() => handlePostClick(post, idx)}
                                            />
                                        ))}
                                    </Masonry>
                                ) : (
                                    <div className="thread-posts-list">
                                        {filteredPosts.map((post, idx) => (
                                            <ThreadPostCard
                                                key={post.id}
                                                post={post}
                                                onClick={() => handlePostClick(post, idx)}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div ref={infiniteScrollRef}></div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Explore;
