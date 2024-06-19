import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './post.css';
import apiUrl from '../../../utils/config';
import { Link } from 'react-router-dom'; // Import Link
import { timeAgo } from '../expandPost/convertDateTIme';
import { useUserContext } from '../../../context/AppUserContext';
import UserListOverlay from '../profile/followListOverlay';
import likedImg from '../../../assets/liked.png';
import unlikedImg from '../../../assets/unliked.png';
import dislikedImg from '../../../assets/disliked.png';
import undislikedImg from '../../../assets/undisliked.png';
import three_dots_dark from '../../../assets/three-dots-dark.png';
import VideoPlayer from './videoPlayer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '@fortawesome/fontawesome-free/css/all.css';

const Post = ({ postInfo, handleShowPostOverlay }) => {

  const [postLikes, setPostLikes] = useState([]);
  const [postDislikes, setPostDislikes] = useState([]);
  
  const [post, setPost] = useState(postInfo);

  const { user, fetchUserData } = useUserContext();
  const navigate = useNavigate();

  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);

  const [commentText, setCommentText] = useState('');

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  
  const [loading, setLoading] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handlePreviousMedia = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + post.media_files.length) % post.media_files.length);
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % post.media_files.length);
  };

  useEffect(() => {
    fetchUserData();
    setLoading(false); // Set loading to false once user data is fetched
  }, []);

// console.log(post)

  useEffect(() => {
    if (!loading) {
      const token = localStorage.getItem('token');

      const headers = new Headers({
        'Authorization': `Token ${token}`,
      });

      fetch(`${apiUrl}posts/${post.id}`, {
        method: 'GET',
        headers: headers,
      })
        .then(response => response.json())
        .then(data => {
          setPost(data);

          // Check if user data is available
          if (user && user.username) {
            setIsLiked(data.likes.find(like => like.username === user.username && isDisliked));
            setIsDisliked((data.dislikes.find(dislike => dislike.username === user.username)) && isLiked);
          } else {
            console.warn('User data not available yet.');
          }
        })
        .catch(error => {
          console.error('Error fetching timeline post:', error);
        });
    } 
  }, [post.id, user]);


  const handleCloseOverlay = () => {
    setShowLikesOverlay(false);
    setShowDislikesOverlay(false);
  };


  const handleDislikeandUndislike = () => {
    // Update the post state with the new dislike information
    setIsDisliked(!isDisliked); // Toggle the state for dislike
    // If the user disliked the post, ensure that the like state is set to false
    setIsLiked(!isLiked && isDisliked);

    const token = localStorage.getItem('token');
    const method = (isDisliked === true) ? 'DELETE' : 'POST' ;
    fetch(`${apiUrl}posts/${post.id}/dislike/`, {
        method: method,
        headers: {
            'Authorization': `Token ${token}`,
        },
    })
        .then(response => response.json())
        .then(data => {
            
            setPost(data);
        })
        .catch(error => console.error('Error toggling like:', error));
  }

  const handleLikeAndUnlike = () => {
     // Update the post state with the new like information
     setIsLiked(!isLiked); // Toggle the state for dislike
     // If the user disliked the post, ensure that the like state is set to false
     setIsDisliked(!isDisliked && isLiked);

    const token = localStorage.getItem('token');
    const method = (isLiked === true) ? 'DELETE' : 'POST' ;
    fetch(`${apiUrl}posts/${post.id}/like/`, {
        method: method,
        headers: {
            'Authorization': `Token ${token}`,
        },
    })
        .then(response => response.json())
        .then(data => {
          
            setPost(data);
        })
        .catch(error => console.error('Error toggling like:', error));
};

const myUsernameIsNotSameUser = (thisUser) => {
  return !(user.username === thisUser);
}

const handleCommentSubmit = (event) => {
  event.preventDefault();
  const token = localStorage.getItem('token');
  
  // Assuming 'content' and 'uploadedMedia' are variables containing your data
  const formData = new FormData();
  formData.append('text', commentText);
  formData.append('post_id', post.id);

  fetch(`${apiUrl}posts/${post.id}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`, // Use 'Authorization' header for the token
    },
    body: formData, // Use FormData to send both 'text' and 'media' fields
  })
    .then((response) => response.json())
    .then((data) => {
      // Update the post state with the new comment
      setCommentText('');
      setPost((prevPost) => ({
        ...prevPost,
        comments: [...prevPost.comments, data], // assuming data is the new comment object
      }));
    })
    .catch((error) => console.error('Error creating post:', error));
    navigate();

};

    return (
        <div className="timeline-post">
        <div className="timeline-per-post">
          <div className='timeline-post-info'>
            <div className='timeline-post-user-info'>
                <div className='timeline-post-user-profile'>
                  <a href={myUsernameIsNotSameUser(post.user.username) ? `http://localhost:3000/profile/${post.user.username}` : `http://localhost:3000/profile`}>
                    <img src={`${apiUrl}${post.user.profile_picture}`} alt={"User Profile Picture"} ></img>
                  </a>
                </div>
                  <div className='timeline-post-username'>
                    <a href={myUsernameIsNotSameUser(post.user.username) ? `http://localhost:3000/profile/${post.user.username}` : `http://localhost:3000/profile`}>
                      {post.user.username}
                    </a>
                  </div>
            </div>
            <div className='timeline-post-stats'>
                <div className="timeline-post-info-counts">
                    <div className="timeline-post-info-count-likes" onClick={() => setShowLikesOverlay(!showLikesOverlay)}>
                    {`${post.likes.length} likes`}
                    </div>
                    <div className="timeline-post-info-count-likes" onClick={() => setShowDislikesOverlay(!showDislikesOverlay)}>
                    {`${post.dislikes.length} dislikes`}
                    </div>
                    <div className="timeline-post-info-count-comments">
                        <div onClick={() => handleShowPostOverlay(post)} className="timeline-post-info-count-comments">
                            {`${post.comments.length} comments`}
                        </div>
                    </div>
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
                                <button onClick={handlePreviousMedia}>
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                              }
                            </div>
                            <div className='timeline-post-next-media-button'>
                            {currentMediaIndex !==(post.media_files.length-1) &&
                              <button onClick={handleNextMedia}>
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            }
                          </div>
                        </div>

                          <div className='timeline-post-each-media'>
                          {post.media_files.length > 0 &&
                            (post.media_files[currentMediaIndex].media_type === 'mp4' || post.media_files[currentMediaIndex].media_type === 'MOV' ? (
                              <VideoPlayer
                                mediaFile={post.media_files[currentMediaIndex]}
                                onEnded={handleNextMedia}
                                playable={true}
                              />
                            ) : (
                              <img src={`${apiUrl}${post.media_files[currentMediaIndex].file}`} alt={post.id} />
                            ))}

                          </div>
                        
                      </div>

                      {post.text && 
                        <div className='timeline-post-text'>
                          <div onClick={() => handleShowPostOverlay(post)} className="timeline-post-info-count-comments">
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
                          <button onClick={handleCommentSubmit}>Post</button>
                      </div>


        </div>
        <div className="timeline-post-info-user-feedback">
              <div className="timeline-post-info-stats">
                <div onClick={handleLikeAndUnlike} className='timeline-post-like-unlike-imgs'>
                  {isLiked ? 
                    <img src={likedImg} alt="Like"></img> 
                    : 
                    <img src={unlikedImg} alt="Unlike"></img> 
                  }
                <div onClick={handleDislikeandUndislike} className='timeline-post-like-unlike-imgs'>
                  {isDisliked ? 
                    <img src={dislikedImg} alt="Dislike"></img> 
                    : 
                    <img src={undislikedImg} alt="Undislike"></img> 
                  }
                  </div>
                  <div onClick={handleDislikeandUndislike} className='timeline-post-more-img'>
                    <div onClick={() => handleShowPostOverlay(post)}>
                      <img src={three_dots_dark} alt="More"></img>
                    </div>
                  </div>
                </div>
              </div>

          </div>
          {showLikesOverlay && (
          <UserListOverlay userList={post.likes} onClose={handleCloseOverlay} title={'Likes'} username={post.user.username}/>
          )}
          {showDislikesOverlay && (
            <UserListOverlay userList={post.dislikes} onClose={handleCloseOverlay} title={'Dislikes'} username={post.user.username}/>
          )}
      </div>
    );
  };

export default Post;