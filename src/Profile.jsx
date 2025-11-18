import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaSave, FaTimes, FaFire } from "react-icons/fa";

const Profile = ({ user, onLogout, onAuthError }) => {
  const [dp, setDp] = useState(user?.dp || "");
  const [isOpen, setIsOpen] = useState(false);
  const [journalHistory, setJournalHistory] = useState([]);
  const [showJournal, setShowJournal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || user?.username);
  
  // ✅ New State for displaying live streak
  const [liveStreak, setLiveStreak] = useState(0);

  useEffect(() => { setDp(user?.dp || ""); setName(user?.name || user?.username); }, [user]);
  
  // ✅ Fetch streak on open
  useEffect(() => {
    if (isOpen && user.token) {
      axios.get("http://localhost:5000/api/streaks", { headers: { Authorization: `Bearer ${user.token}` } })
        .then(res => setLiveStreak(res.data?.count || 0))
        .catch(console.error);
    }
  }, [isOpen, user.token]);

  const getImageUrl = (path) => path ? `http://localhost:5000${path}` : "/default-avatar.png";

  const toggleJournal = async () => {
    if (!showJournal) {
      try {
        const res = await axios.get("http://localhost:5000/api/journal", { headers: { Authorization: `Bearer ${user.token}` } });
        setJournalHistory(res.data);
      } catch (e) {}
    }
    setShowJournal(!showJournal);
  };

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

  // ✅ GOD MODE
  const handleGodMode = async () => {
    const countInput = prompt("Enter the Streak Count you want (e.g. 50):", "50");
    if (countInput === null) return;
    const daysInput = prompt("Enter how many days ago you last logged in (e.g. 5):", "5");
    if (daysInput === null) return;

    try {
      await axios.post("http://localhost:5000/api/streaks/debug/skip-day", 
        { count: countInput, days: daysInput }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert(`Done! Set streak to ${countInput} and rewound ${daysInput} days.\n\nPage will reload to trigger the 'Streak Broken' check.`);
      window.location.reload(); 
    } catch (e) { alert("Simulation failed."); }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
        <img src={getImageUrl(dp)} alt="Profile" className="w-12 h-12 object-cover rounded-full border-2 border-blue-500" />
        <span className="text-white font-bold">{user?.name || user?.username}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-96 border border-primary-500/50 max-h-[90vh] overflow-y-auto">
             <label className="relative cursor-pointer block w-24 h-24 mx-auto">
              <img src={getImageUrl(dp)} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-blue-500" />
              <input type="file" className="hidden" onChange={handleDpUpload} />
            </label>
            {!isEditingName ? (
              <div className="flex items-center justify-center gap-2 mt-3"><p className="text-xl font-bold">{name}</p><button onClick={() => setIsEditingName(true)} className="text-gray-400"><FaEdit /></button></div>
            ) : (
              <div className="flex items-center gap-2 mt-3"><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-grow p-2 text-white bg-gray-700 rounded" /><button onClick={handleSaveName} className="text-green-500"><FaSave /></button></div>
            )}
            
            {/* ✅ Streak Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-gray-800 rounded-lg text-center">
                 <FaFire className="text-orange-500 text-2xl mx-auto mb-1"/>
                 <span className="text-xl font-bold text-white">{liveStreak}</span>
                 <p className="text-xs text-gray-400">Current Streak</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg text-center">
                 <span className="text-2xl font-bold text-primary-500 block mb-1">{user?.forgivenessTokens}</span>
                 <p className="text-xs text-gray-400">Forgiveness Tokens</p>
              </div>
            </div>

            <button onClick={toggleJournal} className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold text-sm text-white">{showJournal ? "Hide History" : "View History"}</button>
            {showJournal && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg max-h-60 overflow-y-auto">
                {journalHistory.map(entry => (
                  <div key={entry.id} className="border-b border-gray-700 pb-2 mb-2">
                    <div className="flex justify-between text-xs text-gray-400"><span>{new Date(entry.createdAt).toLocaleDateString()}</span><span>{entry.reason === "User login" ? "LOGIN" : "REFLECT"}</span></div>
                    {entry.reason !== "User login" && <p className="text-gray-300 text-sm mt-1">{entry.reason}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* ✅ GOD MODE BUTTON */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <button onClick={handleGodMode} className="w-full py-2 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700 rounded text-xs font-mono">
                ⚠️ DEV: Set Streak & Time Travel
              </button>
            </div>

            <button onClick={onLogout} className="mt-6 text-red-400 w-full text-left">Logout</button>
            <button onClick={() => setIsOpen(false)} className="mt-2 w-full py-2 bg-gray-700 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;