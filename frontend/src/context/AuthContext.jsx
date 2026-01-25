import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for logged in user
        const checkUserLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await apiFetch('/auth/me');
                    if (res.success) {
                        setUser(res.data);
                    } else {
                        localStorage.removeItem('token');
                    }
                } catch (error) {
                    console.error("Auth check failed:", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkUserLoggedIn();
    }, []);

    const login = async (email, password) => {
        const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        if (res.success) {
            localStorage.setItem('token', res.token);
            setUser(res.user);
            return res.user;
        }
    };

    const register = async (name, email, password) => {
        const res = await apiFetch('/auth/register', {
            method: 'POST',
            body: { name, email, password }
        });

        if (res.success) {
            localStorage.setItem('token', res.token);
            setUser(res.user);
            return res.user;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
