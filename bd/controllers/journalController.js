const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { updateGlobalStreak } = require('./streakController'); 

const createLoginJournalEntry = async (userId) => {
  const todayKey = new Date().toISOString().split('T')[0];
  try {
    const lastLoginEntry = await prisma.journalEntry.findFirst({
      where: { userId: userId, reason: "User login" },
      orderBy: { createdAt: 'desc' }
    });

    if (lastLoginEntry) {
      const lastLoginDateKey = lastLoginEntry.createdAt.toISOString().split('T')[0];
      if (lastLoginDateKey === todayKey) return;
    }

    await prisma.journalEntry.create({
      data: { userId, reason: "User login", mitigation: "N/A", taskId: null }
    });
  } catch (error) {
    console.error("Login journal error:", error);
  }
};

const createJournalEntry = async (req, res) => {
  const userId = req.user.id;
  const { reason, mitigationPlan } = req.body;

  if (!reason || !mitigationPlan) return res.status(400).json({ message: "Missing fields" });

  try {
    const newEntry = await prisma.journalEntry.create({
      data: { userId, reason, mitigation: mitigationPlan },
    });
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getJournalEntries = async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, reason: true, mitigation: true },
    });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Checks streak on app load
const handleAppLoad = async (req, res) => {
  try {
    await createLoginJournalEntry(req.user.id);
    const result = await updateGlobalStreak(req.user.id);
    res.status(200).json({ message: "App loaded", streak_broken: result.streak_broken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createJournalEntry, getJournalEntries, createLoginJournalEntry, handleAppLoad };