import React, { useCallback, useEffect, useState } from 'react';
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
    const [activeTab, setActiveTab] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        if (tabOptions.some(t => t.key === hash)) return hash;
        return 'visual';
    });

    const visualFetchPageFn = useCallback(async ({ page, pageSize }) => {
        const offset = page * pageSize;
        const resp = await callApi(
            `posts/explore/get-posts/?post_type=Visual&limit=${pageSize}&offset=${offset}`
        );
        console.log(resp.data)

        return {
            results: resp.data.results,
            next: resp.data.next,
            count: resp.data.count
        };
    }, [callApi]);

    const threadFetchPageFn = useCallback(async ({ page, pageSize }) => {
        const offset = page * pageSize;
        const resp = await callApi(
            `posts/explore/get-posts/?post_type=Thread&limit=${pageSize}&offset=${offset}`
        );
        console.log(resp.data)
        return {
            results: resp.data.results,
            next: resp.data.next,
            count: resp.data.count
        };
    }, [callApi]);

    const visualPaginated = usePaginatedList(visualFetchPageFn, {
        pageSize: 20,
        immediate: activeTab === 'visual', // Only fetch if active
        resetDeps: [activeTab]
    });
    const threadPaginated = usePaginatedList(threadFetchPageFn, {
        pageSize: 20,
        immediate: activeTab === 'thread', // Only fetch if active
        resetDeps: [activeTab]
    });

    const paginated = activeTab === 'visual' ? visualPaginated : threadPaginated;
    const { items: posts, loadMore, hasMore, loading } = paginated;


    // Scroll trigger
    const infiniteScrollRef = useInfiniteScrollTrigger(loadMore, hasMore, loading);

    // Scroll to top on tab switch
    React.useEffect(() => {
        window.scrollTo({ top: 0 });
        window.location.hash = activeTab;
    }, [activeTab]);

    // Hash sync (optional, robust)
    React.useEffect(() => {
        const onHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (tabOptions.some(t => t.key === hash)) setActiveTab(hash);
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);


    // Post click handler (expand logic, etc)
    const handlePostClick = (post, index) => {
        handleExpandPostOpen(post.id, posts, window.location.pathname + window.location.hash, index, post.post_type);
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
                {loading && posts.length === 0 ? (
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Explore;