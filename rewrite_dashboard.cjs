const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const animatedNumberSnippet = `
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

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {
`;

// Insert AnimatedNumber
content = content.replace('const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {', animatedNumberSnippet);

// Now replace everything from "return (" to the end of the component
// The exact string to find in the original Dashboard.tsx is:
//   return (
//     <div className="bg-[#F5F2EB]
const returnIndex = content.indexOf('  return (\n    <div className="bg-[#F5F2EB]');
const exportIndex = content.lastIndexOf('export default Dashboard;');

if (returnIndex !== -1 && exportIndex !== -1) {
  const codeBeforeReturn = content.substring(0, returnIndex);
  const tail = content.substring(exportIndex);
  
  const newJSX = `  return (
    <div className="bg-[#F5F0E8] min-h-screen pt-24 md:pt-32 px-4 md:px-6 pb-12 relative overflow-hidden text-[#2C2A26]">
      {/* OTTER MASCOT OVERLAY */}
      <div id="otter-mascot" className="fixed bottom-6 right-6 w-20 h-20 bg-[#98A89A] rounded-full flex items-center justify-center text-4xl shadow-lg shadow-[#98A89A]/30 animate-bounce cursor-pointer z-50 hover:bg-[#859F94] transition-colors" title="FlowState Guide">
        🦦
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HERO SECTION */}
        <header className="mb-16 pt-8 animate-fade-in-up text-center">
          <h1 className="text-5xl md:text-7xl font-serif text-[#2C2A26] mb-4">Good morning.</h1>
          <p className="text-lg text-[#789094] font-medium mb-12">Your personal conservation journal.</p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-24 relative z-10">
            
            {/* Weekly Usage Stats */}
            <div className="flex flex-col items-center group cursor-default">
              <span className="text-sm font-bold uppercase tracking-widest text-[#789094] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">Weekly Est.</span>
              <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-6xl md:text-8xl font-serif text-[#2C2A26] tracking-tight">
                    <AnimatedNumber value={Math.round(stats.grandTotal)} />
                 </span>
                 <span className="text-xl text-[#98A89A] ml-2 font-light">gal</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                 <span className="bg-[#98A89A]/20 text-[#5F7A65] px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                   <AnimatedNumber value={Math.abs(Math.round(stats.trend))} />% {stats.trend > 0 ? 'above' : 'below'} avg
                 </span>
              </div>
            </div>

            {/* Centerpiece: Score Ring */}
            <div className="flex flex-col items-center relative group">
              <div className="w-56 h-56 md:w-64 md:h-64 relative flex items-center justify-center bg-white rounded-full shadow-[0_8px_40px_rgba(152,168,154,0.15)] group-hover:-translate-y-2 group-hover:shadow-[0_15px_50px_rgba(152,168,154,0.25)] transition-all duration-700">
                <svg className="w-full h-full absolute inset-0 -rotate-90 p-3" viewBox="0 0 36 36">
                  <path className="text-[#F5F0E8]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path className="text-[#98A89A] transition-all duration-1000 ease-out" strokeDasharray={\`\${stats.score}, 100\`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div className="flex flex-col items-center text-center">
                    <span className="text-6xl md:text-7xl font-serif text-[#2C2A26]">
                       <AnimatedNumber value={stats.score} />
                    </span>
                    <span className="text-xs uppercase tracking-widest text-[#98A89A] mt-2 font-bold">Health Score</span>
                </div>
              </div>
              <h3 className="font-serif text-2xl mt-6 text-[#2C2A26]">
                 {stats.score > 80 ? "Excellent Stewardship" : stats.score > 50 ? "Moderate Impact" : "High Consumption"}
              </h3>
            </div>

            {/* Streak */}
            <div className="flex flex-col items-center group cursor-default">
              <span className="text-sm font-bold uppercase tracking-widest text-[#789094] mb-3 opacity-80 group-hover:opacity-100 transition-opacity">Streak</span>
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-[#D5D0C6] flex flex-col items-center justify-center bg-white/50 shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-500">
                <span className="text-4xl md:text-5xl font-serif text-[#2C2A26]">
                   <AnimatedNumber value={streakData.currentStreak} />
                </span>
                <span className="text-[10px] text-[#98A89A] uppercase font-bold tracking-wider mt-1">Days</span>
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
                            className={\`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors \${
                                isDailySubmitted
                                    ? 'bg-[#E8DFC8]/50 text-[#98A89A] cursor-default'
                                    : 'bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#444]'
                            }\`}
                        >
                            {saving ? 'Saving...' : (isDailySubmitted ? '✓ Logged' : 'Log Today')}
                        </button>
                    </div>
                </div>

                <div className={\`space-y-6 transition-opacity duration-300 \${isDailySubmitted ? 'opacity-50 pointer-events-none' : 'opacity-100'}\`}>
                    <div className="space-y-6">
                        <div className="group border-b border-[#98A89A]/20 pb-6">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Shower Duration</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.showerMinutes} <span className="text-sm font-sans text-[#98A89A]">min</span></span>
                            </div>
                            <input
                                type="range" min="1" max="25"
                                value={dailyInputs.showerMinutes}
                                onChange={(e) => handleDailyInputChange('showerMinutes', parseInt(e.target.value))}
                                className="w-full accent-[#98A89A] h-2 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-3 transition-all focus:outline-none"
                            />
                        </div>
                        <div className="group border-b border-[#98A89A]/20 pb-6">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Baths Today</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.baths} <span className="text-sm font-sans text-[#98A89A]">tubs</span></span>
                            </div>
                            <input
                                type="range" min="0" max="3"
                                value={dailyInputs.baths}
                                onChange={(e) => handleDailyInputChange('baths', parseInt(e.target.value))}
                                className="w-full accent-[#98A89A] h-2 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-3 transition-all focus:outline-none"
                            />
                        </div>
                        <div className="group border-b border-[#98A89A]/20 pb-6">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Faucet Run Time</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.faucetMinutes} <span className="text-sm font-sans text-[#98A89A]">min</span></span>
                            </div>
                            <input
                                type="range" min="1" max="20"
                                value={dailyInputs.faucetMinutes}
                                onChange={(e) => handleDailyInputChange('faucetMinutes', parseInt(e.target.value))}
                                className="w-full accent-[#98A89A] h-2 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-3 transition-all focus:outline-none"
                            />
                        </div>
                        <div className="group">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-semibold text-[#789094]">Toilet Flushes</label>
                                <span className="font-serif text-xl md:text-2xl text-[#2C2A26]">{dailyInputs.flushes} <span className="text-sm font-sans text-[#98A89A]">times</span></span>
                            </div>
                            <input
                                type="range" min="1" max="15"
                                value={dailyInputs.flushes}
                                onChange={(e) => handleDailyInputChange('flushes', parseInt(e.target.value))}
                                className="w-full accent-[#98A89A] h-2 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-3 transition-all focus:outline-none"
                            />
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
                            className={\`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors \${
                                isWeeklySubmitted
                                    ? 'bg-[#E8DFC8]/50 text-[#98A89A] cursor-default'
                                    : 'bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#444]'
                            }\`}
                        >
                            {saving ? 'Saving...' : (isWeeklySubmitted ? '✓ Logged' : 'Log Week')}
                        </button>
                    </div>
                </div>

                <div className={\`space-y-8 transition-opacity duration-300 \${isWeeklySubmitted ? 'opacity-50 pointer-events-none' : 'opacity-100'}\`}>
                    
                    {/* Household Section */}
                    <div>
                        <h4 className="text-sm font-serif text-[#2C2A26] border-b border-[#E8DFC8] pb-2 mb-6">Shared Household</h4>
                        <div className="space-y-6">
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Laundry Loads</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.laundryLoads}</span>
                                </div>
                                <input
                                    type="range" min="0" max="15"
                                    value={weeklyInputs.laundryLoads}
                                    onChange={(e) => handleWeeklyInputChange('laundryLoads', parseInt(e.target.value))}
                                    className="w-full accent-[#789094] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Dishwasher Loads</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.dishwasherLoads}</span>
                                </div>
                                <input
                                    type="range" min="0" max="14"
                                    value={weeklyInputs.dishwasherLoads}
                                    onChange={(e) => handleWeeklyInputChange('dishwasherLoads', parseInt(e.target.value))}
                                    className="w-full accent-[#789094] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                            </div>
                            <div className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Garden Watering (min)</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.gardenMinutes}</span>
                                </div>
                                <input
                                    type="range" min="0" max="120" step="5"
                                    value={weeklyInputs.gardenMinutes}
                                    onChange={(e) => handleWeeklyInputChange('gardenMinutes', parseInt(e.target.value))}
                                    className="w-full accent-[#789094] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
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
                                <input
                                    type="range" min="0" max="21"
                                    value={weeklyInputs.meatMeals}
                                    onChange={(e) => handleWeeklyInputChange('meatMeals', parseInt(e.target.value))}
                                    className="w-full accent-[#789094] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">New Clothing Items</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.newClothingItems}</span>
                                </div>
                                <input
                                    type="range" min="0" max="5"
                                    value={weeklyInputs.newClothingItems}
                                    onChange={(e) => handleWeeklyInputChange('newClothingItems', parseInt(e.target.value))}
                                    className="w-full accent-[#789094] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">Miles Driven</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.milesDriven}</span>
                                </div>
                                <input
                                    type="range" min="0" max="500" step="10"
                                    value={weeklyInputs.milesDriven}
                                    onChange={(e) => handleWeeklyInputChange('milesDriven', parseInt(e.target.value))}
                                    className="w-full accent-[#789094] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#789094]">AI Queries (heavy)</label>
                                    <span className="font-serif text-xl text-[#2C2A26]">{weeklyInputs.aiQueries}</span>
                                </div>
                                <input
                                    type="range" min="0" max="200" step="10"
                                    value={weeklyInputs.aiQueries}
                                    onChange={(e) => handleWeeklyInputChange('aiQueries', parseInt(e.target.value))}
                                    className="w-full accent-[#789094] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                                <p className="text-[10px] text-[#A8A29E] mt-1">Data center cooling consumes ~0.005 gal per heavy session.</p>
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#98A89A]">Items Recycled</label>
                                    <span className="font-serif text-xl text-[#5F7A65]">-{weeklyInputs.recyclingItems}</span>
                                </div>
                                <input
                                    type="range" min="0" max="50"
                                    value={weeklyInputs.recyclingItems}
                                    onChange={(e) => handleWeeklyInputChange('recyclingItems', parseInt(e.target.value))}
                                    className="w-full accent-[#98A89A] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                            </div>
                            <div className="group border-b border-[#E8DFC8]/50 pb-5">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs font-semibold text-[#98A89A]">Compost (lbs)</label>
                                    <span className="font-serif text-xl text-[#5F7A65]">-{weeklyInputs.compostLbs}</span>
                                </div>
                                <input
                                    type="range" min="0" max="20"
                                    value={weeklyInputs.compostLbs}
                                    onChange={(e) => handleWeeklyInputChange('compostLbs', parseInt(e.target.value))}
                                    className="w-full accent-[#98A89A] h-1.5 bg-[#F5F0E8] rounded-full appearance-none cursor-pointer hover:h-2 transition-all focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[#E8DFC8]/50 text-center">
                     <p className="text-xs text-[#98A89A] font-medium tracking-wide">
                         Estimates based on research from EPA, Environment Canada, USGS, and Water Footprint Network.
                     </p>
                </div>
            </div>
            {/* END PANELS */}

        </div>
      </div>
    </div>
  );
};
`;

  content = codeBeforeReturn + newJSX + tail;
  fs.writeFileSync(filePath, content);
  console.log("Dashboard.tsx rewritten successfully!");
} else {
  console.error("Could not find start or end bounds for replacement.");
}
