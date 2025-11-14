// bd/controllers/streakController.js (NEW FILE)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to format a Date object into YYYY-MM-DD string
const getDateKey = (date) => date.toISOString().split('T')[0];

// Function to get the last 90 days of activity
const getStreak = async (req, res) => {
  const userId = req.user.id;
  
  // Calculate the date 90 days ago for filtering
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    // Fetch all task updates from the last 90 days for the user's tasks.
    // We rely on 'updatedAt' being modified when a user interacts with a task.
    const activity = await prisma.task.findMany({
      where: {
        userId: userId,
        updatedAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      }
    });

    // Process activity into a map of YYYY-MM-DD : true
    const activityMap = {};
    activity.forEach(item => {
      const dateKey = getDateKey(item.updatedAt);
      activityMap[dateKey] = true;
    });

    // --- Calculate Current Streak Count ---
    let currentStreak = 0;
    let checkDate = new Date();
    const todayKey = getDateKey(checkDate);
    
    // Check for activity today
    let foundActivity = activityMap[todayKey];
    if (foundActivity) {
        currentStreak++;
    }

    // Check previous days consecutively
    for (let i = foundActivity ? 1 : 0; i < 90; i++) {
        checkDate.setDate(checkDate.getDate() - 1); // Go back one day
        const dateKey = getDateKey(checkDate);

        if (activityMap[dateKey]) {
            currentStreak++;
        } else {
            // Streak broken
            break; 
        }
    }
    
    return res.json({
        activity: activityMap,
        currentStreak: currentStreak,
        period: 90
    });

  } catch (error) {
    console.error('Streak calculation error:', error);
    return res.status(500).json({ message: 'Failed to calculate streak data' });
  }
};

module.exports = { getStreak };