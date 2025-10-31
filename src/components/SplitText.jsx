import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SplitText = ({ children, className = '', delay = 0, duration = 0.6, stagger = 0.03 }) => {
  const textRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!textRef.current || hasAnimated.current) return;

    const text = textRef.current;
    const words = children.split(' ');
    
    // Clear and rebuild with spans
    text.innerHTML = '';
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.marginRight = '0.3em';
      
      word.split('').forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.style.display = 'inline-block';
        charSpan.style.opacity = '0';
        charSpan.style.transform = 'translateY(20px) rotateX(-90deg)';
        wordSpan.appendChild(charSpan);
      });
      
      text.appendChild(wordSpan);
    });

    // Animate
    gsap.to(text.querySelectorAll('span span'), {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration,
      delay,
      stagger,
      ease: 'back.out(1.7)',
    });

    hasAnimated.current = true;
  }, [children, delay, duration, stagger]);

  return (
    <div ref={textRef} className={className}>
      {children}
    </div>
  );
};

export default SplitText;
