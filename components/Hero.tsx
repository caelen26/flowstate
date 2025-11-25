
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';

interface HeroProps {
    onNavClick?: (targetId: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavClick }) => {
  return (
    <section className="relative w-full h-[90vh] min-h-[600px] overflow-hidden bg-[#D6D1C7]">
      
      {/* Background Image - Serene Water */}
      <div className="absolute inset-0 w-full h-full">
        <img 
            src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=2000" 
            alt="Deep blue water surface" 
            className="w-full h-full object-cover grayscale contrast-[0.8] brightness-[0.8] animate-[pulse_15s_ease-in-out_infinite_alternate]"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#2C2A26]/30 mix-blend-multiply"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 md:px-6">
        <div className="animate-fade-in-up flex flex-col items-center">
          <span className="block text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-white/90 mb-6 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
            Global Impact Tracker
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal text-white tracking-tight mb-8 drop-shadow-sm">
            Your water footprint, <span className="italic text-[#F5F2EB]">made visible.</span>
          </h1>
          <p className="max-w-lg mx-auto text-base md:text-xl text-white/90 font-light leading-relaxed mb-12 text-shadow-sm px-2">
            From your morning shower to your daily meals, discover where your water goes—and how to save it. Get personalized insights and join a global movement for conservation.
          </p>

          <button
            onClick={() => onNavClick && onNavClick('signup')}
            className="border border-[#F5F2EB] text-[#F5F2EB] px-8 py-3 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-[#F5F2EB] hover:text-[#2C2A26] transition-all duration-300"
          >
            See My Impact
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
