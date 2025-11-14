// bd/controllers/userController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' } // ✅ Changed from 1h to 7 days
  );
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        dp: true,
        forgivenessTokens: true,
        name: true, // ✅ Get the name
      },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name: username, // ✅ Set name to username by default
        },
        select: {
          id: true,
          username: true,
          dp: true,
          forgivenessTokens: true,
          name: true, // ✅ Return the name
        },
      });

      const token = generateToken(newUser);
      return res.status(201).json({ message: 'User registered successfully', user: newUser, token });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ message: 'Login successful', user: userWithoutPassword, token });

  } catch (error) {
    console.error('Login/Register error:', error);
    return res.status(500).json({ message: 'Server error during login/registration' });
  }
};

const handleGoogleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Google token is required.' });
  }

  try {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleUserId = payload['sub'];
    const email = payload['email'];
    const name = payload['name']; // ✅ We will now use this 'name'
    const picture = payload['picture'];

    if (!email) {
       console.error('Google payload missing email:', payload);
       return res.status(400).json({ message: 'Email not provided by Google sign-in.' });
    }

    let user = await prisma.user.findUnique({
      where: { username: email },
      select: {
        id: true,
        username: true,
        dp: true,
        forgivenessTokens: true,
        name: true, // ✅ Get the name
      },
    });

    if (user) {
      const appToken = generateToken(user);
      return res.status(200).json({ message: 'Google Login successful', user: user, token: appToken });
    } else {
      const placeholderPassword = await bcrypt.hash(`google_${googleUserId}_${Date.now()}_${Math.random()}`, 10);

      const newUser = await prisma.user.create({
        data: {
          username: email,
          password: placeholderPassword,
          dp: picture || null,
          name: name || email, // ✅ Save the Google name, fallback to email
        },
        select: {
          id: true,
          username: true,
          dp: true,
          forgivenessTokens: true,
          name: true, // ✅ Return the name
        },
      });

      const appToken = generateToken(newUser);
      return res.status(201).json({ message: 'User registered via Google successfully', user: newUser, token: appToken });
    }

  } catch (error) {
    console.error('Google token verification or user processing failed:', error);
    if (error.message.includes('Token used too late') || error.message.includes('Invalid token signature') || error.message.includes('Wrong recipient')) {
       return res.status(401).json({ message: 'Invalid or expired Google token. Please try signing in again.' });
    }
    return res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

module.exports = { loginUser, handleGoogleLogin };