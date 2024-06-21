import React, { useState, useEffect } from 'react'
import axios from "axios";
import { useParams } from "react-router-dom";
import API_BASE_URL from '../../../../../../config';
import { useAuthState } from '../../../../../../general/components/Authentication/utils/AuthProvider';
import GetConfig from '../../../../../../general/components/Authentication/utils/config';

const ExpandPostPage = () => {
    const { post_id } = useParams();
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [postData, setPostData] = useState({});

    const handlFetchPostData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/post/${post_id}`, config);
            setPostData(response.data);
            console.log(response.data);

        } catch (error) {
            console.error("Error fetching post data", error);
        }
    }

    useEffect(() => {
        handlFetchPostData();
    }, []);

    return (
        <div>

        </div>
    )
}

export default ExpandPostPage;