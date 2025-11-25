
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { WATER_METRICS } from '../constants';

interface AssistantProps {
  user: User | null;
}

const Assistant: React.FC<AssistantProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello. I am your conservation guide. Ask me about reducing your water footprint or sustainable habits.', timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset chat if user changes (e.g. logs in/out)
  useEffect(() => {
    setMessages([
      { role: 'model', text: user 
        ? `Hello ${user.username}. I have access to your water usage data. How can I help you optimize your footprint today?` 
        : 'Hello. I am your conservation guide. Ask me about reducing your water footprint or sustainable habits.', 
        timestamp: Date.now() 
      }
    ]);
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const getUserContext = (): string | undefined => {
    if (!user || !user.dashboardData) return undefined;

    const d = user.dashboardData.inputs;
    const householdDivisor = Math.max(1, user.householdSize || 1);
    
    // Calculate actual gallons for context
    const showerGal = Math.round(d.showerMinutes * WATER_METRICS.SHOWER_GPM * 7);
    const bathGal = Math.round(d.baths * WATER_METRICS.BATH_GPB);
    const faucetGal = Math.round(d.faucetMinutes * WATER_METRICS.FAUCET_GPM * 7);
    const toiletGal = Math.round(d.flushes * WATER_METRICS.FLUSH_GPF * 7);
    const dietGal = Math.round(d.meatMeals * WATER_METRICS.DIET_MEAT_GPM);
    const clothingGal = Math.round(d.newClothingItems * WATER_METRICS.CLOTHING_AVG_GPI);
    
    // Shared
    const gardenGal = Math.round((d.gardenMinutes * WATER_METRICS.GARDEN_GPM) / householdDivisor);
    const laundryGal = Math.round((d.laundryLoads * WATER_METRICS.LAUNDRY_GPL) / householdDivisor);

    const totalDirect = showerGal + bathGal + faucetGal + toiletGal + laundryGal + gardenGal;
    const totalVirtual = dietGal + clothingGal;

    return `
      User Name: ${user.username}
      Location: ${user.city}, ${user.country}
      Household Size: ${user.householdSize} people
      
      WEEKLY WATER USAGE DATA (Calculated):
      
      -- Direct Usage (Hygiene & Home) --
      - Showers: ${d.showerMinutes} mins/day -> ${showerGal} gal/week
      - Baths: ${d.baths} per week -> ${bathGal} gal/week
      - Toilet Flushes: ${d.flushes} per day -> ${toiletGal} gal/week
      - Faucets: ${d.faucetMinutes} mins/day -> ${faucetGal} gal/week
      - Laundry: ${d.laundryLoads} loads/week (Shared) -> ${laundryGal} gal/week (My Share)
      - Garden: ${d.gardenMinutes} mins/week (Shared) -> ${gardenGal} gal/week (My Share)
      
      -- Virtual & Lifestyle --
      - Meat Meals: ${d.meatMeals} per week -> ${dietGal} gal/week
      - Clothing: ${d.newClothingItems} items/week -> ${clothingGal} gal/week
      - AI Queries: ${d.aiQueries} per week
      
      -- TOTALS --
      Total Direct Usage: ${totalDirect} gal/week
      Total Virtual Usage: ${totalVirtual} gal/week
      Total Footprint: ${totalDirect + totalVirtual} gal/week
    `;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const userContext = getUserContext();
      
      const responseText = await sendMessageToGemini(history, userMsg.text, userContext);
      
      const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        // Error handled in service
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-[#F5F2EB] rounded-none shadow-2xl shadow-[#2C2A26]/10 w-[90vw] sm:w-[380px] h-[550px] mb-6 flex flex-col overflow-hidden border border-[#D6D1C7] animate-slide-up-fade">
          {/* Header */}
          <div className="bg-[#EBE7DE] p-5 border-b border-[#D6D1C7] flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#4A7C59] rounded-full animate-pulse"></div>
                <span className="font-serif italic text-[#2C2A26] text-lg">
                  {user ? `${user.username}'s Guide` : 'Guide'}
                </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#A8A29E] hover:text-[#2C2A26] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F5F2EB]" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-5 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#2C2A26] text-[#F5F2EB]' 
                      : 'bg-white border border-[#EBE7DE] text-[#5D5A53] shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
               <div className="flex justify-start">
                 <div className="bg-white border border-[#EBE7DE] p-5 flex gap-1 items-center shadow-sm">
                   <div className="w-1.5 h-1.5 bg-[#A8A29E] rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-[#A8A29E] rounded-full animate-bounce delay-75"></div>
                   <div className="w-1.5 h-1.5 bg-[#A8A29E] rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 bg-[#F5F2EB] border-t border-[#D6D1C7]">
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={user ? "Ask about your data..." : "Ask about conservation..."}
                className="flex-1 bg-white border border-[#D6D1C7] focus:border-[#2C2A26] px-4 py-3 text-sm outline-none transition-colors placeholder-[#A8A29E] text-[#2C2A26]"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking}
                className="bg-[#2C2A26] text-[#F5F2EB] px-4 hover:bg-[#444] transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#2C2A26] text-[#F5F2EB] w-14 h-14 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-500 z-50"
      >
        {isOpen ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
             </svg>
        ) : (
            <span className="font-serif italic text-lg">Ai</span>
        )}
      </button>
    </div>
  );
};

export default Assistant;
