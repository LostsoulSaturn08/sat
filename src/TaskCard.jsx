// src/TaskCard.jsx (FIXED)
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheck, FaArchive, FaUndo, FaTrashAlt, FaPlus, FaMinus } from "react-icons/fa";
// ✅ Import the new, separate JournalModal component
import JournalModal from "./JournalModal"; 

const TaskCard = ({ task, token, onArchive, onRemove, onUnarchive, onAuthError, userProfile }) => {
  if (!task) return null;

  const { id, text, deadline, progress, total } = task;
  const initialPct = total > 0 ? (progress / total) * 100 : 0;
  
  // ✅ Fix: Use state for completion status
  const [isComplete, setIsComplete] = useState(initialPct >= 100);
  const [pct, setPct] = useState(initialPct);
  const [deleted, setDeleted] = useState(false);
  const [archived, setArchived] = useState(task.archived || false);
  const [showJournal, setShowJournal] = useState(false);

  const due = deadline ? new Date(deadline) : null;
  const isOverdue = due && new Date() > due && !isComplete;

  // ✅ Sync with task prop changes
  useEffect(() => {
    const newPct = task.total > 0 ? (task.progress / task.total) * 100 : 0;
    setPct(newPct);
    setIsComplete(newPct >= 100);
    setArchived(task.archived || false);
  }, [task]);

  const saveToBackend = async (data) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/tasks/${id}`,
        { ...data, taskId: id }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Check for the streak_broken flag
      if (response.data.streak_broken) {
        setShowJournal(true); // Open the journal modal
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
          onAuthError();
      }
    }
  };

  const deleteOnBackend = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/tasks/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      if (err.response && err.response.status === 401) {
          onAuthError();
      }
    }
  };

  const updateProgress = async (newPct) => {
    const newProgress = Math.round((newPct / 100) * total);
    const newIsComplete = newProgress >= total;
    
    setPct(newPct);
    setIsComplete(newIsComplete); // Update state immediately
    
    await saveToBackend({ progress: newProgress, completed: newIsComplete });
  };

  const inc = () => updateProgress(Math.min(pct + 100 / total, 100));
  const dec = () => updateProgress(Math.max(pct - 100 / total, 0));

  const removeTask = async () => {
    setDeleted(true);
    await deleteOnBackend();
    onRemove?.(task);
  };

  const archiveTask = async () => {
    await saveToBackend({ archived: true });
    setArchived(true);
    onArchive?.({ ...task, archived: true }); // Pass updated task
  };

  const unarchiveTask = async () => {
    await saveToBackend({ archived: false });
    setArchived(false);
    onUnarchive?.({ ...task, archived: false }); // Pass updated task
  };

  if (deleted) return null;

  const progressColor = isOverdue ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-primary-500";
  const borderColor = isOverdue ? "border-red-500/50" : isComplete ? "border-green-500/50" : "border-primary-500/50";
  const cardBackground = isComplete ? "bg-gray-800" : "bg-gray-900";

  return (
    <>
      {showJournal && (
        <JournalModal
          task={task}
          token={token}
          userProfile={userProfile}
          onClose={() => setShowJournal(false)}
          onAuthError={onAuthError}
          onForgiveSuccess={(updatedUser) => {
            // This is the "soft refresh" to update token count
            onAuthError(); 
            setShowJournal(false);
          }}
        />
      )}

      <div className={`p-6 shadow-2xl rounded-2xl ${cardBackground} text-white border-2 ${borderColor} transition-all duration-500 hover:scale-[1.01] flex flex-col`}>
        <div className="flex justify-between items-start mb-3">
          <h2 className={`text-xl font-bold mr-4 ${isComplete ? "text-green-400 line-through" : "text-gray-200"}`}>{text}</h2>
          {isComplete && <FaCheck className="text-green-500 text-2xl" />}
        </div>
        
        <p className={`text-sm ${isOverdue ? "text-red-400" : "text-gray-400"} mb-4`}>
          Due: {due ? due.toDateString() : "No deadline"}
          {isOverdue && <span className="font-bold ml-1"> (OVERDUE)</span>}
        </p>

        <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full ${progressColor} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-gray-400 font-semibold mb-4">
          Progress: {pct.toFixed(0)}% ({progress}/{total})
        </p>
        
        <div className="mt-auto"> 
          <div className="mt-4 flex justify-between gap-2">
            <button 
              onClick={dec} 
              disabled={isComplete}
              className="px-3 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center w-full disabled:opacity-50"
            >
              <FaMinus />
            </button>
            <button 
              onClick={inc} 
              disabled={isComplete}
              className="px-3 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center w-full disabled:opacity-50"
            >
              <FaPlus /> 
            </button>
          </div>

          {isComplete && (
            <div className="mt-4 flex flex-col gap-2">
              {!archived ? (
                <button onClick={archiveTask} className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 font-semibold">
                  <FaArchive /> Archive Quest
                </button>
              ) : (
                <button onClick={unarchiveTask} className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 font-semibold">
                  <FaUndo /> Unarchive Quest
                </button>
              )}
              <button onClick={removeTask} className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 font-semibold">
                <FaTrashAlt /> Remove Quest
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskCard;