import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
    onNavClick?: (targetId: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavClick }) => {
  const containerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const title1Ref = useRef<HTMLHeadingElement>(null);
  const title2Ref = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Initial stagger text entrance
    tl.fromTo([title1Ref.current, title2Ref.current, descRef.current, btnRef.current], 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, delay: 0.2 }
    );

    // Parallax background
    gsap.to(bgRef.current, {
      yPercent: 30, // move image down by 30% of its height
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full h-[100dvh] min-h-[700px] overflow-hidden bg-[#D6D1C7]">
      
      {/* Background Image - Serene Water - scaled up slightly to allow parallax movement */}
      <div className="absolute inset-0 w-full h-[130%] -top-[15%]">
        <img 
            ref={bgRef}
            src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=2000" 
            alt="Deep blue water surface" 
            className="w-full h-full object-cover grayscale contrast-[0.8] brightness-[0.8]"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C2A26]/80 via-[#2C2A26]/30 to-transparent mix-blend-multiply"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end lg:justify-center items-start lg:items-center text-left lg:text-center px-6 lg:px-8 pb-32 lg:pb-0">
        <div className="flex flex-col items-start lg:items-center max-w-5xl lg:mx-auto">
          <span className="block text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-white/90 mb-6 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full border border-white/10">
            Global Impact Tracker
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal text-white tracking-tight mb-8 drop-shadow-sm flex flex-col items-start lg:items-center gap-2 lg:gap-4">
            <span ref={title1Ref} className="opacity-0">Your Water Footprint,</span>
            <span ref={title2Ref} className="italic text-[#F5F2EB] opacity-0 text-[1.2em]">Made Visible.</span>
          </h1>
          <p ref={descRef} className="opacity-0 max-w-lg lg:mx-auto text-base md:text-xl text-white/80 font-light leading-relaxed mb-12 text-shadow-sm pr-12 lg:pr-0">
            From your morning shower to your daily meals, discover where your water goes—and how to save it. Get personalized insights and join a global movement for conservation.
          </p>

          {/* Upgraded Button */}
          <div className="relative inline-block">
             <button
                ref={btnRef}
                onClick={() => onNavClick && onNavClick('signup')}
                className="opacity-0 relative overflow-hidden group border border-[#F5F2EB]/40 bg-white/5 backdrop-blur-sm text-[#F5F2EB] px-10 py-4 rounded-full uppercase tracking-widest text-xs font-bold transition-all duration-300 transform"
             >
                {/* Background sliding fill */}
                <span className="absolute inset-0 w-full h-full bg-[#F5F2EB] translate-y-[100%] rounded-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                
                {/* Text layer to appear above fill */}
                <span className="relative z-10 group-hover:text-[#2C2A26] transition-colors duration-500">
                See My Impact
                </span>
             </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
