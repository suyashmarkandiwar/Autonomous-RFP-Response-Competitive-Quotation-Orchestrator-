import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);
            const res = await api.post('/api/v1/auth/login', params);
            login(res.data.access_token);  // sets localStorage + updates context
            navigate('/upload');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: '100vh', background: '#080c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulse-glow { 0%,100% { opacity:0.35; } 50% { opacity:0.65; } }
                .auth-input { width:100%; padding:12px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:#fff; font-size:15px; outline:none; transition:all 0.2s; box-sizing:border-box; }
                .auth-input::placeholder { color:rgba(255,255,255,0.3); }
                .auth-input:focus { border-color:rgba(99,102,241,0.6); background:rgba(99,102,241,0.08); box-shadow:0 0 0 3px rgba(99,102,241,0.15); }
                .auth-btn { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:#fff; font-size:15px; font-weight:700; cursor:pointer; transition:all 0.3s; }
                .auth-btn:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(99,102,241,0.45); }
                .auth-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
            `}</style>

            {/* Background orbs */}
            <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(80px)', top: '-150px', left: '-150px', animation: 'pulse-glow 4s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', filter: 'blur(80px)', bottom: '-100px', right: '-100px', animation: 'pulse-glow 4s 2s ease-in-out infinite', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 420, animation: 'fadeInUp 0.6s ease both' }}>
                {/* Back to landing */}
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6, padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>
                    ← Back to Home
                </button>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: '40px 36px', backdropFilter: 'blur(12px)' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>QuotePulse <span style={{ background: 'linear-gradient(135deg,#818cf8,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span></span>
                    </div>

                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>Welcome back</h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Sign in to your account to continue</p>

                    {error && (
                        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 14 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Email Address</label>
                            <input id="login-email" type="email" required placeholder="you@company.com" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    className="auth-input"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        /* Eye-off icon */
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        /* Eye icon */
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <button id="login-submit" type="submit" disabled={loading} className="auth-btn" style={{ marginTop: 8 }}>
                            {loading ? 'Logging in...' : 'Login →'}
                        </button>
                    </form>

                    <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                        Don't have an account?{' '}
                        <button onClick={() => navigate('/signup')} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 14 }}>
                            Create
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
