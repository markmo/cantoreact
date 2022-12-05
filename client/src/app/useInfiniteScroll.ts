import { useCallback, useEffect, useRef, useState } from 'react';

function useInfiniteScroll() {

  const [reachedEnd, setReachedEnd] = useState(false);
  const loadMoreRef = useRef();

  const handleObserver = useCallback((entries: Array<any>) => {
    const [target] = entries;
    setReachedEnd(target.isIntersecting);
  }, []);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    };
    const observer = new IntersectionObserver(handleObserver, options);
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
  }, [handleObserver]);

  return { loadMoreRef, reachedEnd };
}

export default useInfiniteScroll;
