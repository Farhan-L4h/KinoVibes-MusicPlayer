import React from 'react';
import { Upload as UploadIcon } from 'lucide-react';
import SplitText from '../components/SplitText';

const Upload = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SplitText className="text-3xl font-bold text-white text-center" delay={0.1}>
        Upload Music
      </SplitText>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-300">Music upload functionality will be implemented with Firebase Storage</p>
      </div>
    </div>
  );
};

export default Upload;