import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './expandPost.css';
import ExpandedPostOverlay from './expandPostOverlay/expandPostOverlay';
import ExpandedPostNonOverlay from './expandPostNonOverlay/expandPostNonOverlay';
import { ExpandPostProvider } from './expandPostContext';
import { usePostContext } from '../../../context/PostContext';
import PostMoreOverlay from './postMoreOverlay/postMoreOverlay';

const ExpandPost = ({}) => {
    const {
        expandPostIdReciever: overlayPostId,
        handleExpandPostClose,
    } = usePostContext();

    // console.log('ExpandPost overlayPostId:', overlayPostId);

    const { postId } = useParams();
    const { showPostMoreMenuOverlay, setShowPostMoreMenuOverlay } = usePostContext();

    const [expandPostIdFinal, setExpandPostIdFinal] = useState(overlayPostId ? overlayPostId : postId);

    useEffect(() => {
        setExpandPostIdFinal(overlayPostId ? overlayPostId : postId);
    }, [overlayPostId, postId]);

    // console.log('ExpandPost expandPostIdFinal:', expandPostIdFinal);

    return (
        <ExpandPostProvider postId={expandPostIdFinal}>
            <div className={`expanded-post-container ${!overlayPostId ? 'non-overlay' : 'overlay'}`}>
                {overlayPostId ?
                    (
                        <div className='expanded-post-overlay' onClick={handleExpandPostClose}>
                            <ExpandedPostOverlay />
                        </div>
                    ) : (
                        <ExpandedPostNonOverlay />
                    )}
            </div>
            {showPostMoreMenuOverlay &&
                <PostMoreOverlay onClose={() => setShowPostMoreMenuOverlay(false)} />
            }
        </ExpandPostProvider>
    );
}

export default ExpandPost;