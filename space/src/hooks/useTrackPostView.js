import { useEffect, useRef } from 'react';
import useApi from '../utils/useApi';

export function useTrackPostView(postId, enabled = true, setPost) {
    const hasTracked = useRef(false);
    const { callApi } = useApi();

    useEffect(() => {
        if (!enabled || !postId || hasTracked.current) return;
        hasTracked.current = true;
        callApi(`posts/post/${postId}/track-view/`, 'POST')
            .then(resp => {
                // Optionally, optimistically update state
                if (resp?.data?.views_count && setPost) {
                    setPost(prev => ({
                        ...prev,
                        stats: {
                            ...prev.stats,
                            views_count: resp.data.views_count
                        },
                    }));
                }
            })
            .catch(err => { hasTracked.current = false; });
    }, [postId, enabled, callApi, setPost]);
}
