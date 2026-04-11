
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
const BASELINE_CANADIAN_WEEKLY = 168000;

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


const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    let totalDuration = 2000;
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / totalDuration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * (end - start) + start));
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <>{displayValue}</>;
};


const CustomSlider: React.FC<{
  min: number; max: number; step?: number; value: number; onChange: (val: number) => void;
}> = ({ min, max, step = 1, value, onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <>
      <style>{'\n' +
        '.slider-custom::-webkit-slider-thumb {\n' +
        '  -webkit-appearance: none;\n' +
        '  appearance: none;\n' +
        '  width: 24px;\n' +
        '  height: 24px;\n' +
        '  background: #5F7A65;\n' +
        '  border-radius: 50%;\n' +
        '  cursor: pointer;\n' +
        '  box-shadow: 0 2px 6px rgba(0,0,0,0.15);\n' +
        '  transition: transform 0.1s;\n' +
        '}\n' +
        '.slider-custom::-webkit-slider-thumb:hover {\n' +
        '  transform: scale(1.15);\n' +
        '}\n' +
        '.slider-custom::-moz-range-thumb {\n' +
        '  width: 24px;\n' +
        '  height: 24px;\n' +
        '  background: #5F7A65;\n' +
        '  border-radius: 50%;\n' +
        '  cursor: pointer;\n' +
        '  border: none;\n' +
        '  box-shadow: 0 2px 6px rgba(0,0,0,0.15);\n' +
        '}\n'
      }</style>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-3 md:h-4 rounded-full appearance-none outline-none cursor-pointer slider-custom"
        style={{
          background: `linear-gradient(to right, #98A89A ${percentage}%, #E8DFC8 ${percentage}%)`
        }}
      />
    </>
  );
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
    const showerWeekly = inputs.showerMinutes * WATER_METRICS.SHOWER_LITRES_PER_MINUTE * 7;
    const bathWeekly = inputs.baths * WATER_METRICS.BATH_LITRES_PER_TUB;
    const faucetWeekly = inputs.faucetMinutes * WATER_METRICS.FAUCET_LITRES_PER_MINUTE * 7;
    const toiletWeekly = inputs.flushes * WATER_METRICS.TOILET_LITRES_PER_FLUSH * 7;
    
    // Shared Resources (Per Capita)
    const laundryWeekly = (inputs.laundryLoads * WATER_METRICS.LAUNDRY_LITRES_PER_LOAD_HE) / householdDivisor;
    const dishwasherWeekly = (inputs.dishwasherLoads * WATER_METRICS.DISHWASHER_LITRES_PER_CYCLE_ENERGYSTAR) / householdDivisor;
    const gardenWeekly = (inputs.gardenMinutes * WATER_METRICS.GARDEN_SPRINKLER_LITRES_PER_MINUTE) / householdDivisor;
    
    // Virtual & Lifestyle
    const clothingWeekly = inputs.newClothingItems * WATER_METRICS.CLOTHING_LITRES_PER_ITEM; 
    const dietWeekly = inputs.meatMeals * WATER_METRICS.MEAT_BEEF_LITRES_PER_MEAL;
    const transportWeekly = inputs.milesDriven * WATER_METRICS.TRANSPORT_LITRES_PER_KM;
    const aiWeekly = inputs.aiQueries * WATER_METRICS.AI_LITRES_PER_QUERY;

    // Credits (Offsets)
    const recyclingWeekly = inputs.recyclingItems * WATER_METRICS.RECYCLING_LITRES_SAVED_PER_ITEM;
    const compostWeekly = inputs.compostLbs * WATER_METRICS.COMPOSTING_LITRES_SAVED_PER_KG;

    const directTotal = showerWeekly + bathWeekly + faucetWeekly + toiletWeekly + laundryWeekly + dishwasherWeekly + gardenWeekly;
    const virtualTotal = clothingWeekly + dietWeekly + transportWeekly + aiWeekly - recyclingWeekly - compostWeekly;
    const grandTotal = directTotal + virtualTotal;

    // Comparison vs Canada Baseline
    const trend = ((grandTotal - BASELINE_CANADIAN_WEEKLY) / BASELINE_CANADIAN_WEEKLY) * 100;
    
    // Impact Score (0-100)
    // Target <= 100000 L is ideal
    const rawScore = 100 - ((grandTotal - 100000) / 1360);
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
    <div className="bg-[#F5F0E8] min-h-screen pt-24 md:pt-32 px-4 md:px-6 pb-12 relative overflow-hidden text-[#2C2A26]">
      {/* OTTER MASCOT OVERLAY */}
      <div id="otter-mascot" className="fixed bottom-6 right-6 w-20 h-20 bg-[#98A89A] rounded-full flex items-center justify-center text-4xl shadow-lg shadow-[#98A89A]/30 animate-bounce cursor-pointer z-50 hover:bg-[#859F94] transition-colors" title="FlowState Guide">
        🦦
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HERO SECTION */}
        <header className="mb-16 pt-8 animate-fade-in-up flex flex-col items-center w-full">
          <h1 className="text-5xl md:text-7xl font-serif text-[#2C2A26] mb-4 text-center">
             {(() => {
                const hour = new Date().getHours();
                let firstName = user?.firstName || (user?.username ? user.username.split(' ')[0] : '');
                if (firstName) {
                    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
                }
                const formatName = firstName ? ` ${firstName}` : '';
                if (hour < 12) return 'Good Morning' + formatName;
                if (hour < 17) return 'Good Afternoon' + formatName;
                return 'Good Evening' + formatName;
             })()}
          </h1>
          <p className="text-lg text-[#789094] font-medium mb-12 text-center">Your personal conservation journal.</p>

          <div className="flex flex-col items-center w-full max-w-4xl mx-auto relative z-10 gap-8">
            
            {/* Centerpiece: Score Ring - always centered */}
            <div className="flex flex-col items-center relative group shrink-0">
              <div className="w-52 h-52 md:w-64 md:h-64 relative flex items-center justify-center bg-white rounded-full shadow-[0_8px_40px_rgba(152,168,154,0.15)] group-hover:-translate-y-2 group-hover:shadow-[0_15px_50px_rgba(152,168,154,0.25)] transition-all duration-700">
                <svg className="w-full h-full absolute inset-0 -rotate-90 p-3" viewBox="0 0 36 36">
                  <path className="text-[#F5F0E8]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path className="text-[#98A89A] transition-all duration-1000 ease-out" strokeDasharray={`${stats.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div className="flex flex-col items-center text-center">
                    <span className="text-6xl md:text-7xl font-serif text-[#2C2A26]">
                       <AnimatedNumber value={stats.score} />
                    </span>
                    <span className="text-xs uppercase tracking-widest text-[#98A89A] mt-2 font-bold">Water Score</span>
                </div>
              </div>
              <h3 className="font-serif text-2xl mt-6 text-[#2C2A26]">
                 {stats.score > 80 ? "Excellent Stewardship" : stats.score > 50 ? "Moderate Impact" : "High Consumption"}
              </h3>
            </div>

            {/* Weekly + Streak row — side by side on all sizes */}
            <div className="flex flex-row items-center justify-center gap-8 w-full">
              {/* Weekly Usage Stats */}
              <div className="flex flex-col items-center group cursor-default">
                <span className="text-xs font-bold uppercase tracking-widest text-[#789094] mb-1 opacity-80 group-hover:opacity-100 transition-opacity">Weekly Est.</span>
                <div className="flex items-baseline gap-1 mb-1">
                   <span className="text-4xl md:text-6xl font-serif text-[#2C2A26] tracking-tight">
                      <AnimatedNumber value={Math.round(stats.grandTotal)} />
                   </span>
                   <span className="text-base text-[#98A89A] font-light">L</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="bg-[#98A89A]/20 text-[#5F7A65] px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                     <AnimatedNumber value={Math.abs(Math.round(stats.trend))} />% {stats.trend > 0 ? 'above' : 'below'} avg
                   </span>
                </div>
                <p className="text-[10px] text-[#A8A29E] mt-3 text-center max-w-[150px] leading-tight">Your estimated total water footprint, including virtual water in food, clothing & daily consumption.</p>
              </div>

              {/* Divider */}
              <div className="w-px h-16 bg-[#D6D1C7]/50"></div>

              {/* Streak */}
              <div className="flex flex-col items-center group cursor-default">
                <span className="text-xs font-bold uppercase tracking-widest text-[#789094] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">Streak</span>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-[#D5D0C6] flex flex-col items-center justify-center bg-white/50 shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-500">
                  <span className="text-3xl md:text-4xl font-serif text-[#2C2A26]">
                     <AnimatedNumber value={streakData.currentStreak} />
                  </span>
                  <span className="text-[10px] text-[#98A89A] uppercase font-bold tracking-wider mt-0.5">Days</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Organic SVG Divider */}
        <div className="w-full flex justify-center mb-16 opacity-30 text-[#98A89A]">
            <svg width="200" height="20" viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 10C50 10 50 0 100 0C150 0 150 10 200 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>

        {/* TODAY'S CHECK-IN UNIFIED CARD */}
        {(!isDailySubmitted || !isWeeklySubmitted) && (
          <div className="mb-12 bg-white rounded-3xl p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-[#E8DFC8] flex flex-col md:flex-row justify-between items-center gap-6 animate-fade-in-up hover:-translate-y-1 transition-transform duration-500 delay-100">
            <div className="text-center md:text-left">
              <h3 className="font-serif text-2xl text-[#2C2A26] mb-2">Today's Check-in</h3>
              <p className="text-[#789094] font-medium text-sm">Your actions today ripple into tomorrow.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {!isDailySubmitted && (
                 <button onClick={() => document.getElementById('daily-log')?.scrollIntoView({ behavior: 'smooth' })} className="whitespace-nowrap px-8 py-3.5 bg-[#98A89A] text-white rounded-full text-sm font-semibold hover:bg-[#859F94] transition-colors shadow-sm w-full sm:w-auto">
                    Log Daily Use
                 </button>
              )}
              {!isWeeklySubmitted && (
                 <button onClick={() => document.getElementById('weekly-log')?.scrollIntoView({ behavior: 'smooth' })} className="whitespace-nowrap px-8 py-3.5 bg-white border border-[#E8DFC8] text-[#2C2A26] rounded-full text-sm font-semibold hover:bg-[#F5F0E8] transition-colors w-full sm:w-auto">
                    Update Habits
                 </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pb-12">
            
            {/* DAILY LOG PANEL */}
            <div id="daily-log" className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-[#E8DFC8]/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 animate-fade-in-up delay-200">
                <div className="flex justify-between items-center mb-8 gap-2">
                    <div>
                        <h3 className="font-serif text-2xl text-[#2C2A26]">Daily Log</h3>
                        <p className="text-xs text-[#98A89A] mt-1 font-medium tracking-wide">Track your personal hygiene usage</p>
                    </div>
                    <div className="flex gap-2">
                        {isDailySubmitted && (
                            <button
                                onClick={() => setIsDailySubmitted(false)}
                                className="bg-transparent text-[#789094] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-[#2C2A26] transition-colors"
                            >
                                Edit
                            </button>
                        )}
                        <button
                            onClick={handleDailySubmit}
                            disabled={isDailySubmitted || saving}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                isDailySubmitted
                                    ? 'bg-[#98A89A] text-[#F5F0E8] shadow-sm cursor-default'
                                    : 'bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#444]'
                            }`}
                        >
                            {saving ? 'Saving...' : (isDailySubmitted ? '✓ Logged' : 'Log Today')}
                        </button>
                    </div>
                </div>

                <div className={`space-y-6 transition-opacity duration-300 ${isDailySubmitted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="space-y-6">
                        <div className="group border-b border-[#98A89A]/20 pb-6">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Shower Duration</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.showerMinutes} <span className="text-sm font-sans text-[#98A89A]">min</span></span>
                            </div>
                            <CustomSlider min={1} max={25} value={dailyInputs.showerMinutes} onChange={(val) => handleDailyInputChange('showerMinutes', val)} />
                        </div>
                        <div className="group border-b border-[#98A89A]/20 pb-6">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Baths Today</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.baths} <span className="text-sm font-sans text-[#98A89A]">tubs</span></span>
                            </div>
                            <CustomSlider min={0} max={3} value={dailyInputs.baths} onChange={(val) => handleDailyInputChange('baths', val)} />
                        </div>
                        <div className="group border-b border-[#98A89A]/20 pb-6">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Faucet Run Time</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.faucetMinutes} <span className="text-sm font-sans text-[#98A89A]">min</span></span>
                            </div>
                            <CustomSlider min={1} max={20} value={dailyInputs.faucetMinutes} onChange={(val) => handleDailyInputChange('faucetMinutes', val)} />
                        </div>
                        <div className="group">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Toilet Flushes</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.flushes} <span className="text-sm font-sans text-[#98A89A]">times</span></span>
                            </div>
                            <CustomSlider min={1} max={15} value={dailyInputs.flushes} onChange={(val) => handleDailyInputChange('flushes', val)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* WEEKLY LOG PANEL */}
            <div id="weekly-log" className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-[#E8DFC8]/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 animate-fade-in-up delay-300">
                <div className="flex justify-between items-center mb-8 gap-2">
                    <div>
                        <h3 className="font-serif text-2xl text-[#2C2A26]">Habits & Weekly</h3>
                        <p className="text-xs text-[#98A89A] mt-1 font-medium tracking-wide">Household and lifestyle</p>
                    </div>
                    <div className="flex gap-2">
                        {isWeeklySubmitted && (
                            <button
                                onClick={() => setIsWeeklySubmitted(false)}
                                className="bg-transparent text-[#789094] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-[#2C2A26] transition-colors"
                            >
                                Edit
                            </button>
                        )}
                        <button
                            onClick={handleWeeklySubmit}
                            disabled={isWeeklySubmitted || saving}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                isWeeklySubmitted
                                    ? 'bg-[#98A89A] text-[#F5F0E8] shadow-sm cursor-default'
                                    : 'bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#444]'
                            }`}
                        >
                            {saving ? 'Saving...' : (isWeeklySubmitted ? '✓ Logged' : 'Log Week')}
                        </button>
                    </div>
                </div>

                <div className={`space-y-8 transition-opacity duration-300 ${isWeeklySubmitted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    
                    {/* Household Section */}
                    <div>
                        <h4 className="text-sm font-serif text-[#2C2A26] border-b border-[#E8DFC8] pb-2 mb-6">Shared Household</h4>
                        <div className="space-y-6">
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Laundry Loads</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.laundryLoads}</span>
                                </div>
                                <CustomSlider min={0} max={15} value={weeklyInputs.laundryLoads} onChange={(val) => handleWeeklyInputChange('laundryLoads', val)} />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Dishwasher Loads</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.dishwasherLoads}</span>
                                </div>
                                <CustomSlider min={0} max={14} value={weeklyInputs.dishwasherLoads} onChange={(val) => handleWeeklyInputChange('dishwasherLoads', val)} />
                            </div>
                            <div className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Garden Watering (min)</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.gardenMinutes}</span>
                                </div>
                                <CustomSlider min={0} max={120} step={5} value={weeklyInputs.gardenMinutes} onChange={(val) => handleWeeklyInputChange('gardenMinutes', val)} />
                            </div>
                        </div>
                    </div>

                    {/* Lifestyle Section */}
                    <div>
                        <h4 className="text-sm font-serif text-[#2C2A26] border-b border-[#E8DFC8] pb-2 mb-6">Lifestyle</h4>
                        <div className="space-y-6">
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Meat-based Meals</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.meatMeals}</span>
                                </div>
                                <CustomSlider min={0} max={21} value={weeklyInputs.meatMeals} onChange={(val) => handleWeeklyInputChange('meatMeals', val)} />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">New Clothing Items</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.newClothingItems}</span>
                                </div>
                                <CustomSlider min={0} max={5} value={weeklyInputs.newClothingItems} onChange={(val) => handleWeeklyInputChange('newClothingItems', val)} />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Miles Driven</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.milesDriven}</span>
                                </div>
                                <CustomSlider min={0} max={500} step={10} value={weeklyInputs.milesDriven} onChange={(val) => handleWeeklyInputChange('milesDriven', val)} />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">AI Queries (heavy)</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.aiQueries}</span>
                                </div>
                                <CustomSlider min={0} max={200} step={10} value={weeklyInputs.aiQueries} onChange={(val) => handleWeeklyInputChange('aiQueries', val)} />
                                <p className="text-[10px] text-[#A8A29E] mt-1">Data center cooling consumes ~0.019 L per query.</p>
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#98A89A]">Items Recycled</label>
                                    <span className="font-serif text-xl text-[#5F7A65]">-{weeklyInputs.recyclingItems}</span>
                                </div>
                                <CustomSlider min={0} max={50} value={weeklyInputs.recyclingItems} onChange={(val) => handleWeeklyInputChange('recyclingItems', val)} />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#98A89A]">Compost (lbs)</label>
                                    <span className="font-serif text-xl text-[#5F7A65]">-{weeklyInputs.compostLbs}</span>
                                </div>
                                <CustomSlider min={0} max={20} value={weeklyInputs.compostLbs} onChange={(val) => handleWeeklyInputChange('compostLbs', val)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[#E8DFC8]/50 text-center space-y-1">
                     <p className="text-xs text-[#2C2A26] font-medium">Canadian average: 6,000 L/day per person (total footprint)</p>
                     <p className="text-xs text-[#2C2A26] font-medium">Canadian tap use only: 223 L/day per person</p>
                     <p className="text-[10px] text-[#98A89A] tracking-wide mt-2">
                         Statistics Canada (2021); Canada WaterPortal / Brock University UNESCO Chair
                     </p>
                </div>
            </div>
            {/* END PANELS */}

        </div>
      </div>
    </div>
  );
};
export default Dashboard;
