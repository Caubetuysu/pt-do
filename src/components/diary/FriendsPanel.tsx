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
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearchStatus('loading');
    const results = await userService.searchByEmail(searchEmail.trim());
    const found = results.find(r => r.uid !== currentUser.uid);
    if (found) {
      setSearchResult(found);
      setSearchStatus('found');
    } else {
      setSearchResult(null);
      setSearchStatus('not_found');
    }
  };

  const handleSendRequest = async (toUid: string) => {
    await friendService.sendRequest(
      currentUser.uid,
      currentUser.displayName || 'Người dùng',
      currentUser.photoURL || '',
      toUid
    );
    setSearchStatus('sent');
  };

  const handleAccept = async (fromUid: string) => {
    await friendService.acceptRequest(currentUser.uid, fromUid);
    await loadAll();
  };

  const handleDecline = async (fromUid: string) => {
    await friendService.declineRequest(currentUser.uid, fromUid);
    await loadAll();
  };

  const toggleFriendOnMap = async (friend: UserProfile) => {
    const next = new Set(showFriendMap);
    if (next.has(friend.uid)) {
      next.delete(friend.uid);
    } else {
      next.add(friend.uid);
    }
    setShowFriendMap(next);

    // Rebuild friend check-ins to pass up
    const activeFriends = friends.filter(f => next.has(f.uid));
    const allData = await Promise.all(activeFriends.map(async (f) => {
      const checkIns = await friendService.getFriendCheckIns(f.uid);
      return { uid: f.uid, name: f.displayName, photo: f.photoURL, checkIns };
    }));
    onFriendCheckInsChange(allData);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button 
          onClick={() => setTab('friends')} 
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'friends' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground'}`}
        >
          <Users className="w-4 h-4" />
          Bạn Bè ({friends.length})
        </button>
        <button 
          onClick={() => setTab('requests')} 
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'requests' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground'}`}
        >
          <Bell className="w-4 h-4" />
          {requests.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{requests.length}</span>}
          Lời Mời
        </button>
        <button 
          onClick={() => setTab('search')} 
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'search' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground'}`}
        >
          <UserPlus className="w-4 h-4" />
          Thêm
        </button>
        <button 
          onClick={() => setTab('trips')} 
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'trips' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground'}`}
        >
          <Radio className="w-4 h-4" />
          Live
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* FRIENDS TAB */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có bạn bè nào.</p>
                <p className="text-xs mt-1">Bấm "Thêm" để tìm kiếm bạn bè.</p>
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend.uid} className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
                  <img src={friend.photoURL} alt={friend.displayName} className="w-10 h-10 rounded-full border border-border" onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + friend.uid)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{friend.displayName}</p>
                    <p className="text-xs text-muted-foreground">Lv.{friend.level} • {friend.totalKm.toFixed(1)} km</p>
                  </div>
                  <button
                    onClick={() => toggleFriendOnMap(friend)}
                    className={`p-2 rounded-full transition-colors ${showFriendMap.has(friend.uid) ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    title={showFriendMap.has(friend.uid) ? 'Ẩn trên bản đồ' : 'Hiện trên bản đồ'}
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Không có lời mời kết bạn nào.</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.fromUid} className="bg-secondary/30 rounded-xl p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={req.fromPhoto} alt={req.fromName} className="w-10 h-10 rounded-full border border-border" onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + req.fromUid)} />
                    <div>
                      <p className="font-semibold text-sm">{req.fromName}</p>
                      <p className="text-xs text-muted-foreground">Muốn kết bạn với bạn</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(req.fromUid)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                      <Check className="w-4 h-4" /> Chấp nhận
                    </button>
                    <button onClick={() => handleDecline(req.fromUid)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                      <X className="w-4 h-4" /> Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SEARCH TAB */}
        {tab === 'search' && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Tìm bạn bè qua địa chỉ Gmail</p>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={searchEmail}
                onChange={e => { setSearchEmail(e.target.value); setSearchStatus('idle'); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="example@gmail.com"
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <button onClick={handleSearch} disabled={searchStatus === 'loading'} className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {searchStatus === 'loading' && <p className="text-sm text-muted-foreground animate-pulse">Đang tìm...</p>}
            {searchStatus === 'not_found' && <p className="text-sm text-red-500">Không tìm thấy người dùng nào với email này.</p>}
            {searchStatus === 'sent' && <p className="text-sm text-emerald-500">✓ Đã gửi lời mời kết bạn!</p>}

            {searchStatus === 'found' && searchResult && (
              <div className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
                <img src={searchResult.photoURL} alt={searchResult.displayName} className="w-12 h-12 rounded-full border border-border" />
                <div className="flex-1">
                  <p className="font-semibold">{searchResult.displayName}</p>
                  <p className="text-xs text-muted-foreground">Lv.{searchResult.level} • {searchResult.totalKm.toFixed(1)} km</p>
                </div>
                <button
                  onClick={() => handleSendRequest(searchResult.uid)}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Kết bạn
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
