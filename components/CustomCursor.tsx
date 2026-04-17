import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for touch/mobile devices
    const isTouchDevice = 
      (typeof window !== 'undefined' && 'ontouchstart' in window) || 
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      (typeof window !== 'undefined' && window.innerWidth < 768);
      
    if (isTouchDevice) {
      return;
    }

    // Hide default cursor globally, even on hover states
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      // Immediate dot
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0,
        ease: "none"
      });
      
      // Trailing ring
      gsap.to(followerRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.6,
        ease: "power2.out"
      });
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);
    
    // Scale down on click
    const onMouseDown = () => {
      gsap.to(cursorRef.current, { scale: 0.8, duration: 0.2 });
      gsap.to(followerRef.current, { scale: 0.5, duration: 0.2 });
    };
    
    const onMouseUp = () => {
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
      gsap.to(followerRef.current, { scale: 1, duration: 0.2 });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Add specific hover logic for clickables
    let hoverStateActive = false;
    const addHoverEffect = () => {
      if (hoverStateActive) return;
      hoverStateActive = true;
      gsap.to(cursorRef.current, { scale: 0, opacity: 0, duration: 0.3 });
      gsap.to(followerRef.current, { 
        scale: 1.5, 
        backgroundColor: '#F5F2EB', // Cream inverse
        border: 'none', 
        mixBlendMode: 'difference',
        duration: 0.3 
      });
    };
    
    const removeHoverEffect = () => {
      hoverStateActive = false;
      gsap.to(cursorRef.current, { scale: 1, opacity: 1, duration: 0.3 });
      gsap.to(followerRef.current, { 
        scale: 1, 
        mixBlendMode: 'normal', 
        backgroundColor: 'transparent', 
        border: '1px solid #2C2A26', 
        clearProps: 'mixBlendMode',
        duration: 0.3 
      });
    };

    // Attach to all elements matching our selectors dynamically
    const attachHoverEvents = () => {
      const clickables = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
      clickables.forEach((el) => {
        // Prevent adding multiple listeners
        if (!el.hasAttribute('data-cursor-attached')) {
          el.addEventListener('mouseenter', addHoverEffect);
          el.addEventListener('mouseleave', removeHoverEffect);
          el.setAttribute('data-cursor-attached', 'true');
        }
      });
    };

    // Initial attach
    attachHoverEvents();

    // Re-attach observer for dynamic React content
    const observer = new MutationObserver(() => {
      attachHoverEvents();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.head.removeChild(style);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      observer.disconnect();
      
      const clickables = document.querySelectorAll('[data-cursor-attached="true"]');
      clickables.forEach((el) => {
        el.removeEventListener('mouseenter', addHoverEffect);
        el.removeEventListener('mouseleave', removeHoverEffect);
        el.removeAttribute('data-cursor-attached');
      });
    };
  }, [isVisible]);

  return (
    <>
      {/* Outer ring follower */}
      <div 
        ref={followerRef}
        className={`hidden md:block fixed top-0 left-0 w-10 h-10 rounded-full border border-[#2C2A26] pointer-events-none z-[99999] transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 origin-center ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'transform' }}
      />
      
      {/* Inner dot */}
      <div 
        ref={cursorRef}
        className={`hidden md:block fixed top-0 left-0 w-2 h-2 rounded-full bg-[#2C2A26] pointer-events-none z-[100000] transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 origin-center ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'transform' }}
      />
    </>
  );
};

export default CustomCursor;
