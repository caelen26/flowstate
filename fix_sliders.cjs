const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const customSliderSnippet = `
const CustomSlider: React.FC<{
  min: number; max: number; step?: number; value: number; onChange: (val: number) => void;
}> = ({ min, max, step = 1, value, onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <>
      <style>{'\\n' +
        '.slider-custom::-webkit-slider-thumb {\\n' +
        '  -webkit-appearance: none;\\n' +
        '  appearance: none;\\n' +
        '  width: 24px;\\n' +
        '  height: 24px;\\n' +
        '  background: #5F7A65;\\n' +
        '  border-radius: 50%;\\n' +
        '  cursor: pointer;\\n' +
        '  box-shadow: 0 2px 6px rgba(0,0,0,0.15);\\n' +
        '  transition: transform 0.1s;\\n' +
        '}\\n' +
        '.slider-custom::-webkit-slider-thumb:hover {\\n' +
        '  transform: scale(1.15);\\n' +
        '}\\n' +
        '.slider-custom::-moz-range-thumb {\\n' +
        '  width: 24px;\\n' +
        '  height: 24px;\\n' +
        '  background: #5F7A65;\\n' +
        '  border-radius: 50%;\\n' +
        '  cursor: pointer;\\n' +
        '  border: none;\\n' +
        '  box-shadow: 0 2px 6px rgba(0,0,0,0.15);\\n' +
        '}\\n' +
      '}</style>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-3 md:h-4 rounded-full appearance-none outline-none cursor-pointer slider-custom"
        style={{
          background: \`linear-gradient(to right, #98A89A \${percentage}%, #E8DFC8 \${percentage}%)\`
        }}
      />
    </>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {
`;

content = content.replace('const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {', customSliderSnippet);

// Replace all occurrences of native inputs with CustomSlider
const inputsToReplace = [
  {
    regex: /<input\s+type="range"[^>]*value=\{dailyInputs\.showerMinutes\}[^>]*onChange=\{\(e\) => handleDailyInputChange\('showerMinutes', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={1} max={25} value={dailyInputs.showerMinutes} onChange={(val) => handleDailyInputChange('showerMinutes', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{dailyInputs\.baths\}[^>]*onChange=\{\(e\) => handleDailyInputChange\('baths', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={3} value={dailyInputs.baths} onChange={(val) => handleDailyInputChange('baths', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{dailyInputs\.faucetMinutes\}[^>]*onChange=\{\(e\) => handleDailyInputChange\('faucetMinutes', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={1} max={20} value={dailyInputs.faucetMinutes} onChange={(val) => handleDailyInputChange('faucetMinutes', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{dailyInputs\.flushes\}[^>]*onChange=\{\(e\) => handleDailyInputChange\('flushes', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={1} max={15} value={dailyInputs.flushes} onChange={(val) => handleDailyInputChange('flushes', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.laundryLoads\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('laundryLoads', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={15} value={weeklyInputs.laundryLoads} onChange={(val) => handleWeeklyInputChange('laundryLoads', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.dishwasherLoads\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('dishwasherLoads', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={14} value={weeklyInputs.dishwasherLoads} onChange={(val) => handleWeeklyInputChange('dishwasherLoads', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.gardenMinutes\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('gardenMinutes', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={120} step={5} value={weeklyInputs.gardenMinutes} onChange={(val) => handleWeeklyInputChange('gardenMinutes', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.meatMeals\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('meatMeals', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={21} value={weeklyInputs.meatMeals} onChange={(val) => handleWeeklyInputChange('meatMeals', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.newClothingItems\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('newClothingItems', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={5} value={weeklyInputs.newClothingItems} onChange={(val) => handleWeeklyInputChange('newClothingItems', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.milesDriven\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('milesDriven', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={500} step={10} value={weeklyInputs.milesDriven} onChange={(val) => handleWeeklyInputChange('milesDriven', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.aiQueries\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('aiQueries', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={200} step={10} value={weeklyInputs.aiQueries} onChange={(val) => handleWeeklyInputChange('aiQueries', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.recyclingItems\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('recyclingItems', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={50} value={weeklyInputs.recyclingItems} onChange={(val) => handleWeeklyInputChange('recyclingItems', val)} />"
  },
  {
    regex: /<input\s+type="range"[^>]*value=\{weeklyInputs\.compostLbs\}[^>]*onChange=\{\(e\) => handleWeeklyInputChange\('compostLbs', parseInt\(e\.target\.value\)\)\}[^>]*\/>/g,
    replace: "<CustomSlider min={0} max={20} value={weeklyInputs.compostLbs} onChange={(val) => handleWeeklyInputChange('compostLbs', val)} />"
  }
];

inputsToReplace.forEach(({regex, replace}) => {
  content = content.replace(regex, replace);
});

fs.writeFileSync(filePath, content);
console.log('Sliders successfully upgraded to CustomSlider.');
