import React, { useState } from 'react';
import supabase from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$|^$/g, '');
            const isLocalhost = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
            const url = (API_BASE && (!isLocalhost || import.meta.env.DEV)) ? `${API_BASE}/api/auth/login` : '/api/auth/login';
            const cleanEmail = (email || '').trim().toLowerCase();
            const resp = await axios.post(url, { email: cleanEmail, password });
            if (resp.data && resp.data.access_token) {
                // store token for API calls
                localStorage.setItem('access_token', resp.data.access_token);
                // optional: set in supabase client if you want
                // supabase.auth.setAuth(resp.data.access_token);
                navigate('/dashboard');
            } else if (resp.data && resp.data.user) {
                // Some flows return user object; still navigate
                navigate('/dashboard');
            } else {
                setError('Login failed: invalid response');
            }
        } catch (err) {
            console.error('Login error', err?.response?.data || err.message);
            const serverErr = err?.response?.data;
            // Prefer readable server error message when available
            const message = (serverErr && (serverErr.error || serverErr.msg || serverErr.message)) || JSON.stringify(serverErr) || err?.message || 'Login failed';
            setError(message);
        }
    };

    return (
        <div className="login-card">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">Login</button>
            </form>
            <style>{`
                .login-card { max-width:420px; margin:20px auto; padding:16px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
                label { display:block; margin-bottom:6px; font-weight:600; }
                input { width:100%; padding:8px; margin-bottom:10px; border:1px solid #ddd; border-radius:6px; }
                .error { color:#b91c1c; }
            `}</style>
        </div>
    );
};

export default Login;