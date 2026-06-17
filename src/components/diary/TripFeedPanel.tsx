"use client";

import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { socialService, SharedTrip } from '@/services/socialService';
import { userService, UserProfile } from '@/services/userService';
import { CheckIn } from '@/services/diaryService';
import { MapPin, Users, Plus, Copy, Check, Radio, Wifi } from 'lucide-react';

interface TripFeedPanelProps {
  currentUser: User;
}

export function TripFeedPanel({ currentUser }: TripFeedPanelProps) {
  const [trips, setTrips] = useState<SharedTrip[]>([]);
  const [activeTrip, setActiveTrip] = useState<SharedTrip | null>(null);
  const [feedItems, setFeedItems] = useState<{ uid: string; checkIn: CheckIn }[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  const [newTripName, setNewTripName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadTrips();
  }, [currentUser.uid]);

  useEffect(() => {
    if (!activeTrip) return;
    // Subscribe to real-time feed
    if (unsubscribeRef.current) unsubscribeRef.current();
    const unsub = socialService.subscribeToTripFeed(activeTrip, (items) => {
      setFeedItems(items);
      setLiveCount(items.length);
    });
    unsubscribeRef.current = unsub;

    // Load member profiles
    loadMemberProfiles(activeTrip.memberUids);

    return () => { unsub(); };
  }, [activeTrip?.id]);

  const loadTrips = async () => {
    const myTrips = await socialService.getMyTrips(currentUser.uid);
    setTrips(myTrips);
  };

  const loadMemberProfiles = async (uids: string[]) => {
    const profiles = await Promise.all(uids.map(uid => userService.getProfile(uid)));
    const map: Record<string, UserProfile> = {};
    profiles.forEach(p => { if (p) map[p.uid] = p; });
    setMemberProfiles(map);
  };

  const handleCreateTrip = async () => {
    if (!newTripName.trim()) return;
    setIsCreating(true);
    try {
      const tripId = await socialService.createTrip(currentUser.uid, newTripName.trim());
      setNewTripName('');
      await loadTrips();
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTrip = async () => {
    if (!joinCode.trim()) return;
    try {
      await socialService.joinTrip(joinCode.trim(), currentUser.uid);
      setJoinCode('');
      await loadTrips();
    } catch (e: any) {
      alert(e.message || 'Không tìm thấy chuyến đi');
    }
  };

  const copyTripId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  if (activeTrip) {
    return (
      <div className="flex flex-col h-full">
        {/* Trip Header */}
        <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <h3 className="font-bold text-sm">{activeTrip.name}</h3>
            </div>
            <button
              onClick={() => { setActiveTrip(null); unsubscribeRef.current?.(); }}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-secondary rounded-md"
            >
              ← Danh sách
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{activeTrip.memberUids.length} thành viên</span>
            <span>•</span>
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">{liveCount} hoạt động</span>
          </div>
          {/* Copy trip ID */}
          <div className="mt-2 flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground flex-1 truncate font-mono">ID: {activeTrip.id}</span>
            <button onClick={() => copyTripId(activeTrip.id)} className="text-emerald-500 hover:text-emerald-400">
              {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {feedItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
              <p className="text-sm">Đang chờ hoạt động...</p>
              <p className="text-xs mt-1">Check-in của các thành viên sẽ xuất hiện ở đây!</p>
            </div>
          ) : (
            feedItems.map(({ uid, checkIn }) => {
              const profile = memberProfiles[uid];
              const isMe = uid === currentUser.uid;
              return (
                <div
                  key={checkIn.id}
                  className={`flex gap-3 p-3 rounded-xl border transition-all ${
                    isMe
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border bg-secondary/20'
                  }`}
                >
                  <img
                    src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`}
                    alt={profile?.displayName || '?'}
                    className="w-9 h-9 rounded-full border border-border shrink-0"
                    onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-semibold truncate">
                        {profile?.displayName || 'Thành viên'}{isMe ? ' (Bạn)' : ''}
                      </p>
                      {checkIn.mood && <span className="text-xs">{checkIn.mood}</span>}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{checkIn.activityText}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{checkIn.address || `${checkIn.location.lat.toFixed(3)}, ${checkIn.location.lng.toFixed(3)}`}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {checkIn.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {checkIn.timestamp.toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        
        {/* Create trip */}
        <div className="bg-secondary/30 rounded-xl p-4 border border-border">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500" /> Tạo chuyến đi mới
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTrip()}
              placeholder="Tên chuyến đi..."
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <button
              onClick={handleCreateTrip}
              disabled={isCreating || !newTripName.trim()}
              className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              Tạo
            </button>
          </div>
        </div>

        {/* Join trip */}
        <div className="bg-secondary/30 rounded-xl p-4 border border-border">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Tham gia bằng ID
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinTrip()}
              placeholder="Dán Trip ID vào đây..."
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <button
              onClick={handleJoinTrip}
              disabled={!joinCode.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </div>

        {/* Trip list */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Chuyến đi của tôi ({trips.length})</h4>
          {trips.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Chưa có chuyến đi nào.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => setActiveTrip(trip)}
                  className="w-full flex items-center gap-3 p-3 bg-secondary/30 hover:bg-secondary/60 rounded-xl border border-border transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                    🗺️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{trip.name}</p>
                    <p className="text-xs text-muted-foreground">{trip.memberUids.length} thành viên • Tap để xem live</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Radio className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
