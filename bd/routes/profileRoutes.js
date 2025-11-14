const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadProfileImage } = require('../controllers/profileController');
const authenticateUser = require('../controllers/authMiddleware'); // Import centralized middleware

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage }); 

// Route to handle profile image upload
// FIX: Use the centralized middleware for authentication
router.post(
  '/upload-profile-image',
  authenticateUser, // Standard authentication check
  upload.single('profileImage'),
  uploadProfileImage
);

module.exports = router;