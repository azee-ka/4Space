import React, { useEffect, useState } from 'react';
import './timeline.css';
import useApi from '../../../utils/useApi';
import TimelinePerPost from './timelinePerPost/timelinePerPost';
import { FaImages } from "react-icons/fa";
import { ExpandPostProvider } from '../../../components/postUI/expandPost/expandPostContext';

const Timeline = () => {
    const { callApi } = useApi();
    const [postIds, setPostIds] = useState([]);

    useEffect(() => {
        const fetchTimelinePosts = async () => {
            try {
                const response = await callApi(`radianspace/timeline/flares-list/`);
                console.log(response.data);
                setPostIds(response.data);
            } catch (err) {
                console.error('Error fetching timeline page posts:', err);
            }
        }
        fetchTimelinePosts();
    }, []);

    return postIds ? (
        <div className="radian-timeline-page">
            <div className='radian-timeline-page-header'>
                <h2>Timeline</h2>
            </div>
            {postIds.length > 0 ?
                (
                    <div className='radian-timeline-page-content'>
                        <div className="timeline-left-side-container">
                            {postIds.map((post, index) => (
                                <ExpandPostProvider key={index} postId={post.uuid}>
                                    <TimelinePerPost postId={post.uuid} posts={postIds} index={index} />
                                </ExpandPostProvider>
                            ))
                            }
                        </div>
                        <div className="timeline-right-side-container">

                        </div>
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