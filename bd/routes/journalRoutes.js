// bd/routes/journalRoutes.js
const express = require('express'); 
const router  = express.Router();

const authenticateUser = require('../controllers/authMiddleware');
// ✅ Import both functions
const { createJournalEntry, getJournalEntries } = require('../controllers/journalController');

// All journal routes require a user
router.use(authenticateUser);

// ✅ GET /api/journal (Gets all entries for the grid)
router.get('/', getJournalEntries);

// POST /api/journal (Creates a new entry)
router.post('/', createJournalEntry);

module.exports = router;