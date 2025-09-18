import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import MusicPlayer from './components/MusicPlayer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import Favorites from './pages/Favorites';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import LyricsPage from './pages/LyricsPage';

// Styles
import './App.css';

function App() {
  const { initializeAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize auth state listener
    const unsubscribe = initializeAuth();
    
    // Cleanup on unmount
    return () => unsubscribe && unsubscribe();
  }, [initializeAuth]);

  return (
    <Router>
      <div className="bg-black">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><Layout><Home /></Layout></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Layout><Search /></Layout></PrivateRoute>} />
          <Route path="/library" element={<PrivateRoute><Layout><Library /></Layout></PrivateRoute>} />
          <Route path="/lyrics" element={<PrivateRoute><Layout><LyricsPage /></Layout></PrivateRoute>} />
          <Route path="/playlists" element={<PrivateRoute><Layout><Playlists /></Layout></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Layout><Favorites /></Layout></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Layout><Upload /></Layout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        </Routes>
        
        {/* Music Player - hanya tampil jika user sudah login */}
        {isAuthenticated && <MusicPlayer />}
      </div>
    </Router>
  );
}

export default App;
