

// src/JournalModal.jsx (NEW FILE)
import React, { useState } from 'react';
import axios from 'axios';
import { FaHeartBroken } from 'react-icons/fa';

// This is the Journal Modal Component
const JournalModal = ({ task, token, userProfile, onClose, onAuthError, onForgiveSuccess }) => {
  const [reason, setReason] = useState("");
  const [mitigation, setMitigation] = useState("");

  const handleSubmit = async (e) => {
    // This allows handleSubmit to be called by the form or by handleForgive
    if (e) e.preventDefault(); 
    
    if (!reason || !mitigation) {
      alert("Please fill out both fields.");
      return false; // Indicate failure
    }
    
    try {
      // 1. Save the journal entry
      await axios.post(
        'http://localhost:5000/api/journal',
        { reason, mitigationPlan: mitigation, taskId: task.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return true; // Indicate success

    } catch (err) {
      if (err.response && err.response.status === 401) onAuthError();
      alert("Failed to save journal entry.");
      return false; // Indicate failure
    }
  };
  
  const handleSaveAndClose = async (e) => {
    const success = await handleSubmit(e);
    if (success) {
      onClose(); // Close modal only after successful submission
    }
  };

  const handleForgive = async () => {
    try {
      // 1. First, ensure journal is filled out and save it
      const journalSuccess = await handleSubmit(null); // Pass null to skip event logic
      if (!journalSuccess) return; // Stop if journal fails

      // 2. Call the forgive endpoint
      const response = await axios.post(
        'http://localhost:5000/api/streaks/forgive',
        { taskId: task.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Update parent state with new token count
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

        {/* Use onSaveAndClose for the form submission */}
        <form onSubmit={handleSaveAndClose}>
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