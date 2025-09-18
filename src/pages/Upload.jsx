import React from 'react';
import { Upload as UploadIcon } from 'lucide-react';

const Upload = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Upload Music</h1>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-center">
        <UploadIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <p className="text-gray-300">Music upload functionality will be implemented with Firebase Storage</p>
      </div>
    </div>
  );
};

export default Upload;