// hooks/useCommentAsPost.js
import { useQuery } from '@tanstack/react-query';
import { getCommentAsPost } from '../services/post';

export const useCommentAsPost = (commentId) => {
  return useQuery({
    queryKey: ['commentAsPost', commentId],
    queryFn: () => getCommentAsPost(commentId),
    enabled: !!commentId,
  });
};
