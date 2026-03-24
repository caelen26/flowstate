
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Post, Event, Group } from '../types';

interface CommunityProps {
    initialTab?: 'feed' | 'events';
}

// Helper to get clean error messages
const getErrorMessage = (error: any) => {
    if (!error) return "Unknown error";
    if (typeof error === 'string') return error;
    return error.message || error.error_description || JSON.stringify(error);
};

const Community: React.FC<CommunityProps> = ({ initialTab = 'feed' }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Groups State
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupName, setActiveGroupName] = useState<string>('FlowState');
  const [activeGroupDesc, setActiveGroupDesc] = useState<string>('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '' });

  // Posts State
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [feedTab, setFeedTab] = useState<'All' | 'Wins' | 'Questions' | 'Tips'>('All');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const placeholders = [
      "Share a conservation win...",
      "Ask the community something...",
      "What's your water tip this week?"
  ];
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
      }, 4000);
      return () => clearInterval(interval);
  }, []);


  // Events State
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState({
      title: '',
      description: '',
      location: '',
      date: '',
      time: ''
  });
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (initialTab === 'feed') {
        fetchGroupsAndMemberships();
    } else {
        fetchEvents();
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialTab === 'feed' && activeGroupId) {
        fetchPosts();
    }
  }, [activeGroupId, initialTab]);

  const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          setCurrentUserId(user.id);
          const { data } = await supabase.from('profiles').select('avatar_url, first_name, username').eq('id', user.id).single();
          if (data?.avatar_url && !data.avatar_url.includes('pravatar')) {
              setCurrentUserAvatar(data.avatar_url);
          } else {
              setCurrentUserAvatar(`https://ui-avatars.com/api/?name=${encodeURIComponent(data?.first_name || data?.username || 'User')}&background=EBE7DE&color=2C2A26`);
          }
      }
  };

  // --- GROUPS LOGIC ---
  const fetchGroupsAndMemberships = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. Fetch All Groups
        const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .order('name');
        
        if (groupsError) throw groupsError;

        // 2. Fetch User Memberships
        let memberIds = new Set<string>();
        if (user) {
            const { data: membersData } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);
            
            if (membersData) {
                membersData.forEach((m: any) => memberIds.add(m.group_id));
            }
        }
        setMyGroupIds(memberIds);

        if (groupsData && groupsData.length > 0) {
            const mappedGroups: Group[] = groupsData.map((g: any) => ({
                id: g.id,
                name: g.name,
                description: g.description,
                imageUrl: g.image_url,
                isJoined: memberIds.has(g.id)
            }));
            setGroups(mappedGroups);
            
            // Set default active group (FlowState or first available) if not set
            if (!activeGroupId) {
                const flowState = mappedGroups.find(g => g.name === 'FlowState');
                if (flowState) {
                    setActiveGroupId(flowState.id);
                    setActiveGroupName(flowState.name);
                    setActiveGroupDesc(flowState.description);
                } else {
                    setActiveGroupId(mappedGroups[0].id);
                    setActiveGroupName(mappedGroups[0].name);
                    setActiveGroupDesc(mappedGroups[0].description);
                }
            }
        }
    } catch (e: any) {
        console.error("Error fetching groups:", getErrorMessage(e));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('groups')
            .insert({
                name: newGroupData.name,
                description: newGroupData.description,
                created_by: user.id
            })
            .select()
            .single();

          if (error) throw error;

          // Auto-join creator
          if (data) {
              await supabase.from('group_members').insert({
                  group_id: data.id,
                  user_id: user.id
              });
              
              setGroups(prev => [...prev, { id: data.id, name: data.name, description: data.description, isJoined: true }]);
              setMyGroupIds(prev => new Set(prev).add(data.id));
              
              // Switch to new group
              setActiveGroupId(data.id);
              setActiveGroupName(data.name);
              setActiveGroupDesc(data.description);
              
              setShowCreateGroupModal(false);
              setNewGroupData({ name: '', description: '' });
          }

      } catch (e: any) {
          console.error("Error creating group:", getErrorMessage(e));
      }
  };

  const selectGroup = (group: Group) => {
      setActiveGroupId(group.id);
      setActiveGroupName(group.name);
      setActiveGroupDesc(group.description);
      
      // Mobile UX: Scroll to feed
      if (window.innerWidth < 1024) {
          document.getElementById('feed-header')?.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const handleJoinToggle = async (group: Group) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isJoined = myGroupIds.has(group.id);

      try {
          if (isJoined) {
              // Leave
              await supabase.from('group_members').delete().match({ group_id: group.id, user_id: user.id });
              setMyGroupIds(prev => {
                  const next = new Set(prev);
                  next.delete(group.id);
                  return next;
              });
          } else {
              // Join
              await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
              setMyGroupIds(prev => new Set(prev).add(group.id));
          }
          // Refresh local group list state to update UI
          setGroups(prev => prev.map(g => g.id === group.id ? { ...g, isJoined: !isJoined } : g));

      } catch (e) {
          console.error("Error toggling join:", e);
      }
  };


  // --- POSTS LOGIC ---
  const fetchPosts = async () => {
      if (!activeGroupId) return;
      setPostsLoading(true);
      try {
          // Auto-expire: only fetch posts from the last 7 days
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const { data, error } = await supabase
            .from('posts')
            .select(`
                id,
                content,
                created_at,
                likes,
                user_id,
                group_id,
                tag,
                profiles (username, first_name, avatar_url)
            `)
            .eq('group_id', activeGroupId)
            .gte('created_at', oneWeekAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;

          if (data) {
              const formattedPosts: Post[] = data.map((item: any) => ({
                  id: item.id,
                  userId: item.user_id,
                  username: item.profiles?.username || 'Unknown User',
                  avatar: (item.profiles?.avatar_url && !item.profiles.avatar_url.includes('pravatar')) ? item.profiles.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profiles?.first_name || item.profiles?.username || 'User')}&background=EBE7DE&color=2C2A26`,
                  content: item.content,
                  likes: item.likes,
                  groupId: item.group_id,
                  tag: item.tag,
                  timestamp: new Date(item.created_at).toLocaleDateString() + ' ' + new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              }));
              setPosts(formattedPosts);
          }
      } catch (e: any) {
          console.error("Error fetching posts:", getErrorMessage(e));
      } finally {
          setPostsLoading(false);
      }
  };

  const handlePost = async () => {
      if(!newPost.trim()) return;
      setPosting(true);

      try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
              console.error("User must be logged in to post.");
              return;
          }

          // Ensure user is member before posting (optional, but good UX)
          if (!myGroupIds.has(activeGroupId!)) {
              await handleJoinToggle(groups.find(g => g.id === activeGroupId)!);
          }

          const { error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                content: newPost,
                group_id: activeGroupId, 
                tag: selectedTag?.split(' ')[1] || null, // Drops the emoji, e.g. "💧 Tip" -> "Tip"
                likes: 0
            });

          if (error) throw error;

          setNewPost('');
          fetchPosts();

      } catch (e: any) {
          console.error("Error creating post:", getErrorMessage(e));
      } finally {
          setPosting(false);
      }
  };

  const handleDeletePost = async (postId: string) => {
      try {
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

          if (error) throw error;

          setPosts(prev => prev.filter(p => p.id !== postId));

      } catch (e: any) {
          console.error("Error deleting post:", getErrorMessage(e));
      }
  };

  // --- EVENTS LOGIC ---
  const fetchEvents = async () => {
      setEventsLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();

          // Auto-expire: only fetch events that ended less than 7 days ago or are upcoming
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          // Fetch events and check if the current user is a participant
          const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                profiles (username, avatar_url),
                event_participants (user_id)
            `)
            .gte('event_date', oneWeekAgo.toISOString())
            .order('event_date', { ascending: true });

          if (error) throw error;

          if (data) {
              const formattedEvents: Event[] = data.map((item: any) => {
                  const participants = item.event_participants || [];
                  const isJoined = user ? participants.some((p: any) => p.user_id === user.id) : false;
                  
                  return {
                    id: item.id,
                    userId: item.user_id, // Creator ID
                    title: item.title,
                    description: item.description,
                    location: item.location,
                    rawDate: item.event_date, 
                    date: new Date(item.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                    time: new Date(item.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    participants: item.participants_count || 0,
                    isJoined: isJoined,
                    organizer: item.profiles?.username || 'Unknown',
                    organizerAvatar: item.profiles?.avatar_url,
                    createdAt: new Date(item.created_at).toLocaleDateString()
                  };
              });
              setEvents(formattedEvents);
          }
      } catch (e: any) {
          console.error("Error fetching events:", getErrorMessage(e));
      } finally {
          setEventsLoading(false);
      }
  };

  const handleOpenCreateModal = () => {
      setEditingEventId(null);
      setEventFormData({ title: '', description: '', location: '', date: '', time: '' });
      setShowEventModal(true);
  };

  const handleOpenEditModal = (event: Event) => {
      if (currentUserId !== event.userId) return; // Only owner can edit
      
      const eventDate = new Date(event.rawDate || Date.now());
      // Format date as YYYY-MM-DD for input
      const dateStr = eventDate.toISOString().split('T')[0];
      // Format time as HH:MM
      const timeStr = eventDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      setEditingEventId(event.id);
      setEventFormData({
          title: event.title,
          description: event.description,
          location: event.location,
          date: dateStr,
          time: timeStr
      });
      setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmittingEvent(true);
      
      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) throw new Error("Not authenticated");

         const dateTime = new Date(`${eventFormData.date}T${eventFormData.time}:00`).toISOString();

         if (editingEventId) {
             // UPDATE
             const { error } = await supabase
                .from('events')
                .update({
                    title: eventFormData.title,
                    description: eventFormData.description,
                    location: eventFormData.location,
                    event_date: dateTime
                })
                .eq('id', editingEventId);
            
            if (error) throw error;
         } else {
             // CREATE
            const { error } = await supabase
                .from('events')
                .insert({
                    user_id: user.id,
                    title: eventFormData.title,
                    description: eventFormData.description,
                    location: eventFormData.location,
                    event_date: dateTime,
                    participants_count: 1 // Creator counts as 1
                });

            if (error) throw error;
         }

         setShowEventModal(false);
         fetchEvents();

      } catch (e: any) {
          console.error("Error saving event:", getErrorMessage(e));
      } finally {
          setSubmittingEvent(false);
      }
  };

  const handleDeleteEvent = async () => {
      if (!editingEventId) return;
      setSubmittingEvent(true);
      try {
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', editingEventId);
          
          if (error) throw error;
          
          setConfirmingDelete(false);
          setShowEventModal(false);
          fetchEvents();
      } catch (e: any) {
           console.error("Error deleting event:", getErrorMessage(e));
      } finally {
           setSubmittingEvent(false);
      }
  };

  const handleJoinEvent = async (event: Event) => {
      if (!currentUserId) return;
      
      // Optimistic update
      const wasJoined = event.isJoined;
      setEvents(prev => prev.map(e => {
          if (e.id === event.id) {
              return {
                  ...e,
                  isJoined: !wasJoined,
                  participants: wasJoined ? e.participants - 1 : e.participants + 1
              };
          }
          return e;
      }));

      try {
          if (wasJoined) {
              // Leave: Remove from participants
              const { error: partError } = await supabase
                .from('event_participants')
                .delete()
                .match({ event_id: event.id, user_id: currentUserId });
                
              if (partError) throw partError;
              
              await supabase.rpc('decrement_event_count', { row_id: event.id });

          } else {
              // Join: Add to participants
              const { error: partError } = await supabase
                .from('event_participants')
                .insert({ event_id: event.id, user_id: currentUserId });
            
              if (partError) throw partError;

              await supabase.rpc('increment_event_count', { row_id: event.id });
          }
      } catch (e: any) {
          console.error("Error joining event:", e);
          // Revert optimistic update
          fetchEvents();
      }
  };

  // ------------------------------------------------
  // RENDER: COMMUNITY FEED VIEW
  // ------------------------------------------------
  if (initialTab === 'feed') {
      return (
        <div className="min-h-screen bg-[#F5F2EB] pt-24 md:pt-32 px-4 md:px-6 pb-12 relative">
            
            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 z-[60] bg-[#2C2A26]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
                    <div className="bg-[#F5F2EB] w-full max-w-md shadow-2xl p-8 border border-[#D6D1C7]">
                        <h2 className="text-xl font-serif text-[#2C2A26] mb-6">Create New Community</h2>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input 
                                className="w-full bg-white border-b border-[#D6D1C7] p-3 outline-none focus:border-[#2C2A26] transition-colors" 
                                placeholder="Group Name" 
                                value={newGroupData.name}
                                onChange={e => setNewGroupData({...newGroupData, name: e.target.value})}
                                required
                            />
                            <textarea 
                                className="w-full bg-white border-b border-[#D6D1C7] p-3 outline-none focus:border-[#2C2A26] transition-colors" 
                                placeholder="Description" 
                                value={newGroupData.description}
                                onChange={e => setNewGroupData({...newGroupData, description: e.target.value})}
                                required
                            />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowCreateGroupModal(false)} className="flex-1 py-3 text-[#5D5A53] hover:text-[#2C2A26] text-xs uppercase font-bold tracking-widest">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-[#2C2A26] text-[#F5F2EB] text-xs uppercase font-bold tracking-widest hover:bg-[#433E38]">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* --- MOBILE: HORIZONTAL SCROLL GROUPS --- */}
                <div className="lg:hidden col-span-1 mb-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-extrabold text-sm text-[#2C2A26]">Communities</h3>
                        <button onClick={() => setShowCreateGroupModal(true)} className="text-[#A8A29E] hover:text-[#2C2A26]">
                             <span className="text-xs uppercase font-bold tracking-widest">+ New</span>
                        </button>
                    </div>
                    <div className="flex overflow-x-auto gap-3 pb-4 -mx-4 px-4 snap-x no-scrollbar">
                        {groups.map(group => (
                            <button 
                                key={group.id}
                                onClick={() => selectGroup(group)}
                                className={`flex-shrink-0 snap-start px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-colors ${
                                    activeGroupId === group.id 
                                        ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26]' 
                                        : 'bg-white text-[#5D5A53] border-[#D6D1C7]'
                                }`}
                            >
                                {group.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- DESKTOP SIDEBAR: COMMUNITIES LIST --- */}
                <div className="hidden lg:block lg:col-span-3 space-y-8">
                    <div className="bg-[#FDFAF5] border border-[#D6D1C7] p-6 shadow-sm lg:sticky lg:top-32 rounded-2xl">
                        <div className="mb-6 pb-6 border-b border-[#D6D1C7]/50 text-center">
                            <span className="text-3xl mb-2 block">🌊</span>
                            <p className="text-xs text-[#98A89A] font-medium">Water Conservation Community</p>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-lg text-[#2C2A26]">Communities</h3>
                            <button onClick={() => setShowCreateGroupModal(true)} className="text-[#A8A29E] hover:text-[#2C2A26] transition-colors p-1" title="Create Group">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Joined Groups */}
                            <div>
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#2C2A26] mb-3">Your Groups</h4>
                                <ul className="space-y-1">
                                    {groups.filter(g => myGroupIds.has(g.id)).map(group => (
                                        <li key={group.id}>
                                            <button 
                                                onClick={() => selectGroup(group)}
                                                className={`w-full text-left flex items-start gap-4 p-4 transition-colors border-l-4 ${activeGroupId === group.id ? 'bg-white border-l-[#98A89A] shadow-sm rounded-r-xl text-[#2C2A26]' : 'hover:bg-[#EBE7DE]/50 text-[#5D5A53] border-l-transparent'}`}
                                            >
                                                <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center font-serif text-[10px] border ${activeGroupId === group.id ? 'bg-[#F5F2EB] text-[#2C2A26] border-transparent' : 'bg-white border-[#D6D1C7]'}`}>
                                                    {group.name.substring(0,1)}
                                                </div>
                                                <div>
      <span className="text-sm font-bold block mb-0.5">{group.name}</span>
      <span className="text-xs opacity-70 line-clamp-2 leading-relaxed">{group.description || 'A community dedicated to water conservation.'}</span>
  </div>
                                            </button>
                                        </li>
                                    ))}
                                    {groups.filter(g => myGroupIds.has(g.id)).length === 0 && (
                                        <p className="text-xs text-[#A8A29E] italic px-3">You haven't joined any groups yet.</p>
                                    )}
                                </ul>
                            </div>

                            {/* Other Groups */}
                            <div>
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#2C2A26] mb-3">Explore</h4>
                                <ul className="space-y-1">
                                    {groups.filter(g => !myGroupIds.has(g.id)).map(group => (
                                        <li key={group.id}>
                                            <button 
                                                onClick={() => selectGroup(group)}
                                                className={`w-full text-left flex items-start gap-4 p-4 transition-colors border-l-4 ${activeGroupId === group.id ? 'bg-white border-l-[#98A89A] shadow-sm rounded-r-xl text-[#2C2A26]' : 'hover:bg-[#EBE7DE]/50 text-[#5D5A53] border-l-transparent'}`}
                                            >
                                                <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center font-serif text-[10px] border ${activeGroupId === group.id ? 'bg-[#F5F2EB] text-[#2C2A26] border-transparent' : 'bg-white border-[#D6D1C7]'}`}>
                                                    {group.name.substring(0,1)}
                                                </div>
                                                <div>
      <span className="text-sm font-bold block mb-0.5">{group.name}</span>
      <span className="text-xs opacity-70 line-clamp-2 leading-relaxed">{group.description || 'A community dedicated to water conservation.'}</span>
  </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN FEED --- */}
                <div className="lg:col-span-9 animate-fade-in-up">
                    <div id="feed-header" className="mb-8 border-b border-[#D6D1C7] pb-6">
                        <h2 className="text-2xl md:text-3xl font-serif text-[#2C2A26] mb-2 font-extrabold">{activeGroupName}</h2>
                        <p className="text-[#5D5A53] text-sm font-light max-w-2xl leading-relaxed">{activeGroupDesc}</p>
                    </div>
                    
                    {/* Post Input */}
                    {myGroupIds.has(activeGroupId!) ? (
                        <div className="bg-[#FDFAF5] p-6 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#EBE7DE] rounded-2xl">
                            <div className="flex gap-4 mb-4">
                                <img src={currentUserAvatar} className="w-10 h-10 rounded-full object-cover border border-[#D6D1C7]" alt="You" />
                                <div className="flex-1">
                                    <textarea 
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        placeholder={placeholders[placeholderIdx]}
                                        disabled={posting}
                                        className="w-full bg-white border border-[#D6D1C7] rounded-xl outline-none text-[#2C2A26] placeholder-[#A8A29E] resize-none p-4 focus:border-[#98A89A] focus:ring-1 focus:ring-[#98A89A] transition-all disabled:opacity-50 text-sm md:text-base leading-relaxed"
                                        rows={3}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pl-14">
                                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                    {['💧 Tip', '🏆 Win', '❓ Question'].map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedTag === tag ? 'bg-[#98A89A] text-white shadow-sm' : 'bg-white border border-[#D6D1C7] text-[#789094] hover:border-[#98A89A]'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={handlePost} 
                                    disabled={!newPost.trim() || posting} 
                                    className="w-full md:w-auto bg-[#98A89A] text-[#F5F2EB] px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#859F94] hover:shadow-md disabled:opacity-50 transition-all shrink-0"
                                >
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    ) : (
                         <div className="bg-[#F9F8F6] p-6 mb-8 border border-[#EBE7DE] text-center">
                             <p className="text-[#5D5A53] text-sm mb-4">Join this community to start posting and interacting.</p>
                             <button 
                                onClick={() => handleJoinToggle(groups.find(g => g.id === activeGroupId)!)}
                                className="underline text-[#2C2A26] text-xs font-bold uppercase tracking-widest"
                             >
                                 Join Now
                             </button>
                         </div>
                    )}

                    {/* Feed Tabs */}
                    <div className="flex items-center gap-6 mb-6 border-b border-[#D6D1C7]/50 pb-2">
                        {['All', 'Wins', 'Questions', 'Tips'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFeedTab(tab as any)}
                                className={`text-sm font-bold tracking-widest uppercase transition-all pb-2 border-b-2 ${feedTab === tab ? 'border-[#2C2A26] text-[#2C2A26]' : 'border-transparent text-[#A8A29E] hover:text-[#5D5A53]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Feed List */}
                    <div className="space-y-6">
                        {postsLoading ? (
                            <div className="text-center py-12 text-[#A8A29E]">Loading community voices...</div>
                        ) : posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <span className="text-6xl mb-6 block drop-shadow-sm">🦦</span>
                                <h3 className="text-2xl font-serif text-[#2C2A26] mb-3">Be the first to share something this week</h3>
                                <p className="text-[#A8A29E] text-sm">The community is listening.</p>
                            </div>
                        ) : (
                            posts.filter(post => feedTab === 'All' || post.tag === feedTab.slice(0, -1)).length === 0 ? (
                                <div className="text-center py-12 text-[#A8A29E]">No {feedTab.toLowerCase()} found in this community.</div>
                            ) : (
                            posts.filter(post => feedTab === 'All' || post.tag === feedTab.slice(0, -1)).map(post => (
                                <div key={post.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#EBE7DE] flex gap-4 md:gap-6 group/post hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                                    <img src={post.avatar} alt={post.username} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-[#EBE7DE] shadow-sm" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="font-bold text-[#2C2A26] text-sm md:text-base block">{post.username}</span>
                                                <span className="text-[11px] uppercase tracking-widest text-[#A8A29E] mt-0.5 block">{post.timestamp}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {post.tag && (
                                                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-[#EBE7DE]/50 text-[#5D5A53]">
                                                        {post.tag}
                                                    </span>
                                                )}
                                                
                                                {/* DELETE BUTTON */}
                                                {currentUserId === post.userId && (
                                                    <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                                    className="text-[#A8A29E] hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                                    title="Delete Post"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 pointer-events-none">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[#2C2A26] text-[15px] leading-relaxed mb-4 whitespace-pre-wrap break-words">{post.content}</p>
                                        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#F5F2EB]">
                                                <button className="text-sm text-[#A8A29E] hover:text-red-500 flex items-center gap-2 transition-colors group">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                                    </svg>
                                                    <span className="font-medium">{post.likes}</span>
                                                </button>
                                                <button className="text-sm text-[#A8A29E] hover:text-[#98A89A] flex items-center gap-2 transition-colors group">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.06a12.08 12.08 0 0 0 2.555.31Z" />
                                                    </svg>
                                                    <span className="font-medium">0</span>
                                                </button>
                                            </div>
                                    </div>
                                </div>
                            ))
                            )
                        )}
                    </div>

                    {/* Leave Group — buried at the bottom, small and muted */}
                    {activeGroupId && myGroupIds.has(activeGroupId) && (
                        <div className="mt-16 pt-6 border-t border-[#D6D1C7]/30 text-center">
                            <button
                                onClick={() => handleJoinToggle(groups.find(g => g.id === activeGroupId)!)}
                                className="text-[#C4BFB5] hover:text-red-400 text-[11px] uppercase tracking-widest font-medium transition-colors"
                            >
                                Leave group
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // ------------------------------------------------
  // RENDER: EVENTS VIEW
  // ------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F5F2EB] pt-24 md:pt-32 px-4 md:px-6 pb-12 relative">
       {/* Create/Edit Event Modal */}
       {showEventModal && (
           <div className="fixed inset-0 z-[110] bg-[#2C2A26]/80 backdrop-blur-sm flex items-center justify-center p-4 pt-20 md:pt-4">
               <div className="bg-[#F5F2EB] w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in-up border border-[#D6D1C7]">
                   
                   {/* Modal Header */}
                   <div className="p-6 md:p-8 border-b border-[#D6D1C7] flex justify-between items-start bg-white/50">
                       <div>
                           <h2 className="text-2xl md:text-3xl font-serif text-[#2C2A26] mb-2">{editingEventId ? 'Edit Event' : 'New Event'}</h2>
                           <p className="text-xs text-[#A8A29E] uppercase tracking-widest">{editingEventId ? 'Update details' : 'Bring the community together'}</p>
                       </div>
                       <button onClick={() => setShowEventModal(false)} className="text-[#A8A29E] hover:text-[#2C2A26] transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                           </svg>
                       </button>
                   </div>
                   
                   {/* Modal Body */}
                   <div className="p-6 md:p-8 overflow-y-auto bg-[#F5F2EB]">
                        <form onSubmit={handleSaveEvent} className="space-y-6 md:space-y-8">
                            
                            {/* Title & Description */}
                            <div className="space-y-6">
                                <div>
                                    <input 
                                        required
                                        type="text"
                                        value={eventFormData.title}
                                        onChange={e => setEventFormData({...eventFormData, title: e.target.value})}
                                        className="w-full bg-transparent border-b-2 border-[#D6D1C7] py-2 text-[#2C2A26] outline-none focus:border-[#2C2A26] transition-colors font-serif text-xl md:text-2xl placeholder-[#A8A29E]/50"
                                        placeholder="Event Title"
                                    />
                                </div>
                                <div>
                                    <textarea 
                                        required
                                        value={eventFormData.description}
                                        onChange={e => setEventFormData({...eventFormData, description: e.target.value})}
                                        className="w-full bg-transparent border-b border-[#D6D1C7] py-2 text-[#5D5A53] outline-none focus:border-[#2C2A26] min-h-[80px] transition-colors resize-none placeholder-[#A8A29E]/70 leading-relaxed text-sm md:text-base"
                                        placeholder="Describe the gathering..."
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="relative">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A8A29E] mb-2 block">Location</label>
                                <div className="flex items-center gap-2 border-b border-[#D6D1C7] py-2 focus-within:border-[#2C2A26] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#A8A29E]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    <input 
                                        required
                                        type="text"
                                        value={eventFormData.location}
                                        onChange={e => setEventFormData({...eventFormData, location: e.target.value})}
                                        className="w-full bg-transparent outline-none text-[#2C2A26] text-sm md:text-base"
                                        placeholder="e.g. City Park, Main Square"
                                    />
                                </div>
                            </div>

                            {/* Elegant Date/Time Selection */}
                            <div className="grid grid-cols-2 gap-4 md:gap-6 bg-white p-4 border border-[#D6D1C7] shadow-sm">
                                <div className="relative group">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A8A29E] mb-1 group-hover:text-[#2C2A26] transition-colors">Date</label>
                                    <input 
                                        required
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={eventFormData.date}
                                        onChange={e => setEventFormData({...eventFormData, date: e.target.value})}
                                        className="w-full outline-none text-[#2C2A26] bg-transparent font-serif text-base md:text-lg cursor-pointer"
                                    />
                                </div>
                                <div className="relative group pl-4 md:pl-6 border-l border-[#F5F2EB]">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A8A29E] mb-1 group-hover:text-[#2C2A26] transition-colors">Time</label>
                                    <input 
                                        required
                                        type="time"
                                        value={eventFormData.time}
                                        onChange={e => setEventFormData({...eventFormData, time: e.target.value})}
                                        className="w-full outline-none text-[#2C2A26] bg-transparent font-serif text-base md:text-lg cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 flex flex-col gap-3">
                                <button 
                                        type="submit"
                                        disabled={submittingEvent}
                                        className="w-full py-4 bg-[#2C2A26] text-[#F5F2EB] text-xs font-bold uppercase tracking-widest hover:bg-[#444] disabled:opacity-50 transition-colors shadow-lg"
                                >
                                    {submittingEvent ? 'Saving...' : (editingEventId ? 'Update Event' : 'Publish Event')}
                                </button>
                                
                                {editingEventId && (
                                    !confirmingDelete ? (
                                        <button 
                                            type="button"
                                            onClick={() => setConfirmingDelete(true)}
                                            disabled={submittingEvent}
                                            className="w-full py-3 border border-red-200 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50 transition-colors"
                                        >
                                            Delete Event
                                        </button>
                                    ) : (
                                        <div className="border border-red-200 bg-red-50 p-4 rounded">
                                            <p className="text-xs text-red-700 text-center mb-3 font-medium">This will permanently delete the event.</p>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmingDelete(false)}
                                                    className="flex-1 py-2 border border-[#D6D1C7] text-[#5D5A53] text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteEvent}
                                                    disabled={submittingEvent}
                                                    className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {submittingEvent ? 'Deleting...' : 'Yes, Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </form>
                   </div>
               </div>
           </div>
       )}

       <div className="max-w-[1600px] mx-auto">
          <div className="w-full animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#D6D1C7] pb-6 gap-4">
                  <div>
                    <h2 className="text-3xl font-serif text-[#2C2A26] mb-2 font-extrabold">Events</h2>
                    <p className="text-[#5D5A53] text-sm font-light">Local action, collective impact.</p>
                  </div>
                  <button 
                    onClick={handleOpenCreateModal}
                    className="w-full md:w-auto mt-2 md:mt-0 bg-[#4A7C59] text-[#F5F2EB] px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#3A6346] transition-colors shadow-md"
                  >
                    + Create Event
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {eventsLoading ? (
                      <div className="col-span-full text-center py-12 text-[#A8A29E]">Finding local events...</div>
                  ) : events.length === 0 ? (
                      <div className="col-span-full text-center py-16 border border-dashed border-[#A8A29E] rounded-lg">
                          <p className="text-[#2C2A26] font-serif text-lg mb-2">No upcoming events.</p>
                          <p className="text-[#A8A29E] text-sm mb-6">Start a movement in your area.</p>
                          <button onClick={handleOpenCreateModal} className="underline text-[#2C2A26] uppercase tracking-widest text-xs font-bold">Create the first event</button>
                      </div>
                  ) : (
                      events.map(event => {
                          const isCreator = currentUserId === event.userId;
                          return (
                            <div 
                                key={event.id} 
                                className={`bg-[#2C2A26] text-[#F5F2EB] p-8 flex flex-col shadow-lg group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden ${isCreator ? 'cursor-pointer ring-2 ring-transparent hover:ring-[#A8A29E]/50' : ''}`}
                                onClick={() => isCreator && handleOpenEditModal(event)}
                                title={isCreator ? "Click to edit" : ""}
                            >
                                {/* Subtle BG Texture */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
                                
                                {isCreator && (
                                    <div className="absolute top-4 right-4 text-[10px] bg-white/10 px-2 py-1 rounded uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Owner
                                    </div>
                                )}

                                <div className="mb-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="block text-xs font-bold uppercase tracking-widest text-[#A8A29E]">{event.date}</span>
                                        <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full text-white/90 backdrop-blur-sm">{event.time}</span>
                                    </div>
                                    <h3 className="text-2xl font-serif leading-tight mb-2">{event.title}</h3>
                                    <div className="flex items-center gap-2 mt-3">
                                        <img src={event.organizerAvatar || 'https://i.pravatar.cc/150?u=default'} alt={event.organizer} className="w-5 h-5 rounded-full border border-white/20" />
                                        <p className="text-[10px] text-[#A8A29E] uppercase tracking-widest">Hosted by {event.organizer}</p>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-white/80 font-light leading-relaxed mb-8 flex-grow border-t border-white/10 pt-4">
                                    {event.description}
                                </p>
                                
                                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-[#A8A29E] uppercase tracking-widest mb-1">Going</span>
                                        <span className="block text-xl font-serif">{event.participants}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleJoinEvent(event)}
                                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                                            event.isJoined 
                                                ? 'bg-[#F5F2EB] text-[#2C2A26] hover:bg-white hover:scale-105' 
                                                : 'border border-white/30 hover:bg-white/10 text-white'
                                        }`}
                                    >
                                        {event.isJoined ? 'Going ✓' : 'Join Event'}
                                    </button>
                                </div>
                            </div>
                          );
                      })
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};

export default Community;
