import React from 'react';

const ScoreCard = ({ score, feedback, job_title, created_at }) => {
    // Normalize feedback to an array of strings for safe rendering
    let feedbackList = [];
    try {
        if (!feedback) {
            feedbackList = [];
        } else if (Array.isArray(feedback)) {
            feedbackList = feedback;
        } else if (typeof feedback === 'string') {
            // Try to parse JSON string, otherwise use as single item
            try {
                const parsed = JSON.parse(feedback);
                feedbackList = Array.isArray(parsed) ? parsed : [String(parsed)];
            } catch (e) {
                feedbackList = [feedback];
            }
        } else if (typeof feedback === 'object') {
            // Convert object values to an array (covers JSON objects returned by DB)
            feedbackList = Array.isArray(feedback) ? feedback : Object.values(feedback || {});
        } else {
            feedbackList = [String(feedback)];
        }
    } catch (err) {
        console.error('Failed to normalize feedback', err);
        feedbackList = [];
    }

    return (
        <div className="score-card">
            <div className="meta">
                {job_title && <div className="job">{job_title}</div>}
                {created_at && <div className="time">{new Date(created_at).toLocaleString()}</div>}
            </div>
            <div className="score">{score}</div>
            <div className="feedback">
                <h4>Feedback</h4>
                <ul>
                    {feedbackList.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            <style>{`
                .score-card { padding:16px; border-radius:8px; background:linear-gradient(180deg,#f9fafb,#ffffff); box-shadow:0 1px 6px rgba(16,24,40,0.04); }
                .meta { display:flex; justify-content:space-between; margin-bottom:8px; color:#6b7280; font-size:13px; }
                .score { font-size:40px; font-weight:700; color:#111827; margin-bottom:8px; }
                .feedback ul { padding-left:18px; }
            `}</style>
        </div>
    );
};

export default ScoreCard;