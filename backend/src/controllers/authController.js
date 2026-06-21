const fetch = require('node-fetch');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Helper to call token endpoint (used for auto-login)
const fetchTokenForUser = async (base, email, password) => {
  try {
    const tokenUrl = `${base}/auth/v1/token?grant_type=password`;

    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await resp.json().catch(() => ({}));

    return {
      ok: resp.ok,
      status: resp.status,
      data
    };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      data: {
        error: 'token_fetch_failed',
        details: err.message
      }
    };
  }
};

const register = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = (email || '').trim().toLowerCase();
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
    if (!supabaseUrl) return res.status(500).json({ error: 'Supabase URL not configured on server' });

    const base = supabaseUrl.replace(/\/$/, '');

    // If we have a service-role key, try to check existence of user first to return a clear error
    if (serviceKey) {
      try {
        const checkUrl = `${base}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
        const checkResp = await fetch(checkUrl, {
          method: 'GET',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (checkResp.ok) {
          const existing = await checkResp.json().catch(() => null);
          if (existing) {
            if (Array.isArray(existing) && existing.length > 0) {
              return res.status(409).json({ error: 'Email already registered' });
            }
            if (existing && existing.id) {
              return res.status(409).json({ error: 'Email already registered' });
            }
          }
        }
      } catch (e) {
        console.debug('User existence check error (ignored):', e?.message || e);
      }
    }

    // Attempt admin create if serviceKey present
    if (serviceKey) {
      try {
        const adminUrl = `${base}/auth/v1/admin/users`;
        const adminResp = await fetch(adminUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`
          },
          body: JSON.stringify({ email, password, email_confirm: true })
        });

        const adminData = await adminResp.json().catch(async () => {
          const txt = await adminResp.text().catch(() => '');
          return { raw: txt };
        });

        if (adminResp.ok) {
          console.info('Created user via admin API for', email);

          // Auto-login: exchange password for token and return access_token to frontend if successful
          const tokenResp = await fetchTokenForUser(base, email, password);
          if (tokenResp.ok && tokenResp.data && tokenResp.data.access_token) {
            return res.status(201).json({ access_token: tokenResp.data.access_token, refresh_token: tokenResp.data.refresh_token, user: adminData });
          }

          // If token fetch failed, still return created user info with token fetch details
          return res.status(201).json({ user: adminData, token_fetch: tokenResp });
        }

        if (adminData && (adminData.error || adminData.message || (typeof adminData === 'string' && adminData.includes('already')))) {
  return res.status(409).json({
    error: adminData.error || adminData.message || 'Email already registered',
    details: adminData
  });
}

console.debug('Admin user creation failed, falling back to signup', {
  status: adminResp.status,
  body: adminData
});
      } catch (adminErr) {
        console.debug('Admin create attempted and failed (ignored):', adminErr?.message || adminErr);
      }
    }
    // Fallback: public signup. Use anon key for apikey header when available.
    const signupUrl = `${base}/auth/v1/signup`;
    const resp = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey || serviceKey,
        Authorization: `Bearer ${serviceKey || anonKey}`
      },
      body: JSON.stringify({ email, password })
    });

    const data = await resp.json().catch(async () => {
      const txt = await resp.text().catch(() => '');
      return { raw: txt };
    });

    if (!resp.ok) {
      const message = data?.error || data?.message || (data && data.raw) || 'Signup failed';
      if (/(already|exists)/i.test(String(message))) {
        return res.status(409).json({ error: 'Email already registered', details: data });
      }
      console.error('Supabase signup error', resp.status, data);
      return res.status(resp.status).json({ error: message, details: data });
    }

    // If public signup succeeded, attempt token fetch (may fail if email confirmation required)
    const tokenResp = await fetchTokenForUser(base, email, password);
    if (tokenResp.ok && tokenResp.data && tokenResp.data.access_token) {
      return res.status(201).json({ access_token: tokenResp.data.access_token, refresh_token: tokenResp.data.refresh_token, user: data });
    }

    return res.status(201).json({ user: data, token_fetch: tokenResp });
  } catch (err) {
    console.error('Auth register error', err);
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = (email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing email or password'
      });
    }

    const tokenUrl =
      `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`;

    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await resp.json().catch(() => ({}));

    console.log('SUPABASE RESPONSE:', data);

    if (!resp.ok) {
      return res.status(resp.status).json({
        error:
          data.msg ||
          data.error_description ||
          data.error ||
          'Login failed',
        details: data
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user
    });

  } catch (err) {
    console.error('Auth login error:', err);

    return res.status(500).json({
      error: 'Login failed',
      details: err.message
    });
  }
};
// Debug endpoint to proxy a request to Supabase and return raw response for debugging.
// Requires DEBUG_SECRET env var and matching x-debug-secret header for safety.
const debugSupabase = async (req, res) => {
  try {
    const DEBUG_SECRET = process.env.DEBUG_SECRET;
    if (!DEBUG_SECRET) return res.status(403).json({ error: 'Debug endpoint disabled on server (set DEBUG_SECRET to enable)' });

    // Support both JSON and raw/text bodies. If req.body is a string, attempt to parse as JSON.
    let bodyObj = {};
    if (typeof req.body === 'string') {
      // Try to parse JSON-like text, otherwise keep as raw string under 'raw'
      try {
        bodyObj = JSON.parse(req.body);
      } catch (e) {
        bodyObj = { raw: req.body };
      }
    } else if (req.body && typeof req.body === 'object') {
      bodyObj = req.body;
    }

    const provided = req.headers['x-debug-secret'] || bodyObj.debug_secret;
    if (provided !== DEBUG_SECRET) return res.status(403).json({ error: 'Invalid debug secret' });

    const { method = 'GET', path, body: reqBody, headers: extraHeaders } = bodyObj || {};
    if (!path) return res.status(400).json({ error: 'Missing path to proxy. Example: { path: "/auth/v1/token" }' });
    const base = supabaseUrl.replace(/\/$/, '');
    const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

    const defaultHeaders = {
      'Content-Type': typeof reqBody === 'string' ? 'text/plain' : 'application/json',
      apikey: serviceKey || anonKey,
      Authorization: `Bearer ${serviceKey || anonKey}`
    };

    const mergedHeaders = Object.assign({}, defaultHeaders, extraHeaders || {});

    const resp = await fetch(url, {
      method,
      headers: mergedHeaders,
      body: method === 'GET' || method === 'HEAD' ? undefined : (defaultHeaders['Content-Type'] === 'application/json' ? JSON.stringify(reqBody) : reqBody)
    });

    // try parse json, else text
    let data;
    try { data = await resp.json(); } catch (e) { data = await resp.text().catch(() => ''); }

    const safeHeaders = {};
    resp.headers.forEach((v, k) => { safeHeaders[k] = v; });

    return res.status(200).json({ status: resp.status, headers: safeHeaders, body: data });
  } catch (err) {
    console.error('Debug proxy error', err);
    return res.status(500).json({ error: 'Debug proxy failed', details: err.message });
  }
};

module.exports = { register, login, debugSupabase };