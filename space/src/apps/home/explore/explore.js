import React, { useEffect, useState } from 'react';
import './explore.css'; // You can extend this later based on looks
import useApi from '../../../utils/useApi';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import ThreadPosts from './thread/threadPosts';
import VisualPostsGrid from './visual/visualPostsGrid';

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

    const filters = ['All', 'Thread', 'Visual'];

    const filteredPosts = activeFilter === 'All'
    ? posts
    : posts.filter(post => post.post_type === activeFilter);


    return (
        <div className="explore-page">
            <div className="explore-page-inner">
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
                    {loading ? (
                    <div className="loading">Loading posts...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="no-posts">No posts available.</div>
                ) : (
                    <>
                        {activeFilter === 'Thread' && <ThreadPosts posts={filteredPosts} />}
                        {activeFilter === 'Visual' && <VisualPostsGrid posts={filteredPosts} />}
                        {activeFilter === 'All' && (
                            <>
                                <ThreadPosts posts={filteredPosts.filter(post => post.post_type === 'Thread')} />
                                <VisualPostsGrid posts={filteredPosts.filter(post => post.post_type === 'Visual')} />
                            </>
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
