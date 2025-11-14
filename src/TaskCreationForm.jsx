// src/TaskCreationForm.jsx (NEW FILE)
import React, { useState } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const TaskCreationForm = ({ token, onAddTask, onAuthError }) => {
  const [newTask, setNewTask] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [taskDuration, setTaskDuration] = useState(1);

  const addTaskHandler = async () => {
    if (!newTask.trim() || taskDuration < 1) return;
    if (!token) return onAuthError(); 

    const payload = {
      text: newTask,
      deadline: deadline.toISOString(),
      progress: 0,
      total: taskDuration,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/tasks",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAddTask(response.data); // Pass the new task back to parent
    } catch (error) {
      if (error.response && error.response.status === 401) {
        onAuthError();
      }
    }
    setNewTask("");
    setTaskDuration(1);
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-10 items-start p-6 bg-gray-800 rounded-xl border border-primary-500/50">
        {/* Input Fields */}
        <div className="flex-grow flex flex-col gap-4" style={{ flexBasis: '300px' }}>
          <input
            type="text"
            className="p-3 text-white rounded-lg border border-gray-600 bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter new quest..."
          />
          <input
            type="number"
            min="1"
            className="p-3 text-white rounded-lg border border-gray-600 bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
            value={taskDuration}
            onChange={(e) => setTaskDuration(parseInt(e.target.value, 10) || 1)}
            placeholder="Duration/Iterations"
          />
        </div>

        {/* Calendar */}
        <div className="flex-grow" style={{ flexBasis: '300px' }}>
          <div className="border border-primary-500/50 bg-gray-900 rounded-lg shadow-lg">
            <Calendar
              onChange={setDeadline}
              value={deadline}
              className="w-full text-lg font-bold rounded-lg"
            />
          </div>
        </div>
        
        {/* Button */}
        <button
          className="bg-primary-500 px-6 py-3 rounded-lg shadow-lg hover:bg-primary-600 transition-colors font-semibold w-full sm:w-auto"
          onClick={addTaskHandler}
        >
          Add Quest
        </button>
      </div>
      
      {/* Calendar Override Styles */}
      <style>{`
        .react-calendar { background-color: #111827 !important; color: white !important; border-radius: 8px; border: none !important; }
        .react-calendar__tile { color: white !important; }
        .react-calendar__tile:hover { background-color: #374151 !important; }
        .react-calendar__tile--active { background-color: #D600FF !important; }
        .react-calendar__tile--now { background-color: #4B5563 !important; }
        .react-calendar__navigation button { color: #D600FF !important; }
        .react-calendar__month-view__weekdays__weekday { color: #D600FF !important; }
      `}</style>
    </>
  );
};

export default TaskCreationForm;