import apiCall from '../utils/api';

// --- POST ---


export const getCommentAsPost = async (commentId) => {
  const res = await apiCall(`posts/post/comments/${commentId}/`);
  const c = res.data;
  console.log('post comments', c)
  return {
    post: {
      id: c.id,
      content: c.text,
      media_files: [],
    },
    author: c.author,
    meta: { created_at: c.created_at },
    stats: {
      net_votes_count: c.net_votes_count,
      likes_count: c.likes_count,
      comments_count: c.replies_count,
      views_count: 0,
    },
    status: {
      vote_status: c.vote_status,
      like_status: c.like_status,
    },
    is_repost: false,
    parent_post: null,
  };
};


export const fetchPost = async (postId) => {
  const res = await apiCall(`posts/post/${postId}/`);
  return res.data;
};

export const repostPost = async (postId) => {
  const res = await apiCall(`posts/post/${postId}/repost/`, 'POST');
  return res.data;
};

export const quotePost = async ({ postId, quote_text, quote_comment }) => {
  const res = await apiCall(`posts/post/${postId}/quote/`, 'POST', { quote_text, quote_comment });
  return res.data;
};

export const votePost = async ({ postId, vote_type }) => {
  const res = await apiCall(`posts/post/${postId}/vote/`, 'POST', { vote_type });
  return res.data;
};

export const toggleLikeDislike = async ({ postId, toggle_type }) => {
  const res = await apiCall(`posts/post/${postId}/toggle-like-dislike/`, 'POST', { toggle_type });
  return res.data;
};

export const deletePost = async (postId) => {
  await apiCall(`posts/post/${postId}/delete/`, 'DELETE');
};

export const toggleBookmark = async (postId, method = 'POST') => {
  // Note: method POST or DELETE, adjust URL as needed
  await apiCall(`posts/post/${postId}/bookmark/`, method);
};

// --- COMMENTS ---

export const fetchComments = async ({ postId, pageParam = 0, pageSize = 20 }) => {
  const offset = pageParam * pageSize;
  const res = await apiCall(`posts/post/${postId}/comments/?limit=${pageSize}&offset=${offset}`);
  return res.data; // { results, next, count }
};

export const addComment = async ({ postId, text }) => {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('post_id', postId);
  const res = await apiCall(`posts/post/comment/${postId}/create/`, 'POST', formData);
  return res.data;
};

export const likeComment = async (commentId) => {
  const res = await apiCall(`posts/post/comment/${commentId}/like/`, 'POST');
  return res.data;
};

export const voteComment = async ({ commentId, vote_type }) => {
  const res = await apiCall(`posts/post/comment/${commentId}/vote/`, 'POST', { vote_type });
  return res.data;
};

export const replyToComment = async ({ commentId, text }) => {
  const res = await apiCall(`posts/post/comment/${commentId}/reply/`, 'POST', { data: text });
  return res.data;
};
