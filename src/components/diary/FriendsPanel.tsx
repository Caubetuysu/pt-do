"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, userService } from '@/services/userService';
import { friendService, FriendRequest } from '@/services/friendService';
import { CheckIn } from '@/services/diaryService';
import { TripFeedPanel } from './TripFeedPanel';
import { Users, UserPlus, Search, X, Check, MapPin, Bell, UserX, ChevronRight, Radio } from 'lucide-react';

interface FriendsPanelProps {
  currentUser: User;
  onFriendCheckInsChange: (checkIns: {uid: string, name: string, photo: string, checkIns: CheckIn[]}[]) => void;
}

export function FriendsPanel({ currentUser, onFriendCheckInsChange }: FriendsPanelProps) {
  const [tab, setTab] = useState<'friends'|'requests'|'search'|'trips'>('friends');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle'|'loading'|'not_found'|'found'|'sent'>('idle');
  const [showFriendMap, setShowFriendMap] = useState<Set<string>>(new Set());
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadAll();
  }, [currentUser.uid]);

  const loadAll = async () => {
    try {
      const [profile, uids, reqs] = await Promise.all([
        userService.getProfile(currentUser.uid),
        friendService.getFriendUIDs(currentUser.uid),
        friendService.getIncomingRequests(currentUser.uid)
      ]);
      setMyProfile(profile);
      setRequests(reqs);

      // Load friend profiles
      const profiles = await Promise.all(uids.map(uid => userService.getProfile(uid)));
      setFriends(profiles.filter(Boolean) as UserProfile[]);
    } catch (e) {
      console.error("Failed to load friends data", e);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearchStatus('loading');
    try {
      const results = await userService.searchByEmail(searchEmail.trim());
      const found = results.find(r => r.uid !== currentUser.uid);
      if (found) {
        setSearchResult(found);
        setSearchStatus('found');
      } else {
        setSearchResult(null);
        setSearchStatus('not_found');
      }
    } catch (e) {
      console.error(e);
      setSearchStatus('not_found');
    }
  };

  const handleSendRequest = async (toUid: string) => {
    try {
      await friendService.sendRequest(
        currentUser.uid,
        currentUser.displayName || 'Người dùng',
        currentUser.photoURL || '',
        toUid
      );
      setSearchStatus('sent');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async (fromUid: string) => {
    try {
      await friendService.acceptRequest(currentUser.uid, fromUid);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecline = async (fromUid: string) => {
    try {
      await friendService.declineRequest(currentUser.uid, fromUid);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFriendOnMap = async (friend: UserProfile) => {
    const next = new Set(showFriendMap);
    if (next.has(friend.uid)) {
      next.delete(friend.uid);
    } else {
      next.add(friend.uid);
    }
    setShowFriendMap(next);

    try {
      // Rebuild friend check-ins to pass up
      const activeFriends = friends.filter(f => next.has(f.uid));
      const allData = await Promise.all(activeFriends.map(async (f) => {
        const checkIns = await friendService.getFriendCheckIns(f.uid);
        return { uid: f.uid, name: f.displayName, photo: f.photoURL, checkIns };
      }));
      onFriendCheckInsChange(allData);
    } catch (e) {
      console.error("Failed to sync friend check-ins on map", e);
    }
  };

  // Helper for progress bar
  const getLevelProgress = (km: number, level: number) => {
    const thresholds = [0, 10, 50, 100, 300, 500, 1000];
    if (level >= 7) return 100;
    const currentThreshold = thresholds[level - 1] || 0;
    const nextThreshold = thresholds[level] || 1000;
    const range = nextThreshold - currentThreshold;
    const progress = km - currentThreshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  interface TabItem {
    id: 'friends' | 'requests' | 'search' | 'trips';
    label: string;
    count?: number;
    icon: any;
    badgeColor?: string;
    isLive?: boolean;
  }

  const tabsConfig: TabItem[] = [
    { id: 'friends', label: 'Bạn Bè', count: friends.length, icon: Users },
    { id: 'requests', label: 'Lời Mời', count: requests.length, icon: Bell, badgeColor: 'bg-red-500' },
    { id: 'search', label: 'Thêm', icon: UserPlus },
    { id: 'trips', label: 'Live', icon: Radio, isLive: true }
  ];

  return (
    <div className="flex flex-col h-full bg-[#121214]/60 backdrop-blur-md">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.04] p-1 bg-black/20 shrink-0">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button 
              key={t.id}
              onClick={() => setTab(t.id)} 
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-all rounded-lg cursor-pointer ${
                isActive 
                  ? 'bg-white/[0.06] text-emerald-400 border border-white/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.2)]' 
                  : 'text-white/60 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-white/60'}`} />
              <span className="truncate">{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${t.badgeColor || 'bg-emerald-500/20 text-emerald-400'}`}>
                  {t.count}
                </span>
              )}
              {'isLive' in t && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {/* FRIENDS TAB */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-10" />
                <p className="text-sm font-semibold">Chưa có bạn bè nào</p>
                <p className="text-xs text-white/30 mt-1 max-w-[200px] mx-auto">Bấm tab "Thêm" để kết nối với những người bạn đồng hành!</p>
              </div>
            ) : (
              friends.map(friend => {
                const isShowing = showFriendMap.has(friend.uid);
                return (
                  <div key={friend.uid} className="glass-card rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <img 
                        src={friend.photoURL} 
                        alt={friend.displayName} 
                        className="w-10 h-10 rounded-full border border-white/10" 
                        onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + friend.uid)} 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white/90 truncate">{friend.displayName}</p>
                        <p className="text-xs text-white/40 font-medium">Cấp độ {friend.level} • {friend.totalKm.toFixed(1)} km</p>
                      </div>
                      
                      <button
                        onClick={() => toggleFriendOnMap(friend)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                          isShowing 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                            : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10 hover:text-white'
                        }`}
                        title={isShowing ? 'Ẩn trên bản đồ' : 'Hiện trên bản đồ'}
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress to next level bar */}
                    <div className="w-full">
                      <div className="flex justify-between text-[9px] text-white/30 font-semibold mb-0.5">
                        <span>XP Progress</span>
                        <span>{Math.round(getLevelProgress(friend.totalKm, friend.level))}%</span>
                      </div>
                      <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${getLevelProgress(friend.totalKm, friend.level)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-10" />
                <p className="text-sm font-semibold">Hộp thư trống</p>
                <p className="text-xs text-white/30 mt-1">Không có lời mời kết bạn nào.</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.fromUid} className="glass-card rounded-xl p-3 border border-white/[0.05]">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={req.fromPhoto} 
                      alt={req.fromName} 
                      className="w-10 h-10 rounded-full border border-white/10" 
                      onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + req.fromUid)} 
                    />
                    <div>
                      <p className="font-semibold text-sm text-white/95">{req.fromName}</p>
                      <p className="text-xs text-white/40 font-medium">Muốn kết nối với bạn</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAccept(req.fromUid)} 
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/20"
                    >
                      <Check className="w-3.5 h-3.5" /> Chấp nhận
                    </button>
                    <button 
                      onClick={() => handleDecline(req.fromUid)} 
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SEARCH TAB */}
        {tab === 'search' && (
          <div className="space-y-4">
            <p className="text-xs text-white/40 font-medium px-1">Tìm bạn bè qua địa chỉ Email</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={searchEmail}
                onChange={e => { setSearchEmail(e.target.value); setSearchStatus('idle'); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="example@gmail.com"
                className="flex-1 px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-sm focus:border-emerald-500/50 outline-none text-white placeholder:text-white/30 transition-all font-medium"
              />
              <button 
                onClick={handleSearch} 
                disabled={searchStatus === 'loading'} 
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {searchStatus === 'loading' && <p className="text-xs text-white/40 font-medium animate-pulse px-1">Đang tìm...</p>}
            {searchStatus === 'not_found' && <p className="text-xs text-red-400 font-semibold px-1">Không tìm thấy người dùng nào với email này.</p>}
            {searchStatus === 'sent' && <p className="text-xs text-emerald-400 font-bold px-1">✓ Đã gửi lời mời kết bạn!</p>}

            {searchStatus === 'found' && searchResult && (
              <div className="glass-card rounded-xl p-3.5 flex items-center gap-3 border border-white/[0.05]">
                <img src={searchResult.photoURL} alt={searchResult.displayName} className="w-11 h-11 rounded-full border border-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white/95 truncate">{searchResult.displayName}</p>
                  <p className="text-xs text-white/40 font-medium">Cấp độ {searchResult.level} • {searchResult.totalKm.toFixed(1)} km</p>
                </div>
                <button
                  onClick={() => handleSendRequest(searchResult.uid)}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-lg shadow-emerald-950/20 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Kết bạn
                </button>
              </div>
            )}
          </div>
        )}
        {/* TRIPS TAB */}
        {tab === 'trips' && (
          <div className="-m-4 h-full">
            <TripFeedPanel currentUser={currentUser} />
          </div>
        )}
      </div>
    </div>
  );
}
