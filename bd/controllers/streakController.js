const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDateKey = (date) => date.toISOString().split('T')[0];
const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDateKey(d);
};

const updateGlobalStreak = async (userId) => {
  const todayKey = getDateKey(new Date());

  try {
    let streak = await prisma.streak.findUnique({ where: { userId } });

    if (!streak) {
      await prisma.streak.create({
        data: { userId, count: 1, lastUpdated: new Date() }
      });
      return { streak_broken: false };
    }

    const lastUpdatedKey = getDateKey(streak.lastUpdated);

    if (lastUpdatedKey === todayKey) return { streak_broken: false };

    if (lastUpdatedKey === getYesterdayKey()) {
      await prisma.streak.update({
        where: { id: streak.id },
        data: { count: streak.count + 1, lastUpdated: new Date() }
      });
      return { streak_broken: false };
    }

    await prisma.streak.update({
      where: { id: streak.id },
      data: { prevCount: streak.count, count: 1, lastUpdated: new Date() }
    });
    return { streak_broken: true }; 

  } catch (error) {
    console.error("Streak update error:", error);
    return { streak_broken: false };
  }
};

const getStreaks = async (req, res) => {
  try {
    const streak = await prisma.streak.findUnique({ where: { userId: req.user.id } });
    res.json(streak ? [streak] : []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching streak" });
  }
};

const applyForgiveness = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.forgivenessTokens <= 0) return res.status(403).json({ message: "No tokens left" });

    const streak = await prisma.streak.findUnique({ where: { userId } });
    if (!streak) return res.status(404).json({ message: "No streak to forgive" });

    const restoredCount = (streak.prevCount || 0) + 1;

    const [updatedUser, updatedStreak] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { forgivenessTokens: user.forgivenessTokens - 1 } }),
      prisma.streak.update({ where: { id: streak.id }, data: { count: restoredCount } })
    ]);

    res.json({ 
      message: "Global streak forgiven", 
      forgivenessTokens: updatedUser.forgivenessTokens,
      streak: updatedStreak
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const simulateMissedDay = async (req, res) => {
  const userId = req.user.id;
  const { days, count } = req.body; 
  const daysToSkip = days ? parseInt(days) : 2;
  const newCount = count ? parseInt(count) : undefined;

  try {
    let streak = await prisma.streak.findUnique({ where: { userId } });
    if (!streak) streak = await prisma.streak.create({ data: { userId, count: 1, lastUpdated: new Date() } });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - daysToSkip);

    const dataToUpdate = { lastUpdated: pastDate };
    if (newCount !== undefined) dataToUpdate.count = newCount;

    const updated = await prisma.streak.update({ where: { id: streak.id }, data: dataToUpdate });
    res.json({ message: `Rewound ${daysToSkip} days.`, streak: updated });
  } catch (error) {
    res.status(500).json({ message: "Error simulating missed day" });
  }
};

// ✅ UPDATED: Accepts reason/mitigation and saves entry for specific date
const recoverStreakDay = async (req, res) => {
  const userId = req.user.id;
  const { date, reason, mitigation } = req.body;

  if (!date || !reason || !mitigation) return res.status(400).json({ message: "All fields required." });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.forgivenessTokens <= 0) return res.status(403).json({ message: "No tokens left." });

    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const existingEntry = await prisma.journalEntry.findFirst({
      where: { userId: userId, createdAt: { gte: targetDate, lt: nextDate } }
    });

    if (existingEntry) return res.status(400).json({ message: "Day already has activity." });

    const streak = await prisma.streak.findUnique({ where: { userId } });
    
    const [updatedUser, updatedStreak] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { forgivenessTokens: { decrement: 1 } } }),
      prisma.streak.update({ where: { id: streak.id }, data: { count: { increment: 1 } } }),
      prisma.journalEntry.create({
        data: {
          userId: userId,
          reason: reason,          // ✅ User input
          mitigation: mitigation,  // ✅ User input
          createdAt: targetDate    // ✅ Back-dated
        }
      })
    ]);

    res.json({ 
      message: "Day recovered!", 
      tokens: updatedUser.forgivenessTokens, 
      streakCount: updatedStreak.count 
    });

  } catch (error) {
    console.error("Recovery error:", error);
    res.status(500).json({ message: "Server error during recovery." });
  }
};

module.exports = { getStreaks, applyForgiveness, updateGlobalStreak, simulateMissedDay, recoverStreakDay };