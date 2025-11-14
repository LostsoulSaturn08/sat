const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Incoming Authorization header:", authHeader); // 🔍 Debug log

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("❌ No token found in Authorization header");
    return res.status(401).json({ error: "Unauthorized - No token" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Extracted token:", token); // 🔍 Debug log

  try {
    // FIX: Use the same fallback secret as userController for consistency
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log("✅ Token verified. Decoded payload:", decoded); // 🔍 Debug log

    req.user = decoded; // Attach user info to the request object
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authenticateUser;
