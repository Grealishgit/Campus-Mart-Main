import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useLogs = (page = 1) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/logs', {
          params: { page, limit: 50 },
        });
        setLogs(data.logs);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page]);

  return { logs, loading, error };
};