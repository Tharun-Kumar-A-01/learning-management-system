import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

// Custom hook to fetch and cache branding settings globally
export function useBranding() {
    const [settings, setSettings] = useState({
        companyName: 'LMS Platform',
        tagline: 'Learn. Grow. Succeed.',
        primaryColor: '#5f82f3',
        secondaryColor: '#2a2580',
        logoUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/site-settings');
            if (res.success && res.data) {
                setSettings(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch branding settings:', err);
            setError(err.message || 'Failed to load branding');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const refetch = () => {
        fetchSettings();
    };

    return { settings, loading, error, refetch };
}

export default useBranding;
