import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  COMMUNITY, COMMUNITY_MEMBERS, COMMUNITY_EXCHANGES
} from '../services/queryKeys';
import {
  fetchCommunity, fetchCommunityMembers, updateRole, updatePermissions,
  fetchExchanges, createDiscussion, voteDiscussion,
  addCommunityTabs, joinCommunity, leaveCommunity,
  searchUsersApi, inviteUserApi,
} from '../services/communities';

const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

// ---- Settings logic with react-query, API-compatible signature ----
function useSettingsLogic(communityId) {
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading: loading,
    refetch: fetchMembers,
  } = useQuery({
    queryKey: COMMUNITY_MEMBERS(communityId),
    queryFn: () => fetchCommunityMembers(communityId),
    enabled: !!communityId,
    staleTime: 30_000,
  });

const updateRoleMutation = useMutation({
  mutationFn: ({ userId, newRole }) => updateRole({ communityId, userId, newRole }),
  onSuccess: () => queryClient.invalidateQueries(COMMUNITY_MEMBERS(communityId)),
});

const updatePermissionsMutation = useMutation({
  mutationFn: ({ userId, perms }) => updatePermissions({ communityId, userId, perms }),
  onSuccess: () => {
    queryClient.invalidateQueries(COMMUNITY_MEMBERS(communityId))
  },
});


  const setMembers = () => {};

  // Accept a callback to clear UI state after update
  const bulkUpdate = useCallback(
    async (roleChanges, permsChanges, onFinish) => {
      await Promise.all([
        ...Object.entries(permsChanges).map(([userId, perms]) =>
          updatePermissionsMutation.mutateAsync({ userId, perms })
        ),
        ...Object.entries(roleChanges).map(([userId, newRole]) =>
          updateRoleMutation.mutateAsync({ userId, newRole })
        ),
      ]);
      // This will always run after all mutations finish
      if (typeof onFinish === 'function') onFinish();
      fetchMembers();
    },
    [fetchMembers, updatePermissionsMutation, updateRoleMutation]
  );

  return {
    members,
    setMembers,
    loading,
    fetchMembers,
    updateRole: ({ userId, newRole }) => updateRoleMutation.mutateAsync({ userId, newRole }),
    updatePermissions: ({ userId, perms }) => updatePermissionsMutation.mutateAsync({ userId, perms }),
    bulkUpdate,
  };
}


// ---- Exchange logic with react-query, API-compatible signature ----
function useExchangeLogic(communityId) {
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    isLoading: loading,
    refetch: fetchExchanges,
  } = useQuery({
    queryKey: COMMUNITY_EXCHANGES(communityId),
    queryFn: () => fetchExchanges(communityId),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  // UI state for detail view
  const [selectedPostId, setSelectedPostId] = useState(null);

  // This lets the UI still force-set a post list for instant UI update
  const setPosts = useCallback((newPosts) => {
    queryClient.setQueryData(COMMUNITY_EXCHANGES(communityId), newPosts);
  }, [queryClient, communityId]);

  const createDiscussionMutation = useMutation({
    // Accepts: { title, content }
    mutationFn: ({ title, content }) => createDiscussion({ communityId, title, content }),
    onSuccess: (data) => {
      // Optionally, you can insert data into posts immediately if you want, else rely on refetch.
      queryClient.invalidateQueries(COMMUNITY_EXCHANGES(communityId));
    }
  });

  const voteDiscussionMutation = useMutation({
    mutationFn: ({ postId, direction }) => voteDiscussion({ communityId, postId, direction }),
    onSuccess: () => queryClient.invalidateQueries(COMMUNITY_EXCHANGES(communityId)),
  });

  return {
    posts,
    setPosts,
    loading,
    selectedPostId,
    setSelectedPostId,
    fetchExchanges,
    createDiscussion: ({ title, content }) => createDiscussionMutation.mutateAsync({ title, content }),
    voteDiscussion: ({ postId, direction }) => voteDiscussionMutation.mutateAsync({ postId, direction }),
  };
}

// ---- CommunityProvider ----
export const CommunityProvider = ({ communityId, children }) => {
  const queryClient = useQueryClient();
  const [communityState, setCommunity] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);

  // COMMUNITY
  const { data: community, refetch: fetchCommunityData } = useQuery({
    queryKey: COMMUNITY(communityId),
    queryFn: () => fetchCommunity(communityId),
    enabled: !!communityId,
    staleTime: 30_000,
    onSuccess: (data) => {
      setSelectedTab(data?.tabs?.[0]);
    }
  });

  // JOIN/LEAVE
  const handleJoinLeave = useCallback(async () => {
    const current = communityState || community;
    if (!current) return;
    const wasMember = current.is_member;
    const newMemberStatus = !wasMember;
    const newMemberCount = wasMember
      ? Math.max(0, (current.members_count || 1) - 1)
      : (current.members_count || 0) + 1;

    setCommunity({
      ...current,
      is_member: newMemberStatus,
      members_count: newMemberCount
    });

    try {
      if (wasMember) {
        await leaveCommunity(communityId);
      } else {
        await joinCommunity(communityId);
      }
      await queryClient.invalidateQueries(COMMUNITY(communityId));
    } catch (error) {
      setCommunity(current); // revert on error
    }
  }, [community, communityState, communityId, queryClient]);

const addTabsMutation = useMutation({
  mutationFn: ({ communityId, tabs }) => addCommunityTabs({ communityId, tabs }),
  onSuccess: () => {
    queryClient.invalidateQueries(COMMUNITY(communityId));
  }
});

const addTabs = useCallback((tabsToAdd) => {
  // tabsToAdd: [{ key, label }]
    if (!tabsToAdd?.length) return;
    setCommunity(prev => {
  const base = prev ?? community ?? {}; // fall back to actual community data!
  return {
    ...base,
    tabs: [...((base.tabs) || []), ...tabsToAdd]
  };
});



  addTabsMutation.mutate(
    { communityId: communityId, tabs: tabsToAdd },
    {
      onError: () => {
        // Revert on error
        setCommunity(community || communityState);
      }
    }
  );
}, [addTabsMutation, communityId, community, communityState]);

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) return [];
    const response = await searchUsersApi(query);
    return response.data;
  }, []);

  // Invite user
  const inviteUser = useCallback(async (userId) => {
    await inviteUserApi({ communityId, userId });
  }, [communityId]);

  // ---- Sub-hooks ----
  const exchange = useExchangeLogic(communityId);
  const settings = useSettingsLogic(communityId);

  return (
    <CommunityContext.Provider value={{
      community: communityState || community,
      setCommunity,
      selectedTab,
      setSelectedTab,
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
