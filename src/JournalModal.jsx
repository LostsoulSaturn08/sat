// lostsoulsaturn08/sat/sat-019c4325342575340607add8b5a7fff4fb04e73f/src/JournalModal.jsx
// src/JournalModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { FaHeartBroken } from 'react-icons/fa';

// ✅ Accept onJournalUpdate prop
const JournalModal = ({ task, token, userProfile, onClose, onAuthError, onForgiveSuccess, onJournalUpdate }) => {
  const [reason, setReason] = useState("");
  const [mitigation, setMitigation] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); 
    
    if (!reason || !mitigation) {
      alert("Please fill out both fields.");
      return false;
    }
    
    try {
      await axios.post(
        'http://localhost:5000/api/journal',
        { reason, mitigationPlan: mitigation, taskId: task.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onJournalUpdate?.(); // ✅ Call the update function
      return true;

    } catch (err) {
      if (err.response && err.response.status === 401) onAuthError();
      alert("Failed to save journal entry.");
      return false;
    }
  };
  
  const handleSaveAndClose = async (e) => {
    const success = await handleSubmit(e);
    if (success) {
      onClose(); 
    }
  };

  const handleForgive = async () => {
    try {
      // 1. Save journal
      const journalSuccess = await handleSubmit(null); 
      if (!journalSuccess) return; 
      // onJournalUpdate() is already called inside handleSubmit()

      // 2. Call forgive endpoint
      const response = await axios.post(
        'http://localhost:5000/api/streaks/forgive',
        { taskId: task.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Update parent state
      onForgiveSuccess({ ...userProfile, forgivenessTokens: response.data.forgivenessTokens });

    } catch (err) {
      if (err.response && err.response.status === 401) onAuthError();
      alert(err.response?.data?.message || "Failed to use forgiveness.");
    }
  };

  return (
    <div className="journal-modal-backdrop">
      <div className="journal-modal-content">
        <FaHeartBroken className="text-red-500 text-5xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-center mb-2">Streak Broken for:</h2>
        <h3 className="text-xl font-semibold text-primary-500 text-center mb-6">{task.text}</h3>
        
        <p className="text-gray-300 mb-4 text-center">
          It's okay! Take a moment to reflect. This helps you learn and improve.
        </p>

        <form onSubmit={handleSaveAndClose}>
          {/* ... (rest of the form is unchanged) ... */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-1">What was the main reason you missed this quest?</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              rows="3"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-1">What's one thing you can do to prevent this next time?</label>
            <textarea
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              rows="3"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all font-semibold"
            >
              Save Journal & Reset Streak
            </button>

            {userProfile?.forgivenessTokens > 0 && (
              <button 
                type="button"
                onClick={handleForgive}
                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-all font-semibold"
              >
                Use Forgiveness Token ({userProfile.forgivenessTokens} left)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-all font-semibold mt-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalModal;