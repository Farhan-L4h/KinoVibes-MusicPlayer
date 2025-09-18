import React from 'react';

const TailwindTest = () => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg">
      <h2 className="font-bold text-xl mb-2">Tailwind Test</h2>
      <p className="text-sm">If you can see this with red background, Tailwind is working!</p>
    </div>
  );
};

export default TailwindTest;