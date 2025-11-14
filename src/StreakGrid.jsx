// src/ProgressTracker.jsx (Updated from w1.jsx)

import React, { useState, useEffect } from "react";
import Profile from "./Profile";
import Login from "./Login";
import TaskCard from "./TaskCard";
import axios from "axios";
// ✅ NEW: Import the separated form
import TaskCreationForm from "./TaskCreationForm"; 
// ✅ NEW: Import the Streak Grid
import StreakGrid from "./components/StreakGrid"; 

// Helper function to get initial state from localStorage
const getInitialUserState = () => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  if (storedUser && storedToken) {
    try {
      const user = JSON.parse(storedUser);
      const profile = { ...user, token: storedToken };
      return { loggedIn: true, profile: profile };
    } catch (e) {
      // Handle corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
  return { loggedIn: false, profile: null };
};

const ProgressTracker = () => {
  const [tasks, setTasks] = useState([]);
  const initialUserState = getInitialUserState();
  const [profile, setProfile] = useState(initialUserState.profile);
  const [loggedIn, setLoggedIn] = useState(initialUserState.loggedIn);
  
  // ✅ NEW: State for toggling archived tasks (passed to Profile)
  const [showArchived, setShowArchived] = useState(false);

  // Logout/Auth error handler
  const handleAuthError = () => {
    setLoggedIn(false);
    setProfile(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Login handler
  const handleLogin = (data) => {
    const { user, token } = data;
    setProfile({ ...user, token });
    setLoggedIn(true);
  };

  // ✅ NEW: Simplified handler; logic is in TaskCreationForm
  const addTaskHandler = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  // Handler passed to TaskCard
  const handleRemove = (removedTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== removedTask.id));
  };

  // Handler passed to TaskCard
  const handleArchive = (archivedTask) => {
    setTasks((prev) => prev.map(t => 
      t.id === archivedTask.id ? { ...t, archived: true } : t
    ));
  };

  // Handler passed to TaskCard
  const handleUnarchive = (unarchivedTask) => {
     setTasks((prev) => prev.map(t => 
      t.id === unarchivedTask.id ? { ...t, archived: false } : t
    ));
  };

  // Effect to fetch tasks when user logs in
  useEffect(() => {
    if (!loggedIn || !profile?.token) return;

    const fetchTasks = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/tasks", {
          headers: { Authorization: `Bearer ${profile.token}` },
        });
        setTasks(res.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          handleAuthError(); // Log out if token is bad
        }
      }
    };
    
    fetchTasks();
  }, [profile?.token]); // Re-run if token changes
  
  // Effect to clear tasks on logout
  useEffect(() => {
    if (!loggedIn) {
      setTasks([]);
    }
  }, [loggedIn]);

  // ✅ NEW: Logic to display active or archived tasks
  const tasksToDisplay = tasks.filter(task => 
    showArchived ? task.archived : !task.archived
  );

  return (
    // ✅ NEW: Applied Color Feature (bg-gray-900, text-primary-500)
    <div className="relative p-8 bg-gray-900 text-white min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6 border-b border-primary-500/50 pb-4">
        <h1 className="text-5xl font-extrabold text-primary-500">
          Progress Tracker
        </h1>
        {loggedIn && (
          <Profile
            user={profile}
            onLogout={handleAuthError} 
            onAuthError={handleAuthError} 
            showArchived={showArchived}
            setShowArchived={setShowArchived}
          />
        )}
      </div>

      {!loggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          {/* ✅ 1. STREAK GRID COMPONENT ADDED */}
          <StreakGrid 
            token={profile.token} 
            onAuthError={handleAuthError} 
          />
        
          {/* ✅ 2. TASK CREATION MOVED TO ITS OWN COMPONENT */}
          <TaskCreationForm 
            token={profile.token}
            onAddTask={addTaskHandler} 
            onAuthError={handleAuthError}
          />
          
          {/* ✅ 3. TASK LIST GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tasksToDisplay.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                token={profile.token}
                onRemove={handleRemove}
                onArchive={handleArchive}   
                onUnarchive={handleUnarchive} 
                onAuthError={handleAuthError} 
              />
            ))}
            {tasksToDisplay.length === 0 && (
                <p className="text-gray-500 text-lg col-span-full text-center py-10">
                    No {showArchived ? "archived" : "active"} quests found.
                </p>
            )}
          </div>
        </>
      )}

      {/* Calendar styles are now in TaskCreationForm, so we can remove them from here */}
      <style>{`
        /* Minimal global styles if needed */
      `}</style>
    </div>
  );
};

export default ProgressTracker;