import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const PageTransition = ({ children }) => {
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const tl = gsap.timeline();
    
    // Initial state
    gsap.set(containerRef.current, {
      opacity: 0,
      scale: 0.98,
    });

    // Animate in
    tl.to(containerRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'power3.out',
    });

    hasAnimated.current = true;
  }, []);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};

export default PageTransition;
