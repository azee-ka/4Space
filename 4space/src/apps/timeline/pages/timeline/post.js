import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './post.css';
import API_BASE_URL from '../../../../general/components/Authentication/utils/apiConfig';
import { Link } from 'react-router-dom'; // Import Link
import { timeAgo } from '../../../../general/utils/formatDate';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import UserListOverlay from '../../utils/userListOverlay/userListOverlay';
import likedImg from '../../../../assets/liked.png';
import unlikedImg from '../../../../assets/unliked.png';
import dislikedImg from '../../../../assets/disliked.png';
import undislikedImg from '../../../../assets/undisliked.png';
import three_dots_dark from '../../../../assets/three-dots-dark.png';
import VideoPlayer from '../../utils/videoPlayer/videoPlayer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
// import '@fortawesome/fontawesome-free/css/all.css';
import GetConfig from '../../../../general/components/Authentication/utils/config';
import ProfilePicture from '../../../../general/utils/profilePicture/getProfilePicture';

const Post = ({ postId, handleExpandPostTrigger, handleUserListTrigger }) => {
  const [post, setPost] = useState(null);

  const { token, user } = useAuthState();
  const config = GetConfig(token);
  const navigate = useNavigate();

  const [comment, setComment] = useState('');

  const [commentText, setCommentText] = useState('');

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);


  const fetchPostData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/post/${postId}`, config);
      setPost(response.data);
      // console.log(response.data);
    } catch (error) {
      console.error("Error fetching post data", error);
    }
  };


  useEffect(() => {
    setCurrentMediaIndex(0);
    fetchPostData();
  }, [postId]);

  useEffect(() => {
    if (post && Object.keys(post).length !== 0) {
      setIsLiked(post.likes.some(like => like.username === user.username));
      setIsDisliked(post.dislikes.some(dislike => dislike.username === user.username));
    }
  }, [post, user.username]);


  const handlePreviousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleNextMedia = () => {
    if (currentMediaIndex < post.media_files.length - 1) {
      setCurrentMediaIndex((prevIndex) => prevIndex + 1);
    }
  };



  const handlePostComment = async () => {
    const data = { text: comment }
    try {
      const response = await axios.post(`${API_BASE_URL}api/post/${postId}/comment/`, data, config);
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
    fetch(`${API_BASE_URL}/api/post/${postId}/dislike/`, {
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
    fetch(`${API_BASE_URL}/api/post/${postId}/like/`, {
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


  const handleRedirect = (username) => {
    navigate(`/timeline/profile/${username}`)
  }

  return post ? (
    <div className="timeline-post">
      <div className="timeline-per-post">
        <div className='timeline-post-info'>
          <div className='timeline-post-user-info'>
            <div className='timeline-post-user-profile'>
              <div onClick={() => handleRedirect(post.user.username)}>
                <ProfilePicture src={post.user.profile_picture} />
              </div>
            </div>
            <div className='timeline-post-username'>
              <div onClick={() => handleRedirect(post.user.username)}>
                {post.user.username}
              </div>
            </div>
          </div>
          <div className='timeline-post-stats'>
            <div className="timeline-post-info-counts">
              <p onClick={() => handleUserListTrigger(post.likes, "Likes")}>
                {`${post.likes.length} likes`}
              </p>
              <p onClick={() => handleUserListTrigger(post.dislikes, "Dislikes")}>
                {`${post.dislikes.length} dislikes`}
              </p>
              <p onClick={() => handleExpandPostTrigger(post, window.location.pathname)} className="timeline-post-info-count-comments">
                {`${post.comments.length} comments`}
              </p>
            </div>
          </div>
          <div className='timeline-post-stats-info-container'>
            {`Posted ${timeAgo(post.created_at)}`}
          </div>
        </div>


        <div className="timeline-media">

          <div className='timline-post-previous-next-media-buttons'>
            <div className='timeline-post-previous-media-button'>
              {currentMediaIndex !== 0 &&
                <button onClick={() => handlePreviousMedia()}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
              }
            </div>
            <div className='timeline-post-next-media-button'>
              {currentMediaIndex !== (post.media_files.length - 1) &&
                <button onClick={() => handleNextMedia()}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              }
            </div>
          </div>

          <div className='timeline-post-each-media'>
            {post.media_files.length > 0 &&
              renderMediaContent(post.media_files[currentMediaIndex], null)
            }
          </div>

        </div>

        {post.text &&
          <div className='timeline-post-text'>
            <div onClick={() => handleExpandPostTrigger(post, window.location.pathname)} className="timeline-post-info-count-comments">
              {`${post.text}`}
            </div>
          </div>
        }
        <div className="timeline-post-write-comment">
          <input
            placeholder='Comment here...'
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          ></input>
          <button onClick={() => handlePostComment()}>Post</button>
        </div>


      </div>
      <div className="timeline-post-info-user-feedback">
        <div className="timeline-post-info-stats">
          <div className='timeline-post-like-unlike-imgs'>
            <div onClick={handleLikeAndUnlike}>
              <img src={isLiked ? likedImg : unlikedImg} alt="Like" />
            </div>
            <div onClick={handleDislikeandUndislike} >
              <img src={isDisliked ? dislikedImg : undislikedImg} alt="Dislike" />
            </div>
            <div className='timeline-post-more-img'>
              <div onClick={() => handleExpandPostTrigger(post, window.location.pathname)}>
                <img src={three_dots_dark} alt="More"></img>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  ) : (
    <div>Loading...</div>
  )
};

export default Post;