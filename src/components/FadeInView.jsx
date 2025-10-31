import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const FadeInView = ({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 0.8,
  y = 30,
  scale = 0.95,
  stagger = 0.1,
}) => {
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const elements = containerRef.current.children;
    
    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y,
        scale,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
      }
    );

    hasAnimated.current = true;
  }, [delay, duration, y, scale, stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default FadeInView;
