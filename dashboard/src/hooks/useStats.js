import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data.stats);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};