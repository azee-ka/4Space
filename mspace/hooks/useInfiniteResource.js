// hooks/useInfiniteResource.js
import { useInfiniteQuery } from '@tanstack/react-query';

// fetchPageFn: (pageParam) => Promise<{ results, nextCursor, count }>
export function useInfiniteResource(queryKey, fetchPageFn, options = {}) {
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = null }) => fetchPageFn(pageParam),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    ...options,
  });
}
