import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const PulseRing = ({ isActive = false, size = 'md' }) => {
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const ring3Ref = useRef(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  useEffect(() => {
    if (!isActive) {
      gsap.killTweensOf([ring1Ref.current, ring2Ref.current, ring3Ref.current]);
      gsap.set([ring1Ref.current, ring2Ref.current, ring3Ref.current], {
        scale: 0,
        opacity: 0,
      });
      return;
    }

    const rings = [ring1Ref.current, ring2Ref.current, ring3Ref.current];
    
    rings.forEach((ring, index) => {
      if (!ring) return;

      gsap.fromTo(
        ring,
        {
          scale: 0.8,
          opacity: 0.8,
        },
        {
          scale: 1.5,
          opacity: 0,
          duration: 1.5,
          repeat: -1,
          delay: index * 0.5,
          ease: 'power2.out',
        }
      );
    });

    return () => {
      gsap.killTweensOf(rings);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${sizeClasses[size]}`}>
      <div
        ref={ring1Ref}
        className="absolute inset-0 rounded-full border-2 border-current"
        style={{ opacity: 0 }}
      />
      <div
        ref={ring2Ref}
        className="absolute inset-0 rounded-full border-2 border-current"
        style={{ opacity: 0 }}
      />
      <div
        ref={ring3Ref}
        className="absolute inset-0 rounded-full border-2 border-current"
        style={{ opacity: 0 }}
      />
    </div>
  );
};

export default PulseRing;
