import React, { useState } from 'react';
import UploadForm from '../components/UploadForm';
import ScoreCard from '../components/ScoreCard';

const Analyzer = () => {
    const [atsScore, setAtsScore] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const handleAnalysis = (score, feedback) => {
        setAtsScore(score);
        setFeedback(feedback);
    };

    return (
        <div>
            <h1>Resume Analyzer</h1>
            <UploadForm onAnalyze={handleAnalysis} />
            {atsScore !== null && feedback && (
                <ScoreCard score={atsScore} feedback={feedback} />
            )}
        </div>
    );
};

export default Analyzer;