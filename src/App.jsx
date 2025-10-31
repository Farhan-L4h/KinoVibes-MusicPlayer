import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import MusicPlayer from './components/MusicPlayer';
import PageTransition from './components/PageTransition';

// Pages
import Home from './pages/HomeYT'; // New YouTube Music style
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Favorites from './pages/Favorites';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import LyricsPage from './pages/LyricsPageYT'; // New YouTube Music style lyrics

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
      <div className="w-full h-screen bg-black overflow-hidden">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><Layout><PageTransition><Home /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Layout><PageTransition><Search /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/library" element={<PrivateRoute><Layout><PageTransition><Library /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/lyrics" element={<PrivateRoute><Layout><PageTransition><LyricsPage /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/playlists" element={<PrivateRoute><Layout><PageTransition><Playlists /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/playlists/:id" element={<PrivateRoute><Layout><PageTransition><PlaylistDetail /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Layout><PageTransition><Favorites /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Layout><PageTransition><Upload /></PageTransition></Layout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Layout><PageTransition><Profile /></PageTransition></Layout></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
