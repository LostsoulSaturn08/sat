import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import { FaMagic, FaTimes } from 'react-icons/fa';
import JournalModal from './JournalModal'; // ✅ Import Modal

const getAllDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate).toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const StreakGrid = ({ token, userProfile, onAuthError, journalUpdateKey, onUpdateUser }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [recoveryMode, setRecoveryMode] = useState(false);
  
  // ✅ Modal State for Recovery
  const [selectedDate, setSelectedDate] = useState(null);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  useEffect(() => {
    if (!token) return;
    const fetchJournalEntries = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/journal", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const counts = {};
        res.data.forEach(entry => {
          const date = entry.createdAt.split('T')[0];
          counts[date] = (counts[date] || 0) + 1;
        });
        const allDates = getAllDatesInRange(startDate, endDate);
        const data = allDates.map(date => ({ date: date, count: counts[date] || 0 }));
        setHeatmapData(data);
      } catch (err) {
        if (err.response && err.response.status === 401) onAuthError();
      }
    };
    fetchJournalEntries();
  }, [token, onAuthError, journalUpdateKey]);

  const handleDayClick = (value) => {
    if (!recoveryMode || !value) return;
    if (new Date(value.date) > new Date()) return alert("Cannot recover future dates.");
    if (value.count > 0) return alert("This day is already complete!");

    // ✅ Open Modal instead of instant confirm
    setSelectedDate(value.date);
  };

  return (
    <>
      {/* ✅ Recovery Journal Modal */}
      {selectedDate && (
        <JournalModal 
            token={token}
            userProfile={userProfile} // Needs tokens count
            recoveryDate={selectedDate} // Triggers Recovery Mode
            onClose={() => setSelectedDate(null)}
            onAuthError={onAuthError}
            onForgiveSuccess={(updates) => {
                onUpdateUser(updates); // Update parent token count
                setHeatmapData(prev => prev.map(d => d.date === selectedDate ? { ...d, count: 1 } : d)); // Visual Update
                setSelectedDate(null); // Close modal
            }}
        />
      )}

      <div className={`mb-10 p-6 rounded-xl border transition-colors duration-300 ${recoveryMode ? 'bg-indigo-900/30 border-indigo-500' : 'bg-gray-800 border-primary-500/50'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-primary-500">Activity</h2>
          <button 
            onClick={() => setRecoveryMode(!recoveryMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${recoveryMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
          >
            {recoveryMode ? <><FaTimes /> Exit Recovery</> : <><FaMagic /> Recover Missed Days</>}
          </button>
        </div>
        
        {recoveryMode && <p className="text-center text-indigo-300 mb-4 animate-pulse">Select a gray square to recover that day.</p>}

        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={heatmapData}
          onClick={handleDayClick}
          classForValue={(value) => {
            if (!value || value.count === 0) return 'color-empty cursor-pointer hover:opacity-80';
            return `color-scale-${Math.min(value.count, 4)} cursor-pointer`;
          }}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) return null;
            return { 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': `${value.date}: ${value.count} entries` };
          }}
        />
        <Tooltip id="heatmap-tooltip" />
      </div>
    </>
  );
};

export default StreakGrid;