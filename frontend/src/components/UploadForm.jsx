import React, { useState } from 'react';
import axios from 'axios';
import supabase from '../supabaseClient';
import ScoreCard from './ScoreCard';

const UploadForm = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [atsScore, setAtsScore] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const handleFileChange = (event) => setPdfFile(event.target.files[0]);
    const handleJobDescriptionChange = (event) => setJobDescription(event.target.value);

    const getAccessToken = async () => {
    try {
        // First check localStorage (your login stores token here)
        const localToken = localStorage.getItem('access_token');
        if (localToken) return localToken;

        // Fallback to Supabase session
        if (supabase.auth?.getSession) {
            const { data } = await supabase.auth.getSession();
            return data?.session?.access_token || null;
        }

        return null;
    } catch (err) {
        console.error('Failed to get token', err);
        return null;
    }
};

    const doUpload = async (formData, headers) => {
        return axios.post('/api/analyze', formData, { headers, timeout: 120000 });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!pdfFile || !jobDescription) {
            setErrorDetails({ message: 'Please upload a PDF and enter a job description.' });
            return;
        }

        setLoading(true);
        setErrorDetails(null);

        const formData = new FormData();
        formData.append('resume', pdfFile);
        formData.append('job_description', jobDescription);

        const token = await getAccessToken();
        const headers = { 'Content-Type': 'multipart/form-data' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Use Vite env VITE_API_URL when provided (e.g., http://localhost:5000)
        const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$|^$/g, '');
        const url = API_BASE ? `${API_BASE}/api/analyze` : '/api/analyze';

        try {
            const response = await axios.post(url, formData, { headers, timeout: 120000 });
            setAtsScore(response.data.ats_score ?? null);
            const fb = response.data.feedback || [];
            setFeedback(Array.isArray(fb) ? fb : [String(fb)]);
            setRetryCount(0);
        } catch (err) {
            const details = err?.response?.data || { message: err.message };
            console.error('Upload error', details);
            setErrorDetails(details);
            if (retryCount < 2) {
                setRetryCount((c) => c + 1);
                setTimeout(() => handleSubmit(event), 1000 * (retryCount + 1));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-card">
            <form onSubmit={handleSubmit} className="upload-form">
                <div className="field">
                    <label htmlFor="pdf-upload">Upload Resume (PDF)</label>
                    <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} />
                </div>

                <div className="field">
                    <label htmlFor="job-description">Job Description</label>
                    <textarea id="job-description" value={jobDescription} onChange={handleJobDescriptionChange} rows={6} />
                </div>

                <div className="actions">
                    <button type="submit" className="btn" disabled={loading}>{loading ? 'Analyzing…' : 'Analyze'}</button>
                </div>

                {errorDetails && (
                    <div className="error-box">
                        <strong>Error:</strong>
                        <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
                        {retryCount < 2 && <p>Retrying... ({retryCount})</p>}
                    </div>
                )}
            </form>

            {atsScore !== null && (
                <div className="result">
                    <ScoreCard score={atsScore} feedback={feedback} />
                </div>
            )}

            <style jsx>{`
                .upload-card { max-width: 720px; margin: 20px auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); background: #fff; }
                .upload-form .field { margin-bottom: 12px; }
                label { display:block; font-weight:600; margin-bottom:6px; }
                input[type=file] { display:block; }
                textarea { width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; }
                .actions { margin-top:10px; }
                .btn { background:#2563eb; color:#fff; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; }
                .btn:disabled { opacity:0.6; cursor:default; }
                .error-box { margin-top:12px; background:#fff4f4; border:1px solid #ffd2d2; padding:10px; border-radius:6px; color:#a11; }
                .result { margin-top:18px; }
            `}</style>
        </div>
    );
};

export default UploadForm;