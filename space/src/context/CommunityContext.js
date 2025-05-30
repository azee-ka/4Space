import React, { createContext, useContext, useCallback, useState } from 'react';
import useApi from '../utils/useApi';




function useSettingsLogic(communityId) {
  const { callApi } = useApi();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch members list
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callApi(`community/${communityId}/members/`);
      setMembers(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [communityId, callApi]);

  // Update member role
  const updateRole = useCallback(async (userId, newRole) => {
    await callApi(`community/${communityId}/role/${userId}/`, 'PUT', { role: newRole });
    setMembers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  }, [communityId, callApi]);

  // Update member permissions
  const updatePermissions = useCallback(async (userId, perms) => {
    await callApi(`community/${communityId}/permissions/${userId}/`, 'PUT', { permissions: perms });
    setMembers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, permissions: { ...user.permissions, ...perms } }
          : user
      )
    );
  }, [communityId, callApi]);

  // Bulk Save
  const bulkUpdate = useCallback(async (roleChanges, permsChanges) => {
    await Promise.all([
      ...Object.entries(permsChanges).map(([userId, perms]) =>
        updatePermissions(userId, perms)
      ),
      ...Object.entries(roleChanges).map(([userId, role]) =>
        updateRole(userId, role)
      ),
    ]);
  }, [updatePermissions, updateRole]);

  // Optionally, update appearance, posting rules, security, announcements...
  // (Create similar functions for those settings if you want API-backed storage)

  return {
    members, setMembers, loading, fetchMembers, updateRole, updatePermissions, bulkUpdate,
    // you can add more settings methods here
  };
}

function useExchangeLogic(communityId) {
  const { callApi } = useApi();
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all exchanges for the community
  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callApi(`community/${communityId}/exchanges/list/`);
      setPosts(response.data);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  }, [communityId, callApi]);

  // Create a new discussion post
  const createDiscussion = useCallback(async (data) => {
    const res = await callApi(`community/${communityId}/exchanges/create/`, 'POST', data);
    setPosts(prev => [res.data, ...prev]);
    return res.data;
  }, [communityId, callApi]);

  // Upvote/downvote
  const voteDiscussion = useCallback(async (postId, direction) => {
    const res = await callApi(`community/${communityId}/exchanges/${postId}/vote/`, 'POST', { direction });
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, upvotes: res.data.upvotes, downvotes: res.data.downvotes }
        : post
    ));
    return res.data;
  }, [communityId, callApi]);

  // ... any more methods (delete, comment, etc.) ...

  return {
    posts, setPosts,
    loading,
    selectedPostId, setSelectedPostId,
    fetchExchanges,
    createDiscussion,
    voteDiscussion,
    // ... etc
  };
}



// Context & hook
const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

export const CommunityProvider = ({ communityId, children }) => {
  const { callApi } = useApi();
  const [community, setCommunity] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);


   const exchange = useExchangeLogic(communityId);
  const settings = useSettingsLogic(communityId);

  // Fetch data for the community
  const fetchCommunityData = useCallback(async () => {
    try {
      const response = await callApi(`community/c/${communityId}/`);
      setCommunity(response.data);
      setSelectedTab(response.data?.tabs[0]);
    } catch (error) {
      console.error('Error retrieving community data:', error);
    }
  }, [communityId, callApi]);

  // Join/leave actions
  const handleJoinLeave = useCallback(async () => {
    if (!community) return;
    const wasMember = community.is_member;
    const newMemberStatus = !wasMember;
    const newMemberCount = wasMember
      ? Math.max(0, (community.members_count || 1) - 1)
      : (community.members_count || 0) + 1;

    setCommunity({
      ...community,
      is_member: newMemberStatus,
      members_count: newMemberCount
    });

    try {
      if (wasMember) {
        await callApi(`community/${communityId}/leave/`, 'DELETE');
      } else {
        await callApi(`community/${communityId}/join/`, 'POST');
      }
    } catch (error) {
      // revert on error
      setCommunity({
        ...community,
        is_member: wasMember,
        members_count: community.members_count
      });
      console.error('Error updating membership:', error);
    }
  }, [community, setCommunity, communityId, callApi]);

  // Add tabs
  const addTabs = useCallback(async (tabsToAdd) => {
    // tabsToAdd: [{ key, label }]
    if (!tabsToAdd?.length) return;
    setCommunity(prev => ({
      ...prev,
      tabs: [...(prev.tabs || []), ...tabsToAdd]
    }));

    try {
      await callApi(`community/c/${communityId}/tabs/`, 'POST', {
        tabs: tabsToAdd
      });
    } catch (error) {
      // You may want to revert on error or show a toast
      console.error('Error submitting new tabs:', error);
    }
  }, [communityId, setCommunity, callApi]);


  // Search users
const searchUsers = useCallback(async (query) => {
  if (!query.trim()) return [];
  const response = await callApi(`search/user-search/?query=${query}`);
  return response.data;
}, [callApi]);

// Invite user
const inviteUser = useCallback(async (userId) => {
  await callApi(`community/${communityId}/invite/`, 'POST', { user_id: userId });
}, [callApi, communityId]);


  return (
    <CommunityContext.Provider value={{
      community, setCommunity,
      selectedTab, setSelectedTab,
      fetchCommunityData,
      handleJoinLeave,
      addTabs,
      communityId,
      searchUsers,
    inviteUser,

      exchange,
      settings,
    }}>
      {children}
    </CommunityContext.Provider>
  );
};
