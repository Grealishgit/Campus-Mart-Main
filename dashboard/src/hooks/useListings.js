import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const { data } = await api.get('/admin/listings');
                setListings(data.listings);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch listings');
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const verifyListing = async (id, type) => {
        const { data } = await api.put(`/admin/listings/${id}/verify`, {}, {
            params: { type },
        });
        setListings((prev) => prev.map((l) => (l.id === id ? data.listing : l)));
    };

    return { listings, loading, error, verifyListing };
};