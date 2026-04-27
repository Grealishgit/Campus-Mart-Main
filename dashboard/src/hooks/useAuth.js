import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/admin/login', { email, password });
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem('adminUser'));
        } catch {
            return null;
        }
    };

    const isAuthenticated = () => !!localStorage.getItem('adminToken');

    return { login, logout, getUser, isAuthenticated, loading, error };
};