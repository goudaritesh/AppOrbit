import { useState, useCallback } from 'react';

/**
 * Reusable hook to handle asynchronous API calls with loading, error, and data lifecycle.
 *
 * @param {Function} apiFunc - Async function returning a promise
 * @returns {object} { execute, data, error, isLoading, reset }
 */
export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        setIsLoading(false);
        return { data: result, error: null };
      } catch (err) {
        setError(err);
        setIsLoading(false);
        return { data: null, error: err };
      }
    },
    [apiFunc]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, data, error, isLoading, reset };
};

export default useApi;
