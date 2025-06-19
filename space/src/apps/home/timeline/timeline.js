import React, { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTimelineFeed } from '../../../services/home';
import { TIMELINE_FEED } from '../../../services/queryKeys';
import TimelinePerPost from './timelinePerPost/timelinePerPost';
import { FaImages } from "react-icons/fa";
import { ExpandPostProvider } from '../../../components/postUI/expandPost/expandPostContext';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger';
import { useDevice } from '../../../context/DeviceContext';
import './timeline.css';

const PAGE_SIZE = 20;

const Timeline = () => {
    const { isM, isT } = useDevice();

    // Filters
    const filters = ['All', 'Thread', 'Visual'];
    const [leftFilter, setLeftFilter] = useState('All');
    const [rightFilter, setRightFilter] = useState('Visual');
    const [secondTimelineAdd, setSecondTimelineAdd] = useState(true);

    // Infinite query (pagination)
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: TIMELINE_FEED(),
        queryFn: ({ pageParam = 0 }) => fetchTimelineFeed({ pageParam, pageSize: PAGE_SIZE }),
        getNextPageParam: (lastPage, allPages) => {
            // If the backend returns a `next` URL, parse the offset, else compute manually:
            if (lastPage.next) {
                const url = new URL(lastPage.next, window.location.origin);
                return parseInt(url.searchParams.get("offset"), 10);
            }
            // Or: if no `next`, no more data
            return undefined;
        },
        refetchOnWindowFocus: false,
    });

    // Flatten posts from all pages
    const posts = useMemo(() => (
        data?.pages?.flatMap(page => page.results) ?? []
    ), [data]);

    // Infinite scroll
    const infiniteScrollRef = useInfiniteScrollTrigger(
        () => {
            if (!isFetchingNextPage && hasNextPage) fetchNextPage();
        },
        hasNextPage,
        isFetchingNextPage
    );

    // Filtering logic
    const leftFilteredPosts = useMemo(
        () => posts.filter(post => leftFilter === 'All' || post.post_type === leftFilter),
        [posts, leftFilter]
    );
    const rightFilteredPosts = useMemo(
        () => posts.filter(post => rightFilter === 'All' || post.post_type === rightFilter),
        [posts, rightFilter]
    );

    // UI
    if (isLoading) return <div>Loading…</div>;
    if (isError) return <div>Error loading timeline.</div>;

    return (
        <div className="timeline-page">
            {/* Header */}
            <div className="timeline-header">
                <h2>Timeline</h2>
                {(isM || isT) && (
                    <DropdownButton
                        toggleContent={
                            <button className="filter-toggle">
                                <span>Filter by: {leftFilter}</span>
                                <FontAwesomeIcon icon={faChevronDown} />
                            </button>
                        }
                    >
                        <div className="timeline-filters">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    className={`filter-btn ${leftFilter === filter ? 'active' : ''}`}
                                    onClick={() => setLeftFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </DropdownButton>
                )}
                {!isM && !isT && (
                    <button
                        onClick={() => setSecondTimelineAdd(!secondTimelineAdd)}
                        className={`timeline-add-btn ${secondTimelineAdd ? 'active' : ''}`}>
                        Toggle Timeline
                    </button>
                )}
            </div>

            {/* Filter Row */}
            <div className={`timeline-filter-row ${secondTimelineAdd ? 'second-timeline' : ''}`}>
                {!isM && !isT && (
                    <DropdownButton
                        toggleContent={
                            <button className="filter-toggle">
                                <span>Filter by: {leftFilter}</span>
                                <FontAwesomeIcon icon={faChevronDown} />
                            </button>
                        }
                    >
                        <div className="timeline-filters">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    className={`filter-btn ${leftFilter === filter ? 'active' : ''}`}
                                    onClick={() => setLeftFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </DropdownButton>
                )}
                {secondTimelineAdd && !isM && !isT && (
                    <DropdownButton
                        toggleContent={
                            <button className="filter-toggle">
                                <span>Filter by: {rightFilter}</span>
                                <FontAwesomeIcon icon={faChevronDown} />
                            </button>
                        }
                    >
                        <div className="timeline-filters">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    className={`filter-btn ${rightFilter === filter ? 'active' : ''}`}
                                    onClick={() => setRightFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </DropdownButton>
                )}
            </div>

            {/* Timeline Feeds */}
            {posts.length > 0 ? (
                <div className='timeline-content'>
                    {/* Left Feed */}
                    <div className="timeline-left-side-container">
                        {leftFilteredPosts.map((post, index) => (
                            <ExpandPostProvider key={post.id} postId={post.id}>
                                <TimelinePerPost
                                    postId={post.id}
                                    posts={leftFilteredPosts}
                                    index={index}
                                    activeFilter={leftFilter}
                                />
                            </ExpandPostProvider>
                        ))}
                        <div ref={infiniteScrollRef}></div>
                    </div>
                    {/* Right Feed */}
                    {secondTimelineAdd && rightFilteredPosts && !isM && !isT &&
                        <div className="timeline-right-side-container">
                            {rightFilteredPosts.map((post, index) => (
                                <ExpandPostProvider key={post.id} postId={post.id}>
                                    <TimelinePerPost
                                        postId={post.id}
                                        posts={rightFilteredPosts}
                                        index={index}
                                        activeFilter={rightFilter}
                                    />
                                </ExpandPostProvider>
                            ))}
                            <div ref={infiniteScrollRef}></div>
                        </div>
                    }
                </div>
            ) : (
                <div className="timeline-no-posts">
                    <FaImages className="icon-style" />
                    <h3>No More Posts</h3>
                    <h3>You're caught up!</h3>
                </div>
            )}
            {isFetchingNextPage && <div>Loading more…</div>}
        </div>
    );
};

export default Timeline;
