const fetch = require('node-fetch');
require('dotenv').config();

const verifySupabaseAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = auth.split(' ')[1];
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('Supabase URL or service key not configured');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const url = `${supabaseUrl.replace(/\/?$/, '')}/auth/v1/user`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceKey,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Supabase auth verify failed:', resp.status, text);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await resp.json();
    req.user = user;
    return next();
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(500).json({ error: 'Authentication verification failed' });
  }
};

module.exports = { verifySupabaseAuth };
