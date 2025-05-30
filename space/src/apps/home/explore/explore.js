import React, { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import './explore.css';
import useApi from '../../../utils/useApi';
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger';
import { usePaginatedList } from '../../../hooks/usePaginatedList';

import VisualGridTile from './visual/exploreVisualPostCard';
import ThreadPostCard from './thread/threadPostCard';
import { usePostContext } from '../../../context/PostContext';
import { ExpandPostProvider } from '../../../components/postUI/expandPost/expandPostContext';

const tabOptions = [
    { key: 'visual', label: 'Visual' },
    { key: 'thread', label: 'Thread' },
];

const Explore = () => {
    const { callApi } = useApi();
    const { handleExpandPostOpen } = usePostContext();

    const getInitialTab = () => {
        const hash = window.location.hash.replace('#', '');
        if (tabOptions.some(t => t.key === hash)) {
            return hash;
        }
        return 'visual';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);

    // Sync tab to hash on change
    useEffect(() => {
        if (window.location.hash.replace('#', '') !== activeTab) {
            window.location.hash = activeTab;
        }
    }, [activeTab]);

    // On hashchange (e.g. browser navigation), update tab
    useEffect(() => {
        const onHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (tabOptions.some(t => t.key === hash)) {
                setActiveTab(hash);
            }
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

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
    const filteredPosts = posts.filter(post => 
        post.post_type.toLowerCase() === activeTab
    );


    // Post click handler (expand logic, etc)
    const handlePostClick = (post, index) => {
        handleExpandPostOpen(post.id, filteredPosts, window.location.pathname + window.location.hash, index, post.post_type);
    };


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
                                {activeTab === 'visual' ? (
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
                                            <ExpandPostProvider key={post.id} postId={post.id}>
                                                <ThreadPostCard
                                                    postId={post.id}
                                                    index={idx}
                                                />
                                            </ExpandPostProvider>
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