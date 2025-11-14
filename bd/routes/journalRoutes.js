// bd/routes/journalRoutes.js
const express = require('express'); 
const router  = express.Router();

const authenticateUser = require('../controllers/authMiddleware');
// ✅ Import all functions
const { 
  createJournalEntry, 
  getJournalEntries,
  handleAppLoad 
} = require('../controllers/journalController');

// All journal routes require a user
router.use(authenticateUser);

// GET /api/journal (Gets all entries for the grid)
router.get('/', getJournalEntries);

// POST /api/journal (Creates a new entry)
router.post('/', createJournalEntry);

// ✅ --- NEW ROUTE --- ✅
// POST /api/journal/app-load
// This is hit once when the app loads to mark the heatmap
router.post('/app-load', handleAppLoad);
// ✅ ----------------- ✅

module.exports = router;