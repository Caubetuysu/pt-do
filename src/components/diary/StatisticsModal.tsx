"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { CheckIn } from '@/services/diaryService';
import { Quest, questService } from '@/services/questService';
import { friendService } from '@/services/friendService';
import { userService, UserProfile, getLevelTitle } from '@/services/userService';
import { X, Award, Map, Navigation, Moon, Coffee, Home, Zap, Target, Trophy, Users, ChevronRight } from 'lucide-react';

interface StatisticsModalProps {
  checkIns: CheckIn[];
  currentUser: User;
  onClose: () => void;
}

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
}

export function StatisticsModal({ checkIns, currentUser, onClose }: StatisticsModalProps) {
  const [tab, setTab] = useState<'titles'|'quests'|'leaderboard'>('titles');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    questService.getWeeklyQuests(currentUser.uid).then(setQuests);
    
    // Load leaderboard: me + friends
    const loadLeaderboard = async () => {
      const [friendUids, me] = await Promise.all([
        friendService.getFriendUIDs(currentUser.uid),
        userService.getProfile(currentUser.uid)
      ]);
      setMyProfile(me);
      const friendProfiles = await Promise.all(friendUids.map(uid => userService.getProfile(uid)));
      const all = [me, ...friendProfiles].filter(Boolean) as UserProfile[];
      all.sort((a, b) => b.totalKm - a.totalKm);
      setLeaderboard(all);
    };
    loadLeaderboard();
  }, [currentUser.uid]);

  const stats = useMemo(() => {
    const thisMonthCheckIns = checkIns.filter(c => 
      c.timestamp.getMonth() === currentMonth && c.timestamp.getFullYear() === currentYear
    );
    let distance = 0;
    const sorted = [...thisMonthCheckIns].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 1; i < sorted.length; i++) {
      distance += getDistanceInKm(sorted[i-1].location.lat, sorted[i-1].location.lng, sorted[i].location.lat, sorted[i].location.lng);
    }
    let nightOwlCount = 0, homeCount = 0, cafeCount = 0;
    thisMonthCheckIns.forEach(c => {
      const hour = c.timestamp.getHours();
      if (hour >= 22 || hour <= 4) nightOwlCount++;
      const text = (c.activityText + ' ' + (c.address || '')).toLowerCase();
      if (text.includes('nhà') || text.includes('home')) homeCount++;
      if (text.includes('cafe') || text.includes('coffee') || text.includes('cà phê')) cafeCount++;
    });
    const titles = [];
    if (nightOwlCount >= 3) titles.push({ icon: <Moon className="w-6 h-6 text-indigo-400" />, name: "Cú Đêm", desc: "Chuyên gia đi hoang sau 10h tối", color: "from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30" });
    if (homeCount >= 5) titles.push({ icon: <Home className="w-6 h-6 text-emerald-400" />, name: "Con Ngoan", desc: "Trai ngoan/gái đảm luôn về nhà đúng giờ", color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30" });
    if (cafeCount >= 3) titles.push({ icon: <Coffee className="w-6 h-6 text-amber-400" />, name: "Chiến Thần Cafe", desc: "Không có ngày nào thiếu Caffeine", color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30" });
    if (distance >= 50) titles.push({ icon: <Zap className="w-6 h-6 text-rose-400" />, name: "Phượt Thủ", desc: `Đã bào hơn ${Math.round(distance)}km tháng này`, color: "from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/30" });
    if (titles.length === 0) titles.push({ icon: <Map className="w-6 h-6 text-blue-400" />, name: "Tân Binh", desc: "Hành trình vạn dặm bắt đầu từ một bước chân", color: "from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30" });
    return { distance, count: thisMonthCheckIns.length, titles };
  }, [checkIns, currentMonth, currentYear]);

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Award className="w-7 h-7 text-yellow-300" />
            <h2 className="text-xl font-bold">Bảng Phong Thần</h2>
          </div>
          <p className="text-emerald-100 text-sm">Tháng {currentMonth + 1}/{currentYear} • {stats.count} địa điểm • {stats.distance.toFixed(1)} km</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {([['titles', <Award className="w-4 h-4" />, 'Danh Hiệu'], ['quests', <Target className="w-4 h-4" />, 'Quest'], ['leaderboard', <Trophy className="w-4 h-4" />, 'Xếp Hạng']] as const).map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === key ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-muted-foreground'}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">

          {/* TITLES TAB */}
          {tab === 'titles' && (
            <div className="space-y-3">
              {stats.titles.map((title, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r ${title.color} shadow-sm`}>
                  <div className="p-2 bg-background/50 rounded-lg">{title.icon}</div>
                  <div>
                    <h4 className="font-bold text-lg">{title.name}</h4>
                    <p className="text-sm opacity-90">{title.desc}</p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Quãng Đường</p>
                  <p className="text-2xl font-bold">{stats.distance.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km</span></p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Địa Điểm</p>
                  <p className="text-2xl font-bold">{stats.count} <span className="text-sm font-normal text-muted-foreground">nơi</span></p>
                </div>
              </div>
            </div>
          )}

          {/* QUESTS TAB */}
          {tab === 'quests' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">Nhiệm vụ tuần này — hoàn thành để nhận huy hiệu đặc biệt!</p>
              {quests.length === 0 && <p className="text-sm text-muted-foreground animate-pulse">Đang tải nhiệm vụ...</p>}
              {quests.map(quest => (
                <div key={quest.id} className={`p-4 rounded-xl border ${quest.completed ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-border bg-secondary/30'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{quest.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{quest.title}</p>
                      <p className="text-xs text-muted-foreground">{quest.description}</p>
                    </div>
                    {quest.completed && <span className="text-emerald-500 text-xs font-bold">✓ Hoàn Thành!</span>}
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{Math.min(quest.currentCount, quest.targetCount)}/{quest.targetCount}</p>
                </div>
              ))}
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {tab === 'leaderboard' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">Xếp hạng theo tổng km giữa bạn và bạn bè</p>
              {leaderboard.length === 0 && <p className="text-sm text-muted-foreground">Kết bạn để cạnh tranh xếp hạng nhé!</p>}
              {leaderboard.map((profile, idx) => (
                <div key={profile.uid} className={`flex items-center gap-3 p-3 rounded-xl ${profile.uid === currentUser.uid ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-secondary/30'}`}>
                  <span className="w-6 text-center font-bold text-lg">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}
                  </span>
                  <img src={profile.photoURL} alt={profile.displayName} className="w-9 h-9 rounded-full border border-border" onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.uid)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{profile.displayName}{profile.uid === currentUser.uid ? ' (Bạn)' : ''}</p>
                    <p className="text-xs text-muted-foreground">{getLevelTitle(profile.level)} • Lv.{profile.level}</p>
                  </div>
                  <p className="font-bold text-sm text-emerald-500">{profile.totalKm.toFixed(1)} km</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
