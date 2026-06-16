const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const historyController = require('../controllers/historyController');
const authController = require('../controllers/authController');
const { verifySupabaseAuth } = require('../middleware/auth');

// Auth endpoints (public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Debug proxy for Supabase (enabled only when DEBUG_SECRET env is set)
// Use express.text middleware for this route so we can accept non-JSON/raw payloads without crashing the global json parser
router.post('/debug/supabase', express.text({ type: '*/*' }), authController.debugSupabase);

// Route for analyzing a resume — protect when REQUIRE_ANALYZE_AUTH=true
if (process.env.REQUIRE_ANALYZE_AUTH === 'true') {
  router.post('/analyze', verifySupabaseAuth, analyzeController.upload.single('resume'), analyzeController.analyzeResume);
} else {
  // Keep unauthenticated analyze allowed for local/dev convenience
  router.post('/analyze', analyzeController.upload.single('resume'), analyzeController.analyzeResume);
}

// Make history public (no auth) because user requested removing login
router.get('/history', historyController.getHistory);

module.exports = router;