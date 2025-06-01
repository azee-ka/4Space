import { useState, useCallback, useEffect } from "react";

export function usePaginatedList(fetchPageFn, { pageSize = 20, immediate = true, resetDeps = [] } = {}) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0); // Change: state instead of ref

    // RESET when dependencies change (e.g., new postId)
    useEffect(() => {
        setItems([]);
        setPage(0);
        setHasMore(true);
        setLoading(false);
        setError(null);
        setTotalCount(0);
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
                const merged = [...resp.results, ...prev];
                const deduped = [];
                const seen = new Set();
                for (const c of merged) {
                    // Prefer uuid, fallback to id, fallback to stringified object as last resort
                    const uniqueKey = c.uuid ?? c.id ?? JSON.stringify(c);
                    if (!seen.has(uniqueKey)) {
                        seen.add(uniqueKey);
                        deduped.push(c);
                    }
                }
                return deduped;
            });
            setHasMore(Boolean(resp.next) && (resp.results?.length > 0));
            setPage(prev => prev + 1);
            setTotalCount(resp.count ?? 0); // Change: update state
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
        setTotalCount(0); // Change: reset state
        if (immediate) loadMore();
    };

    return {
        items,
        loadMore,
        hasMore,
        loading,
        error,
        totalCount,
        reset,
        setItems,
        setTotalCount,
    };
}
