import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const MusicWave = ({ isPlaying = false, barCount = 5 }) => {
  const barsRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isPlaying]);

  const startAnimation = () => {
    barsRef.current.forEach((bar, index) => {
      if (!bar) return;

      gsap.to(bar, {
        scaleY: 'random(0.3, 1)',
        duration: 'random(0.3, 0.6)',
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: index * 0.1,
      });
    });
  };

  const stopAnimation = () => {
    barsRef.current.forEach((bar) => {
      if (!bar) return;
      gsap.to(bar, {
        scaleY: 0.3,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
  };

  return (
    <div className="flex items-center justify-center gap-1 h-6">
      {Array.from({ length: barCount }).map((_, index) => (
        <div
          key={index}
          ref={(el) => (barsRef.current[index] = el)}
          className="w-1 h-full bg-current origin-bottom"
          style={{
            transform: 'scaleY(0.3)',
          }}
        />
      ))}
    </div>
  );
};

export default MusicWave;
