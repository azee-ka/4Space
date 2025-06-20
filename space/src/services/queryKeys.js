// src/queryKeys.js



// Query keys for posts and comments (exhaustive)
export const POST_DETAIL      = (postId)      => ['post', postId];
export const POST_COMMENTS    = (postId)      => ['post', postId, 'comments'];
export const COMMENT_LIKES    = (commentId)   => ['comment', commentId, 'likes'];
export const COMMENT_VOTES    = (commentId)   => ['comment', commentId, 'votes'];
export const POST_REPOST      = (postId)      => ['post', postId, 'repost'];
export const POST_QUOTE       = (postId)      => ['post', postId, 'quote'];
export const POST_VOTE        = (postId)      => ['post', postId, 'vote'];
export const POST_LIKE_STATUS = (postId)      => ['post', postId, 'likeStatus'];
export const POST_BOOKMARK    = (postId)      => ['post', postId, 'bookmark'];
export const COMMENT_REPLY    = (commentId)   => ['comment', commentId, 'reply'];
export const POST_DELETE      = (postId)      => ['post', postId, 'delete'];





export const SEARCH_HISTORY = ['searchHistory'];
export const SEARCH_RESULTS = (query) => ['searchResults', query];

export const NOTIFICATIONS = ['notifications'];

export const DISPLAY_SETTINGS = ['displaySettings'];



// src/apps/communities
export const COMMUNITY = (communityId) => ['community', communityId];
export const COMMUNITY_MEMBERS = (communityId) => ['communityMembers', communityId];
export const COMMUNITY_EXCHANGES = (communityId) => ['communityExchanges', communityId];

// You can expand here with other keys as needed!
export const COMMUNITY_POST = (communityId, postId) => ['communityPost', communityId, postId];
export const COMMUNITY_TABS = (communityId) => ['communityTabs', communityId];
export const COMMUNITY_SEARCH_USERS = (communityId, query) => ['communitySearchUsers', communityId, query];

export const CREATE_DISCUSSION = ['createDiscussion'];

export const EXCHANGE_DETAIL = (postId) => ['exchangeDetail', postId];

export const PUBLICATION_DETAIL = (publicationId) => ['publicationDetail', publicationId];
export const MY_PUBLICATIONS = (communityId) => ['myPublications', communityId];

export const CREATE_COMMUNITY = ['createCommunity'];
export const COMMUNITIES_TIMELINE = ['communitiesTimeline'];


// src/apps/home
export const CREATE_POST = ['createPost'];
export const EXPLORE_FEED = (postType) => ['exploreFeed', postType];
export const TIMELINE_FEED = (filter) => ['timelineFeed', filter];


// src/apps/space
export const CALCULATOR_HISTORY = ['calculatorHistory'];

export const SPACE_LIBRARY = ['spaceLibrary'];

export const SPACE_PROJECTS = ['spaceProjects'];

export const SPACE_REPOSITORIES = ['spaceRepositories'];
export const SPACE_REPOSITORY = (repositoryId) => ['spaceRepository', repositoryId];

export const SPACE_COPILOT_PROJECTS = ['spaceCopilotProjects'];
export const SPACE_WORKFLOW = (workflowId) => ['spaceWorkflow', workflowId];

export const RICH_TEXT_CONTENT = (projectId) => ['richTextContent', projectId];
export const CODE_FILES = (projectId) => ['codeFiles', projectId];
export const LATEX_CONTENT = (projectId) => ['latex', projectId];
export const LATEX_PDF = (projectId) => ['latexPDF', projectId];
export const CREATE_SPACE_PROJECT = ['space', 'createProject'];
export const NOTEBOOK_CELLS = (projectId) => ['notebook', projectId];
export const MARKDOWN_CONTENT = (projectId) => ['markdown', projectId];


// src/components/report
export const REPORT_CONTENT = ['reportContent'];


// src/pages/messages
export const INBOX_CONVERSATIONS    = ['messages', 'inbox'];
export const REQUEST_CONVERSATIONS  = ['messages', 'requests'];
export const CONVO_DETAILS = (conversationId) => ['conversationDetails', conversationId];
export const CONVO_MESSAGES = (conversationId) => ['conversationMessages', conversationId];


// src/pages/settings
export const PROFILE_VISIBILITY   = ['profileVisibility'];
export const USER_PROFILE         = ['userProfile'];
export const MESSAGE_SETTINGS     = ['messageSettings'];
export const HANDLES_LIST         = ['handlesList'];
export const BASIC_INFO = ['basicInfo'];
export const USERNAME_HANDLES = ['usernameHandles'];


// src/pages/profile
export const PROFILE = (username) => ['profile', username || 'me'];
export const USER_PROFILE_WITH_ID = (userId) => ['userProfile', userId];


// src/pages/profile/myPostsTab
export const USER_POSTS = (username, postType) => ['userPosts', username, postType];

// src/pages/profile/myCommunitiesTab
export const USER_EXCHANGES = (username) => ['userExchanges', username];
export const USER_COMMUNITIES = (username) => ['userCommunities', username];













// Root-level query keys for broad invalidation/refetch (no params)
export const ALL_QUERY_KEYS = [
  PROFILE_VISIBILITY,
  PROFILE,
  USER_PROFILE,
  BASIC_INFO,
  USER_POSTS,           // function, so this matches all 'userPosts' queries
  TIMELINE_FEED,        // function, same
  HANDLES_LIST,
  USERNAME_HANDLES,
  POST_DETAIL,
  POST_COMMENTS,
  POST_REPOST,
  POST_QUOTE,
  POST_VOTE,
  POST_LIKE_STATUS,
  POST_BOOKMARK,
  POST_DELETE,
  COMMENT_LIKES,
  COMMENT_VOTES,
  COMMENT_REPLY,
  SEARCH_HISTORY,
  NOTIFICATIONS,
  DISPLAY_SETTINGS,
  COMMUNITY,
  COMMUNITY_MEMBERS,
  COMMUNITY_EXCHANGES,
  COMMUNITY_POST,
  COMMUNITY_TABS,
  COMMUNITY_SEARCH_USERS,
  CREATE_DISCUSSION,
  EXCHANGE_DETAIL,
  PUBLICATION_DETAIL,
  MY_PUBLICATIONS,
  CREATE_COMMUNITY,
  COMMUNITIES_TIMELINE,
  CREATE_POST,
  EXPLORE_FEED,
  SPACE_LIBRARY,
  SPACE_PROJECTS,
  SPACE_REPOSITORIES,
  SPACE_REPOSITORY,
  SPACE_COPILOT_PROJECTS,
  SPACE_WORKFLOW,
  RICH_TEXT_CONTENT,
  CODE_FILES,
  LATEX_CONTENT,
  LATEX_PDF,
  CREATE_SPACE_PROJECT,
  NOTEBOOK_CELLS,
  MARKDOWN_CONTENT,
  REPORT_CONTENT,
  INBOX_CONVERSATIONS,
  REQUEST_CONVERSATIONS,
  CONVO_DETAILS,
  CONVO_MESSAGES,
  MESSAGE_SETTINGS,
  PROFILE,
  USER_PROFILE_WITH_ID,
  USER_EXCHANGES,
  USER_COMMUNITIES,
];
