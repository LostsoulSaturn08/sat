// src/ProgressTracker.jsx
import React, { useState, useEffect } from "react";
import Profile from "./Profile";
import Login from "./Login";
import TaskCard from "./TaskCard";
import axios from "axios";
import TaskCreationForm from "./TaskCreationForm";
import StreakGrid from "./StreakGrid";
import './JournalModal.css'; 
import './StreakGrid.css';

const getInitialUserState = () => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  if (storedUser && storedToken) {
    try {
      const user = JSON.parse(storedUser);
      const profile = { 
        ...user, 
        token: storedToken,
        name: user.name || user.username,
        forgivenessTokens: user.forgivenessTokens !== undefined ? user.forgivenessTokens : 2 
      };
      return { loggedIn: true, profile: profile };
    } catch (e) {
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
  const [showArchived, setShowArchived] = useState(false);
  
  // This key will be "bumped" to trigger a refresh in StreakGrid
  const [journalUpdateKey, setJournalUpdateKey] = useState(0);

  const handleLogout = () => {
    setLoggedIn(false);
    setProfile(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const handleProfileRefresh = () => {
    const token = localStorage.getItem('token');
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && token) {
         setProfile({ 
           ...user, 
           token: token,
           name: user.name || user.username,
           forgivenessTokens: user.forgivenessTokens !== undefined ? user.forgivenessTokens : 2 
         });
         return; 
      }
    } catch (e) { /* Corrupted user data */ }
    
    handleLogout();
  };
  
  const handleJournalUpdate = () => {
    setJournalUpdateKey(prevKey => prevKey + 1);
  };

  const handleLogin = (data) => {
    const { user, token } = data;
    const fullProfile = { 
      ...user, 
      token, 
      name: user.name || user.username,
      // Also apply default forgiveness tokens here
      forgivenessTokens: user.forgivenessTokens !== undefined ? user.forgivenessTokens : 2
    };
    setProfile(fullProfile);
    setLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    
    // --- THIS IS THE FIX ---
    // Tell the StreakGrid to refetch its data now that we are logged in
    setJournalUpdateKey(prevKey => prevKey + 1);
    // --- END OF FIX ---
  };

  const addTaskHandler = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleRemove = (removedTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== removedTask.id));
  };

  const handleArchive = (archivedTask) => {
    setTasks((prev) => prev.map(t =>
      t.id === archivedTask.id ? archivedTask : t
    ));
  };

  const handleUnarchive = (unarchivedTask) => {
     setTasks((prev) => prev.map(t =>
      t.id === unarchivedTask.id ? unarchivedTask : t
    ));
  };

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
          handleLogout();
        }
      }
    };
    
    fetchTasks();
  }, [loggedIn, profile?.token]); 
  
  useEffect(() => {
    if (!loggedIn) {
      setTasks([]);
    }
  }, [loggedIn]);

  const tasksToDisplay = tasks.filter(task =>
    showArchived ? task.archived : !task.archived
  );

  return (
    <div className="relative p-8 bg-gray-900 text-white min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6 border-b border-primary-500/50 pb-4">
        <h1 className="text-5xl font-extrabold text-primary-500">
          Progress Tracker
        </h1>
        {loggedIn && (
          <Profile
            user={profile}
            onLogout={handleLogout}
            onAuthError={handleProfileRefresh}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
          />
        )}
      </div>

      {!loggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <StreakGrid 
            token={profile.token}
            onAuthError={handleProfileRefresh}
            journalUpdateKey={journalUpdateKey} // Pass the key
          />

          <TaskCreationForm
            token={profile.token}
            onAddTask={addTaskHandler}
            onAuthError={handleProfileRefresh}
          />
          
          <div className="grid grid-cols-1 sm:g:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tasksToDisplay.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                token={profile.token}
                onRemove={handleRemove}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onAuthError={handleProfileRefresh}
                userProfile={profile}
                onJournalUpdate={handleJournalUpdate} // Pass update function
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
    </div>
  );
};

export default ProgressTracker;