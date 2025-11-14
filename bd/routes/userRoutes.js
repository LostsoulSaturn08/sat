// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
// Import both controllers from userController
const { loginUser, handleGoogleLogin } = require('../controllers/userController');

// POST route to handle traditional username/password login or registration
router.post('/login', loginUser);

// NEW: POST route to handle Google Sign-In token verification and login/registration
router.post('/google-login', handleGoogleLogin);

module.exports = router;