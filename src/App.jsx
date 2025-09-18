import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Playlists from './pages/Playlists';
import Favorites from './pages/Favorites';
import Upload from './pages/Upload';
import Profile from './pages/Profile';

// Styles
import './App.css';

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth state listener
    const unsubscribe = initializeAuth();
    
    // Cleanup on unmount
    return () => unsubscribe && unsubscribe();
  }, [initializeAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><Layout><Home /></Layout></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Layout><Search /></Layout></PrivateRoute>} />
          <Route path="/playlists" element={<PrivateRoute><Layout><Playlists /></Layout></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Layout><Favorites /></Layout></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Layout><Upload /></Layout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
