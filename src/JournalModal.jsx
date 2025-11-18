import React, { useState } from 'react';
import axios from 'axios';
import { FaHeartBroken, FaMagic } from 'react-icons/fa';

const JournalModal = ({ token, userProfile, onClose, onAuthError, onForgiveSuccess, onJournalUpdate, recoveryDate }) => {
  const [reason, setReason] = useState("");
  const [mitigation, setMitigation] = useState("");

  // Different Logic for "Today's Break" vs "Past Recovery"
  const isRecovery = !!recoveryDate;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); 
    if (!reason || !mitigation) return alert("Please fill out both fields.");
    
    try {
      if (isRecovery) {
        // ✅ Recovery Mode: Calls the recover endpoint
        const res = await axios.post(
          'http://localhost:5000/api/streaks/recover',
          { date: recoveryDate, reason, mitigation },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Call success callback with new token count
        onForgiveSuccess({ forgivenessTokens: res.data.tokens }); 
      } else {
        // ✅ Normal Mode: Just saves journal (Streak break handled separately)
        await axios.post(
          'http://localhost:5000/api/journal',
          { reason, mitigationPlan: mitigation }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onJournalUpdate?.();
        onClose(); // Close immediately if just saving
      }
    } catch (err) {
      if (err.response && err.response.status === 401) onAuthError();
      else alert(err.response?.data?.message || "Failed to save.");
    }
  };
  
  // Only used in Normal Mode (Today)
  const handleTodayForgive = async () => {
    if (!reason || !mitigation) return alert("Please fill out journal first.");
    
    // 1. Save Journal
    try {
        await axios.post('http://localhost:5000/api/journal', { reason, mitigationPlan: mitigation }, { headers: { Authorization: `Bearer ${token}` } });
        onJournalUpdate?.();
    } catch(e) { return alert("Failed to save journal"); }

    // 2. Call Forgive Endpoint
    try {
        const response = await axios.post('http://localhost:5000/api/streaks/forgive', {}, { headers: { Authorization: `Bearer ${token}` } });
        onForgiveSuccess({ ...userProfile, forgivenessTokens: response.data.forgivenessTokens });
    } catch (err) { alert("Failed to use forgiveness."); }
  };

  return (
    <div className="journal-modal-backdrop">
      <div className="journal-modal-content">
        {isRecovery ? (
            <FaMagic className="text-indigo-500 text-5xl mx-auto mb-4" />
        ) : (
            <FaHeartBroken className="text-red-500 text-5xl mx-auto mb-4" />
        )}
        
        <h2 className="text-2xl font-bold text-center mb-2">
            {isRecovery ? `Recovering: ${recoveryDate}` : "Global Streak Broken!"}
        </h2>
        
        <p className="text-gray-300 mb-4 text-center">
          {isRecovery 
            ? "Use a token to fill this missing day. Write a note about what happened." 
            : "You missed your goal. Reflect to get back on track."}
        </p>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-1">Reason for missing?</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" rows="2" required />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-1">How to fix next time?</label>
            <textarea value={mitigation} onChange={(e) => setMitigation(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" rows="2" required />
          </div>

          <div className="flex flex-col gap-3">
            {/* Button Logic */}
            {isRecovery ? (
                <button 
                    onClick={(e) => handleSubmit(e)}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold"
                >
                    Use Token & Recover Day
                </button>
            ) : (
                <>
                    <button onClick={handleSubmit} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
                        Save Journal & Reset Streak
                    </button>

                    {userProfile?.forgivenessTokens > 0 && (
                    <button onClick={handleTodayForgive} className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold">
                        Use Token to Restore ({userProfile.forgivenessTokens} left)
                    </button>
                    )}
                </>
            )}

            <button onClick={onClose} className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalModal;