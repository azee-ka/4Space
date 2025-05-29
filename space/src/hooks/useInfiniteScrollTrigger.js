import { useRef, useEffect } from "react";

export function useInfiniteScrollTrigger(loadMore, hasMore, loading) {
  const ref = useRef();
  useEffect(() => {
    if (loading || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore) loadMore(); },
      { threshold: 0.8 }
    );
    const node = ref.current;
    observer.observe(node);
    return () => observer.unobserve(node);
  }, [loadMore, hasMore, loading]);
  return ref;
}
