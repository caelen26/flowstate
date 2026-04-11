
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { LeaderboardEntry, Post, Event, JournalArticle, Product } from './types';

export const WATER_METRICS = {
  // Source: Canada WaterPortal / Brock University UNESCO Chair on Water
  // Average Canadian water footprint: ~6,000 L/person/day including virtual water
  // For a household of 4, weekly footprint baseline = 6,000 × 4 × 7 = 168,000 L/week
  // Use 6,000 L/person/day as the per-person daily footprint baseline
  DAILY_BASELINE_PER_PERSON: 6000,
  WEEKLY_BASELINE: 168000,
  
  // For display contrast, also store direct tap use baseline:
  // Source: Statistics Canada, Survey of Drinking Water Plants, 2021
  DAILY_TAP_BASELINE_PER_PERSON: 223,
  
  // "Ideal" target should be approximately 40% below baseline
  // Represents a meaningfully conservation-minded household
  IDEAL_WEEKLY_TARGET: 100000,

  // Direct Usage (Tap)
  // Source: Natural Resources Canada, Proposed Canadian max efficient standard = 6.8 L/min. Avg = ~8 L/min.
  SHOWER_LITRES_PER_MINUTE: 8.0,
  // Source: Natural Resources Canada, Recommended faucet aerator: less than 4.7 L/min
  FAUCET_LITRES_PER_MINUTE: 4.7,
  // Source: Canadian Building Code / NRCan. Federal standard = 6 L/flush max. HET = 4.8 L/flush.
  TOILET_LITRES_PER_FLUSH: 6.0,
  TOILET_HET_LITRES_PER_FLUSH: 4.8,
  // Source: AWWA North American Residential Water Use Study
  BATH_LITRES_PER_TUB: 115.0,
  // Source: Safe Drinking Water Foundation (citing Government of Canada data)
  GARDEN_HOSE_LITRES_PER_MINUTE: 45.0,
  GARDEN_SPRINKLER_LITRES_PER_MINUTE: 19.0,

  // Shared Household Usage
  // Source: ENERGY STAR Canada (aligned with US ENERGY STAR program)
  LAUNDRY_LITRES_PER_LOAD_HE: 53.0,
  LAUNDRY_LITRES_PER_LOAD_STANDARD: 76.0,
  // Source: ENERGY STAR Canada / Home Water Works
  DISHWASHER_LITRES_PER_CYCLE_ENERGYSTAR: 13.0,
  DISHWASHER_LITRES_PER_CYCLE_STANDARD: 19.0,

  // Virtual Water
  // Source: University of Manitoba + Agriculture and Agri-Food Canada (AAFC), 2017
  MEAT_BEEF_LITRES_PER_MEAL: 1700.0,
  // Source: Water Footprint Network. Avg across clothing types ~3000 L, t-shirt = 2700 L
  CLOTHING_LITRES_PER_ITEM: 2700.0,
  // Source: FoodPrint.org citing USDA, converted to metric
  TRANSPORT_LITRES_PER_KM: 0.5,
  // Source: University of California Riverside / EESI (2023)
  AI_LITRES_PER_QUERY: 0.019,

  // Conservation Credits
  // Source: Water Footprint Calculator. Recycling 1 lb paper = ~13 L
  RECYCLING_LITRES_SAVED_PER_ITEM: 13.0,
  // Source: EPA. Composting 1 lb food waste saves ~15 gallons = ~57 L
  COMPOSTING_LITRES_SAVED_PER_KG: 57.0,
};

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { id: 'u1', username: 'Elara Vance', avatar: 'https://i.pravatar.cc/150?u=u1', monthlyUsage: 840, trend: 'down' },
  { id: 'u2', username: 'Kai Tanaka', avatar: 'https://i.pravatar.cc/150?u=u2', monthlyUsage: 920, trend: 'down' },
  { id: 'u3', username: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=u3', monthlyUsage: 1150, trend: 'stable' },
  { id: 'u4', username: 'David Chen', avatar: 'https://i.pravatar.cc/150?u=u4', monthlyUsage: 1240, trend: 'up' },
  { id: 'u5', username: 'Marcus O.', avatar: 'https://i.pravatar.cc/150?u=u5', monthlyUsage: 1300, trend: 'down' },
];

export const COMMUNITY_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    username: 'Kai Tanaka',
    avatar: 'https://i.pravatar.cc/150?u=u2',
    content: 'Just installed a rainwater harvesting system for the garden! Hoping to cut my outdoor usage by 50% this month.',
    likes: 24,
    timestamp: '2 hours ago'
  },
  {
    id: 'p2',
    userId: 'u5',
    username: 'Marcus O.',
    avatar: 'https://i.pravatar.cc/150?u=u5',
    content: 'Does anyone have recommendations for low-flow shower heads that still have decent pressure?',
    likes: 8,
    timestamp: '5 hours ago'
  }
];

export const EVENTS: Event[] = [
  {
    id: 'e1',
    userId: 'u1',
    title: 'River Cleanup Drive',
    date: 'April 22, 2025',
    location: 'Kamo River Banks',
    participants: 42,
    description: 'Join us for our annual Earth Day river cleanup. Gloves and bags provided.'
  },
  {
    id: 'e2',
    userId: 'u3',
    title: 'Urban Gardening Workshop',
    date: 'May 05, 2025',
    location: 'Community Center',
    participants: 15,
    description: 'Learn how to grow food with minimal water usage using hydroponic systems.'
  }
];

export const JOURNAL_ARTICLES: JournalArticle[] = [
    {
        id: 1,
        title: "The Hidden Cost of Cotton",
        date: "April 12, 2025",
        excerpt: "Understanding the virtual water footprint of our wardrobe choices.",
        image: "https://images.unsplash.com/photo-1516834474-48c0abc2a902?auto=format&fit=crop&q=80&w=1000",
        content: React.createElement(React.Fragment, null,
            React.createElement("p", { className: "mb-6 first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:float-left text-[#5D5A53]" },
                "It takes approximately 2,700 liters of water to make one cotton t-shirt. That is enough for one person to drink for 900 days."
            ),
            React.createElement("p", { className: "mb-8 text-[#5D5A53]" },
                "When we talk about water conservation, we often look at the tap. But our consumption is largely invisible, woven into the fabrics we wear and the food we eat."
            ),
            React.createElement("blockquote", { className: "border-l-2 border-[#2C2A26] pl-6 italic text-xl text-[#2C2A26] my-10 font-serif" },
                "\"True conservation requires seeing the invisible.\""
            )
        )
    },
    {
        id: 2,
        title: "Greywater Systems 101",
        date: "March 28, 2025",
        excerpt: "How to safely reuse water from your shower and laundry for your garden.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000",
        content: React.createElement(React.Fragment, null,
            React.createElement("p", { className: "mb-6 text-[#5D5A53]" },
                "Greywater is gently used water from your bathroom sinks, showers, tubs, and washing machines. It is not water that has come into contact with feces, either from the toilet or from washing diapers."
            ),
            React.createElement("p", { className: "mb-8 text-[#5D5A53]" },
                "By redirecting this water to your landscape, you can significantly reduce your freshwater consumption while keeping your garden lush."
            )
        )
    }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Flow Meter',
    price: 149,
    category: 'Home',
    imageUrl: 'https://images.unsplash.com/photo-1585776463376-74eb6451a71c?auto=format&fit=crop&q=80&w=800',
    description: 'Real-time water usage tracking for your entire home.',
    longDescription: 'The Flow Meter attaches to your main water line and provides granular data on your household water consumption. Detect leaks instantly and track your conservation goals.',
    features: ['Non-invasive installation', 'Wi-Fi enabled', 'Leak detection alerts', '1-year battery life']
  },
  {
    id: '2',
    name: 'Nebia by FlowState',
    price: 299,
    category: 'Home',
    imageUrl: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=800',
    description: 'Spa experience. 50% less water.',
    longDescription: 'A partnership with Nebia, this showerhead uses atomization to create millions of tiny droplets, covering more surface area while using half the water of a standard shower.',
    features: ['Atomization technology', 'Adjustable height', 'Easy self-install', 'Brushed Aluminum']
  },
  {
    id: '3',
    name: 'Hydro Loop Band',
    price: 89,
    category: 'Wearable',
    imageUrl: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&q=80&w=800',
    description: 'Track your personal hydration and environmental impact.',
    longDescription: 'A minimalist band that gently vibrates to remind you to hydrate, while syncing with the FlowState ecosystem to display your personal water savings.',
    features: ['Silent vibration motor', 'E-ink display', 'Recycled ocean plastic', 'Waterproof']
  }
];

export const BRAND_NAME = 'FlowState';
