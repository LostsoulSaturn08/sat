const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uploadProfileImage = async (req, res) => {
  console.log('✅ Reached uploadProfileImage route');

  // Check for JWT-authenticated user
  if (!req.user || !req.user.id) {
    console.error('⛔ req.user is missing');
    return res.status(401).json({ error: 'Unauthorized: No user info' });
  }

  // Check if file was uploaded by multer
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
      },
    });
  } catch (error) {
    console.error('🔥 Error updating user profile image:', error);
    return res.status(500).json({ error: 'Server error: Unable to update profile image' });
  }
};

module.exports = { uploadProfileImage };
