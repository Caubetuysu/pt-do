"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { userService, UserProfile, getLevelTitle } from '@/services/userService';
import { useStore } from '@/store/useStore';
import { 
  Map, 
  LayoutGrid, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Award, 
  LogOut, 
  LogIn,
  Sparkles,
  Users,
  Target,
  MapPin,
  Plane
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = useStore(state => state.isSidebarCollapsed);
  const setIsCollapsed = useStore(state => state.setSidebarCollapsed);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Automatically collapse sidebar on map page for optimal map viewing
    if (pathname === '/') {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userProfile = await userService.getProfile(user.uid);
          setProfile(userProfile);
        } catch (e) {
          console.error("Failed to load user profile in Sidebar", e);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const menuItems = [
    {
      name: 'Hành trình',
      path: '/',
      icon: Map,
      color: 'text-emerald-400'
    }
  ];

  const actionItems = [
    {
      name: 'Nhật ký Hành trình',
      icon: Plane,
      color: 'text-teal-400',
      action: () => {
        useStore.getState().setShowTimeline(true);
        setIsCollapsed(true);
      }
    },
    {
      name: 'Wrap-up',
      icon: Sparkles,
      color: 'text-violet-400',
      action: () => useStore.getState().setShowWrapUp(true)
    },
    {
      name: 'Bạn bè',
      icon: Users,
      color: 'text-blue-400',
      action: () => {
        useStore.getState().setShowFriends(true);
        setIsCollapsed(true);
      }
    },
    {
      name: 'Thống kê',
      icon: Award,
      color: 'text-yellow-400',
      action: () => useStore.getState().setShowStats(true)
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <aside 
      className={`glass-panel fixed top-0 left-0 h-screen z-[3000] flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } border-r border-white/10`}
    >
      {/* Toggle button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1 shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all z-[3100] cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Logo Section */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06] overflow-hidden shrink-0 justify-center">
        <div className="relative group shrink-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          <img 
            src="/logo.png" 
            alt="PT.DO Logo" 
            className="relative w-10 h-10 object-contain rounded-xl bg-black/40 border border-white/10 p-1"
          />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col select-none">
            <span className="text-lg font-bold tracking-tight text-white bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              PT.DO
            </span>
            <span className="text-[10px] text-white/40 font-semibold tracking-wider uppercase">
              Productivity
            </span>
          </div>
        )}
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-emerald-400 rounded-r-md"></div>
              )}
              
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? item.color : 'text-white/60 group-hover:text-white'}`} />
              
              {!isCollapsed && (
                <span className="text-sm tracking-wide">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}

        <div className="w-full h-px bg-white/10 my-4"></div>

        {actionItems.map((item) => {
          const Icon = item.icon;
          return (
            <button 
              key={item.name}
              onClick={item.action}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent cursor-pointer"
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 group-hover:${item.color}`} />
              
              {!isCollapsed && (
                <span className="text-sm tracking-wide text-left">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile / Auth section at the bottom */}
      <div className="p-4 border-t border-white/[0.06] shrink-0 bg-black/20">
        {currentUser ? (
          <div className="flex flex-col gap-3">
            {/* User Info */}
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="relative group shrink-0">
                {profile?.photoURL || currentUser.photoURL ? (
                  <img 
                    src={profile?.photoURL || currentUser.photoURL || ''} 
                    alt="User avatar" 
                    className="w-10 h-10 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {profile?.displayName?.charAt(0) || currentUser.displayName?.charAt(0) || '?'}
                  </div>
                )}
                {/* Level Badge overlay */}
                {profile?.level && (
                  <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-black/80">
                    {profile.level}
                  </span>
                )}
              </div>
              
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white/90 truncate leading-tight">
                    {profile?.displayName || currentUser.displayName || 'Người dùng'}
                  </span>
                  <span className="text-[10px] text-white/40 truncate mt-0.5">
                    {profile?.level ? getLevelTitle(profile.level) : 'Người mới'}
                  </span>
                </div>
              )}
            </div>

            {/* Streak & Level stats (expanded view) */}
            {!isCollapsed && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Streak */}
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-white/40">Streak</span>
                    <span className="text-xs font-bold text-orange-400">{profile?.currentStreak || 0} ngày</span>
                  </div>
                </div>
                {/* Distance/XP */}
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-white/40">Quãng đường</span>
                    <span className="text-xs font-bold text-emerald-400">{profile?.totalKm ? Math.round(profile.totalKm) : 0} km</span>
                  </div>
                </div>
              </div>
            )}

            {/* Logout button */}
            {!isCollapsed ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer mx-auto"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* When not authenticated */
          !isCollapsed ? (
            <div className="flex flex-col gap-2 text-center p-2">
              <span className="text-xs text-white/40">Chưa đăng nhập</span>
              <Link 
                href="/" 
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                Đăng nhập
              </Link>
            </div>
          ) : (
            <Link 
              href="/" 
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-95 mx-auto"
              title="Đăng nhập"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )
        )}
      </div>
    </aside>
  );
}
