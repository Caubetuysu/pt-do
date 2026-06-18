"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { socialService, SharedTrip } from '@/services/socialService';
import { userService, UserProfile } from '@/services/userService';
import { CheckIn } from '@/services/diaryService';
import { MapPin, Users, Plus, Copy, Check, Radio, Wifi, Flag, Calendar, Navigation, X } from 'lucide-react';

interface TripFeedPanelProps {
  currentUser: User;
}

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ---- Trip Summary Modal ----
function TripSummaryModal({ trip, feedItems, memberProfiles, onClose }: {
  trip: SharedTrip;
  feedItems: { uid: string; checkIn: CheckIn }[];
  memberProfiles: Record<string, UserProfile>;
  onClose: () => void;
}) {
  const stats = useMemo(() => {
    const sorted = [...feedItems].sort((a, b) => a.checkIn.timestamp.getTime() - b.checkIn.timestamp.getTime());
    let totalKm = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalKm += getDistanceInKm(
        sorted[i-1].checkIn.location.lat, sorted[i-1].checkIn.location.lng,
        sorted[i].checkIn.location.lat, sorted[i].checkIn.location.lng
      );
    }
    const duration = trip.endDate && trip.startDate
      ? Math.round((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60))
      : null;

    const perMember: Record<string, number> = {};
    feedItems.forEach(({ uid }) => { perMember[uid] = (perMember[uid] || 0) + 1; });

    return { totalKm, duration, perMember, total: feedItems.length };
  }, [feedItems, trip]);

  return (
    <div className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/10 rounded-full hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
          <div className="text-4xl mb-2">🗺️</div>
          <h2 className="text-xl font-black">{trip.name}</h2>
          <p className="text-emerald-100 text-sm">Hành trình kết thúc!</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{stats.totalKm.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">km đã đi</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{stats.total}</p>
              <p className="text-xs text-muted-foreground">check-in</p>
            </div>
          </div>

          {stats.duration !== null && (
            <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="font-bold">{stats.duration} giờ</p>
                <p className="text-xs text-muted-foreground">thời gian hành trình</p>
              </div>
            </div>
          )}

          {/* Per member breakdown */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Thành viên</p>
            {trip.memberUids.map(uid => {
              const profile = memberProfiles[uid];
              const count = stats.perMember[uid] || 0;
              return (
                <div key={uid} className="flex items-center gap-2 py-1.5">
                  <img
                    src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`}
                    alt=""
                    className="w-7 h-7 rounded-full border border-border"
                    onError={e => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`)}
                  />
                  <p className="text-sm flex-1">{profile?.displayName || 'Thành viên'}</p>
                  <p className="text-sm font-bold text-emerald-500">{count} check-in</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            Xong 🎉
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main TripFeedPanel ----
export function TripFeedPanel({ currentUser }: TripFeedPanelProps) {
  const [trips, setTrips] = useState<SharedTrip[]>([]);
  const [activeTrip, setActiveTrip] = useState<SharedTrip | null>(null);
  const [feedItems, setFeedItems] = useState<{ uid: string; checkIn: CheckIn }[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  const [newTripName, setNewTripName] = useState('');
  const [newTripStart, setNewTripStart] = useState(''); // date string for start override
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [localActiveTrip, setLocalActiveTrip] = useState<SharedTrip | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadTrips();
  }, [currentUser.uid]);

  useEffect(() => {
    if (!activeTrip) return;
    if (unsubscribeRef.current) unsubscribeRef.current();
    const unsub = socialService.subscribeToTripFeed(activeTrip, (items) => {
      setFeedItems(items);
      setLiveCount(items.length);
    });
    unsubscribeRef.current = unsub;
    loadMemberProfiles(activeTrip.memberUids);
    return () => { unsub(); };
  }, [activeTrip?.id, activeTrip?.startDate?.getTime()]);

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
      const startDate = newTripStart ? new Date(newTripStart) : undefined;
      await socialService.createTrip(currentUser.uid, newTripName.trim(), startDate);
      setNewTripName('');
      setNewTripStart('');
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

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    setIsEnding(true);
    try {
      await socialService.endTrip(activeTrip.id);
      const updated: SharedTrip = { ...activeTrip, isActive: false, endDate: new Date() };
      setLocalActiveTrip(updated);
      setShowSummary(true);
    } finally {
      setIsEnding(false);
    }
  };

  const copyTripId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const displayTrip = localActiveTrip || activeTrip;

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
              onClick={() => { setActiveTrip(null); setLocalActiveTrip(null); unsubscribeRef.current?.(); }}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-secondary rounded-md"
            >
              ← Danh sách
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Users className="w-3 h-3" />
            <span>{activeTrip.memberUids.length} thành viên</span>
            <span>•</span>
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">{liveCount} hoạt động</span>
            {activeTrip.startDate && (
              <>
                <span>•</span>
                <Calendar className="w-3 h-3" />
                <span>Từ {activeTrip.startDate.toLocaleDateString('vi-VN')}</span>
              </>
            )}
          </div>

          {/* Copy trip ID */}
          <div className="mt-2 flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground flex-1 truncate font-mono">ID: {activeTrip.id}</span>
            <button onClick={() => copyTripId(activeTrip.id)} className="text-emerald-500 hover:text-emerald-400">
              {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* End trip button — only for creator */}
          {activeTrip.isActive && activeTrip.creatorUid === currentUser.uid && (
            <button
              onClick={handleEndTrip}
              disabled={isEnding}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Flag className="w-4 h-4" />
              {isEnding ? 'Đang kết thúc...' : 'Kết thúc hành trình'}
            </button>
          )}
          {!activeTrip.isActive && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Flag className="w-3 h-3" />
              <span>Hành trình đã kết thúc • {activeTrip.endDate?.toLocaleDateString('vi-VN')}</span>
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {feedItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
              <p className="text-sm">Chưa có hoạt động trong thời gian này.</p>
              {activeTrip.startDate && (
                <p className="text-xs mt-1 opacity-60">Từ {activeTrip.startDate.toLocaleString('vi-VN')}</p>
              )}
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

        {showSummary && displayTrip && (
          <TripSummaryModal
            trip={displayTrip}
            feedItems={feedItems}
            memberProfiles={memberProfiles}
            onClose={() => { setShowSummary(false); loadTrips(); }}
          />
        )}
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
          <input
            type="text"
            value={newTripName}
            onChange={(e) => setNewTripName(e.target.value)}
            placeholder="Tên chuyến đi (VD: Đà Lạt tháng 6)..."
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:ring-1 focus:ring-emerald-500 outline-none mb-2"
          />
          {/* Start date picker — allows retroactive trips */}
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Ngày bắt đầu (để trống = từ bây giờ)</label>
              <input
                type="datetime-local"
                value={newTripStart}
                onChange={(e) => setNewTripStart(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleCreateTrip}
            disabled={isCreating || !newTripName.trim()}
            className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Đang tạo...' : 'Tạo chuyến đi'}
          </button>
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${trip.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-secondary'}`}>
                    {trip.isActive ? '🗺️' : '✅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{trip.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {trip.memberUids.length} thành viên
                      {trip.startDate && ` • Từ ${trip.startDate.toLocaleDateString('vi-VN')}`}
                      {!trip.isActive && ' • Đã kết thúc'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {trip.isActive
                      ? <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      : <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    }
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
