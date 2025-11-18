const express = require('express'); 
const router  = express.Router();
const authenticateUser = require('../controllers/authMiddleware');

const { 
  getStreaks, 
  applyForgiveness, 
  recoverStreakDay,
  refillTokens 
} = require('../controllers/streakController');

router.use(authenticateUser);

router.get('/', getStreaks);
router.post('/forgive', applyForgiveness);
router.post('/recover', recoverStreakDay);
router.post('/debug/refill-tokens', refillTokens);

module.exports = router;