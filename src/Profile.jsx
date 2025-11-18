import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaSave, FaTimes, FaFire, FaHistory, FaFilter } from "react-icons/fa";

const Profile = ({ user, onLogout, onAuthError }) => {
  const [dp, setDp] = useState(user?.dp || "");
  const [isOpen, setIsOpen] = useState(false);
  
  const [journalHistory, setJournalHistory] = useState([]);
  const [showJournal, setShowJournal] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || user?.username);
  
  const [liveStreak, setLiveStreak] = useState(0);

  useEffect(() => { setDp(user?.dp || ""); setName(user?.name || user?.username); }, [user]);
  
  useEffect(() => {
    if (isOpen && user.token) {
      axios.get("http://localhost:5000/api/streaks", { headers: { Authorization: `Bearer ${user.token}` } })
        .then(res => setLiveStreak(res.data?.[0]?.count || 0))
        .catch(console.error);

      if (showJournal) {
        fetchJournal();
      }
    }
  }, [isOpen, showJournal, user.token]);

  const fetchJournal = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/journal", { headers: { Authorization: `Bearer ${user.token}` } });
      setJournalHistory(res.data);
    } catch (e) { console.error("Failed to load history"); }
  };

  const getImageUrl = (path) => path ? `http://localhost:5000${path}` : "/default-avatar.png";

  const handleDpUpload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    const formData = new FormData(); formData.append("profileImage", file);
    try {
      const res = await axios.post("http://localhost:5000/api/upload-profile-image", formData, { headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } });
      const updatedUser = { ...user, dp: res.data.imageUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser)); onAuthError();
    } catch (e) {}
  };

  const handleSaveName = async () => {
    try {
      const res = await axios.patch("http://localhost:5000/api/profile/name", { name }, { headers: { Authorization: `Bearer ${user.token}` } });
      localStorage.setItem('user', JSON.stringify({ ...user, name: res.data.user.name }));
      setIsEditingName(false); onAuthError();
    } catch (e) {}
  };

  // ✅ REFILL TOKENS (Use this to fix your 0 tokens issue)
  const handleRefillTokens = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/streaks/debug/refill-tokens", {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(res.data.message);
      const updatedUser = { ...user, forgivenessTokens: res.data.tokens };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onAuthError();
    } catch (e) { alert("Failed to refill tokens."); }
  };

  const displayedHistory = showAllLogs 
    ? journalHistory 
    : journalHistory.filter(entry => entry.reason !== "User login");

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
        <img src={getImageUrl(dp)} alt="Profile" className="w-12 h-12 object-cover rounded-full border-2 border-blue-500" />
        <span className="text-white font-bold">{user?.name || user?.username}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-96 border border-primary-500/50 max-h-[90vh] overflow-y-auto flex flex-col">
             <label className="relative cursor-pointer block w-24 h-24 mx-auto">
              <img src={getImageUrl(dp)} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-blue-500" />
              <input type="file" className="hidden" onChange={handleDpUpload} />
            </label>
            {!isEditingName ? (
              <div className="flex items-center justify-center gap-2 mt-3"><p className="text-xl font-bold">{name}</p><button onClick={() => setIsEditingName(true)} className="text-gray-400"><FaEdit /></button></div>
            ) : (
              <div className="flex items-center gap-2 mt-3"><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-grow p-2 text-white bg-gray-700 rounded" /><button onClick={handleSaveName} className="text-green-500"><FaSave /></button></div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-gray-800 rounded-lg text-center border border-gray-700">
                 <FaFire className="text-orange-500 text-2xl mx-auto mb-1"/>
                 <span className="text-xl font-bold text-white">{liveStreak}</span>
                 <p className="text-xs text-gray-400">Current Streak</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg text-center border border-gray-700">
                 <span className="text-2xl font-bold text-primary-500 block mb-1">{user?.forgivenessTokens}</span>
                 <p className="text-xs text-gray-400">Tokens</p>
              </div>
            </div>

            <button 
                onClick={() => setShowJournal(!showJournal)} 
                className={`mt-6 w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${showJournal ? 'bg-purple-700 text-white' : 'bg-gray-800 text-purple-400 hover:bg-gray-700'}`}
            >
                <FaHistory /> {showJournal ? "Hide History" : "View Journal History"}
            </button>

            {showJournal && (
              <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700 max-h-60 overflow-y-auto">
                <div className="flex justify-end mb-2">
                    <button onClick={() => setShowAllLogs(!showAllLogs)} className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white uppercase tracking-wider">
                        <FaFilter size={10} /> {showAllLogs ? "Hide System Logs" : "Show All Activity"}
                    </button>
                </div>

                {displayedHistory.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">No entries found.</p>
                ) : (
                    displayedHistory.map(entry => (
                    <div key={entry.id} className="border-b border-gray-700 pb-3 mb-3 last:border-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${entry.reason === "User login" ? "bg-gray-700 text-gray-300" : "bg-indigo-900 text-indigo-200"}`}>
                                {entry.reason === "User login" ? "LOGIN" : "JOURNAL"}
                            </span>
                        </div>
                        {entry.reason !== "User login" && (
                           <>
                               <p className="text-gray-200 text-sm leading-relaxed">{entry.reason}</p>
                               {entry.mitigation && entry.mitigation !== "N/A" && (
                                   <div className="mt-1 pl-2 border-l-2 border-primary-500/30">
                                       <p className="text-xs text-gray-400">💡 {entry.mitigation}</p>
                                   </div>
                               )}
                           </>
                        )}
                    </div>
                    ))
                )}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-700 space-y-2">
              {/* ✅ Refill Button to fix your 0 Token Issue */}
              <button onClick={handleRefillTokens} className="w-full py-1.5 bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-900/50 rounded text-[10px] font-mono tracking-wide">
                💰 DEV: REFILL TOKENS
              </button>
            </div>

            <button onClick={onLogout} className="mt-6 text-red-400 w-full text-left hover:text-red-300 text-sm">Logout</button>
            <button onClick={() => setIsOpen(false)} className="mt-2 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;