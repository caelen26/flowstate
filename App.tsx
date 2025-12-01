
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Dashboard from './components/Dashboard';
import Leaderboard from './components/Leaderboard';
import Community from './components/Community';
// import Assistant from './components/Assistant'; // DEACTIVATED: AI chatbot - uncomment to reactivate
import Footer from './components/Footer';
import Login from './components/Login';
import Account from './components/Account';
import { ViewState, User } from './types';
import { supabase } from './services/supabaseClient';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize view based on auth state
  const [view, setView] = useState<ViewState>({ type: 'landing' });

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchUserProfile(session.user.id);
        if (view.type === 'landing' || view.type === 'auth') {
          setView({ type: 'dashboard' });
        }
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchUserProfile(session.user.id);
        // Automatically redirect to dashboard if currently on auth or landing pages
        setView((prev) => 
          (prev.type === 'auth' || prev.type === 'landing') ? { type: 'dashboard' } : prev
        );
      } else {
        setUser(null);
        // Use functional update to avoid stale closure issues
        setView((prev) => prev.type !== 'landing' ? { type: 'landing' } : prev);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch Profile
      // Use maybeSingle() to handle "no rows found" gracefully without throwing PGRST116
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // SELF-HEALING: If profile is missing, try to create it manually using Auth metadata.
      if (!profile) {
         console.warn("Profile missing in DB. Attempting self-healing...");
         
         const { data: { user: authUser } } = await supabase.auth.getUser();
         if (authUser) {
             const newProfile = {
                 id: authUser.id,
                 username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User',
                 city: authUser.user_metadata?.city || 'Unknown',
                 country: authUser.user_metadata?.country || 'Unknown',
                 household_size: parseInt(authUser.user_metadata?.household_size || '1'),
                 avatar_url: `https://i.pravatar.cc/150?u=${authUser.id}`,
                 joined_date: new Date().toISOString().split('T')[0],
                 monthly_usage: 0
             };
             
             // Use upsert to handle race conditions safely
             const { data: insertedProfile, error: insertError } = await supabase
                .from('profiles')
                .upsert(newProfile, { onConflict: 'id' })
                .select()
                .single();
             
             if (!insertError && insertedProfile) {
                 // Recovery successful, use the new profile data
                 profile = insertedProfile;
                 console.log("Self-healing successful.");
             } else {
                 console.error("Self-healing failed:", JSON.stringify(insertError));
             }
         }
      }

      if (!profile) {
        console.error('Critical Error: User authenticated but profile could not be loaded.');
        await supabase.auth.signOut();
        return;
      }

      // Fetch Dashboard Data (Use maybeSingle as it might not exist yet)
      const { data: dashboard, error: dashboardError } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch Daily Hygiene Data
      const { data: dailyHygiene, error: dailyError } = await supabase
        .from('daily_hygiene_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch Streak Data
      const { data: streakInfo, error: streakError } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Map DB snake_case to App camelCase
      const appUser: User = {
        id: profile.id,
        username: profile.username,
        email: 'user@flowstate.app', // Email is hidden in profile, handled by auth
        avatar: profile.avatar_url || 'https://i.pravatar.cc/150?u=default',
        city: profile.city,
        country: profile.country,
        householdSize: profile.household_size,
        monthlyUsage: profile.monthly_usage,
        joinedDate: profile.joined_date,
        dashboardData: dashboard ? {
            inputs: dashboard.inputs,
            isSubmitted: dashboard.is_submitted,
            lastUpdated: dashboard.last_updated
        } : undefined,
        dailyHygieneData: dailyHygiene ? {
            inputs: dailyHygiene.inputs,
            isSubmitted: dailyHygiene.is_submitted,
            lastUpdated: dailyHygiene.last_updated
        } : undefined,
        streakData: streakInfo ? {
            currentStreak: streakInfo.current_streak,
            longestStreak: streakInfo.longest_streak,
            lastLogDate: streakInfo.last_log_date,
            totalPoints: streakInfo.total_points
        } : undefined
      };

      setUser(appUser);
    } catch (error) {
      console.error("Error building user object:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setView({ type: 'dashboard' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView({ type: 'landing' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserUpdate = (updatedUser: User) => {
     setUser(updatedUser);
  };

  // Navigation handler
  const handleNavClick = (targetId: string) => {
    // Special handling for 'about' anchor to ensure we are on the landing page first
    if (targetId === 'about') {
        if (view.type !== 'landing') {
            setView({ type: 'landing' });
            setTimeout(() => {
                 const el = document.getElementById('about');
                 if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
             const el = document.getElementById('about');
             if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (targetId === 'landing') {
        setView({ type: 'landing' });
        return;
    }
    
    if (targetId === 'auth') {
        setView({ type: 'auth', mode: 'login' });
        return;
    }
    if (targetId === 'signup') {
        setView({ type: 'auth', mode: 'signup' });
        return;
    }

    if (!isAuthenticated) {
        setView({ type: 'auth', mode: 'login' });
        return;
    }

    if (targetId === 'dashboard') setView({ type: 'dashboard' });
    else if (targetId === 'leaderboard') setView({ type: 'leaderboard' });
    else if (targetId === 'community') setView({ type: 'community' });
    else if (targetId === 'events') setView({ type: 'events' });
    else if (targetId === 'account') setView({ type: 'account' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-4 h-4 bg-[#2C2A26] rounded-full mb-2"></div>
           <span className="font-serif text-[#2C2A26]">Loading FlowState...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans text-[#2C2A26] selection:bg-[#D6D1C7] selection:text-[#2C2A26]">
      <Navbar 
        onNavClick={handleNavClick}
        activeView={view.type}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      
      <main>
        {view.type === 'landing' && (
            <>
                <Hero onNavClick={handleNavClick} />
                <About />
            </>
        )}

        {view.type === 'auth' && (
            <Login onLogin={handleLogin} initialMode={view.mode || 'login'} />
        )}

        {isAuthenticated && view.type === 'dashboard' && !user && (
             <div className="min-h-screen pt-32 flex justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#2C2A26] border-t-transparent rounded-full"></div>
             </div>
        )}

        {isAuthenticated && view.type === 'dashboard' && user && (
            <Dashboard user={user} onUpdateUser={handleUserUpdate} />
        )}

        {isAuthenticated && view.type === 'account' && user && (
            <Account user={user} onUpdateUser={handleUserUpdate} />
        )}

        {isAuthenticated && view.type === 'leaderboard' && (
            <Leaderboard />
        )}

        {/* Reuse Community Component for both Community and Events views */}
        {isAuthenticated && (view.type === 'community' || view.type === 'events') && (
            <Community initialTab={view.type === 'events' ? 'events' : 'feed'} />
        )}
      </main>

      <Footer onLinkClick={handleNavClick} />
      {/* <Assistant user={user} /> */} {/* DEACTIVATED: AI chatbot - uncomment to reactivate */}
    </div>
  );
}

export default App;
