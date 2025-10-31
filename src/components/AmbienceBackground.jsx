import { useEffect, useState } from 'react';
import { useMusicStore } from '../stores/music';

/**
 * AmbienceBackground - YouTube Music style blur effect
 * Extracts dominant color from album art and creates blur background
 */
const AmbienceBackground = () => {
  const { currentTrack } = useMusicStore();
  const [dominantColor, setDominantColor] = useState('rgb(15, 15, 15)');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!currentTrack?.albumArt) {
      setDominantColor('rgb(15, 15, 15)');
      setImageLoaded(false);
      return;
    }

    // Extract dominant color from image
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = currentTrack.albumArt;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Sample center pixel
        const centerX = Math.floor(img.width / 2);
        const centerY = Math.floor(img.height / 2);
        const imageData = ctx.getImageData(centerX, centerY, 1, 1).data;
        
        // Make color darker for background
        const r = Math.floor(imageData[0] * 0.4);
        const g = Math.floor(imageData[1] * 0.4);
        const b = Math.floor(imageData[2] * 0.4);
        
        setDominantColor(`rgb(${r}, ${g}, ${b})`);
        setImageLoaded(true);
      } catch (error) {
        console.error('Failed to extract color:', error);
        setDominantColor('rgb(15, 15, 15)');
      }
    };
    
    img.onerror = () => {
      setDominantColor('rgb(15, 15, 15)');
      setImageLoaded(false);
    };
  }, [currentTrack?.albumArt]);

  return (
    <>
      {/* Gradient overlay for smooth transition */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{
          background: imageLoaded
            ? `radial-gradient(circle at 50% 20%, ${dominantColor} 0%, rgb(3, 3, 3) 70%)`
            : 'radial-gradient(circle at 50% 20%, rgb(15, 15, 15) 0%, rgb(3, 3, 3) 70%)',
          opacity: imageLoaded ? 0.6 : 1,
        }}
      />
      
      {/* Album art blur background */}
      {currentTrack?.albumArt && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 transform scale-110 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${currentTrack.albumArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px)',
              opacity: imageLoaded ? 0.15 : 0,
            }}
          />
        </div>
      )}
    </>
  );
};

export default AmbienceBackground;
