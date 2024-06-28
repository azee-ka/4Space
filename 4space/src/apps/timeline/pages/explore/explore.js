import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './explore.css';
import API_BASE_URL from '../../../../config';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import GetConfig from '../../../../general/components/Authentication/utils/config';

const Explore = ({ handleExpandPostTrigger }) => {
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [explorePosts, setExplorePosts] = useState([]);

    const fetchPostData = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}api/apps/timeline/explore/posts/`, config);
          setExplorePosts(response.data);
          console.log(response.data);
        } catch (error) {
          console.error("Error fetching post data", error);
        }
      };

    useEffect(() => {
        fetchPostData();
    }, []);

    return (
        <div className="explore-page">

        </div>
    );
};

export default Explore;