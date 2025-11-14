// bd/routes/journalRoutes.js (NEW FILE)
const express = require('express'); 
const router  = express.Router();

const authenticateUser = require('../controllers/authMiddleware');
const { createJournalEntry } = require('../controllers/journalController');

// All journal routes require a user
router.use(authenticateUser);

// POST /api/journal
router.post('/', createJournalEntry);

module.exports = router;