// src/context/CommunityContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  COMMUNITY,
  COMMUNITY_MEMBERS,
  COMMUNITY_EXCHANGES,
} from '../services/queryKeys';
import {
  fetchCommunity,
  fetchCommunityMembers,
  updateRole,
  updatePermissions,
  fetchExchanges,
  createDiscussion,
  voteDiscussion,
  addCommunityTabs,
  joinCommunity,
  leaveCommunity,
  searchUsersApi,
  inviteUserApi,
} from '../services/communities';
import { HandlesProvider } from './HandlesContext';

const CommunityContext = createContext();
export const useCommunity = () => useContext(CommunityContext);

function useSettingsLogic(slug) {
  const qc = useQueryClient();
  const { data: members = [], isLoading: loading, refetch: fetchMembers } =
    useQuery({
      queryKey: COMMUNITY_MEMBERS(slug),
      queryFn: () => fetchCommunityMembers(slug),
      enabled: false,
      staleTime: 30_000,
    });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) =>
      updateRole({ slug, userId, newRole }),
    onSuccess: () => qc.invalidateQueries(COMMUNITY_MEMBERS(slug)),
  });
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, perms }) =>
      updatePermissions({ slug, userId, perms }),
    onSuccess: () => qc.invalidateQueries(COMMUNITY_MEMBERS(slug)),
  });

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
      onFinish?.();
      fetchMembers();
    },
    [fetchMembers, updatePermissionsMutation, updateRoleMutation]
  );

  return {
    members,
    loading,
    fetchMembers,
    updateRole: updateRoleMutation.mutateAsync,
    updatePermissions: updatePermissionsMutation.mutateAsync,
    bulkUpdate,
  };
}

function useExchangeLogic(slug) {
  const qc = useQueryClient();
  const {
    data: posts = [],
    isLoading: loading,
    isError: error,
  } = useQuery({
    queryKey: COMMUNITY_EXCHANGES(slug),
    queryFn: () => fetchExchanges(slug),
    staleTime: 30_000,
    keepPreviousData: true,
  });

  const createDiscussionMutation = useMutation({
    mutationFn: ({ title, content }) =>
      createDiscussion({ slug, title, content }),
    onSuccess: () => {
      qc.invalidateQueries(COMMUNITY_EXCHANGES(slug));
    },
  });

  const voteDiscussionMutation = useMutation({
    mutationFn: ({ postId, direction }) =>
      voteDiscussion({ slug, postId, direction }),
    onSuccess: () => qc.invalidateQueries(COMMUNITY_EXCHANGES(slug)),
  });

  return {
    posts,
    loading,
    error,
    createDiscussionMutation,
    voteDiscussion: voteDiscussionMutation.mutateAsync,
  };
}

export const CommunityProvider = ({ slug, children }) => {
  const qc = useQueryClient();
  const [communityState, setCommunity] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);

  const { data: community, refetch: fetchCommunityData } = useQuery({
    queryKey: COMMUNITY(slug),
    queryFn: () => fetchCommunity(slug),
    enabled: !!slug,
    staleTime: 30_000,
    onSuccess: data => {
      setCommunity(data);
      setSelectedTab(data.tabs?.[0] || null);
    },
  });

  const handleJoinLeave = useCallback(async () => {
    const current = communityState || community;
    if (!current) return;
    const wasMember = current.is_member;
    setCommunity({
      ...current,
      is_member: !wasMember,
      members_count: wasMember
        ? Math.max(0, (current.members_count || 1) - 1)
        : (current.members_count || 0) + 1,
    });
    try {
      if (wasMember) await leaveCommunity(slug);
      else await joinCommunity(slug);
      qc.invalidateQueries(COMMUNITY(slug));
    } catch {
      setCommunity(current);
    }
  }, [community, communityState, slug, qc]);

  const addTabsMutation = useMutation({
    mutationFn: ({ slug, tabs }) =>
      addCommunityTabs({ slug, tabs }),
    onSuccess: () => qc.invalidateQueries(COMMUNITY(slug)),
  });
  const addTabs = useCallback(
    tabsToAdd => {
      if (!tabsToAdd?.length) return;
      setCommunity(prev => ({
        ...prev,
        tabs: [...(prev?.tabs || []), ...tabsToAdd],
      }));
      addTabsMutation.mutate(
        { slug, tabs: tabsToAdd },
        { onError: () => setCommunity(communityState || community) }
      );
    },
    [addTabsMutation, community, slug, communityState]
  );

  const searchUsers = useCallback(
    async q => {
      if (!q.trim()) return [];
      const resp = await searchUsersApi(q);
      return resp.data;
    },
    []
  );
  const inviteUser = useCallback(
    async userId => {
      await inviteUserApi({ slug, userId });
    },
    [slug]
  );

  const settings = useSettingsLogic(slug);
  const exchange = useExchangeLogic(slug);

  return (
    <HandlesProvider>
      <CommunityContext.Provider
        value={{
          community: communityState || community,
          setCommunity,
          selectedTab,
          setSelectedTab,
          fetchCommunityData,
          handleJoinLeave,
          addTabs,
          searchUsers,
          inviteUser,
          settings,
          exchange,
        }}
      >
        {children}
      </CommunityContext.Provider>
    </HandlesProvider>
  );
};
