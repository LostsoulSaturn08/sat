// bd/controllers/journalController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- NEW HELPER FUNCTION ---
const getDateKey = (date) => date.toISOString().split('T')[0];

/**
 * Creates a journal entry for login, but only once per day.
 * This will mark the activity heatmap (StreakGrid) for today.
 */
const createLoginJournalEntry = async (userId) => {
  const todayKey = getDateKey(new Date());
  
  try {
    const lastLoginEntry = await prisma.journalEntry.findFirst({
      where: {
        userId: userId,
        reason: "User login" // This is a special reason for this entry
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (lastLoginEntry) {
      const lastLoginDateKey = getDateKey(lastLoginEntry.createdAt);
      if (lastLoginDateKey === todayKey) {
        // An entry for today already exists, do nothing
        return;
      }
    }

    // No login entry for today, create one
    await prisma.journalEntry.create({
      data: {
        userId: userId,
        reason: "User login",
        mitigation: "N/A", // 'mitigation' is required, so we use a placeholder
        taskId: null
      }
    });
    console.log(`✅ Created login journal entry for user ${userId}`);

  } catch (error) {
    // Log the error but don't fail the login
    console.error("🔥 Failed to create login journal entry:", error);
  }
};
// --- END OF NEW FUNCTION ---

const createJournalEntry = async (req, res) => {
  const userId = req.user.id;
  const { reason, mitigationPlan, taskId } = req.body;

  if (!reason || !mitigationPlan) {
    return res.status(400).json({ message: "Reason and mitigation plan are required." });
  }

  try {
    const newEntry = await prisma.journalEntry.create({
      data: {
        userId,
        reason,
        mitigation: mitigationPlan, // Use 'mitigationPlan' from request
        taskId: taskId ? parseInt(taskId) : null,
      },
    });
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("🔥 Error creating journal entry:", error);
    res.status(500).json({ message: "Server error creating journal entry" });
  }
};

const getJournalEntries = async (req, res) => {
  const userId = req.user.id;
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: userId },
      select: {
        id: true,
        createdAt: true, 
      },
    });
    res.status(200).json(entries);
  } catch (error) {
    console.error("🔥 Error fetching journal entries:", error);
    res.status(500).json({ message: "Server error fetching journal entries" });
  }
};

// --- NEW FUNCTION TO HANDLE APP LOAD ---
const handleAppLoad = async (req, res) => {
  try {
    await createLoginJournalEntry(req.user.id);
    res.status(200).json({ message: "App load processed." });
  } catch (error) {
    console.error("🔥 Error during app-load process:", error);
    res.status(500).json({ message: "Server error processing app load" });
  }
};
// --- END OF NEW FUNCTION ---

module.exports = {
  createJournalEntry,
  getJournalEntries,
  createLoginJournalEntry, // ✅ Export for userController
  handleAppLoad,           // ✅ Export for new route
};