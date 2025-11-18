const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
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
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { taskId: _x, ...dataToUpdate } = req.body;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate, 
    });
    
    return res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    await prisma.task.delete({ where: { id: taskId } });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };