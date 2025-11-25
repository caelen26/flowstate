
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState } from 'react';

interface FooterProps {
  onLinkClick: (targetId: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onLinkClick }) => {
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    if (!email) return;
    setSubscribeStatus('loading');
    setTimeout(() => {
      setSubscribeStatus('success');
      setEmail('');
    }, 1500);
  };

  return (
    <footer className="bg-[#EBE7DE] pt-24 pb-12 px-6 text-[#5D5A53]">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        
        <div className="md:col-span-4">
          <h4 className="text-2xl font-serif text-[#2C2A26] mb-6">FlowState</h4>
          <p className="max-w-xs font-light leading-relaxed">
            Empowering communities to preserve our most vital resource through mindful living and collective action.
          </p>
        </div>

        <div className="md:col-span-4">
          <h4 className="font-medium text-[#2C2A26] mb-6 tracking-wide text-sm uppercase">Platform</h4>
          <ul className="space-y-4 font-light">
            <li><a href="#" onClick={(e) => {e.preventDefault(); onLinkClick('dashboard')}} className="hover:text-[#2C2A26] transition-colors underline-offset-4 hover:underline">Dashboard</a></li>
            <li><a href="#" onClick={(e) => {e.preventDefault(); onLinkClick('leaderboard')}} className="hover:text-[#2C2A26] transition-colors underline-offset-4 hover:underline">Global Leaderboard</a></li>
            <li><a href="#" onClick={(e) => {e.preventDefault(); onLinkClick('community')}} className="hover:text-[#2C2A26] transition-colors underline-offset-4 hover:underline">Events</a></li>
            <li><a href="#" onClick={(e) => {e.preventDefault(); onLinkClick('account')}} className="hover:text-[#2C2A26] transition-colors underline-offset-4 hover:underline">My Account</a></li>
          </ul>
        </div>
        
        <div className="md:col-span-4">
          <h4 className="font-medium text-[#2C2A26] mb-6 tracking-wide text-sm uppercase">Weekly Insights</h4>
          <div className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="email@address.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
              className="bg-transparent border-b border-[#A8A29E] py-2 text-lg outline-none focus:border-[#2C2A26] transition-colors placeholder-[#A8A29E]/70 text-[#2C2A26] disabled:opacity-50" 
            />
            <button 
              onClick={handleSubscribe}
              disabled={subscribeStatus !== 'idle' || !email}
              className="self-start text-sm font-medium uppercase tracking-widest mt-2 hover:text-[#2C2A26] disabled:cursor-default disabled:hover:text-[#5D5A53] disabled:opacity-50 transition-opacity"
            >
              {subscribeStatus === 'idle' && 'Subscribe'}
              {subscribeStatus === 'loading' && 'Subscribing...'}
              {subscribeStatus === 'success' && 'Subscribed'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mt-20 pt-8 border-t border-[#D6D1C7] flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-widest opacity-60">
        <p>&copy; 2025 FlowState Conservation.</p>
      </div>
    </footer>
  );
};

export default Footer;
