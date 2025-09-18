import React from 'react';
import { User } from 'lucide-react';
import { useAuthStore } from '../stores/auth';

const Profile = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Profile</h1>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.displayName || 'Music Lover'}</h2>
            <p className="text-gray-300">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-gray-300">Playlists Created</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-gray-300">Songs Uploaded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-gray-300">Favorites</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;