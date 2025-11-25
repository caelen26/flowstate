
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'signup';
}

const Login: React.FC<LoginProps> = ({ onLogin, initialMode = 'login' }) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Signup Fields
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);

  // Sync initialMode if it changes prop-wise
  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
    setError(null);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        if (isSignUp) {
            // 1. Sign Up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        city,
                        country,
                        household_size: Number(householdSize), // Ensure integer
                    }
                }
            });

            if (authError) throw authError;

            // Handle Signup Success
            if (authData.user) {
                // 2. EXPLICITLY create/ensure profile exists in DB
                const newProfile = {
                    id: authData.user.id,
                    username: username,
                    city: city,
                    country: country,
                    household_size: Number(householdSize),
                    avatar_url: `https://i.pravatar.cc/150?u=${authData.user.id}`,
                    monthly_usage: 0,
                    joined_date: new Date().toISOString().split('T')[0]
                };

                // Only attempt to write to DB if we have a session (user is logged in).
                if (authData.session) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert(newProfile);

                    if (profileError) {
                        console.error("Profile creation warning:", JSON.stringify(profileError));
                    } else {
                        // 3. AUTO-JOIN FLOWSTATE GROUP
                        // Find the group ID for 'FlowState'
                        const { data: groupData } = await supabase
                            .from('groups')
                            .select('id')
                            .eq('name', 'FlowState')
                            .single();

                        if (groupData) {
                            await supabase.from('group_members').insert({
                                group_id: groupData.id,
                                user_id: authData.user.id
                            });
                        }
                    }

                    // User logged in immediately
                    const appUser: User = {
                        id: authData.user.id,
                        username: username,
                        email: email,
                        avatar: newProfile.avatar_url,
                        city: city,
                        country: country,
                        householdSize: Number(householdSize),
                        monthlyUsage: 0,
                        joinedDate: new Date().toLocaleDateString()
                    };
                    onLogin(appUser);
                } else {
                    // Email confirmation required
                    alert("Account created! Please check your email inbox to confirm your account before logging in.");
                    setIsSignUp(false); 
                }
            }

        } else {
            // Sign In
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes("Email not confirmed")) {
                    throw new Error("Please check your email inbox to confirm your account.");
                }
                throw error;
            }
            // App.tsx auth listener handles the rest
        }
    } catch (e: any) {
        console.error("Auth Error:", e);
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center p-6 relative overflow-hidden pt-24">
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-[#EBE7DE] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
          <div className="absolute top-1/3 -right-1/4 w-[600px] h-[600px] bg-[#D6D1C7] rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
       </div>

       <div className="relative z-10 w-full max-w-md bg-white/50 backdrop-blur-lg border border-[#D6D1C7] p-8 md:p-12 shadow-2xl shadow-[#2C2A26]/5 animate-fade-in-up">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif text-[#2C2A26] mb-2">FlowState</h1>
            <p className="text-[#5D5A53] font-light tracking-wide">Track your flow. Preserve the source.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E]">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E]">City</label>
                            <input 
                                type="text" 
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E]">Country</label>
                            <input 
                                type="text" 
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E]">Household Size</label>
                        <input 
                            type="number" 
                            min="1"
                            max="20"
                            value={householdSize}
                            onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
                            className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                            required
                        />
                    </div>
                </>
            )}
            
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E]">Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E]">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#2C2A26] focus:border-[#2C2A26] outline-none transition-colors"
                    required
                />
            </div>

            {error && (
                <p className="text-red-600 text-xs font-medium uppercase tracking-widest text-center bg-red-50 p-3 border border-red-100 leading-relaxed">{error}</p>
            )}

            <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#2C2A26] text-[#F5F2EB] uppercase tracking-widest text-sm font-medium hover:bg-[#433E38] transition-all mt-8 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="text-xs text-[#5D5A53] hover:text-[#2C2A26] underline underline-offset-4"
            >
                {isSignUp ? 'Already have an account? Sign In' : 'New to FlowState? Create Account'}
            </button>
          </div>
       </div>
    </div>
  );
};

export default Login;
