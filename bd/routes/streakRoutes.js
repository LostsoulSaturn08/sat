const express = require('express'); 
const router  = express.Router();

const authenticateUser = require('../controllers/authMiddleware');
const {getStreaks , updateStreaks , applyForgiveness } = require('../controllers/streakController');
router.use(authenticateUser);
router.get('/',getStreaks);
router.post('/update',updateStreaks);
router.post('/forgive', applyForgiveness);
module.exports = router;
