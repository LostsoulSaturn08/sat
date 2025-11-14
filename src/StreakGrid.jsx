// src/StreakGrid.jsx (CORRECTED CODE)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFire } from 'react-icons/fa';

// This is the StreakGrid component.
// It receives the list of *all* tasks as a prop.
const StreakGrid = ({ tasks, token, onAuthError }) => {
  const [streaks, setStreaks] = useState({});

  useEffect(() => {
    if (!token) return;

    const fetchStreaks = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/streaks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Convert streak array to a map for easy lookup by taskId
        const streakMap = res.data.reduce((acc, streak) => {
          acc[streak.taskId] = streak;
          return acc;
        }, {});
        setStreaks(streakMap);

      } catch (err) {
        if (err.response && err.response.status === 401) {
          onAuthError();
        }
      }
    };

    fetchStreaks();
  }, [token, tasks]); // Refetch if token or the list of tasks changes

  // Filter for tasks that are NOT archived AND have a streak count > 0
  const tasksWithStreaks = tasks.filter(task => 
    !task.archived && 
    streaks[task.id] && 
    streaks[task.id].count > 0
  );

  if (tasksWithStreaks.length === 0) {
    return null; // Don't render anything if no active streaks
  }

  return (
    <div className="mb-10 p-6 bg-gray-800 rounded-xl border border-primary-500/50">
      <h2 className="text-3xl font-bold text-primary-500 mb-4">Current Streaks 🔥</h2>
      <div className="flex flex-wrap gap-4">
        {tasksWithStreaks.map(task => {
          const streak = streaks[task.id];
          return (
            <div 
              key={task.id} 
              className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center gap-3"
            >
              <FaFire className="text-orange-500 text-2xl" />
              <div>
                <span className="font-semibold text-white">{task.text}</span>
                <span className="text-lg font-bold text-orange-400 ml-2">{streak.count} day{streak.count > 1 ? 's' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakGrid;