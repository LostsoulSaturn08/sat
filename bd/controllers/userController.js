const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); // Import Google Auth library

const prisma = new PrismaClient();

// Initialize Google OAuth2 client
// Make sure GOOGLE_CLIENT_ID is in your .env file
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || 'fallback_secret', // Use environment variable or a fallback
    { expiresIn: '1h' } // Token expires in 1 hour
  );
};

// --- Existing loginUser function ---
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Try to find the user by username
    let user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true, // Need password to compare
        dp: true,
        forgivenessTokens: true,
      },
    });

    // If user doesn't exist, register them
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          // dp will be null initially
          // forgivenessTokens defaults to 2 in schema
        },
        select: { // Select only the data needed for the frontend session
          id: true,
          username: true,
          dp: true,
          forgivenessTokens: true,
        },
      });

      const token = generateToken(newUser); // Generate token for the new user
      // Return 201 Created status for registration
      return res.status(201).json({ message: 'User registered successfully', user: newUser, token });
    }

    // If user exists, compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' }); // Use 401 Unauthorized for bad credentials
    }

    // Passwords match, generate token
    const token = generateToken(user);

    // Remove password hash before sending user data back
    const { password: _, ...userWithoutPassword } = user;

    // Return 200 OK status for successful login
    return res.status(200).json({ message: 'Login successful', user: userWithoutPassword, token });

  } catch (error) {
    console.error('Login/Register error:', error);
    return res.status(500).json({ message: 'Server error during login/registration' });
  }
};


// --- NEW: Google Login Handler ---
const handleGoogleLogin = async (req, res) => {
  const { token } = req.body; // Google ID token from frontend

  if (!token) {
    return res.status(400).json({ message: 'Google token is required.' });
  }

  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();

    // Extract necessary info, ensure email exists
    const googleUserId = payload['sub'];
    const email = payload['email'];
    const name = payload['name']; // Optional: use if needed
    const picture = payload['picture']; // Optional: use for profile picture

    if (!email) {
       console.error('Google payload missing email:', payload);
       return res.status(400).json({ message: 'Email not provided by Google sign-in.' });
    }

    // Check if user already exists based on email (used as username for Google users)
    let user = await prisma.user.findUnique({
      where: { username: email },
      select: { // Select only needed fields
        id: true,
        username: true,
        dp: true,
        forgivenessTokens: true,
      },
    });

    // If user exists, generate our app token and return data
    if (user) {
      const appToken = generateToken(user);
      return res.status(200).json({ message: 'Google Login successful', user: user, token: appToken });
    } else {
      // User doesn't exist, create a new user
      // Generate a secure, unique placeholder password (not used for login)
      const placeholderPassword = await bcrypt.hash(`google_${googleUserId}_${Date.now()}_${Math.random()}`, 10);

      const newUser = await prisma.user.create({
        data: {
          username: email, // Use email as the unique username
          password: placeholderPassword,
          dp: picture || null, // Use Google picture if available
          // forgivenessTokens defaults to 2 in schema
        },
        select: { // Select only needed fields
          id: true,
          username: true,
          dp: true,
          forgivenessTokens: true,
        },
      });

      // Generate our app token for the newly created user
      const appToken = generateToken(newUser);
      // Return 201 Created status
      return res.status(201).json({ message: 'User registered via Google successfully', user: newUser, token: appToken });
    }

  } catch (error) {
    // Log detailed error for debugging
    console.error('Google token verification or user processing failed:', error);
    // Provide specific error messages based on common issues
    if (error.message.includes('Token used too late') || error.message.includes('Invalid token signature') || error.message.includes('Wrong recipient')) {
       return res.status(401).json({ message: 'Invalid or expired Google token. Please try signing in again.' });
    }
    // Generic server error for other issues
    return res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

// Export both functions
module.exports = { loginUser, handleGoogleLogin };