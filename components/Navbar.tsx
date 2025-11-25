
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { BRAND_NAME } from '../constants';

interface NavbarProps {
  onNavClick: (targetId: string) => void;
  activeView: string;
  onLogout: () => void;
  isAuthenticated: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onNavClick, activeView, onLogout, isAuthenticated }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, target: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavClick(target);
  };

  // Logic: Only use the transparent/white-text style if we are on the landing page AND at the top.
  // Otherwise (scrolled OR not on landing page), use the solid/dark-text style.
  const isLanding = activeView === 'landing';
  const useSolidStyle = !isLanding || scrolled || mobileMenuOpen;

  // Dynamic classes
  const navContainerClass = useSolidStyle 
    ? 'bg-[#F5F2EB]/90 backdrop-blur-md py-4 shadow-sm text-[#2C2A26]' 
    : 'bg-[#2C2A26]/0 py-6 text-[#F5F2EB]';
  
  const linkClass = `transition-colors duration-500 hover:opacity-60 ${
      useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'
  }`;

  const logoClass = `text-2xl font-serif font-medium tracking-tight transition-colors duration-500 ${
      useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'
  }`;

  // Button styles
  const buttonBaseClass = "text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full transition-all duration-300 border";
  const outlineButtonClass = useSolidStyle 
    ? `border-[#2C2A26] text-[#2C2A26] hover:bg-[#2C2A26] hover:text-[#F5F2EB]` 
    : `border-[#F5F2EB] text-[#F5F2EB] hover:bg-[#F5F2EB] hover:text-[#2C2A26]`;

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-in-out ${navContainerClass}`}
      >
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 relative flex items-center justify-between">
          {/* Logo */}
          <div className="z-50">
            <a 
                href="#" 
                onClick={(e) => handleLinkClick(e, isAuthenticated ? 'dashboard' : 'landing')}
                className={logoClass}
            >
                {BRAND_NAME}
            </a>
          </div>
          
          {/* Center Links - Absolutely Centered */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-12 text-sm font-medium tracking-widest uppercase">
            <div className={`transition-colors duration-500 flex gap-12 ${useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'}`}>
                {isAuthenticated ? (
                    <>
                        <a href="#" onClick={(e) => handleLinkClick(e, 'dashboard')} className={`hover:opacity-60 transition-opacity ${activeView === 'dashboard' ? 'underline underline-offset-4' : ''}`}>Dashboard</a>
                        <a href="#" onClick={(e) => handleLinkClick(e, 'leaderboard')} className={`hover:opacity-60 transition-opacity ${activeView === 'leaderboard' ? 'underline underline-offset-4' : ''}`}>Leaderboard</a>
                        <a href="#" onClick={(e) => handleLinkClick(e, 'community')} className={`hover:opacity-60 transition-opacity ${activeView === 'community' ? 'underline underline-offset-4' : ''}`}>Community</a>
                        <a href="#" onClick={(e) => handleLinkClick(e, 'events')} className={`hover:opacity-60 transition-opacity ${activeView === 'events' ? 'underline underline-offset-4' : ''}`}>Events</a>
                    </>
                ) : (
                     <a href="#" onClick={(e) => handleLinkClick(e, 'about')} className="hover:opacity-60 transition-opacity">About</a>
                )}
            </div>
          </div>

          {/* Right Actions */}
          <div className={`flex items-center gap-6 z-50 transition-colors duration-500 ${useSolidStyle ? 'text-[#2C2A26]' : 'text-[#F5F2EB]'}`}>
             {isAuthenticated ? (
                <>
                    <button 
                      onClick={(e) => handleLinkClick(e, 'account')}
                      className="text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden sm:block"
                    >
                      Account
                    </button>
                    {/* Divider */}
                    <span className="hidden sm:block opacity-30">|</span>
                    <button 
                      onClick={onLogout}
                      className="text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden sm:block"
                    >
                      Log Out
                    </button>
                </>
             ) : (
                 <div className="hidden sm:flex items-center gap-4">
                    <button 
                        onClick={(e) => handleLinkClick(e, 'auth')}
                        className={`${buttonBaseClass} ${outlineButtonClass}`}
                    >
                        Log In
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
