import { useRef, useEffect } from "react";

// Pass { upward: true } to trigger at top
export function useInfiniteScrollTrigger(loadMore, hasMore, loading, opts = {}) {
  const ref = useRef();
  useEffect(() => {
    if (loading || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Optionally: Only load if at top and NOT at bottom!
        if (entry.isIntersecting && hasMore && (!opts.upward || ref.current.scrollTop === 0)) loadMore();
      },
      { threshold: 0.8 }
    );
    const node = ref.current;
    observer.observe(node);
    return () => observer.unobserve(node);
  }, [loadMore, hasMore, loading]);
  return ref;
}

