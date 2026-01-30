import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    // Center the elements
    gsap.set([cursor, dot], { xPercent: -50, yPercent: -50 });
    
    // Quicksetters for high-performance direct property updates
    const xSetRing = gsap.quickSetter(cursor, "x", "px");
    const ySetRing = gsap.quickSetter(cursor, "y", "px");
    const xSetDot = gsap.quickSetter(dot, "x", "px");
    const ySetDot = gsap.quickSetter(dot, "y", "px");

    const onMouseMove = (e: MouseEvent) => {
      // DOT: Absolute zero lag by setting it directly
      xSetDot(e.clientX);
      ySetDot(e.clientY);

      // RING: Minimal lag for that "follow" effect but very snappy
      xSetRing(e.clientX);
      ySetRing(e.clientY);

      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer');
      
      setIsPointer(!!isClickable);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      {/* Snappy Outer Ring */}
      <div 
        ref={cursorRef} 
        className={`fixed top-0 left-0 w-10 h-10 rounded-full border-2 border-yellow-400/50 pointer-events-none z-[9999] hidden md:flex items-center justify-center transition-transform duration-200 ease-out ${isPointer ? 'scale-125 border-orange-500 bg-orange-500/10' : 'scale-100'}`}
      >
        <div className={`w-full h-full rounded-full border border-white/30 transition-opacity ${isPointer ? 'opacity-100' : 'opacity-0'}`} />
      </div>
      
      {/* Zero-Lag Inner Dot */}
      <div 
        ref={dotRef} 
        className={`fixed top-0 left-0 w-2 h-2 bg-orange-600 rounded-full pointer-events-none z-[9999] hidden md:block shadow-[0_0_12px_rgba(234,88,12,0.6)] transition-transform duration-150 ${isPointer ? 'scale-0' : 'scale-100'}`}
      />
      
      <style>{`
        @media (min-width: 768px) {
          body, button, a, input, textarea, label, [role="button"], .cursor-pointer {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  );
};