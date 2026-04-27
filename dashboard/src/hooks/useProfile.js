import { useState } from 'react';
import api from '../lib/api';

export const useProfile = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const updateProfile = async (updates) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const { data } = await api.put('/admin/profile', updates);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            await api.put('/admin/profile/password', { currentPassword, newPassword });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return { updateProfile, changePassword, loading, error, success };
};