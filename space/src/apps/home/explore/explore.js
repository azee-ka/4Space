import React, { useEffect, useState } from 'react';
import './explore.css'; // You can extend this later based on looks
import useApi from '../../../utils/useApi';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import ThreadCard from './thread/threadCard';
import VisualCard from './visual/visualCard';
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

    const filteredPosts = activeFilter === 'All'
        ? posts
        : posts.filter(post => post.post_type === activeFilter);

    const renderPost = (post) => {
        switch (post.post_type) {
            case 'Thread': return <ThreadCard post={post} key={post.id} />;
            case 'Visual': return <VisualCard post={post} key={post.id} />;
            case 'Poll': return <PollCard post={post} key={post.id} />;
            case 'Story': return <StoryCard post={post} key={post.id} />;
            case 'Event': return <EventCard post={post} key={post.id} />;
            case 'Audio': return <AudioCard post={post} key={post.id} />;
            default: return null;
        }
    };
    const filters = ['All', 'Thread', 'Visual', 'Poll', 'Story', 'Event', 'Audio'];

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
                <div className={`posts-container ${activeFilter === 'Visual' ? 'grid' : 'list'}`}>
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map(post => renderPost(post))
                    ) : (
                        <div className="no-posts">No posts to show.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Explore;
