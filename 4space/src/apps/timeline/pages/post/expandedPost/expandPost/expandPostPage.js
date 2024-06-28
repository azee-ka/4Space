import React, { useState, useEffect } from 'react'
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import './expandPostPage.css';
import API_BASE_URL from '../../../../../../general/components/Authentication/utils/apiConfig';
import { useAuthState } from '../../../../../../general/components/Authentication/utils/AuthProvider';
import GetConfig from '../../../../../../general/components/Authentication/utils/config';
import VideoPlayer from '../../../../utils/videoPlayer/videoPlayer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import { timeAgo } from '../../../../../../general/utils/formatDate';
import ProfilePicture from '../../../../../../general/utils/profilePicture/getProfilePicture';

import likedImg from '../../../../../../assets/liked.png';
import unlikedImg from '../../../../../../assets/unliked.png';
import dislikedImg from '../../../../../../assets/disliked.png';
import undislikedImg from '../../../../../../assets/undisliked.png';


const ExpandPostPage = ({ handleUserListTrigger }) => {
    const { post_id: postId } = useParams();
    const { token, user } = useAuthState();
    const config = GetConfig(token);

    const [post, setPost] = useState({});

    const navigate = useNavigate();

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [renderMedia, setRenderMedia] = useState(true);

    const [comment, setComment] = useState('');

    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);


    const handlFetchPostData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apps/timeline/post/${postId}`, config);
            setPost(response.data);
            console.log(response.data);

        } catch (error) {
            console.error("Error fetching post data", error);
        }
    }

    useEffect(() => {
        handlFetchPostData();
    }, []);

    useEffect(() => {
        if (post && Object.keys(post).length !== 0) {
            setIsLiked(post.likes.some(like => like.username === user.username));
            setIsDisliked(post.dislikes.some(dislike => dislike.username === user.username));
        }
    }, [post, user.username]);


    const handlePreviousMedia = () => {
        if (currentMediaIndex > 0) {
            setCurrentMediaIndex((prevIndex) => prevIndex - 1);
            setRenderMedia(false);
            setRenderMedia(true);
        }
    };

    const handleNextMedia = () => {
        if (currentMediaIndex < post.media_files.length - 1) {
            setCurrentMediaIndex((prevIndex) => prevIndex + 1);
            setRenderMedia(false);
            setRenderMedia(true);
        }
    };


    const handlePostComment = async () => {
        const data = { text: comment }
        try {
            const response = await axios.post(`${API_BASE_URL}/api/apps/timeline/post/${postId}/comment/`, data, config);
            // console.log(response.data);
            setComment('');
            setPost((prevPost) => ({
                ...prevPost,
                comments: [...prevPost.comments, response.data], // assuming data is the new comment object
            }));
            handlFetchPostData()
        } catch (error) {
            console.error("Error fetching post data", error);
        }
    };


    const handleDislikeandUndislike = () => {
        // Update the post state with the new dislike information
        setIsDisliked(!isDisliked); // Toggle the state for dislike
        // If the user disliked the post, ensure that the like state is set to false
        setIsLiked(isLiked && isDisliked);

        const method = (isDisliked === true) ? 'DELETE' : 'POST';
        fetch(`${API_BASE_URL}/api/apps/timeline/post/${postId}/dislike/`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                setPost(data);
            })
            .catch(error => console.error('Error toggling like:', error));
    }

    const handleLikeAndUnlike = () => {
        // Update the post state with the new like information
        setIsLiked(!isLiked); // Toggle the state for dislike
        // If the user disliked the post, ensure that the like state is set to false
        setIsDisliked(isDisliked && isLiked);

        const method = (isLiked === true) ? 'DELETE' : 'POST';
        fetch(`${API_BASE_URL}/api/apps/timeline/post/${postId}/like/`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                setPost(data);
            })
            .catch(error => console.error('Error toggling like:', error));
    };




    const renderMediaContent = (mediaFile, onEnded) => {
        if (mediaFile.media_type === 'mp4') {
            return (
                <VideoPlayer
                    mediaFile={mediaFile}
                    onEnded={onEnded}
                    playable={true}
                />
            );
        } else {
            return (
                <img src={`${API_BASE_URL}${mediaFile.file}`} alt={mediaFile.id} />
            );
        }
    };


    const handleRedirect = (path, onClose) => {
        onClose?.onClose();
        navigate(path);
        // window.location.reload();
    };

    return (post && post.user && post !== null) ? (
        <div className='expand-page-page'>
            <div className='expand-page-inner'>
                <div className='expand-page-interaction'>
                    <div className="expand-page-interact-container-inner" onClick={(e) => e.stopPropagation()}>
                        <div onClick={handleLikeAndUnlike} className='expand-page-unlike-img'>
                            {isLiked ?
                                <img src={likedImg} alt="Like"></img>
                                :
                                <img src={unlikedImg} alt="Unlike"></img>
                            }
                        </div>
                        <div onClick={handleDislikeandUndislike} className='expand-page-like-img'>
                            {isDisliked ?
                                <img src={dislikedImg} alt="Dislike"></img>
                                :
                                <img src={undislikedImg} alt="Undislike"></img>
                            }
                        </div>
                    </div>
                </div>
                <div className='expand-page-media-container'>
                    <div className="expand-page-previous-next-meida-btns" onClick={(e) => e.stopPropagation()}>
                        <div onClick={(e) => e.stopPropagation()}>
                            {currentMediaIndex !== 0 &&
                                <button onClick={handlePreviousMedia}>
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                            }
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            {currentMediaIndex !== (post.media_files.length - 1) &&
                                <button onClick={handleNextMedia}>
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            }
                        </div>
                    </div>
                    <div className='expand-page-each-media' onClick={(e) => e.stopPropagation()}>
                        {post.media_files.length > 0 && renderMedia &&
                            renderMediaContent(post.media_files[currentMediaIndex], null)
                        }
                    </div>
                </div>
                <div className='expand-page-user-comments-stats'>
                    <div className='expand-page-user-comments-stats-inner'>
                        <div className="expand-page-user-info">
                            <div className="expand-page-user-info-inner">
                                <div className="expand-page-user-info-profile-pic" onClick={() => handleRedirect(`/timeline/profile/${post.user.username}`)}>
                                    <ProfilePicture src={post.user.profile_picture} />
                                </div>
                                <div className="expand-page-user-info-username">
                                    <p onClick={() => handleRedirect(`/timeline/profile/${post.user.username}`)}>
                                        {post.user.username}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="expand-page-post-stats">
                            <div className="expand-page-post-stats-inner">
                                <p onClick={() => handleUserListTrigger(post.likes, "Likes")} >{post.likes_count} like{post.likes_count === 1 ? '' : 's'}</p>
                                <p onClick={() => handleUserListTrigger(post.dislikes, "Dislikes")}>{post.dislikes_count} dislike{post.dislikes_count === 1 ? '' : 's'}</p>
                                <p>{post.comments_count} comment{post.comments_count === 1 ? '' : 's'}</p>
                            </div>
                            <div className="expand-page-post-stats-inner-time-ago">
                                <p>Posted {timeAgo(post.created_at)}</p>
                            </div>
                        </div>
                        <div className="expand-page-comments">
                            <div className="expand-page-list-comments">
                                <div className="expand-page-list-comments-inner">
                                    {post.comments.length > 0 ? (
                                        post.comments.map((comment, index) => (
                                            <div className="expand-page-per-comment" key={index}>
                                                <div className="expand-page-comment-user-info">
                                                    <div className="expand-page-comment-user-info-profile-pic" onClick={() => handleRedirect(`/profile/${post.user.username}`)}>
                                                        <ProfilePicture src={comment.user.profile_picture} />
                                                    </div>
                                                    <div className="expand-page-comment-user-info-username">
                                                        <p onClick={() => handleRedirect(`/profile/${comment.user.username}`)}>
                                                            {comment.user.username}
                                                        </p>
                                                        <div className="expand-page-commented-post">
                                                            <p>Posted {timeAgo(comment.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="expand-page-comment-text">
                                                    <p>{comment.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="expand-post-overlay-no-comments">
                                            <p>No Comments</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="expand-page-write-comment">
                            {(comment) && <button onClick={() => handlePostComment()}>Post</button>}
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Post a comment..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    )
}

export default ExpandPostPage;