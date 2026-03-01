'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

// Generic hook for fetching data on mount with refetch capability
export function useFetchOnMount<T>(fetcher: () => Promise<T>, initialValue: T): [T, boolean, () => void] {
  const [state, dispatch] = useReducer(
    (prev: { data: T; loading: boolean }, action: { type: 'success'; data: T } | { type: 'error' } | { type: 'loading' }) => {
      if (action.type === 'success') return { data: action.data, loading: false };
      if (action.type === 'error') return { ...prev, loading: false };
      if (action.type === 'loading') return { ...prev, loading: true };
      return prev;
    },
    { data: initialValue, loading: true }
  );

  const fetchIdRef = useRef(0);
  // Store fetcher in a ref so it never triggers re-renders / infinite loops
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(() => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: 'loading' });
    fetcherRef.current().then((result) => {
      if (fetchId === fetchIdRef.current) {
        dispatch({ type: 'success', data: result });
      }
    }).catch(() => {
      if (fetchId === fetchIdRef.current) {
        dispatch({ type: 'error' });
      }
    });
  }, []);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return [state.data, state.loading, doFetch];
}
