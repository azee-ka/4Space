import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { USERNAME_HANDLES } from '../services/queryKeys';
import { fetchUsernameHandles, saveUsernameHandles } from '../services/settings';

const HandlesContext = createContext();
export const useHandles = () => useContext(HandlesContext);

export function HandlesProvider({ children }) {
  const queryClient = useQueryClient();

  // Fetch handles
  const {
    data: handles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: USERNAME_HANDLES,
    queryFn: fetchUsernameHandles,
    staleTime: 60_000,
  });

  // Save/mutate handles
  const saveHandlesMutation = useMutation({
    mutationFn: saveUsernameHandles,
    onSuccess: () => queryClient.invalidateQueries(USERNAME_HANDLES),
  });

  return (
    <HandlesContext.Provider value={{
      handles,
      isLoading,
      refetchHandles: refetch,
      saveHandles: saveHandlesMutation.mutateAsync,
      saveHandlesStatus: saveHandlesMutation.status,
    }}>
      {children}
    </HandlesContext.Provider>
  );
}
