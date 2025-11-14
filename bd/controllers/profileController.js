// lostsoulsaturn08/sat/sat-019c4325342575340607add8b5a7fff4fb04e73f/bd/controllers/profileController.js
// bd/controllers/profileController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uploadProfileImage = async (req, res) => {
  console.log('✅ Reached uploadProfileImage route');

  if (!req.user || !req.user.id) {
    console.error('⛔ req.user is missing');
    return res.status(401).json({ error: 'Unauthorized: No user info' });
  }

  if (!req.file) {
    console.error('⛔ req.file is missing');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = `/uploads/${req.file.filename}`;
    const userId = req.user.id;

    console.log('👉 Updating user ID:', userId);
    console.log('🖼️ File path:', filePath);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { dp: filePath },
    });

    console.log('✅ User dp updated in DB');

    return res.status(200).json({
      message: 'Profile image uploaded successfully',
      imageUrl: filePath,
      user: {
        id: user.id,
        username: user.username,
        dp: user.dp,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('🔥 Error updating user profile image:', error);
    return res.status(500).json({ error: 'Server error: Unable to update profile image' });
  }
};

// ✅ --- NEW FUNCTION --- ✅
const updateProfileName = async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        username: true,
        dp: true,
        forgivenessTokens: true,
        name: true,
      },
    });

    res.status(200).json({
      message: 'Name updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('🔥 Error updating user name:', error);
    res.status(500).json({ error: 'Server error: Unable to update name' });
  }
};
// ✅ -------------------- ✅

module.exports = {
  uploadProfileImage,
  updateProfileName, // ✅ Export the new function
};