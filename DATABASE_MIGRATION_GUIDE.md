# Database Migration Guide: Daily/Weekly Logging & Streak System

## Overview

This guide outlines the database changes needed to support the new daily/weekly logging system with streak tracking.

## Required Database Tables

### 1. daily_hygiene_data
Stores daily personal hygiene usage logs.

```sql
CREATE TABLE daily_hygiene_data (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL,
  is_submitted BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inputs JSONB structure:
-- {
--   "showerMinutes": number,
--   "baths": number,
--   "faucetMinutes": number,
--   "flushes": number
-- }
```

### 2. streak_data
Tracks user streaks and points for daily logging.

```sql
CREATE TABLE streak_data (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_log_date DATE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. dashboard_data (existing - no changes)
Continues to store weekly household & lifestyle data.

```sql
-- Existing table - inputs JSONB now contains combined daily + weekly metrics
-- for backwards compatibility and full weekly calculations
```

## How It Works

### Daily Logging Flow
1. User logs their **Personal Hygiene** metrics each day
2. On submit:
   - Data saved to `daily_hygiene_data` table
   - Streak calculated based on `last_log_date` in `streak_data`
   - If consecutive day: `current_streak++`
   - If streak broken: `current_streak = 1`
   - `longest_streak` updated if `current_streak > longest_streak`
   - `total_points++` (1 point per day logged)

### Weekly Logging Flow
1. User logs their **Household & Lifestyle** metrics each week
2. On submit:
   - Combined data (daily + weekly) saved to `dashboard_data`
   - `monthly_usage` in `profiles` table updated for leaderboard
   - Weekly reset after 7 days

### Streak Calculation Logic
```javascript
// Check if today is consecutive from last log
const today = new Date();
const lastLog = new Date(lastLogDate);
const diffDays = (today - lastLog) / (1000 * 60 * 60 * 24);

if (diffDays === 1) {
  // Consecutive day - increment streak
  currentStreak++;
} else if (diffDays === 0) {
  // Same day - maintain streak
  // (shouldn't happen with proper UI controls)
} else {
  // Streak broken - reset to 1
  currentStreak = 1;
}

longestStreak = Math.max(currentStreak, longestStreak);
totalPoints++;
```

## UI Changes Summary

### Dashboard Header
- **New:** Streak display showing current streak and longest streak
- Weekly usage total display (existing, repositioned)

### Prompt Banners
- **Daily Prompt:** Shows when `isNewDay && !isDailySubmitted`
- **Weekly Prompt:** Shows when `isNewWeek && !isWeeklySubmitted`

### Logging Sections
1. **Daily Log Card**
   - Personal Hygiene inputs (shower, bath, faucet, toilet)
   - Submit button: "Log Today"
   - Accent color: Green (#4A7C59)

2. **Weekly Log Card**
   - Household inputs (laundry, dishwasher, garden)
   - Lifestyle inputs (meat meals, clothing, miles driven)
   - Tech & Circularity inputs (AI queries, recycling, compost)
   - Submit button: "Log Week"
   - Accent color: Dark gray (#2C2A26)

## Setup Instructions

### 1. Create Database Tables

Run the SQL commands above in your Supabase SQL editor to create the new tables.

### 2. Add Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE daily_hygiene_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_data ENABLE ROW LEVEL SECURITY;

-- Allow users to read/write their own data
CREATE POLICY "Users can view own daily hygiene data"
  ON daily_hygiene_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily hygiene data"
  ON daily_hygiene_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily hygiene data"
  ON daily_hygiene_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streak data"
  ON streak_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak data"
  ON streak_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak data"
  ON streak_data FOR UPDATE
  USING (auth.uid() = user_id);
```

### 3. Update User Data Loading

When loading user data, fetch from all three tables:

```javascript
// Fetch daily hygiene data
const { data: dailyData } = await supabase
  .from('daily_hygiene_data')
  .select('*')
  .eq('user_id', userId)
  .single();

// Fetch streak data
const { data: streakInfo } = await supabase
  .from('streak_data')
  .select('*')
  .eq('user_id', userId)
  .single();

// Existing: dashboard_data and profiles
```

## Testing Checklist

- [ ] Create database tables
- [ ] Enable RLS policies
- [ ] Test daily logging (creates streak)
- [ ] Test consecutive day logging (increments streak)
- [ ] Test missed day (resets streak to 1)
- [ ] Test weekly logging (updates monthly usage)
- [ ] Verify streak display shows correct numbers
- [ ] Verify daily/weekly prompt banners show appropriately
- [ ] Test edit functionality for both logs
- [ ] Verify calculations combine daily + weekly correctly

## Migration Notes

- Existing users will start with `currentStreak: 0` and `longestStreak: 0`
- First daily log will set `currentStreak: 1`
- Weekly `dashboard_data` remains unchanged for backwards compatibility
- All existing weekly logging functionality continues to work
