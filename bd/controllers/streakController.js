// bd/controllers/streakController.js (REWRITTEN)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to get date strings (YYYY-MM-DD)
const getDateKey = (date) => date.toISOString().split('T')[0];

// Helper to get yesterday's date string
const getYesterdayKey = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateKey(yesterday);
};

/**
 * This is NOT a route handler.
 * It's a helper function called by taskController when a task is completed.
 */
const updateStreakOnTaskCompletion = async (userId, taskId) => {
  const todayKey = getDateKey(new Date());
  let streak_broken = false;

  try {
    const streak = await prisma.streak.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    if (!streak) {
      // No streak exists, create a new one
      await prisma.streak.create({
        data: {
          userId,
          taskId,
          count: 1,
          lastUpdated: new Date(),
        },
      });
      return { streak_broken: false };
    }

    // Streak exists, check last update
    const lastUpdatedKey = getDateKey(streak.lastUpdated);

    if (lastUpdatedKey === todayKey) {
      // Already completed today, do nothing
      return { streak_broken: false };
    }

    if (lastUpdatedKey === getYesterdayKey()) {
      // Streak continued, increment count
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          count: streak.count + 1,
          lastUpdated: new Date(),
        },
      });
      return { streak_broken: false };
    }

    // Streak was broken (last updated before yesterday)
    // Reset count to 1
    await prisma.streak.update({
      where: { id: streak.id },
      data: {
        count: 1,
        lastUpdated: new Date(),
      },
    });
    // Return flag to notify frontend
    return { streak_broken: true };

  } catch (error) {
    console.error("Error updating streak:", error);
    // Don't block task update, just log the streak error
    return { streak_broken: false }; 
  }
};

/**
 * ROUTE HANDLER: /api/streaks
 * Gets all per-task streaks for the logged-in user.
 */
const getStreaks = async (req, res) => {
  try {
    const streaks = await prisma.streak.findMany({
      where: { userId: req.user.id },
    });
    res.json(streaks);
  } catch (error) {
    console.error("Error fetching streaks:", error);
    res.status(500).json({ message: "Failed to get streaks" });
  }
};

/**
 * ROUTE HANDLER: /api/streaks/forgive
 * Applies a forgiveness token to a task's streak.
 */
const applyForgiveness = async (req, res) => {
  const userId = req.user.id;
  const { taskId } = req.body;

  if (!taskId) {
    return res.status(400).json({ message: "Task ID is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user.forgivenessTokens <= 0) {
      return res.status(403).json({ message: "No forgiveness tokens remaining" });
    }

    const streak = await prisma.streak.findUnique({
      where: { userId_taskId: { userId, taskId: parseInt(taskId) } },
    });

    if (!streak) {
      return res.status(404).json({ message: "No streak found for this task" });
    }

    // "Mend" the streak by pretending the last update was yesterday
    // and incrementing the count.
    const [updatedUser, updatedStreak] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { forgivenessTokens: user.forgivenessTokens - 1 },
      }),
      prisma.streak.update({
        where: { id: streak.id },
        data: {
          // This is the core logic: we restore the count and set update to now
          count: streak.count + 1, 
          lastUpdated: new Date(),
        },
      }),
    ]);

    res.json({
      message: "Streak forgiven",
      streak: updatedStreak,
      forgivenessTokens: updatedUser.forgivenessTokens,
    });

  } catch (error) {
    console.error("Error applying forgiveness:", error);
    res.status(500).json({ message: "Server error during forgiveness" });
  }
};


module.exports = {
  getStreaks,
  applyForgiveness,
  updateStreakOnTaskCompletion, // Export for taskController
};