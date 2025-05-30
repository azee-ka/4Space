import React, { useEffect, useState } from 'react';
import './timeline.css';
import useApi from '../../../utils/useApi';
import TimelinePerPost from './timelinePerPost/timelinePerPost';
import { FaImages } from "react-icons/fa";
import { ExpandPostProvider } from '../../../components/postUI/expandPost/expandPostContext';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const Timeline = () => {
    const { callApi } = useApi();
    const [posts, setPosts] = useState([]);

    // Two independent filters for each feed
    const [leftFilter, setLeftFilter] = useState('All');
    const [rightFilter, setRightFilter] = useState('Visual');
    const [secondTimelineAdd, setSecondTimelineAdd] = useState(true);

    useEffect(() => {
        const fetchTimelinePosts = async () => {
            try {
                const response = await callApi(`posts/timeline/get-posts/`);
                setPosts(response.data.posts);
            } catch (err) {
                console.error('Error fetching timeline page posts:', err);
            }
        };
        fetchTimelinePosts();
    }, []);

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
                <button
                    onClick={() => setSecondTimelineAdd(!secondTimelineAdd)}
                    className={`timeline-add-btn ${secondTimelineAdd ? 'active' : ''}`}>
                    Toggle Timeline
                </button>
            </div>

            {/* Filter Row */}
            <div
                className={`timeline-filter-row ${secondTimelineAdd ? 'second-timeline' : ''}`}
            >
                {/* Left Filter */}
                {/* <div> */}
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
                {/* </div> */}
                {/* Right Filter */}
                {secondTimelineAdd &&
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
                    </div>
                    {/* Right Feed */}
                    {secondTimelineAdd &&
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
