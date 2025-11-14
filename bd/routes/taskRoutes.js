// backend/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const authenticateUser = require('../controllers/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// All /api/tasks require a valid JWT
router.use(authenticateUser);

router.get('/',  getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
