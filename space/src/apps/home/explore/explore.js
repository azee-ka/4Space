import React, { useEffect, useState } from 'react';
import './explore.css'; // You can extend this later based on looks
import useApi from '../../../utils/useApi';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import ThreadCard from './thread/threadCard';
import VisualPostsGrid from './visual/visualPostsGrid';
import PollCard from './poll/pollCard';
import StoryCard from './story/storyCard';
import EventCard from './event/eventCard';
import AudioCard from './audio/audioCard';

const Explore = () => {
    const { callApi } = useApi();
    const [posts, setPosts] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    const fetchExplorePosts = async () => {
        try {
            const response = await callApi('posts/explore/get-posts/');
            console.log('Explore posts:', response.data);
            setPosts(response.data.posts || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExplorePosts();
    }, []);

    const filters = ['All', 'Thread', 'Visual', 'Poll', 'Story', 'Event', 'Audio'];

    const renderPosts = () => {
        const filteredPosts = activeFilter === 'All'
            ? posts
            : posts.filter(post => post.post_type === activeFilter);
    
        if (filteredPosts.length === 0) {
            return <div>No posts available.</div>;
        }
    
        switch (activeFilter) {
            case 'Visual':
                return <VisualPostsGrid posts={filteredPosts} />;
            case 'All':
                return (
                    <>
                        {renderPostsByType('Thread')}
                        {renderPostsByType('Visual')}
                        {renderPostsByType('Poll')}
                        {renderPostsByType('Story')}
                        {renderPostsByType('Event')}
                        {renderPostsByType('Audio')}
                    </>
                );
            default:
                return null;
        }
    };
    

    const renderPostsByType = (type) => {
        const typePosts = posts.filter(post => post.post_type === type);
        if (typePosts.length === 0) return null;

        switch (type) {
            case 'Visual':
                return <VisualPostsGrid posts={typePosts} key="visual" />;
            // case 'Thread':
            //     return <ThreadCard posts={typePosts} key="thread" />;
            // case 'Poll':
            //     return <PollCard posts={typePosts} key="poll" />;
            // case 'Story':
            //     return <StoryCard posts={typePosts} key="story" />;
            // case 'Event':
            //     return <EventCard posts={typePosts} key="event" />;
            // case 'Audio':
            //     return <AudioCard posts={typePosts} key="audio" />;
            default:
                return null;
        }
    };


    return (
        <div className="explore-page">
            <div className="explore-header">
                <h2>Explore</h2>
                <DropdownButton
                    toggleContent={
                        <button className="filter-toggle">
                            <span>Filter by: {activeFilter}</span>
                            <FontAwesomeIcon icon={faChevronDown} />
                        </button>
                    }
                >
                    <div className="explore-filters">
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

            {loading ? (
                <div className="loading">Loading posts...</div>
            ) : (
                <div className={`posts-container`}>
                    {renderPosts()}
                </div>
            )}
        </div>
    );
};

export default Explore;
