import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides global auth state.
 * Components consume it via the useAuth() hook.
 */
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('access_token'));
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('access_token'));

    // Keep state in sync if localStorage changes in another tab
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'access_token') {
                const newToken = e.newValue;
                setToken(newToken);
                setIsAuthenticated(!!newToken);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const login = useCallback((accessToken) => {
        localStorage.setItem('access_token', accessToken);
        setToken(accessToken);
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('rfp_analysisData');
        sessionStorage.removeItem('rfp_rfpTitle');
        setToken(null);
        setIsAuthenticated(false);
    }, []);

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/** Hook to consume auth context anywhere in the tree. */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside an <AuthProvider>');
    }
    return context;
}
