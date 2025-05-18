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

    const [activeFilter, setActiveFilter] = useState('All');

    const [secondTimelineAdd, setSecondTimelineAdd] = useState(true);

    useEffect(() => {
        const fetchTimelinePosts = async () => {
            try {
                const response = await callApi(`posts/timeline/get-posts/`);
                console.log(response.data.posts);
                setPosts(response.data.posts);
            } catch (err) {
                console.error('Error fetching timeline page posts:', err);
            }
        }
        fetchTimelinePosts();
    }, []);

    const filters = ['All', 'Thread', 'Visual'];

    // 🔥 Filtering the posts based on activeFilter
    const filteredPosts = posts.filter(post => {
        if (activeFilter === 'All') return true;
        return post.post_type === activeFilter;
    });


    return posts ? (
        <div className="timeline-page">
            <div className='timeline-header'>
                <h2>Timeline</h2>
                <div className="timeline-header-right">
                    <button onClick={() => setSecondTimelineAdd(!secondTimelineAdd)} className={`timeline-add-btn ${secondTimelineAdd ? 'active' : ''}`}>
                        Toggle Timeline
                    </button>
                    <DropdownButton
                        toggleContent={
                            <button className="filter-toggle">
                                <span>Filter by: {activeFilter}</span>
                                <FontAwesomeIcon icon={faChevronDown} />
                            </button>
                        }
                    >
                        <div className="timeline-filters">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </DropdownButton>
                </div>
            </div>
            {posts.length > 0 ?
                (
                    <div className='timeline-content'>
                        <div className="timeline-left-side-container">
                            {filteredPosts.map((post, index) => (
                                <ExpandPostProvider key={index} postId={post.id}>
                                    <TimelinePerPost postId={post.id} posts={filteredPosts} index={index} activeFilter={activeFilter} />
                                </ExpandPostProvider>
                            ))
                            }
                        </div>
                        {secondTimelineAdd &&
                            <div className="timeline-right-side-container">
                                {filteredPosts.map((post, index) => (
                                    <ExpandPostProvider key={index} postId={post.id}>
                                        <TimelinePerPost postId={post.id} posts={filteredPosts} index={index} activeFilter={activeFilter} />
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
                )
            }
        </div>
    ) : (
        <div>Loading...</div>
    )
};

export default Timeline;