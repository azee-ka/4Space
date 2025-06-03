import React, { useEffect, useState } from 'react';
import './timeline.css';
import useApi from '../../../utils/useApi';
import TimelinePerPost from './timelinePerPost/timelinePerPost';
import { FaImages } from "react-icons/fa";
import { ExpandPostProvider } from '../../../components/postUI/expandPost/expandPostContext';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger';
import { useDevice } from '../../../context/DeviceContext';

const Timeline = () => {
    const { callApi } = useApi();

const { isM, isT } = useDevice();

    const fetchPageFn = async ({ page, pageSize }) => {
        const offset = page * pageSize;
        const resp = await callApi(
            `posts/timeline/get-posts/?limit=${pageSize}&offset=${offset}`
        );
        return {
            results: resp.data.results,
            next: resp.data.next,
            count: resp.data.count
        };
    };

    // Use paginated list hook
    const {
        items: posts,
        loadMore,
        hasMore,
        loading,
        error,
        totalCount,
        reset
    } = usePaginatedList(fetchPageFn, { pageSize: 20 });

    // Your other state: filters, etc...

    // Infinite scroll trigger: use your useInfiniteScrollTrigger hook at the end of each feed
    const infiniteScrollRef = useInfiniteScrollTrigger(loadMore, hasMore, loading);

    // Two independent filters for each feed
    const [leftFilter, setLeftFilter] = useState('All');
    const [rightFilter, setRightFilter] = useState('Visual');
    const [secondTimelineAdd, setSecondTimelineAdd] = useState(true);


    const filters = ['All', 'Thread', 'Visual'];

    const leftFilteredPosts = posts.filter(post => {
        if (leftFilter === 'All') return true;
        return post.post_type === leftFilter;
    });

    const rightFilteredPosts = posts.filter(post => {
        if (rightFilter === 'All') return true;
        return post.post_type === rightFilter;
    });

    return posts ? (
        <div className="timeline-page">
            {/* Header (Title & Toggle) */}
            <div className="timeline-header">
                <h2>Timeline</h2>
                {!isM && !isT && <DropdownButton
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
                    </DropdownButton>}
                {!isM && !isT &&
                    <button
                    onClick={() => setSecondTimelineAdd(!secondTimelineAdd)}
                    className={`timeline-add-btn ${secondTimelineAdd ? 'active' : ''}`}>
                    Toggle Timeline
                </button>
                }
            </div>

            {/* Filter Row */}
            <div
                className={`timeline-filter-row ${secondTimelineAdd ? 'second-timeline' : ''}`}
            >
                {/* Left Filter */}
                {/* <div> */}
                    {!isM && !isT && <DropdownButton
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
                    </DropdownButton>}
                {/* </div> */}
                {/* Right Filter */}
                {secondTimelineAdd && !isM && !isT &&
                    // <div>
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
                    // </div>
                }
            </div>

            {/* Feeds */}
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
        </div>
    ) : (
        <div>Loading...</div>
    );
};

export default Timeline;