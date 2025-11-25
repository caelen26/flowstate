
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { supabase } from '../services/supabaseClient';

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, monthly_usage')
            .gt('monthly_usage', 0)
            .order('monthly_usage', { ascending: true }) // Lower is better
            .limit(20);
        
        if (error) throw error;

        if (data) {
            const mappedData: LeaderboardEntry[] = data.map(u => ({
                id: u.id,
                username: u.username,
                avatar: u.avatar_url,
                monthlyUsage: u.monthly_usage,
                trend: 'stable' // Can't calculate trend without historical snapshot, defaulting
            }));
            setLeaders(mappedData);
        }
    } catch (e) {
        console.error("Error loading leaderboard data", e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] pt-24 md:pt-32 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-5xl font-serif text-[#2C2A26] mb-4">Community Impact</h2>
                <p className="text-[#5D5A53] font-light">Honoring those who tread lightly on the earth.</p>
            </div>

            <div className="bg-white/50 border border-[#D6D1C7] overflow-hidden min-h-[300px] shadow-sm">
                <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b border-[#D6D1C7] bg-[#EBE7DE]/30 text-xs font-bold uppercase tracking-widest text-[#A8A29E]">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-7">User</div>
                    <div className="col-span-3 text-right">Monthly Usage</div>
                </div>

                {loading ? (
                    <div className="py-24 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-[#2C2A26] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : leaders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                        <p className="text-[#5D5A53] text-lg font-serif mb-2">No pioneers yet.</p>
                        <p className="text-[#A8A29E] text-sm">Log your water usage in the Dashboard to appear here.</p>
                    </div>
                ) : (
                    leaders.map((user, index) => (
                        <div key={user.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:p-6 border-b border-[#D6D1C7] items-center hover:bg-white transition-colors group">
                            
                            {/* Mobile Rank + User Row */}
                            <div className="flex items-center w-full md:col-span-9 gap-4">
                                <div className="flex-shrink-0 w-8 flex justify-center">
                                    {index < 3 ? (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[#F5F2EB] font-serif ${
                                            index === 0 ? 'bg-[#D4AF37]' : index === 1 ? 'bg-[#A8A29E]' : 'bg-[#CD7F32]'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    ) : (
                                        <span className="text-[#5D5A53] font-serif text-lg">{index + 1}</span>
                                    )}
                                </div>
                                
                                <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full bg-[#EBE7DE] object-cover grayscale group-hover:grayscale-0 transition-all" />
                                
                                <div className="flex-1">
                                    <span className="block text-[#2C2A26] font-medium">{user.username}</span>
                                    <span className="text-xs text-[#A8A29E]">{user.trend === 'down' ? '↓ Reducing' : '— Stable'}</span>
                                </div>

                                {/* Mobile Only Usage Display (Right aligned on same row) */}
                                <div className="md:hidden text-right">
                                    <span className="font-serif text-lg text-[#2C2A26]">{user.monthlyUsage}</span>
                                    <span className="text-xs text-[#A8A29E] ml-1">gal</span>
                                </div>
                            </div>

                            {/* Desktop Usage Column */}
                            <div className="hidden md:block col-span-3 text-right">
                                <span className="font-serif text-xl text-[#2C2A26]">{user.monthlyUsage}</span>
                                <span className="text-xs text-[#A8A29E] ml-1">gal</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;
