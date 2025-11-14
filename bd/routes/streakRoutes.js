// bd/routes/streakRoutes.js (REWRITTEN)
const express = require('express'); 
const router  = express.Router();

const authenticateUser = require('../controllers/authMiddleware');
// ✅ Import the new handlers
const { getStreaks, applyForgiveness } = require('../controllers/streakController');

// All streak routes require a user
router.use(authenticateUser);

// GET /api/streaks
router.get('/', getStreaks);

// POST /api/streaks/forgive
router.post('/forgive', applyForgiveness);

module.exports = router;