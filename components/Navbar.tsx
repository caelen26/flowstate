import React, { useState, useEffect, useRef } from 'react';
import { BRAND_NAME } from '../constants';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface NavbarProps {
  onNavClick: (targetId: string) => void;
  activeView: string;
  onLogout: () => void;
  isAuthenticated: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onNavClick, activeView, onLogout, isAuthenticated }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useGSAP(() => {
    // Entrance animation for links
    if (linksRef.current.length > 0) {
        gsap.fromTo(linksRef.current, 
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, stagger: 0.05, duration: 0.8, ease: "power2.out", delay: 0.4 }
        );
    }
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, target: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavClick(target);
  };

  const isLanding = activeView === 'landing';
  const useSolidStyle = !isLanding || scrolled || mobileMenuOpen;

  // Floating Pill Dynamic Styles
  const navContainerClass = useSolidStyle 
    ? 'bg-[#F5F2EB]/95 backdrop-blur-xl py-3 shadow-lg border border-[#2C2A26]/5 rounded-full mt-4 w-[calc(100%-2rem)] max-w-5xl mx-auto px-6 text-[#2C2A26]' 
    : 'bg-transparent py-6 rounded-none mt-0 w-full max-w-[1800px] mx-auto px-4 md:px-8 text-[#F5F2EB]';
  
  const logoClass = `text-2xl font-serif font-medium tracking-tight transition-colors duration-500 ${
      useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'
  }`;

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] grid place-items-center transition-all duration-700 pointer-events-none`}
      >
        <div 
          ref={navRef}
          className={`relative flex items-center justify-between pointer-events-auto transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${navContainerClass}`}
        >
          {/* Logo */}
          <div className="z-50 shrink-0">
            <a 
                href="#" 
                onClick={(e) => handleLinkClick(e, isAuthenticated ? 'dashboard' : 'landing')}
                className={logoClass}
            >
                {BRAND_NAME}
            </a>
          </div>
          
          {/* Center Links */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-12 text-sm font-medium tracking-widest uppercase">
            <div className={`transition-colors duration-500 flex gap-10 ${useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'}`}>
                {isAuthenticated ? (
                    <>
                        {['Dashboard', 'Leaderboard', 'Community', 'Events'].map((item, i) => (
                           <a key={item} href="#" ref={(el: HTMLAnchorElement | null) => { linksRef.current[i] = el; }}
                              onClick={(e) => handleLinkClick(e, item.toLowerCase())} 
                              className={`inline-block hover:opacity-60 transition-opacity ${activeView === item.toLowerCase() ? 'underline underline-offset-4' : ''}`}>
                                {item}
                           </a>
                        ))}
                    </>
                ) : (
                     <a href="#" ref={(el: HTMLAnchorElement | null) => { linksRef.current[0] = el; }}
                        onClick={(e) => handleLinkClick(e, 'about')} 
                        className="inline-block hover:opacity-60 transition-opacity">
                            About
                     </a>
                )}
            </div>
          </div>

          {/* Right Actions */}
          <div className={`flex items-center gap-6 z-50 shrink-0 transition-colors duration-500 ${useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'}`}>
             {isAuthenticated ? (
                <>
                    <button 
                      onClick={(e) => handleLinkClick(e, 'account')}
                      className="inline-block text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden sm:block"
                    >
                      Account
                    </button>
                    <span className="hidden sm:block opacity-30">|</span>
                    <button 
                      onClick={onLogout}
                      className="inline-block text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden sm:block"
                    >
                      Log Out
                    </button>
                </>
             ) : (
                 <div className="hidden sm:flex items-center gap-4">
                    {/* Button with Sliding Cover */}
                    <button 
                        onClick={(e) => handleLinkClick(e, 'auth')}
                        className={`relative overflow-hidden group outline-none text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-full border transition-colors duration-300 ${
                          useSolidStyle 
                           ? `border-[#2C2A26] text-[#2C2A26]` 
                           : `border-[#F5F2EB]/40 bg-white/5 text-[#F5F2EB]`
                        }`}
                    >
                        {/* Slide color depending on style */}
                        <span className={`absolute inset-0 w-full h-full translate-y-[100%] rounded-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                            useSolidStyle ? 'bg-[#2C2A26]' : 'bg-[#F5F2EB]'
                        }`}></span>
                        <span className={`relative z-10 transition-colors duration-500 ${
                            useSolidStyle ? 'group-hover:text-[#F5F2EB]' : 'group-hover:text-[#2C2A26]'
                        }`}>
                            Log In
                        </span>
                    </button>
                </div>
             )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className={`block lg:hidden focus:outline-none transition-colors duration-500 ${useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
               {mobileMenuOpen ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                 </svg>
               )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#F5F2EB] z-40 flex flex-col justify-center items-center transition-all duration-500 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}>
          <div className="flex flex-col items-center space-y-8 text-xl font-serif font-medium text-[#2C2A26]">
            {isAuthenticated ? (
                <>
                    <a href="#" onClick={(e) => handleLinkClick(e, 'dashboard')} className="hover:opacity-60 transition-opacity">Dashboard</a>
                    <a href="#" onClick={(e) => handleLinkClick(e, 'leaderboard')} className="hover:opacity-60 transition-opacity">Leaderboard</a>
                    <a href="#" onClick={(e) => handleLinkClick(e, 'community')} className="hover:opacity-60 transition-opacity">Community</a>
                    <a href="#" onClick={(e) => handleLinkClick(e, 'events')} className="hover:opacity-60 transition-opacity">Events</a>
                    <a href="#" onClick={(e) => handleLinkClick(e, 'account')} className="hover:opacity-60 transition-opacity">My Account</a>
                    <button onClick={onLogout} className="text-base uppercase tracking-widest font-sans mt-8 text-red-900">Log Out</button>
                </>
            ) : (
                <>
                   <a href="#" onClick={(e) => handleLinkClick(e, 'about')} className="hover:opacity-60 transition-opacity">About</a>
                   <button onClick={(e) => handleLinkClick(e, 'auth')} className="text-base uppercase tracking-widest font-sans mt-4 text-[#2C2A26]">Log In</button>
                   <button onClick={(e) => handleLinkClick(e, 'signup')} className="text-base uppercase tracking-widest font-sans mt-4 text-[#2C2A26] border-b border-[#2C2A26]">Create Account</button>
                </>
            )}
          </div>
      </div>
    </>
  );
};

export default Navbar;
