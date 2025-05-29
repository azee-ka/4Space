import { useRef, useCallback } from "react";

export function useInfiniteScrollTrigger(loadMore, hasMore, loading) {
  const ref = useRef();
  const callback = useCallback(node => {
    if (loading) return;
    if (ref.current) ref.current.disconnect();
    ref.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) loadMore();
    }, { threshold: 0.8 });
    if (node) ref.current.observe(node);
  }, [hasMore, loadMore, loading]);
  return callback;
}
