
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { LeaderboardEntry, Post, Event, JournalArticle, Product } from './types';

export const WATER_METRICS = {
  SHOWER_GPM: 2.1,        // EPA WaterSense Standard
  BATH_GPB: 40,           // Avg Bathtub
  FAUCET_GPM: 1.5,        // Standard aerator
  FLUSH_GPF: 1.6,         // Modern standard
  LAUNDRY_GPL: 30,        // High efficiency
  DISHWASHER_GPC: 6,      // Energy Star
  GARDEN_GPM: 12,         // Standard garden hose
  
  // Virtual Water
  CLOTHING_AVG_GPI: 1400, // Avg item
  DIET_MEAT_GPM: 450,     // Avg per meat meal
  FUEL_GPM: 0.5,          // Gallons to refine gas
  
  // Tech & Waste (New)
  AI_QUERY_GPQ: 0.13,     // ~500ml water consumption per session/heavy query (cooling)
  RECYCLING_CREDIT: -5,   // Gallons SAVED per item recycled vs virgin production
  COMPOST_CREDIT: -15,    // Gallons SAVED per lb of food waste (soil moisture retention + avoidance of landfill methane/water use)
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
