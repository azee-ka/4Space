import { useState, useCallback, useRef, useEffect } from "react";

export function usePaginatedList(fetchPageFn, { pageSize = 20, immediate = true, resetDeps = [] } = {}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const countRef = useRef(0);

  // RESET when dependencies change (e.g., new postId)
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setLoading(false);
    setError(null);
    countRef.current = 0;
    if (immediate) loadMore();
    // eslint-disable-next-line
  }, resetDeps);

  const loadMore = useCallback(async () => {
  if (loading || !hasMore) return;
  setLoading(true);
  setError(null);
  try {
    const resp = await fetchPageFn({ page, pageSize });
    setItems(prev => {
        const merged = [...prev, ...(resp.results || [])];
        const deduped = [];
        const seen = new Set();
        for (const c of merged) {
            if (!seen.has(c.id)) {
                seen.add(c.id);
                deduped.push(c);
            }
        }
        return deduped;
    });
    setHasMore(Boolean(resp.next) && (resp.results?.length > 0));
    setPage(prev => prev + 1);
    countRef.current = resp.count ?? countRef.current;
  } catch (e) {
    setError(e);
    setHasMore(false);
  } finally {
    setLoading(false);
  }
}, [loading, hasMore, page, pageSize, fetchPageFn]);


  const reset = () => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setError(null);
    countRef.current = 0;
    if (immediate) loadMore();
  };

  return {
    items,
    loadMore,
    hasMore,
    loading,
    error,
    totalCount: countRef.current,
    reset
  };
}
