import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useUsers = (page = 1, search = '') => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/admin/users', {
                    params: { page, limit: 20, search },
                });
                setUsers(data.users);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page, search]);

    const verifyUser = async (id) => {
        const { data } = await api.put(`/admin/users/${id}/verify`);
        setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    };

    const deleteUser = async (id) => {
        await api.delete(`/admin/users/${id}`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    return { users, loading, error, verifyUser, deleteUser };
};