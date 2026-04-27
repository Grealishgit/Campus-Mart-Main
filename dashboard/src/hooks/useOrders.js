import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useOrders = (page = 1) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/admin/orders', {
                    params: { page, limit: 20 },
                });
                setOrders(data.orders);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [page]);

    return { orders, loading, error };
};