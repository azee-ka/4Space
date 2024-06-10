import React, { useEffect, useState } from "react";
import axios from "axios";
import './expandPostOverlay.css';
import { useNavigate, useParams, Link } from "react-router-dom";
import API_BASE_URL from "../../../../../config";
import GetConfig from "../../../../general/Authentication/utils/config";
import { useAuthState } from "../../../../general/Authentication/utils/AuthProvider";
import VideoPlayer from "../../../../../utils/videoPlayer/videoPlayer";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import ProfilePicture from "../../../../../utils/profilePicture/getProfilePicture";
import { timeAgo } from "../../../../../utils/formatDate";

import likedImg from '../../../../../assets/liked.png';
import unlikedImg from '../../../../../assets/unliked.png';
import dislikedImg from '../../../../../assets/disliked.png';
import undislikedImg from '../../../../../assets/undisliked.png';

const ExpandPostOverlay = ({ onClose, postId: postIdForOverlay, prevPostId: previousPostId, nextPostId, setPostId: setPostIdForOverlay, setPrevPostId, setNextPostId }) => {
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const navigate = useNavigate();

    const { post_id: postIdParam } = useParams();

    const [post, setPost] = useState({});

    const [loading, setLoading] = useState(true);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [renderMedia, setRenderMedia] = useState(true);

    const [comment, setComment] = useState('');

    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);

    const [postId, setPostId] = useState(null);
    const [postIdNext, setPostIdNext] = useState(null);
    const [postIdPrevious, setPostIdPrevious] = useState(null);

    const fetchPostData = async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}api/post/${id}`, config);
            setPost(response.data);
            setLoading(false);
            // console.log(response.data);
        } catch (error) {
            console.error("Error fetching post data", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPostData(postIdForOverlay);
    }, [postIdForOverlay]);


    useEffect(() => {
        if (postIdForOverlay) {
          setPostId(postIdForOverlay);
          window.history.replaceState(null, null, `/post/${postIdForOverlay}`);
    
          setPostIdNext(nextPostId);
          console.log("next p", nextPostId);
          setPostIdPrevious(previousPostId);
    
        } else {
          setPostId(postIdParam);
        }
    
      }, [postId]);
    
    
      useEffect(() => {
        setLoading(false); // Set loading to false once user data is fetched
      }, [setLoading]);
        
      useEffect(() => {
        if (!loading) {

          fetch(`${API_BASE_URL}api/post/${postId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            Authorization: `Token ${token}`
            },
          })
            .then(response => response.json())
            .then(data => {
              setPost(data);
    
              // Check if user data is available
            //   console.log(data);
              if (user && user.username) {
                setIsLiked(data.likes.find(like => like.username === user.username && !isDisliked));
                setIsDisliked((data.dislikes.find(dislike => dislike.username === user.username)) && !isLiked);
              } else {
                console.warn('User data not available yet.');
              }
            })
            .catch(error => {
              console.error('Error fetching expanded post:', error);
            });
        }
      }, [postId]);
    

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
            const response = await axios.post(`${API_BASE_URL}api/post/${postIdForOverlay}/comment/`, data, config);
            // console.log(response.data);
            setComment('');
            setPost((prevPost) => ({
                ...prevPost,
                comments: [...prevPost.comments, response.data], // assuming data is the new comment object
              }));
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
        fetch(`${API_BASE_URL}api/post/${postIdForOverlay}/dislike/`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          },
        })
          .then(response => response.json())
          .then(data => {
            // console.log(data);
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
        fetch(`${API_BASE_URL}api/post/${postIdForOverlay}/like/`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          },
        })
          .then(response => response.json())
          .then(data => {
            // console.log(data);
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
        onClose();
        navigate(path);
        window.location.reload();
    };

    const handleNavigation = (newPostId) => {
        setPostIdForOverlay(newPostId);
        navigate(`/post/${nextPostId}`);
        fetchPostData(newPostId);
    };

    const handlePrevPostClick = () => {
        if (previousPostId) {
            handleNavigation(previousPostId);
        }
    };

    const handleNextPostClick = () => {
        if (nextPostId) {
            handleNavigation(nextPostId);
        }
    };



    return (post && post.media_files) ? (
        <div className='expand-post-overlay' onClick={() => onClose()}>
            <div className="expand-post-overlay-inner">
                <div className="expand-post-overlay-previous-next-post-btns">
                    <div className="expand-post-overlay-previous-next-post-btns-inner">
                        <div className="expand-post-overlay-previous-post-btn">
                            <div onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handlePrevPostClick()}>
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                            </div>
                        </div>
                        <div className="expand-post-overlay-next-post-btn">
                            <div onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleNextPostClick()}>
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
                <div className='expand-post-overlay-user-info-comments'>
                    <div className="expand-post-overlay-user-info" onClick={(e) => e.stopPropagation()}>
                        <div className="expand-post-overlay-user-info-inner">
                            <div className="expand-post-overlay-user-info-profile-pic" onClick={() => handleRedirect(`/profile/${post.user.username}`, onClose)}>
                                <ProfilePicture src={post.user.profile_picture} />
                            </div>
                            <div className="expand-post-overlay-user-info-username">
                                <p onClick={() => handleRedirect(`/profile/${post.user.username}`, onClose)}>
                                    {post.user.username}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="expand-post-overlay-comments" onClick={(e) => e.stopPropagation()}>
                        <div className="expand-post-overlay-list-comments">
                            <div className="expand-post-overlay-list-comments-inner">
                                {post.comments.map((comment, index) => (
                                    <div className="expand-post-overlay-per-comment" key={index}>
                                        <div className="expand-post-overlay-comment-user-info">
                                            <div className="expand-post-overlay-comment-user-info-profile-pic" onClick={() => handleRedirect(`/profile/${post.user.username}`, onClose)}>
                                                <ProfilePicture src={comment.user.profile_picture} />
                                            </div>
                                            <div className="expand-post-overlay-comment-user-info-username">
                                                <p onClick={() => handleRedirect(`/profile/${comment.user.username}`, onClose)}>
                                                    {comment.user.username}
                                                </p>
                                                <div className="expanded-post-overlay-commented-post">
                                                    <p>Posted {timeAgo(comment.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="expand-post-overlay-comment-text">
                                            <p>
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="expand-post-overlay-write-comment">
                            {(comment) && <button onClick={() => handlePostComment()}>Post</button>}
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Post a comment..."
                            />
                        </div>
                    </div>
                </div>
                <div className="expand-post-overlay-media-conatainer" >
                    <div className="expanded-post-overlay-previous-next-meida-btns" onClick={(e) => e.stopPropagation()}>
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
                    <div className='expanded-post-each-media' onClick={(e) => e.stopPropagation()}>
                        {post.media_files.length > 0 && renderMedia &&
                            renderMediaContent(post.media_files[currentMediaIndex], null)
                        }
                    </div>
                </div>
                <div className="expand-post-overlay-interact-container">
                    <div className="expand-post-overlay-interact-container-inner" onClick={(e) => e.stopPropagation()}>
                    <div onClick={handleLikeAndUnlike} className='expanded-post-overlay-unlike-img'>
                      {isLiked ?
                        <img src={likedImg} alt="Like"></img>
                        :
                        <img src={unlikedImg} alt="Unlike"></img>
                      }
                    </div>
                    <div onClick={handleDislikeandUndislike} className='expanded-post-overlay-like-img'>
                      {isDisliked ?
                        <img src={dislikedImg} alt="Dislike"></img>
                        :
                        <img src={undislikedImg} alt="Undislike"></img>
                      }
                    </div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    )
};

export default ExpandPostOverlay;