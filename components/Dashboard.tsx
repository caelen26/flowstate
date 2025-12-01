
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useEffect } from 'react';
import { User, WaterUsageMetrics, DailyHygieneMetrics, WeeklyUsageMetrics } from '../types';
import { WATER_METRICS } from '../constants';
import { supabase } from '../services/supabaseClient';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

// --- Research-Backed Constants ---
const BASELINE_CANADIAN_WEEKLY = 4200;

const DEFAULT_DAILY_INPUTS: DailyHygieneMetrics = {
    showerMinutes: 8,
    baths: 0,
    faucetMinutes: 5,
    flushes: 5,
};

const DEFAULT_WEEKLY_INPUTS: WeeklyUsageMetrics = {
    laundryLoads: 4,
    dishwasherLoads: 5,
    gardenMinutes: 15,
    meatMeals: 7,
    newClothingItems: 1,
    milesDriven: 100,
    recyclingItems: 5,
    compostLbs: 2,
    aiQueries: 20,
};

const DEFAULT_INPUTS: WaterUsageMetrics = {
    showerMinutes: 8,
    baths: 1,
    faucetMinutes: 5,
    flushes: 5,
    laundryLoads: 4,
    dishwasherLoads: 5,
    gardenMinutes: 15,
    meatMeals: 7,
    newClothingItems: 1,
    milesDriven: 100,
    recyclingItems: 5,
    compostLbs: 2,
    aiQueries: 20,
};

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {

  // Helper: Check if a new day has started
  const isNewDay = useMemo(() => {
    if (!user.dailyHygieneData?.lastUpdated) return true;
    const lastDate = new Date(user.dailyHygieneData.lastUpdated).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  }, [user.dailyHygieneData?.lastUpdated]);

  // Helper: Check if 7 days have passed since last weekly update
  const isNewWeek = useMemo(() => {
    if (!user.dashboardData?.lastUpdated) return false;
    const last = new Date(user.dashboardData.lastUpdated).getTime();
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    return (now - last) > oneWeekMs;
  }, [user.dashboardData?.lastUpdated]);

  // Daily Hygiene Inputs
  const [dailyInputs, setDailyInputs] = useState<DailyHygieneMetrics>(() => {
      return user.dailyHygieneData?.inputs || DEFAULT_DAILY_INPUTS;
  });

  const [isDailySubmitted, setIsDailySubmitted] = useState(() => {
      if (isNewDay) return false;
      return user.dailyHygieneData?.isSubmitted || false;
  });

  // Weekly Household & Lifestyle Inputs
  const [weeklyInputs, setWeeklyInputs] = useState<WeeklyUsageMetrics>(() => {
      return {
        laundryLoads: user.dashboardData?.inputs.laundryLoads || DEFAULT_WEEKLY_INPUTS.laundryLoads,
        dishwasherLoads: user.dashboardData?.inputs.dishwasherLoads || DEFAULT_WEEKLY_INPUTS.dishwasherLoads,
        gardenMinutes: user.dashboardData?.inputs.gardenMinutes || DEFAULT_WEEKLY_INPUTS.gardenMinutes,
        meatMeals: user.dashboardData?.inputs.meatMeals || DEFAULT_WEEKLY_INPUTS.meatMeals,
        newClothingItems: user.dashboardData?.inputs.newClothingItems || DEFAULT_WEEKLY_INPUTS.newClothingItems,
        milesDriven: user.dashboardData?.inputs.milesDriven || DEFAULT_WEEKLY_INPUTS.milesDriven,
        recyclingItems: user.dashboardData?.inputs.recyclingItems || DEFAULT_WEEKLY_INPUTS.recyclingItems,
        compostLbs: user.dashboardData?.inputs.compostLbs || DEFAULT_WEEKLY_INPUTS.compostLbs,
        aiQueries: user.dashboardData?.inputs.aiQueries || DEFAULT_WEEKLY_INPUTS.aiQueries,
      };
  });

  const [isWeeklySubmitted, setIsWeeklySubmitted] = useState(() => {
      if (isNewWeek) return false;
      return user.dashboardData?.isSubmitted || false;
  });

  // Combined inputs for calculations
  const inputs = useMemo((): WaterUsageMetrics => ({
      ...dailyInputs,
      ...weeklyInputs
  }), [dailyInputs, weeklyInputs]);

  // Streak data
  const [streakData, setStreakData] = useState(() => user.streakData || {
      currentStreak: 0,
      longestStreak: 0,
      lastLogDate: '',
      totalPoints: 0
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'direct' | 'virtual'>('all');
  const [saving, setSaving] = useState(false);

  // Sync state if user prop changes
  useEffect(() => {
    // Sync daily hygiene data
    if (user.dailyHygieneData) {
        setDailyInputs(user.dailyHygieneData.inputs);
        const lastDate = new Date(user.dailyHygieneData.lastUpdated).toDateString();
        const today = new Date().toDateString();
        setIsDailySubmitted(lastDate === today && user.dailyHygieneData.isSubmitted);
    }

    // Sync weekly data
    if (user.dashboardData) {
        setWeeklyInputs({
            laundryLoads: user.dashboardData.inputs.laundryLoads,
            dishwasherLoads: user.dashboardData.inputs.dishwasherLoads,
            gardenMinutes: user.dashboardData.inputs.gardenMinutes,
            meatMeals: user.dashboardData.inputs.meatMeals,
            newClothingItems: user.dashboardData.inputs.newClothingItems,
            milesDriven: user.dashboardData.inputs.milesDriven,
            recyclingItems: user.dashboardData.inputs.recyclingItems,
            compostLbs: user.dashboardData.inputs.compostLbs,
            aiQueries: user.dashboardData.inputs.aiQueries,
        });

        // Re-evaluate weekly submission status
        if (user.dashboardData.lastUpdated) {
            const last = new Date(user.dashboardData.lastUpdated).getTime();
            const now = Date.now();
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
            setIsWeeklySubmitted((now - last) <= oneWeekMs && user.dashboardData.isSubmitted);
        } else {
            setIsWeeklySubmitted(user.dashboardData.isSubmitted);
        }
    }

    // Sync streak data
    if (user.streakData) {
        setStreakData(user.streakData);
    }
  }, [user.id, user.dashboardData, user.dailyHygieneData, user.streakData]);

  // --- Calculation Engine ---
  const stats = useMemo(() => {
    const householdDivisor = Math.max(1, user.householdSize || 1);

    // Weekly Calculations
    const showerWeekly = inputs.showerMinutes * WATER_METRICS.SHOWER_GPM * 7;
    const bathWeekly = inputs.baths * WATER_METRICS.BATH_GPB;
    const faucetWeekly = inputs.faucetMinutes * WATER_METRICS.FAUCET_GPM * 7;
    const toiletWeekly = inputs.flushes * WATER_METRICS.FLUSH_GPF * 7;
    
    // Shared Resources (Per Capita)
    const laundryWeekly = (inputs.laundryLoads * WATER_METRICS.LAUNDRY_GPL) / householdDivisor;
    const dishwasherWeekly = (inputs.dishwasherLoads * WATER_METRICS.DISHWASHER_GPC) / householdDivisor;
    const gardenWeekly = (inputs.gardenMinutes * WATER_METRICS.GARDEN_GPM) / householdDivisor;
    
    // Virtual & Lifestyle
    const clothingWeekly = inputs.newClothingItems * WATER_METRICS.CLOTHING_AVG_GPI; 
    const dietWeekly = inputs.meatMeals * WATER_METRICS.DIET_MEAT_GPM;
    const transportWeekly = inputs.milesDriven * WATER_METRICS.FUEL_GPM;
    const aiWeekly = inputs.aiQueries * WATER_METRICS.AI_QUERY_GPQ;

    // Credits (Offsets)
    const recyclingWeekly = inputs.recyclingItems * WATER_METRICS.RECYCLING_CREDIT;
    const compostWeekly = inputs.compostLbs * WATER_METRICS.COMPOST_CREDIT;

    const directTotal = showerWeekly + bathWeekly + faucetWeekly + toiletWeekly + laundryWeekly + dishwasherWeekly + gardenWeekly;
    const virtualTotal = clothingWeekly + dietWeekly + transportWeekly + aiWeekly + recyclingWeekly + compostWeekly;
    const grandTotal = directTotal + virtualTotal;

    // Comparison vs Canada Baseline
    const trend = ((grandTotal - BASELINE_CANADIAN_WEEKLY) / BASELINE_CANADIAN_WEEKLY) * 100;
    
    // Impact Score (0-100)
    // Target < 1500 is ideal
    const rawScore = 100 - ((grandTotal - 1500) / 40);
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    return {
      breakdown: {
        Showers: showerWeekly,
        Baths: bathWeekly,
        Toilet: toiletWeekly,
        Faucets: faucetWeekly,
        Laundry: laundryWeekly,
        Dishes: dishwasherWeekly,
        Garden: gardenWeekly,
        Clothing: clothingWeekly,
        Diet: dietWeekly,
        Transport: transportWeekly,
        'AI Usage': aiWeekly,
        'Recycling': recyclingWeekly, 
        'Compost': compostWeekly 
      },
      directTotal,
      virtualTotal,
      grandTotal,
      score,
      trend
    };
  }, [inputs, user.householdSize]);

  // Helper to calculate streak
  const calculateStreak = (lastLogDate: string, currentStreakFromDB: number): { currentStreak: number; isConsecutive: boolean } => {
    if (!lastLogDate) {
      // First time ever logging
      return { currentStreak: 1, isConsecutive: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLog = new Date(lastLogDate);
    lastLog.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastLog.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Same day - user already logged today, maintain current streak from DB
    if (diffDays === 0) {
      return { currentStreak: currentStreakFromDB, isConsecutive: true };
    }

    // Consecutive day (logged yesterday) - increment streak
    if (diffDays === 1) {
      return { currentStreak: currentStreakFromDB + 1, isConsecutive: true };
    }

    // Streak broken (more than 1 day gap)
    return { currentStreak: 1, isConsecutive: false };
  };

  const handleDailyInputChange = (field: keyof DailyHygieneMetrics, value: number) => {
    setDailyInputs(prev => ({ ...prev, [field]: value }));
    if (isDailySubmitted) setIsDailySubmitted(false);
  };

  const handleWeeklyInputChange = (field: keyof WeeklyUsageMetrics, value: number) => {
    setWeeklyInputs(prev => ({ ...prev, [field]: value }));
    if (isWeeklySubmitted) setIsWeeklySubmitted(false);
  };

  const handleDailySubmit = async () => {
      setSaving(true);

      const now = new Date().toISOString();
      const todayStr = new Date().toISOString().split('T')[0];

      // Prevent double-submission on the same day
      if (streakData.lastLogDate === todayStr) {
        alert("You've already logged today! Your streak is maintained.");
        setSaving(false);
        return;
      }

      // Calculate streak using current streak from database
      const { currentStreak, isConsecutive } = calculateStreak(streakData.lastLogDate, streakData.currentStreak);
      const longestStreak = Math.max(currentStreak, streakData.longestStreak);
      const totalPoints = streakData.totalPoints + 1; // 1 point per day logged

      const dailyHygienePayload = {
          user_id: user.id,
          inputs: dailyInputs,
          is_submitted: true,
          last_updated: now
      };

      const streakPayload = {
          user_id: user.id,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_log_date: todayStr,
          total_points: totalPoints
      };

      try {
          // 1. Save Daily Hygiene Data
          const { error: dailyError } = await supabase
            .from('daily_hygiene_data')
            .upsert(dailyHygienePayload, { onConflict: 'user_id' });

          if (dailyError) throw dailyError;

          // 2. Update Streak Data
          const { error: streakError } = await supabase
            .from('streak_data')
            .upsert(streakPayload, { onConflict: 'user_id' });

          if (streakError) throw streakError;

          // 3. Update Local State
          setIsDailySubmitted(true);
          const newStreakData = {
              currentStreak,
              longestStreak,
              lastLogDate: todayStr,
              totalPoints
          };
          setStreakData(newStreakData);

          const updatedUser = {
              ...user,
              dailyHygieneData: {
                  inputs: dailyInputs,
                  isSubmitted: true,
                  lastUpdated: now
              },
              streakData: newStreakData
          };

          onUpdateUser(updatedUser);
          window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (e) {
          console.error("Error saving daily data:", e);
          alert("Failed to save daily data. Please try again.");
      } finally {
          setSaving(false);
      }
  };

  const handleWeeklySubmit = async () => {
      setSaving(true);

      const now = new Date().toISOString();
      const newMonthlyUsage = Math.round(stats.grandTotal * 4);

      // Combine daily and weekly inputs for full calculation
      const combinedInputs: WaterUsageMetrics = {
          ...dailyInputs,
          ...weeklyInputs
      };

      const weeklyPayload = {
          user_id: user.id,
          inputs: combinedInputs,
          is_submitted: true,
          last_updated: now
      };

      try {
          // 1. Save Weekly Dashboard Data
          const { error: dbError } = await supabase
            .from('dashboard_data')
            .upsert(weeklyPayload, { onConflict: 'user_id' });

          if (dbError) throw dbError;

          // 2. Update Public Profile Stats (for Leaderboard)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ monthly_usage: newMonthlyUsage })
            .eq('id', user.id);

          if (profileError) throw profileError;

          // 3. Update Local State
          setIsWeeklySubmitted(true);
          const updatedUser = {
              ...user,
              dashboardData: {
                  inputs: combinedInputs,
                  isSubmitted: true,
                  lastUpdated: now
              },
              monthlyUsage: newMonthlyUsage
          };

          onUpdateUser(updatedUser);
          window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (e) {
          console.error("Error saving weekly data:", e);
          alert("Failed to save weekly data. Please try again.");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="bg-[#F5F2EB] min-h-screen pt-24 md:pt-32 px-4 md:px-6 pb-12">
      <div className="max-w-7xl mx-auto animate-fade-in-up">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-[#D6D1C7] pb-6 gap-6">
           <div className="flex-1">
             <h1 className="text-4xl md:text-6xl font-serif text-[#2C2A26] mb-3 leading-tight">Your Footprint</h1>
             <div className="flex flex-wrap items-center gap-4 text-[#5D5A53] font-light text-sm">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#A8A29E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{user.city}, {user.country}</span>
                </div>
                <span className="hidden md:inline text-[#D6D1C7]">|</span>
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#A8A29E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <span>Household of {user.householdSize}</span>
                </div>
             </div>
           </div>

           <div className="text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-[#EBE7DE] w-full md:w-auto space-y-4">
              {/* Streak Display */}
              <div className="bg-[#4A7C59]/10 p-4 rounded-lg border border-[#4A7C59]/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#4A7C59] block mb-1">
                      Daily Streak
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-serif text-[#4A7C59]">{streakData.currentStreak}</span>
                      <span className="text-sm text-[#5D5A53]">days</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#A8A29E] block">Best</span>
                    <span className="text-xl font-serif text-[#5D5A53]">{streakData.longestStreak}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Usage */}
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#A8A29E] block mb-2">
                    Estimated Weekly Usage
                </span>
                <div className="flex md:justify-end items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-serif leading-none text-[#2C2A26]">
                        {Math.round(stats.grandTotal).toLocaleString()}
                    </span>
                    <span className="text-xl text-[#5D5A53] font-light">gal</span>
                </div>
              </div>
           </div>
        </header>

        {/* New Day Prompt Banner */}
        {isNewDay && !isDailySubmitted && (
           <div className="bg-[#2C2A26] text-[#F5F2EB] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-[#4A7C59] shadow-lg animate-fade-in-up">
              <div>
                <h3 className="font-serif text-xl mb-1">Good morning! Log your daily usage</h3>
                <p className="text-sm text-white/70 font-light">Track your personal hygiene to maintain your streak</p>
              </div>
              <button
                onClick={() => document.getElementById('daily-log')?.scrollIntoView({ behavior: 'smooth' })}
                className="whitespace-nowrap px-6 py-3 bg-[#F5F2EB] text-[#2C2A26] text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-md w-full sm:w-auto"
              >
                Log Today
              </button>
           </div>
        )}

        {/* New Week Prompt Banner */}
        {isNewWeek && !isWeeklySubmitted && (
           <div className="bg-[#5D5A53] text-[#F5F2EB] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-[#A8A29E] shadow-lg animate-fade-in-up">
              <div>
                <h3 className="font-serif text-xl mb-1">A new week begins.</h3>
                <p className="text-sm text-white/70 font-light">Update your weekly household and lifestyle metrics</p>
              </div>
              <button
                onClick={() => document.getElementById('weekly-log')?.scrollIntoView({ behavior: 'smooth' })}
                className="whitespace-nowrap px-6 py-3 bg-[#F5F2EB] text-[#2C2A26] text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-md w-full sm:w-auto"
              >
                Update Week
              </button>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN: VISUALIZATION */}
            <div className="lg:col-span-7 space-y-8">
                
                {/* Impact Score Card */}
                <div className="bg-[#2C2A26] text-[#F5F2EB] p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                   
                   {/* Gauge */}
                   <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path className="text-[#F5F2EB] transition-all duration-1000 ease-out" strokeDasharray={`${stats.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl md:text-4xl font-serif">{stats.score}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-70">Score</span>
                      </div>
                   </div>

                   <div className="z-10 text-center md:text-left">
                       <h3 className="text-xl md:text-2xl font-serif mb-2">
                           {stats.score > 80 ? "Excellent Stewardship" : stats.score > 50 ? "Moderate Impact" : "High Consumption"}
                       </h3>
                       <p className="text-white/70 font-light leading-relaxed text-sm mb-4">
                           {stats.score > 80 
                             ? "You are a leader in conservation." 
                             : "Small changes in diet or shower time can have a massive impact."}
                       </p>
                       <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-medium uppercase tracking-widest">
                           <span className={`${stats.trend > 0 ? 'text-red-300' : 'text-green-300'}`}>
                               {stats.trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(stats.trend))}% vs Canada Avg
                           </span>
                           <span className="text-white/40 text-[9px]">(Env. Canada)</span>
                       </div>
                   </div>
                </div>

                {/* Breakdown Chart */}
                <div className="bg-white border border-[#EBE7DE] p-6 md:p-8 relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="font-serif text-xl text-[#2C2A26]">Usage Breakdown</h3>
                            <div className="flex gap-2">
                                {isDailySubmitted && (
                                    <span className="bg-[#4A7C59]/10 text-[#4A7C59] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Daily
                                    </span>
                                )}
                                {isWeeklySubmitted && (
                                    <span className="bg-[#4A7C59]/10 text-[#4A7C59] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Weekly
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                            {['all', 'direct', 'virtual'].map(mode => (
                                <button 
                                    key={mode}
                                    onClick={() => setActiveCategory(mode as any)}
                                    className={`text-[10px] uppercase tracking-widest px-3 py-1 border transition-colors whitespace-nowrap ${activeCategory === mode ? 'bg-[#2C2A26] text-white border-[#2C2A26]' : 'text-[#A8A29E] border-[#EBE7DE] hover:border-[#2C2A26]'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5">
                        {Object.entries(stats.breakdown).map(([category, val]) => {
                            const numericVal = val as number;
                            const isCredit = numericVal < 0; // Recycling/Compost
                            const isDirect = ['Showers', 'Baths', 'Toilet', 'Faucets', 'Laundry', 'Dishes', 'Garden'].includes(category);
                            
                            if (activeCategory === 'direct' && !isDirect) return null;
                            if (activeCategory === 'virtual' && isDirect) return null;
                            if (Math.abs(numericVal) < 1) return null;

                            const percent = (Math.abs(numericVal) / stats.grandTotal) * 100;
                            const displayPercent = Math.min(100, Math.max(percent, 1)); 

                            return (
                                <div key={category} className="group">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className={`font-medium ${isCredit ? 'text-[#4A7C59]' : 'text-[#5D5A53]'}`}>
                                          {category} {isCredit && '(Offset)'}
                                        </span>
                                        <span className={`${isCredit ? 'text-[#4A7C59]' : 'text-[#A8A29E]'}`}>
                                          {Math.round(numericVal).toLocaleString()} gal
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-[#F5F2EB] relative overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 ${
                                                isCredit ? 'bg-[#4A7C59]' : isDirect ? 'bg-[#8C8881]' : 'bg-[#2C2A26]'
                                            }`} 
                                            style={{ width: `${displayPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: CONTROLS */}
            <div className="lg:col-span-5 space-y-8">
                {/* Daily Hygiene Log */}
                <div id="daily-log" className="bg-white/50 border border-[#D6D1C7] p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6 gap-2">
                        <div>
                            <h3 className="font-serif text-xl text-[#2C2A26]">Daily Log</h3>
                            <p className="text-[10px] text-[#A8A29E] mt-1">Track your personal hygiene usage</p>
                        </div>
                        <div className="flex gap-2">
                            {isDailySubmitted && (
                                <button
                                    onClick={() => setIsDailySubmitted(false)}
                                    className="bg-transparent border border-[#2C2A26] text-[#2C2A26] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#EBE7DE] transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={handleDailySubmit}
                                disabled={isDailySubmitted || saving}
                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                    isDailySubmitted
                                        ? 'bg-[#4A7C59] text-white opacity-50 cursor-default'
                                        : 'bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#444]'
                                }`}
                            >
                                {saving ? 'Saving...' : (isDailySubmitted ? '✓ Logged' : 'Log Today')}
                            </button>
                        </div>
                    </div>

                    <div className={`space-y-6 transition-opacity duration-300 ${isDailySubmitted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {/* Personal Hygiene */}
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#4A7C59] mb-4 block">Personal Hygiene</span>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Shower Duration</label>
                                        <span className="font-serif">{dailyInputs.showerMinutes} min</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="25"
                                        value={dailyInputs.showerMinutes}
                                        onChange={(e) => handleDailyInputChange('showerMinutes', parseInt(e.target.value))}
                                        className="w-full accent-[#4A7C59] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Baths Today</label>
                                        <span className="font-serif">{dailyInputs.baths}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="3"
                                        value={dailyInputs.baths}
                                        onChange={(e) => handleDailyInputChange('baths', parseInt(e.target.value))}
                                        className="w-full accent-[#4A7C59] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Faucet Run Time (Teeth/Face)</label>
                                        <span className="font-serif">{dailyInputs.faucetMinutes} min</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="20"
                                        value={dailyInputs.faucetMinutes}
                                        onChange={(e) => handleDailyInputChange('faucetMinutes', parseInt(e.target.value))}
                                        className="w-full accent-[#4A7C59] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Toilet Flushes</label>
                                        <span className="font-serif">{dailyInputs.flushes}x</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="15"
                                        value={dailyInputs.flushes}
                                        onChange={(e) => handleDailyInputChange('flushes', parseInt(e.target.value))}
                                        className="w-full accent-[#4A7C59] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weekly Household & Lifestyle Log */}
                <div id="weekly-log" className="bg-white/50 border border-[#D6D1C7] p-6 md:p-8 lg:sticky lg:top-32">
                    <div className="flex justify-between items-center mb-6 gap-2">
                        <div>
                            <h3 className="font-serif text-xl text-[#2C2A26]">Weekly Log</h3>
                            <p className="text-[10px] text-[#A8A29E] mt-1">Track household & lifestyle usage</p>
                        </div>
                        <div className="flex gap-2">
                            {isWeeklySubmitted && (
                                <button
                                    onClick={() => setIsWeeklySubmitted(false)}
                                    className="bg-transparent border border-[#2C2A26] text-[#2C2A26] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#EBE7DE] transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={handleWeeklySubmit}
                                disabled={isWeeklySubmitted || saving}
                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                    isWeeklySubmitted
                                        ? 'bg-[#4A7C59] text-white opacity-50 cursor-default'
                                        : 'bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#444]'
                                }`}
                            >
                                {saving ? 'Saving...' : (isWeeklySubmitted ? '✓ Logged' : 'Log Week')}
                            </button>
                        </div>
                    </div>

                    <div className={`space-y-10 transition-opacity duration-300 ${isWeeklySubmitted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {/* Household */}
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#A8A29E] mb-6 block">Shared Household (Weekly Total)</span>
                            <p className="text-[10px] text-[#A8A29E] mb-4 -mt-4">These values are divided by your household size ({user.householdSize}).</p>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Laundry Loads</label>
                                        <span className="font-serif">{weeklyInputs.laundryLoads}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="15"
                                        value={weeklyInputs.laundryLoads}
                                        onChange={(e) => handleWeeklyInputChange('laundryLoads', parseInt(e.target.value))}
                                        className="w-full accent-[#2C2A26] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Dishwasher Loads</label>
                                        <span className="font-serif">{weeklyInputs.dishwasherLoads}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="14"
                                        value={weeklyInputs.dishwasherLoads}
                                        onChange={(e) => handleWeeklyInputChange('dishwasherLoads', parseInt(e.target.value))}
                                        className="w-full accent-[#2C2A26] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Garden Watering (Minutes)</label>
                                        <span className="font-serif">{weeklyInputs.gardenMinutes}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="120" step="5"
                                        value={weeklyInputs.gardenMinutes}
                                        onChange={(e) => handleWeeklyInputChange('gardenMinutes', parseInt(e.target.value))}
                                        className="w-full accent-[#2C2A26] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lifestyle */}
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#A8A29E] mb-6 block">Lifestyle (Weekly)</span>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Meat-based Meals</label>
                                        <span className="font-serif">{weeklyInputs.meatMeals}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="21"
                                        value={weeklyInputs.meatMeals}
                                        onChange={(e) => handleWeeklyInputChange('meatMeals', parseInt(e.target.value))}
                                        className="w-full accent-[#2C2A26] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>New Clothing Items</label>
                                        <span className="font-serif">{weeklyInputs.newClothingItems}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="5"
                                        value={weeklyInputs.newClothingItems}
                                        onChange={(e) => handleWeeklyInputChange('newClothingItems', parseInt(e.target.value))}
                                        className="w-full accent-[#2C2A26] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>Miles Driven</label>
                                        <span className="font-serif">{weeklyInputs.milesDriven}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="500" step="10"
                                        value={weeklyInputs.milesDriven}
                                        onChange={(e) => handleWeeklyInputChange('milesDriven', parseInt(e.target.value))}
                                        className="w-full accent-[#2C2A26] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tech & Sustainable Actions */}
                         <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#A8A29E] mb-6 block">Tech & Circularity (Weekly)</span>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#5D5A53]">
                                        <label>AI Queries (Chat/GenAI)</label>
                                        <span className="font-serif">{weeklyInputs.aiQueries}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="200" step="10"
                                        value={weeklyInputs.aiQueries}
                                        onChange={(e) => handleWeeklyInputChange('aiQueries', parseInt(e.target.value))}
                                        className="w-full accent-[#2C2A26] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-[10px] text-[#A8A29E] mt-1">Data center cooling consumes ~0.13 gal per heavy session.</p>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#4A7C59]">
                                        <label>Items Recycled (Plastic/Alum)</label>
                                        <span className="font-serif">-{weeklyInputs.recyclingItems} credit</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="50"
                                        value={weeklyInputs.recyclingItems}
                                        onChange={(e) => handleWeeklyInputChange('recyclingItems', parseInt(e.target.value))}
                                        className="w-full accent-[#4A7C59] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 text-sm text-[#4A7C59]">
                                        <label>Compost (Lbs diverted)</label>
                                        <span className="font-serif">-{weeklyInputs.compostLbs} lbs</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="20"
                                        value={weeklyInputs.compostLbs}
                                        onChange={(e) => handleWeeklyInputChange('compostLbs', parseInt(e.target.value))}
                                        className="w-full accent-[#4A7C59] h-1.5 bg-[#D6D1C7] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-12 pt-8 border-t border-[#D6D1C7]">
                             <p className="text-xs text-[#A8A29E] leading-relaxed text-center">
                                 Estimates based on research from Environment Canada, USGS, and Water Footprint Network.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
