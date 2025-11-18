const express = require('express'); 
const router  = express.Router();
const authenticateUser = require('../controllers/authMiddleware');

// ✅ Import the new function
const { 
  getStreaks, 
  applyForgiveness, 
  simulateMissedDay,
  recoverStreakDay 
} = require('../controllers/streakController');

// All streak routes require a user
router.use(authenticateUser);

// GET /api/streaks
router.get('/', getStreaks);

// POST /api/streaks/forgive (Automatic Modal Logic)
router.post('/forgive', applyForgiveness);

// POST /api/streaks/debug/skip-day (Dev Tool)
router.post('/debug/skip-day', simulateMissedDay);

// ✅ NEW: POST /api/streaks/recover (Grid Click Logic)
router.post('/recover', recoverStreakDay);

module.exports = router;