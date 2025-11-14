import React, { useState, useEffect } from "react";
import axios from "axios";

const Profile = ({ user, onLogout, onAuthError }) => { 
  const [dp, setDp] = useState(user?.dp || "");
  const [isOpen, setIsOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archive, setArchive] = useState([]);

  const getImageUrl = (path) => {
    return path ? `http://localhost:5000${path}` : "/default-avatar.png";
  };

  const loadArchive = () => {
    const history = JSON.parse(localStorage.getItem("taskHistory")) || [];
    setArchive(history);
  };

  useEffect(() => {
    loadArchive();
  }, []);

  const handleDpUpload = async (e) => {
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
        <span className="text-white font-bold">{user?.username || "User"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-blue bg-opacity-1 backdrop-blur-lg flex justify-center items-center z-500">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-80">
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

            <p className="text-lg font-bold text-center mt-3">{user?.username || "User"}</p>

            <button
              onClick={onLogout}
              className="mt-2 text-red-400 hover:text-red-500 transition-all w-full"
            >
              Logout
            </button>

            <button
              onClick={() => {
                setShowArchive(!showArchive);
                if (!showArchive) loadArchive();
              }}
              className="mt-4 w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-all"
            >
              {showArchive ? "Hide Archive" : "View Archive"}
            </button>

            {showArchive && (
              <div className="mt-4 p-4 bg-gray rounded-lg max-h-40 overflow-y-auto  text-red-500">
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
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
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