import React from 'react';
import { User } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import SplitText from '../components/SplitText';
import FadeInView from '../components/FadeInView';

const Profile = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SplitText className="text-3xl font-bold text-white text-center" delay={0.1}>
        Profile
      </SplitText>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
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

        <FadeInView className="grid grid-cols-1 md:grid-cols-3 gap-6" delay={0.8} stagger={0.15}>
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
        </FadeInView>
      </div>
    </div>
  );
};

export default Profile;