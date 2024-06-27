import { useParams, useNavigate } from "react-router-dom";
import { useAuthState } from "../../../../../general/components/Authentication/utils/AuthProvider";
import GetConfig from "../../../../../general/components/Authentication/utils/config";
import ExpandPostOverlay from "./expandPostOverlay/expandPostOverlay";
import { useEffect, useState } from "react";

const PostFrame = ({ postId, onClose, handlePrevPostClick, handleNextPostClick, handleUserListTrigger }) => {
    const { post_id } = useParams();
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    const navigate = useNavigate();

    const [finalPostId, setFinalPostId] = useState();

    useEffect(() => {
        setFinalPostId(postId || post_id); // Update finalPostId when either postId or post_id changes

    }, [postId, post_id]);

    return finalPostId ? (
        <ExpandPostOverlay postId={finalPostId} onClose={onClose} handlePrevPostClick={handlePrevPostClick} handleNextPostClick={handleNextPostClick} handleUserListTrigger={handleUserListTrigger} />
    ) : (
        <div>Loading...</div>
    )
}

export default PostFrame;