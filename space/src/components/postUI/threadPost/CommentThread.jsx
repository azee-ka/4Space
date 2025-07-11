// src/pages/CommentThread.jsx
import { useParams } from 'react-router-dom';
import { useCommentAsPost } from '../../../hooks/useCommentAsPost';
import { ExpandPostProvider } from '../expandPost/expandPostContext';
import ThreadPost from './threadPost';

export default function CommentThread() {
  const { commentId } = useParams();
  const { data: postData, isLoading } = useCommentAsPost(commentId) || {};

  if (isLoading) return <div>Loading...</div>;
  if (!postData) return <div>Not found</div>;

  return (
    <ExpandPostProvider postData={postData}>
      <ThreadPost />
    </ExpandPostProvider>
  );
}
