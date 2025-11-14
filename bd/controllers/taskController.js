// bd/controllers/taskController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// ✅ Import the streak update function
const { updateStreakOnTaskCompletion } = require('./streakController');

const createTask = async (req, res) => {
  try {
    const { text, completed, deadline, progress, total } = req.body;
    const created = await prisma.task.create({
      data: {
        text,
        completed,
        deadline: new Date(deadline),
        progress,
        total,
        userId: req.user.id,
      },
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error('🔥 createTask error:', err);
    return res.status(500).json({ message: 'Server error creating task' });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { deadline: 'asc' },
    });
    return res.json(tasks);
  } catch (err) {
    console.error('🔥 getTasks error:', err);
    return res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    
    // ✅ Handle streak logic *before* updating the task
    let streakStatus = {};
    if (req.body.completed === true) {
      streakStatus = await updateStreakOnTaskCompletion(req.user.id, taskId);
    }
    
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: req.body,
    });
    
    // ✅ Send back both the updated task and the streak status
    return res.json({ ...updated, ...streakStatus });

  } catch (err) {
    console.error('🔥 updateTask error:', err);
    return res.status(500).json({ message: 'Server error updating task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    
    // ✅ Also delete associated streak and journal entries
    await prisma.$transaction([
      prisma.journalEntry.deleteMany({ where: { taskId: taskId } }),
      prisma.streak.deleteMany({ where: { taskId: taskId } }),
      prisma.task.delete({ where: { id: taskId } })
    ]);
    
    return res.status(204).send();
  } catch (err) {
    console.error('🔥 deleteTask error:', err);
    return res.status(500).json({ message: 'Server error deleting task' });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };