// lostsoulsaturn08/sat/sat-019c4325342575340607add8b5a7fff4fb04e73f/src/Profile.jsx
// src/Profile.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa"; // ✅ Import icons

const Profile = ({ user, onLogout, onAuthError, showArchived, setShowArchived }) => {
  const [dp, setDp] = useState(user?.dp || "");
  const [isOpen, setIsOpen] = useState(false);
  const [archive, setArchive] = useState([]);

  // ✅ --- NEW STATE FOR NAME EDIT --- ✅
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || user?.username);
  // ✅ --------------------------------- ✅

  useEffect(() => {
    setDp(user?.dp || "");
    setName(user?.name || user?.username); // ✅ Update name state if user prop changes
  }, [user]);

  const getImageUrl = (path) => {
    return path ? `http://localhost:5000${path}` : "/default-avatar.png";
  };

  const loadArchive = () => {
    const history = JSON.parse(localStorage.getItem("taskHistory")) || [];
    setArchive(history);
  };

  useEffect(() => {
    if (showArchived) {
      loadArchive();
    }
  }, [showArchived]);

  const handleDpUpload = async (e) => {
    // ... (rest of the function is unchanged)
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be under 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload-profile-image",
        formData,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = response.data;
      setDp(data.imageUrl);
      
      const updatedUser = { ...user, dp: data.imageUrl, name: data.user.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onAuthError(); // Trigger profile refresh

    } catch (err) {
      console.error("Upload error:", err);
      if (err.response && err.response.status === 401) {
        onAuthError();
        alert("Your session expired. Please log in again.");
      } else {
        alert(err.response?.data?.error || "An error occurred during upload");
      }
    }
  };

  // ✅ --- NEW FUNCTION TO SAVE NAME --- ✅
  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user.name) {
      setIsEditingName(false);
      setName(user.name || user.username); // Reset if invalid or unchanged
      return;
    }
    
    try {
      const response = await axios.patch(
        "http://localhost:5000/api/profile/name",
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
      onAuthError(); // Trigger parent profile refresh
      setIsEditingName(false); // Exit edit mode
      
    } catch (err) {
      console.error("Name update error:", err);
      if (err.response && err.response.status === 401) onAuthError();
      alert(err.response?.data?.error || "Failed to update name.");
    }
  };
  // ✅ ---------------------------------- ✅

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all"
      >
        <img
          src={getImageUrl(dp)}
          alt="Profile"
          className="w-12 h-12 object-cover rounded-full border-2 border-blue-500"
        />
        <span className="text-white font-bold">{user?.name || user?.username}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-96 border border-primary-500/50">
            <label className="relative cursor-pointer block w-24 h-24 mx-auto">
              <img
                src={getImageUrl(dp)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
              />
              <input type="file" className="hidden" onChange={handleDpUpload} />
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full text-xs">
                📷
              </div>
            </label>

            {/* ✅ --- EDITABLE NAME FIELD --- ✅ */}
            {!isEditingName ? (
              <div className="flex items-center justify-center gap-2 mt-3">
                <p className="text-xl font-bold text-center">{name}</p>
                <button 
                  onClick={() => setIsEditingName(true)} 
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <FaEdit />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-grow p-2 text-white rounded-lg border border-gray-600 bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                />
                <button onClick={handleSaveName} className="p-2 text-green-500 hover:text-green-400"><FaSave /></button>
                <button 
                  onClick={() => {
                    setIsEditingName(false);
                    setName(user.name || user.username); // Reset on cancel
                  }} 
                  className="p-2 text-red-500 hover:text-red-400"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            {/* ✅ ----------------------------- ✅ */}
            
            <p className="text-sm text-gray-400 text-center">{user?.username}</p>

            <div className="text-center mt-4 p-3 bg-gray-800 rounded-lg">
              <span className="text-2xl font-bold text-primary-500">{user?.forgivenessTokens}</span>
              <p className="text-sm text-gray-300">Forgiveness Tokens</p>
            </div>

            <button
              onClick={() => {
                setShowArchived(!showArchived);
              }}
              className="mt-4 w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-all font-semibold"
            >
              {showArchived ? "Hide Archive" : "View Archive"}
            </button>

            {showArchived && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg max-h-40 overflow-y-auto text-white">
                <h3 className="text-lg font-bold mb-2">Archived Tasks</h3>
                {archive.length > 0 ? (
                  <ul className="text-sm">
                    {archive.map((task, index) => (
                      <li key={index} className="border-b border-gray-700 py-1">
                        {task.text} - {new Date(task.deadline).toDateString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No archived tasks yet.</p>
                )}
              </div>
            )}
            
            <button
              onClick={onLogout}
              className="mt-4 text-red-400 hover:text-red-500 transition-all w-full text-left"
            >
              Logout
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;