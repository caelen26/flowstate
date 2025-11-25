/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';

const Features: React.FC = () => {
  return (
    <section className="bg-[#EBE7DE]">
      {/* Feature Block 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
        <div className="order-2 lg:order-1 relative h-[500px] lg:h-auto overflow-hidden">
           <img 
             src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=1200" 
             alt="Natural Stone Texture" 
             className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]"
           />
        </div>
        <div className="order-1 lg:order-2 flex flex-col justify-center p-12 lg:p-24 bg-[#EBE7DE]">
           <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8A29E] mb-6">Data & Insight</span>
           <h3 className="text-4xl md:text-5xl font-serif mb-8 text-[#2C2A26] leading-tight">
             Knowledge flows <br/> like a river.
           </h3>
           <p className="text-lg text-[#5D5A53] font-light leading-relaxed mb-12 max-w-md">
             We empower you with granular data about your showers, appliances, and lifestyle choices. Understanding your usage is the first step towards meaningful conservation.
           </p>
        </div>
      </div>

      {/* Feature Block 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
        <div className="flex flex-col justify-center p-12 lg:p-24 bg-[#2C2A26] text-[#F5F2EB]">
           <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8A29E] mb-6">Community</span>
           <h3 className="text-4xl md:text-5xl font-serif mb-8 text-[#F5F2EB] leading-tight">
             Collective Action.
           </h3>
           <p className="text-lg text-[#A8A29E] font-light leading-relaxed mb-12 max-w-md">
             You are not alone in this journey. Join a global leaderboard of conscious individuals, participate in local cleanups, and share your milestones with the FlowState community.
           </p>
        </div>
        <div className="relative h-[500px] lg:h-auto overflow-hidden">
           <img 
             src="https://images.pexels.com/photos/6801917/pexels-photo-6801917.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
             alt="Woman sitting on wooden floor reading" 
             className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s] brightness-90"
           />
        </div>
      </div>
    </section>
  );
};

export default Features;
