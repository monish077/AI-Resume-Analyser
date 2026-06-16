import React, { useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import ScoreCard from '../components/ScoreCard';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Check for a token in Supabase session or localStorage
                let token = null;
                try {
                    if (supabase.auth && typeof supabase.auth.getSession === 'function') {
                        const { data } = await supabase.auth.getSession();
                        token = data?.session?.access_token || null;
                    } else if (supabase.auth && typeof supabase.auth.session === 'function') {
                        const session = supabase.auth.session();
                        token = session?.access_token || null;
                    }
                } catch (e) {
                    console.debug('Supabase session check failed', e?.message || e);
                }

                // fallback to localStorage (login flow stores access_token there)
                if (!token) token = localStorage.getItem('access_token') || null;

                // If no token, redirect to login - history is private
                if (!token) {
                    console.debug('[Dashboard] No auth token found — redirecting to /login');
                    navigate('/login', { replace: true });
                    return;
                }

                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/\/+$/g, '');
                const url = API_BASE ? `${API_BASE}/api/history` : '/api/history';

                // Debugging logs to diagnose missing history / 404
                console.debug('[Dashboard] Fetching history from', url);
                console.debug('[Dashboard] Using token:', Boolean(token));

                const resp = await axios.get(url, { headers });
                console.debug('[Dashboard] History response status:', resp.status, 'data:', resp.data);
                setHistory(resp.data || []);
                setError(null);
            } catch (err) {
                const status = err?.response?.status;
                console.error('Failed to fetch history', err?.response?.data || err.message);
                // Treat 401/404 as empty history (friendly message)
                if (status === 401 || status === 404) {
                    setHistory([]);
                    setError(null);
                } else {
                    setError(err?.response?.data || { message: err.message });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="dashboard">
            <h1>Your Resume Analysis History</h1>
            <Link to="/analyze" className="btn-link">Analyze a New Resume</Link>

            {error && <div className="error">Error: {error.message || JSON.stringify(error)}</div>}

            {history.length === 0 ? (
                <p>No analysis history found.</p>
            ) : (
                <div className="history-grid">
                    {history.map((item) => (
                        <ScoreCard
                            key={item.id}
                            score={item.ats_score}
                            feedback={item.feedback}
                            job_title={item.job_title}
                            created_at={item.created_at}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
                .dashboard { max-width:960px; margin:20px auto; padding:16px; }
                .btn-link { display:inline-block; margin-bottom:12px; color:#2563eb; }
                .history-grid { display:grid; grid-template-columns:1fr; gap:12px; }
                @media(min-width:800px){ .history-grid{ grid-template-columns:1fr 1fr; } }
            `}</style>
        </div>
    );
};

export default Dashboard;