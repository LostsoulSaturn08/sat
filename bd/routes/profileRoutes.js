// lostsoulsaturn08/sat/sat-019c4325342575340607add8b5a7fff4fb04e73f/bd/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
// ✅ Import the new function
const { uploadProfileImage, updateProfileName } = require('../controllers/profileController');
const authenticateUser = require('../controllers/authMiddleware'); // Import centralized middleware

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// Route to handle profile image upload
router.post(
  '/upload-profile-image',
  authenticateUser,
  upload.single('profileImage'),
  uploadProfileImage
);

// ✅ --- NEW ROUTE --- ✅
// Route to handle name change
router.patch(
  '/profile/name',
  authenticateUser, // Requires user to be logged in
  updateProfileName
);
// ✅ ----------------- ✅

module.exports = router;