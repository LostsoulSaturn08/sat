import React, { useState, useEffect } from "react";
import Profile from "./Profile";
import Login from "./Login";
import TaskCard from "./TaskCard";
import axios from "axios";
import TaskCreationForm from "./TaskCreationForm";
import StreakGrid from "./StreakGrid";
import JournalModal from "./JournalModal"; 
import './JournalModal.css'; 
import './StreakGrid.css';

const getInitialUserState = () => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  if (storedUser && storedToken) {
    try {
      return { loggedIn: true, profile: { ...JSON.parse(storedUser), token: storedToken } };
    } catch (e) {
      localStorage.clear();
    }
  }
  return { loggedIn: false, profile: null };
};

const ProgressTracker = () => {
  const [tasks, setTasks] = useState([]);
  const { loggedIn: initLog, profile: initProf } = getInitialUserState();
  const [profile, setProfile] = useState(initProf);
  const [loggedIn, setLoggedIn] = useState(initLog);
  const [journalUpdateKey, setJournalUpdateKey] = useState(0);
  const [showGlobalModal, setShowGlobalModal] = useState(false);

  const handleLogout = () => { setLoggedIn(false); setProfile(null); localStorage.clear(); };

  const handleLogin = (data) => {
    setProfile({ ...data.user, token: data.token });
    setLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
  };

  const refreshData = () => setJournalUpdateKey(k => k + 1);

  const handleUserUpdate = (updates) => {
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    localStorage.setItem('user', JSON.stringify(updatedProfile));
    refreshData();
  };

  useEffect(() => {
    if (!loggedIn || !profile?.token) return;
    const initApp = async () => {
      try {
        const streakRes = await axios.post("http://localhost:5000/api/journal/app-load", {}, { headers: { Authorization: `Bearer ${profile.token}` } });
        if (streakRes.data.streak_broken) setShowGlobalModal(true);
        const taskRes = await axios.get("http://localhost:5000/api/tasks", { headers: { Authorization: `Bearer ${profile.token}` } });
        setTasks(taskRes.data);
        refreshData();
      } catch (err) { if (err.response && err.response.status === 401) handleLogout(); }
    };
    initApp();
  }, [loggedIn]);

  return (
    <div className="relative p-8 bg-gray-900 text-white min-h-screen font-sans">
      {showGlobalModal && (
        <JournalModal
          token={profile.token}
          userProfile={profile}
          onClose={() => setShowGlobalModal(false)}
          onAuthError={handleLogout}
          onForgiveSuccess={(updatedUser) => {
            handleUserUpdate(updatedUser);
            setShowGlobalModal(false);
          }}
          onJournalUpdate={refreshData}
        />
      )}
      <div className="flex justify-between items-center mb-6 border-b border-primary-500/50 pb-4">
        <h1 className="text-5xl font-extrabold text-primary-500">Progress Tracker</h1>
        {loggedIn && <Profile user={profile} onLogout={handleLogout} onAuthError={handleLogout} />}
      </div>
      {!loggedIn ? <Login onLogin={handleLogin} /> : (
        <>
          {/* ✅ Passes 'profile' to Grid so Modal can see token count */}
          <StreakGrid 
            token={profile.token} 
            userProfile={profile} 
            onAuthError={handleLogout} 
            journalUpdateKey={journalUpdateKey} 
            onUpdateUser={handleUserUpdate} 
          />
          <TaskCreationForm token={profile.token} onAddTask={t => setTasks(p => [...p, t])} onAuthError={handleLogout} />
          <div className="grid grid-cols-1 sm:g:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} token={profile.token} onRemove={t => setTasks(p => p.filter(x => x.id !== t.id))} onAuthError={handleLogout} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressTracker;