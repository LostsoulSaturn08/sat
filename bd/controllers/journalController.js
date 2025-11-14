// bd/controllers/journalController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createJournalEntry = async (req, res) => {
  const userId = req.user.id;
  // 'mitigationPlan' comes from the request body
  const { reason, mitigationPlan, taskId } = req.body;

  if (!reason || !mitigationPlan) {
    return res.status(400).json({ message: "Reason and mitigation plan are required." });
  }

  try {
    const newEntry = await prisma.journalEntry.create({
      data: {
        userId,
        reason,
        // FIX: Map 'mitigationPlan' from the request to the 'mitigation' field
        mitigation: mitigationPlan,
        taskId: taskId ? parseInt(taskId) : null,
      },
    });
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({ message: "Server error creating journal entry" });
  }
};

// ✅ NEW FUNCTION for the activity grid
const getJournalEntries = async (req, res) => {
  const userId = req.user.id;
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: userId },
      select: {
        id: true,
        createdAt: true, // We only need the creation date
      },
    });
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({ message: "Server error fetching journal entries" });
  }
};

module.exports = {
  createJournalEntry,
  getJournalEntries, // ✅ Export the new function
};