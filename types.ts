
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Added for auth verification
  avatar: string;
  city: string;
  country: string;
  householdSize: number;
  monthlyUsage: number; // Gallons
  joinedDate?: string;
  
  // Persistence for Dashboard
  dashboardData?: {
    inputs: WaterUsageMetrics;
    isSubmitted: boolean;
    lastUpdated: string;
  };
}

export interface WaterUsageMetrics {
  // Hygiene (Individual)
  showerMinutes: number;
  baths: number;
  faucetMinutes: number;
  flushes: number;
  
  // Household (Shared - needs div by householdSize)
  laundryLoads: number;
  dishwasherLoads: number;
  gardenMinutes: number;
  
  // Lifestyle (Individual)
  meatMeals: number;
  newClothingItems: number;
  milesDriven: number;
  
  // New Metrics
  recyclingItems: number; // Cans/Plastic recycled (Water credit)
  compostLbs: number; // Pounds of food waste diverted (Water credit)
  aiQueries: number; // Number of AI queries (Water usage)
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  monthlyUsage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  memberCount?: number;
  isJoined?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  likes: number;
  timestamp: string;
  groupId?: string; 
}

export interface Event {
  id: string;
  userId: string; // Added to track creator
  title: string;
  date: string; // Display string
  rawDate?: string; // ISO string for sorting
  time?: string;
  location: string;
  participants: number;
  description: string;
  isJoined?: boolean;
  organizer?: string;
  organizerAvatar?: string;
  createdAt?: string;
}

export interface JournalArticle {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  content: React.ReactNode;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string;
  longDescription?: string;
  features: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type ViewState = 
  | { type: 'landing' }
  | { type: 'auth', mode?: 'login' | 'signup' }
  | { type: 'account' }
  | { type: 'dashboard' }
  | { type: 'leaderboard' }
  | { type: 'community' }
  | { type: 'events' } // Replaces resources
  | { type: 'article', article: JournalArticle };
