import React, { useEffect } from 'react';
import './threadPost.css';
import useApi from '../../../utils/useApi';
import { useExpandPostContext } from '../expandPost/expandPostContext';

const ThreadPost = () => {
        const {
            post
        } = useExpandPostContext();

    const { callApi } = useApi();

    useEffect(() => {
        if(post) {
            // console.log('ThreadPost component loaded', post);
        }
    }, [post]);

  return post ? (
    <div className="thread-post-page">
      <h2>Thread Post</h2>
      <p>This is a thread post component.</p>
    </div>
  ) : (
    <div>Loading...</div>
  )
}
export default ThreadPost;