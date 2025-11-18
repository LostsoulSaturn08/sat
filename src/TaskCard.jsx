import React, { useState, useEffect } from "react"; 
import axios from "axios";
import { FaCheck, FaTrashAlt, FaPlus, FaMinus } from "react-icons/fa";

const TaskCard = ({ task, token, onRemove, onAuthError }) => {
  if (!task) return null;

  const { id, text, deadline, total } = task;
  const [currentProgress, setCurrentProgress] = useState(task.progress);
  const [pct, setPct] = useState(total > 0 ? (task.progress / total) * 100 : 0);
  const [isComplete, setIsComplete] = useState(total > 0 ? task.progress >= total : false);

  const due = deadline ? new Date(deadline) : null;
  const isOverdue = due && new Date() > due && !isComplete;

  const updateProgress = async (newPct) => {
    if (total <= 0) return; 
    const newProgress = Math.floor((Math.max(0, Math.min(100, newPct)) / 100) * total);
    const isNowComplete = newProgress >= total;
    const finalProgress = isNowComplete ? total : newProgress;

    setPct((finalProgress / total) * 100);
    setCurrentProgress(finalProgress);
    setIsComplete(isNowComplete);

    try {
      await axios.patch(`http://localhost:5000/api/tasks/${id}`, 
        { progress: finalProgress, completed: isNowComplete }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) { if (err.response?.status === 401) onAuthError(); }
  };
  
  const removeTask = async () => {
    if (!window.confirm("Remove this quest?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      onRemove(task);
    } catch (err) { if (err.response?.status === 401) onAuthError(); }
  };

  const inc = () => total > 0 ? updateProgress(Math.min(pct + 100 / total, 100)) : null;
  const dec = () => total > 0 ? updateProgress(Math.max(pct - 100 / total, 0)) : null;

  return (
    <div className={`p-6 shadow-2xl rounded-2xl ${isComplete ? "bg-gray-800" : "bg-gray-900"} text-white border-2 ${isOverdue ? "border-red-500/50" : isComplete ? "border-green-500/50" : "border-primary-500/50"} transition-all duration-500 hover:scale-[1.01] flex flex-col`}>
      <div className="flex justify-between items-start mb-3">
        <h2 className={`text-xl font-bold mr-4 ${isComplete ? "text-green-400 line-through" : "text-gray-200"}`}>{text}</h2>
        {isComplete && <FaCheck className="text-green-500 text-2xl" />}
      </div>
      
      <p className={`text-sm ${isOverdue ? "text-red-400" : "text-gray-400"} mb-4`}>Due: {due ? due.toDateString() : "No deadline"}</p>

      <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div className={`h-full ${isOverdue ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-primary-500"}`} style={{ width: `${pct}%` }} />
      </div>
      
      <p className="mt-2 text-gray-400 font-semibold mb-4">Progress: {pct.toFixed(0)}% ({currentProgress}/{total})</p>
      
      <div className="mt-auto"> 
        <div className="mt-4 flex justify-between gap-2">
          <button onClick={dec} className="px-3 py-2 bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center w-full"><FaMinus /></button>
          <button onClick={inc} disabled={isComplete} className="px-3 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 flex items-center justify-center w-full disabled:opacity-50"><FaPlus /></button>
        </div>
        <button onClick={removeTask} className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 font-semibold"><FaTrashAlt /> Remove Quest</button>
      </div>
    </div>
  );
};

export default TaskCard;