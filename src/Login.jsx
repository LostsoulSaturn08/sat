// src/Login.jsx (Updated for Google Auth and Color)
import React, { useState } from "react";
import axios from "axios";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

// 🔑 Reads the Client ID from your root .env file
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; 

const LoginContent = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      alert("Please enter both username and password.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username: username,
        password: password
      });
  
      const { user, token } = response.data;
      if (user && token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        onLogin({ user, token });
      } else {
        alert("Login failed due to missing session data. Please try again.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.response?.data?.message || "Login failed. Please try again.");
    }
  };
  
  // ✅ NEW: Google Login Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
        // Send the Google credential (ID Token) to the backend
        const response = await axios.post("http://localhost:5000/api/google-login", {
            token: credentialResponse.credential
        });
        const { user, token } = response.data;
        if (user && token) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            onLogin({ user, token });
        } else {
            alert("Google login failed due to missing session data.");
        }
    } catch (error) {
        console.error("Google login backend failed:", error);
        alert(error.response?.data?.message || "Google login failed. Please try again.");
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-4xl font-extrabold mb-8 text-primary-500">Welcome Back</h2>
      <div className="flex flex-col gap-4 w-full max-w-sm p-8 border border-primary-500/50 rounded-xl bg-gray-800 shadow-xl">
        
        {/* Google Sign-in Button */}
        <div className="mb-4 flex flex-col items-center">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error("Google Login Failed")}
                text="signin_with"
                size="large"
                type="standard"
                shape="pill"
                theme="filled_black"
                logo_alignment="left"
            />
        </div>
        
        <div className="text-center my-2 text-gray-400">OR</div>

        {/* Traditional Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            className="p-3 text-white rounded-lg border border-gray-600 bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="p-3 text-white rounded-lg border border-gray-600 bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="bg-primary-500 px-4 py-3 rounded-lg shadow-lg hover:bg-primary-600 transition-colors font-semibold">
            Login or Register
          </button>
        </form>
      </div>
      <p className="mt-4 text-sm text-gray-500">New users will be registered automatically.</p>
    </div>
  );
};

// Component wrapper to provide the Google Context
const Login = (props) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <LoginContent {...props} />
  </GoogleOAuthProvider>
);

export default Login;