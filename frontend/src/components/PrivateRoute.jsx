import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PrivateRoute — wraps any route that requires authentication.
 * Reads from AuthContext (which is synced with localStorage).
 * Redirects to /login if not authenticated.
 */
export default function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
}
