// src/StreakGrid.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip'; // ✅ Import the correct Tooltip

const StreakGrid = ({ token, onAuthError }) => {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    if (!token) return;

    const fetchJournalEntries = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/journal", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Process data for the heatmap
        const counts = {};
        res.data.forEach(entry => {
          const date = entry.createdAt.split('T')[0]; // Get YYYY-MM-DD
          counts[date] = (counts[date] || 0) + 1;
        });

        const data = Object.keys(counts).map(date => ({
          date: date,
          count: counts[date],
        }));
        
        setHeatmapData(data);

      } catch (err) {
        if (err.response && err.response.status === 401) {
          onAuthError();
        }
      }
    };

    fetchJournalEntries();
  }, [token]);

  // Get start date for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return (
    <div className="mb-10 p-6 bg-gray-800 rounded-xl border border-primary-500/50">
      <h2 className="text-3xl font-bold text-primary-500 mb-4">Activity</h2>
      <CalendarHeatmap
        startDate={sixMonthsAgo}
        endDate={new Date()}
        values={heatmapData}
        classForValue={(value) => {
          if (!value) {
            return 'color-empty';
          }
          if (value.count >= 4) return 'color-scale-4';
          if (value.count >= 2) return 'color-scale-2';
          return 'color-scale-1';
        }}
        // ✅ NEW: Set up tooltip attributes for version 5
        tooltipDataAttrs={(value) => {
          if (!value || !value.date) return null;
          const count = value.count || 0;
          return {
            'data-tooltip-id': 'heatmap-tooltip', // ID for the tooltip
            'data-tooltip-content': `${value.date}: ${count} journal entr${count === 1 ? 'y' : 'ies'}`,
          };
        }}
      />
      {/* ✅ NEW: Render the Tooltip component itself */}
      <Tooltip id="heatmap-tooltip" />
    </div>
  );
};

export default StreakGrid;