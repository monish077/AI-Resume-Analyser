const multer = require('multer');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const upload = multer();

// Prefer server-side env vars, fall back to VITE_* for local/dev
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded under field name "resume".' });
        }

        const pdfBuffer = req.file.buffer;
        let pdfData;
        try {
            pdfData = await pdf(pdfBuffer);
        } catch (pdfErr) {
            console.error('PDF parse error:', pdfErr);
            const devDetails = process.env.NODE_ENV === 'production' ? undefined : pdfErr.message;
            return res.status(400).json({ error: 'Failed to parse PDF', details: devDetails });
        }

        const resumeText = (pdfData && pdfData.text) ? pdfData.text : '';
        const jobDescription = req.body.job_description || req.body.job_description_text || req.body.job_description_textarea || '';

        // Development stub: return fake response when USE_GROQ_STUB=true
        if (process.env.USE_GROQ_STUB === 'true') {
            console.warn('Using Groq stub response (USE_GROQ_STUB=true)');
            const ats_score = Math.floor(60 + Math.random() * 30);
            const feedback = [
                'Use more keywords from the job description.',
                'Convert long paragraphs into concise bullets.',
                'Remove uncommon fonts and complex formatting for ATS.'
            ];

            // Save to Supabase only if authenticated user is present
            if (req.user && req.user.id) {
                try {
                    const { data, error } = await supabase
                        .from('resumes')
                        .insert([{ user_id: req.user.id, job_title: req.body.job_title || null, ats_score, feedback }]);
                    if (error) console.error('Supabase insert error:', error);
                } catch (dbErr) {
                    console.error('Supabase insert exception:', dbErr);
                }
            }

            return res.json({ ats_score, feedback, stub: true });
        }

        // Validate Groq configuration before calling
        if (!process.env.GROQ_API_KEY || !process.env.GROQ_API_URL) {
            console.error('Missing GROQ_API_KEY or GROQ_API_URL. Set GROQ_API_KEY and GROQ_API_URL in backend/.env or enable USE_GROQ_STUB.');
            return res.status(500).json({ error: 'Server misconfiguration: Groq API not configured. Use USE_GROQ_STUB=true for local development.' });
        }

        const groqEndpoint = process.env.GROQ_API_URL;
        let response;
        try {
            // Use chat-completions / OpenAI-compatible format (messages) as required by current Groq API
            const systemMessage = `You are an ATS Resume Analyzer. Return JSON ONLY with keys: ats_score (number 0-100) and feedback (array of up to 5 short strings). Do not add any explanatory text.`;
            const userContent = `Resume:\n\n${resumeText}\n\nJob Description:\n\n${jobDescription}\n\nRespond with JSON only.`;

            const bodyPayload = {
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userContent }
                ],
                temperature: 0.1,
                max_tokens: parseInt(process.env.GROQ_MAX_TOKENS || '800', 10)
            };

            response = await fetch(groqEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify(bodyPayload),
                timeout: 120000
            });
        } catch (fetchErr) {
            console.error('Network error calling Groq:', fetchErr);
            const devDetails = process.env.NODE_ENV === 'production' ? undefined : fetchErr.message;
            return res.status(502).json({ error: 'Failed to reach Groq API', details: devDetails });
        }

        if (!response.ok) {
            const text = await response.text().catch(() => '<non-text response>');
            console.error(`Groq API non-OK (${response.status}):`, text);
            const devDetails = process.env.NODE_ENV === 'production' ? undefined : { status: response.status, body: text };
            return res.status(502).json({ error: 'Groq API returned an error', details: devDetails });
        }

        let resultJson;
        try {
            resultJson = await response.json();
        } catch (jsonErr) {
            const text = await response.text().catch(() => '<unreadable>');
            console.error('Failed to parse Groq JSON response:', jsonErr, text);
            const devDetails = process.env.NODE_ENV === 'production' ? undefined : { message: jsonErr.message, raw: text };
            return res.status(502).json({ error: 'Invalid JSON from Groq API', details: devDetails });
        }

        // Extract content from OpenAI-style response
        let content = null;
        if (resultJson?.choices && Array.isArray(resultJson.choices) && resultJson.choices.length > 0) {
            // Some endpoints return choices[0].message.content (chat)
            content = resultJson.choices[0]?.message?.content || resultJson.choices[0]?.text || null;
        } else if (resultJson?.output) {
            // Groq may return output array
            if (Array.isArray(resultJson.output) && resultJson.output.length > 0) {
                content = typeof resultJson.output[0] === 'string' ? resultJson.output[0] : JSON.stringify(resultJson.output[0]);
            }
        } else if (typeof resultJson === 'string') {
            content = resultJson;
        }

        if (!content) {
            console.error('Groq response did not contain expected content field', JSON.stringify(resultJson));
            const devDetails = process.env.NODE_ENV === 'production' ? undefined : { raw: resultJson };
            return res.status(502).json({ error: 'Unexpected Groq response format', details: devDetails });
        }

        // The model should return JSON only; attempt to parse robustly
        let parsed = null;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            // Try to extract JSON substring
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    parsed = JSON.parse(match[0]);
                } catch (e2) {
                    console.error('Failed to parse JSON substring from Groq content', e2);
                }
            }
        }

        if (!parsed) {
            // As a last resort, return raw content for debugging
            console.error('Unable to parse JSON from Groq content. Raw content:', content);
            const devDetails = process.env.NODE_ENV === 'production' ? undefined : { raw: content };
            return res.status(502).json({ error: 'Unable to parse Groq JSON response', details: devDetails });
        }

        // Normalize fields
        const ats_score = parsed.ats_score ?? parsed.score ?? parsed.ATS ?? null;
        const feedback = parsed.feedback ?? parsed.suggestions ?? parsed.recommendations ?? [];

        // Save to Supabase only if authenticated user is present
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];

                const userResp = await fetch(
                    `${supabaseUrl}/auth/v1/user`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            apikey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
                        }
                    }
                );

                if (userResp.ok) {
                    const user = await userResp.json();

                    try {
                        const { data, error } = await supabase
                            .from('resumes')
                            .insert([
                                {
                                    user_id: user.id,
                                    email: user.email,
                                    filename: req.file.originalname,
                                    ats_score: ats_score,
                                    feedback: feedback
                                }
                            ]);

                        if (error) {
                            console.error('INSERT ERROR:', error);
                        } else {
                            console.log('RESUME SAVED:', data);
                        }
                    } catch (dbErr) {
                        console.error('Supabase insert exception:', dbErr);
                    }
                }
            } catch (err) {
                console.error('History save failed:', err);
            }
        }

        return res.json({ ats_score, feedback });
    } catch (error) {
        console.error('Unexpected analyze error:', error);
        const devDetails = process.env.NODE_ENV === 'production' ? undefined : (error && error.message ? error.message : String(error));
        return res.status(500).json({ error: 'An error occurred while analyzing the resume.', details: devDetails });
    }
};

module.exports = { analyzeResume, upload };