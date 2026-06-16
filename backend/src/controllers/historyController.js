const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Supabase configuration missing for historyController'
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

const getHistory = async (req, res) => {
  try {
    let userId = req.query.user_id || null;

    // Get user from access token
    if (!userId) {
      const authHeader = req.headers.authorization;

      if (
        authHeader &&
        authHeader.startsWith('Bearer ')
      ) {
        const token = authHeader.split(' ')[1];

        try {
          const resp = await fetch(
            `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                apikey:
                  process.env.VITE_SUPABASE_ANON_KEY ||
                  process.env.SUPABASE_ANON_KEY
              }
            }
          );

          if (resp.ok) {
            const user = await resp.json();
            userId = user?.id;
          }
        } catch (err) {
          console.error(
            'Token verification failed:',
            err
          );
        }
      }
    }

    if (!userId) {
      return res.status(200).json([]);
    }

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false
      });

    if (error) {
      console.error(
        'History fetch error:',
        error
      );

      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error(
      'HistoryController error:',
      err
    );

    return res.status(500).json({
      error: 'Internal Server Error'
    });
  }
};

module.exports = {
  getHistory
};