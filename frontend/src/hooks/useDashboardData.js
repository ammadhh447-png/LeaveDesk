import { useState, useEffect, useCallback, useRef } from 'react';

export default function useDashboardData(fetcher, options = {}) {
  const { pollInterval = 0, refreshOnFocus = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const result = await fetcherRef.current();
      setData(result);
      if (!silent) setError('');
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to load dashboard data.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!pollInterval) return undefined;
    const intervalId = setInterval(() => refresh({ silent: true }), pollInterval);
    return () => clearInterval(intervalId);
  }, [pollInterval, refresh]);

  useEffect(() => {
    if (!refreshOnFocus) return undefined;
    const handleFocus = () => refresh({ silent: true });
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOnFocus, refresh]);

  return { data, loading, error, refresh };
}
