import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import './hooks/useTheme';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import LyricsPage from './pages/LyricsPage';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Favorites from './pages/Favorites';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const App = () => {
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return unsubscribe;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/lyrics" element={<LyricsPage />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;