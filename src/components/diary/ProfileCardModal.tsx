"use client";

import React, { useRef } from 'react';
import { UserProfile, getLevelTitle } from '@/services/userService';
import { X, Download, Navigation } from 'lucide-react';

interface ProfileCardModalProps {
  profile: UserProfile;
  onClose: () => void;
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'from-slate-400 to-slate-600',
  2: 'from-emerald-400 to-teal-600',
  3: 'from-blue-400 to-indigo-600',
  4: 'from-violet-400 to-purple-600',
  5: 'from-amber-400 to-orange-600',
  6: 'from-rose-400 to-red-600',
  7: 'from-yellow-300 to-amber-500',
};

export function ProfileCardModal({ profile, onClose }: ProfileCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const gradient = LEVEL_COLORS[profile.level] || LEVEL_COLORS[1];

  const handleDownload = async () => {
    // Dynamically import html2canvas to avoid SSR issues
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (!cardRef.current) return;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });
      const link = document.createElement('a');
      link.download = `profile-${profile.displayName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      // Fallback: just alert
      alert('Không thể tải ảnh. Hãy thử chụp màn hình!');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        
        {/* The Card (will be captured by html2canvas) */}
        <div
          ref={cardRef}
          className={`w-full rounded-3xl overflow-hidden bg-gradient-to-br ${gradient} p-px shadow-2xl`}
        >
          <div className="rounded-[23px] bg-black/30 backdrop-blur-md p-6 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />

            {/* App watermark */}
            <div className="flex items-center gap-1.5 mb-5 opacity-70">
              <Navigation className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-widest uppercase">Nhật Ký Hành Trình</span>
            </div>

            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`}
                  alt={profile.displayName}
                  className="w-20 h-20 rounded-2xl border-2 border-white/30 shadow-xl"
                  crossOrigin="anonymous"
                  onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`)}
                />
                <div className="absolute -bottom-2 -right-2 bg-white/20 backdrop-blur-sm rounded-xl px-2 py-0.5 text-xs font-bold border border-white/30">
                  Lv.{profile.level}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black">{profile.displayName}</h2>
                <p className="text-sm font-medium opacity-80">{getLevelTitle(profile.level)}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-black">{profile.totalKm.toFixed(1)}</p>
                <p className="text-xs opacity-70 font-medium">km đã đi</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-black">{profile.totalPlaces}</p>
                <p className="text-xs opacity-70 font-medium">địa điểm</p>
              </div>
            </div>

            {/* Badges */}
            {profile.badges && profile.badges.length > 0 && (
              <div>
                <p className="text-xs font-semibold opacity-60 mb-2 uppercase tracking-wider">Huy hiệu</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.badges.slice(0, 6).map((badge, i) => (
                    <span
                      key={i}
                      className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-2.5 py-1 text-xs font-medium"
                    >
                      {badge}
                    </span>
                  ))}
                  {profile.badges.length > 6 && (
                    <span className="bg-white/15 rounded-xl px-2.5 py-1 text-xs font-medium opacity-60">
                      +{profile.badges.length - 6}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Streak if available */}
            {(profile.currentStreak ?? 0) > 1 && (
              <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-sm font-bold">{profile.currentStreak} ngày liên tiếp</p>
                  <p className="text-xs opacity-60">Kỷ lục: {profile.longestStreak} ngày</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" /> Đóng
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          >
            <Download className="w-4 h-4" /> Tải ảnh
          </button>
        </div>
        <p className="text-xs text-white/40 text-center">Ảnh sẽ được lưu dưới dạng PNG</p>
      </div>
    </div>
  );
}
