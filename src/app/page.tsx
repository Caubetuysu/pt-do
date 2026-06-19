"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MapWrapper } from '@/components/diary/MapWrapper';
import { Timeline } from '@/components/diary/Timeline';
import { CheckInModal } from '@/components/diary/CheckInModal';
import { StatisticsModal } from '@/components/diary/StatisticsModal';
import { diaryService, CheckIn, reverseGeocode } from '@/services/diaryService';
import { fetchOSRMRoute } from '@/services/routingService';
import { userService } from '@/services/userService';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { FriendsPanel } from '@/components/diary/FriendsPanel';
import { questService } from '@/services/questService';
import { fetchWeather, getWeatherEmoji, getWeatherDesc } from '@/services/weatherService';
import { WrapUpModal } from '@/components/diary/WrapUpModal';
import { UserProfile } from '@/services/userService';
import { LocateFixed, Navigation, MapPin, Award, Plane, X, LogIn, LogOut, Users, Calendar, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface Hotspot {
  lat: number;
  lng: number;
  count: number;
}

// Helper for distance calculation
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2-lat1) * (Math.PI/180);
  var dLon = (lon2-lon1) * (Math.PI/180); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}

export default function DiaryPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [draftLocation, setDraftLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [draftAddress, setDraftAddress] = useState<string>("Đang tải địa chỉ...");
  const showStats = useStore(state => state.showStats);
  const setShowStats = useStore(state => state.setShowStats);
  const showWrapUp = useStore(state => state.showWrapUp);
  const setShowWrapUp = useStore(state => state.setShowWrapUp);
  const showFriends = useStore(state => state.showFriends);
  const setShowFriends = useStore(state => state.setShowFriends);
  const triggerLocate = useStore(state => state.triggerLocate);
  const triggerPin = useStore(state => state.triggerPin);
  const isSidebarOpen = useStore(state => state.showTimeline);
  const setIsSidebarOpen = useStore(state => state.setShowTimeline);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [friendCheckInGroups, setFriendCheckInGroups] = useState<{uid: string, name: string, photo: string, checkIns: CheckIn[]}[]>([]);

  const [routedDistance, setRoutedDistance] = useState<number>(0);
  const [routedDays, setRoutedDays] = useState<{dateStr: string, points: {lat: number, lng: number}[]}[]>([]);
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
      if (user) {
        loadCheckIns(user.uid);
        // Create or update user profile in Firestore
        const profile = await userService.createOrUpdateProfile(user.uid, {
          displayName: user.displayName || 'Người dùng',
          photoURL: user.photoURL || '',
          email: user.email || ''
        });
        const p = await userService.getProfile(user.uid);
        setUserProfile(p);
      } else {
        setCheckIns([]);
        setRoutedDays([]);
        setRoutedDistance(0);
      }
    });
    return () => unsubscribe();
  }, []);


  const filteredCheckIns = useMemo(() => {
    if (!selectedDateFilter) return checkIns;
    return checkIns.filter(c => c.timestamp.toLocaleDateString('vi-VN') === selectedDateFilter);
  }, [checkIns, selectedDateFilter]);

  useEffect(() => {
    async function calculateRoutes() {
      if (filteredCheckIns.length === 0) {
        setRoutedDistance(0);
        setRoutedDays([]);
        return;
      }
      setIsRouting(true);
      
      const sorted = [...filteredCheckIns].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const daysMap = new Map<string, {lat: number, lng: number}[]>();
      sorted.forEach((checkIn) => {
        const dateStr = checkIn.timestamp.toLocaleDateString('vi-VN');
        if (!daysMap.has(dateStr)) daysMap.set(dateStr, []);
        daysMap.get(dateStr)!.push(checkIn.location);
      });

      let totalDist = 0;
      const newRoutedDays: {dateStr: string, points: {lat: number, lng: number}[]}[] = [];

      for (const [dateStr, points] of daysMap.entries()) {
        if (points.length < 2) {
          newRoutedDays.push({ dateStr, points: points });
        } else {
          const routeResult = await fetchOSRMRoute(points);
          if (routeResult) {
            totalDist += routeResult.distance / 1000; // convert meters to km
            newRoutedDays.push({ dateStr, points: routeResult.geometry });
          } else {
            // fallback to straight lines
            let fallbackDist = 0;
            for (let i = 1; i < points.length; i++) {
              fallbackDist += getDistanceInKm(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng);
            }
            totalDist += fallbackDist;
            newRoutedDays.push({ dateStr, points });
          }
        }
      }

      setRoutedDistance(totalDist);
      setRoutedDays(newRoutedDays);
      setIsRouting(false);
    }
    
    calculateRoutes();
  }, [filteredCheckIns]);

  const { hotspots } = useMemo(() => {
    const spots: Hotspot[] = [];
    
    // Sort chronologically
    const sorted = [...filteredCheckIns].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    sorted.forEach((checkIn) => {
      // Hotspot calculation
      const existing = spots.find(
        h => Math.abs(h.lat - checkIn.location.lat) < 0.001 && 
             Math.abs(h.lng - checkIn.location.lng) < 0.001
      );
      if (existing) {
        existing.count += 1;
        existing.lat = (existing.lat * (existing.count - 1) + checkIn.location.lat) / existing.count;
        existing.lng = (existing.lng * (existing.count - 1) + checkIn.location.lng) / existing.count;
      } else {
        spots.push({ lat: checkIn.location.lat, lng: checkIn.location.lng, count: 1 });
      }
    });

    return {
      hotspots: spots.filter(h => h.count >= 2)
    };
  }, [filteredCheckIns]);

  const loadCheckIns = async (uid: string) => {
    try {
      const data = await diaryService.getCheckIns(uid);
      setCheckIns(data);

      // Tính tổng km và số địa điểm rồi sync lên profile
      const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      let totalKm = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalKm += getDistanceInKm(
          sorted[i-1].location.lat, sorted[i-1].location.lng,
          sorted[i].location.lat, sorted[i].location.lng
        );
      }
      // Unique places (rounded coords to avoid counting same spot twice)
      const uniquePlaces = new Set(data.map(c => `${c.location.lat.toFixed(3)},${c.location.lng.toFixed(3)}`)).size;
      await userService.updateStats(uid, Math.round(totalKm * 10) / 10, uniquePlaces);
      // Refresh user profile state
      const updated = await userService.getProfile(uid);
      setUserProfile(updated);
    } catch (error) {
      console.error("Failed to load check-ins:", error);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setDraftLocation({ lat, lng });
    setDraftAddress("Đang tải địa chỉ...");
    const address = await reverseGeocode(lat, lng);
    setDraftAddress(address);
  };

  const handleConfirmDraft = () => {
    if (draftLocation) {
      setSelectedLocation(draftLocation);
    }
  };

  const handleFindMyLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Không thể lấy vị trí. Vui lòng bật định vị GPS.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      setIsLocating(false);
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setDraftLocation(loc);
          setDraftAddress("Đang tải địa chỉ...");
          setIsLocating(false);
          const address = await reverseGeocode(loc.lat, loc.lng);
          setDraftAddress(address);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Không thể lấy vị trí. Vui lòng bật định vị GPS trong trình duyệt của bạn.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (triggerLocate > 0) {
      handleFindMyLocation();
    }
  }, [triggerLocate]);

  useEffect(() => {
    if (triggerPin > 0) {
      handleLocateMe();
    }
  }, [triggerPin]);

  const handleSubmitCheckIn = async (text: string, mood?: string) => {
    if (!selectedLocation || !currentUser) return;
    try {
      // Fetch weather silently in background
      let weatherData = undefined;
      try {
        const w = await fetchWeather(selectedLocation.lat, selectedLocation.lng);
        if (w) {
          weatherData = {
            temperature: w.temperature,
            weatherCode: w.weatherCode,
            emoji: getWeatherEmoji(w.weatherCode),
            desc: getWeatherDesc(w.weatherCode)
          };
        }
      } catch { /* weather is optional */ }

      await diaryService.addCheckIn({
        userId: currentUser.uid,
        location: selectedLocation,
        address: draftAddress !== "Đang tải địa chỉ..." ? draftAddress : undefined,
        timestamp: new Date(),
        activityText: text,
        mood,
        weather: weatherData
      });
      await loadCheckIns(currentUser.uid);
      
      // Update quest progress + streak in parallel
      const hour = new Date().getHours();
      try {
        const [newBadges, streakResult] = await Promise.all([
          questService.updateQuestProgress(currentUser.uid, text, 0, hour),
          userService.updateStreak(currentUser.uid)
        ]);
        // Update custom quests too
        await questService.updateCustomQuestProgress(currentUser.uid, 0);

        // Refresh profile for updated streak display
        const updated = await userService.getProfile(currentUser.uid);
        setUserProfile(updated);

        const notifications: string[] = [];
        if (newBadges.length > 0) notifications.push(`🏅 Huy hiệu mới: ${newBadges.join(', ')}`);
        if (streakResult.milestoneReached) notifications.push(`🔥 ${streakResult.milestoneReached} ngày liên tiếp! Tuyệt vời!`);
        else if (streakResult.streak > 1) notifications.push(`🔥 Streak ${streakResult.streak} ngày!`);
        if (notifications.length > 0) alert(notifications.join('\n'));
      } catch (questErr) {
        console.error('Post check-in updates failed:', questErr);
      }

      setSelectedLocation(null);
      setDraftLocation(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu check-in");
    }
  };

  const handleTimelineClick = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    // This will trigger the UserLocationMarker in BaseMap to flyTo this location
  };

  const handleDeleteCheckIns = async (ids: string[]) => {
    if (!currentUser) return;
    try {
      for (const id of ids) {
        await diaryService.deleteCheckIn(id);
      }
      await loadCheckIns(currentUser.uid);
    } catch (error) {
      console.error("Failed to delete check-ins:", error);
      alert("Đã xảy ra lỗi khi xóa dữ liệu.");
    }
  };

  if (isAuthChecking) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><span className="animate-pulse">Đang tải dữ liệu...</span></div>;
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
        <Navigation className="w-16 h-16 text-emerald-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Nhật Ký Hành Trình</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Đăng nhập để bắt đầu ghi lại những hành trình của riêng bạn. Dữ liệu được bảo mật và đồng bộ trên mọi thiết bị.</p>
        <button 
          onClick={async () => {
            const provider = new GoogleAuthProvider();
            try {
              await signInWithPopup(auth, provider);
            } catch (e) {
              console.error(e);
              alert('Đăng nhập thất bại. Bạn đã bật Google Provider trong Firebase Console chưa?');
            }
          }}
          className="bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-emerald-600 font-semibold flex items-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Đăng nhập bằng Google
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden">
      
      {/* Friends Panel - Sliding from left */}
      <div className={`absolute top-0 left-0 h-full w-full sm:w-96 bg-card z-[2000] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${showFriends ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-border bg-background flex items-center justify-between shadow-sm sticky top-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Bạn Bè
          </h2>
          <button onClick={() => setShowFriends(false)} className="p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <FriendsPanel currentUser={currentUser} onFriendCheckInsChange={setFriendCheckInGroups} />
        </div>
      </div>
      
      {/* Sidebar - Timeline (Sliding drawer) */}
      <div className={`absolute top-0 left-0 h-full w-full sm:w-96 bg-card z-[2000] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-border bg-background flex items-center justify-between shadow-sm z-10 sticky top-0">
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate pr-2">
            <Navigation className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="truncate">Nhật Ký Hành Trình</span>
          </h1>
          <div className="flex items-center gap-1.5 shrink-0">
            {currentUser.photoURL && (
              <img src={currentUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-border" />
            )}
            <button 
              onClick={() => signOut(auth)}
              className="p-2 bg-secondary/50 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-colors flex items-center justify-center"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-colors flex items-center justify-center shadow-sm"
              aria-label="Đóng"
            >
              <X className="w-5 h-5 text-foreground font-bold" />
            </button>
          </div>
        </div>
        
        {/* Calendar Filter */}
        <div className="px-4 py-3 bg-secondary/20 border-b border-border flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input 
            type="date" 
            value={selectedDateFilter || ''}
            onChange={(e) => setSelectedDateFilter(e.target.value ? new Date(e.target.value).toLocaleDateString('vi-VN') : null)}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 w-full cursor-pointer"
          />
          {selectedDateFilter && (
            <button 
              onClick={() => setSelectedDateFilter(null)}
              className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Xóa lọc
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <Timeline checkIns={filteredCheckIns} onItemClick={handleTimelineClick} onDeleteCheckIns={handleDeleteCheckIns} />
        </div>
      </div>

      {/* Main Content - Map */}
      <div className="w-full h-full relative">

        {/* Distance Overlay */}
        <div className="absolute top-6 right-6 z-[1000] glass-panel px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-500/20">
            <Navigation className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Tổng Quãng Đường</p>
            <p className="text-xl font-bold text-white leading-tight">
              {isRouting ? (
                <span className="text-sm font-normal animate-pulse text-emerald-400">Đang tính...</span>
              ) : (
                <>
                  {routedDistance > 10 ? Math.round(routedDistance) : routedDistance.toFixed(1)} <span className="text-sm font-normal text-white/60">km</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Floating Actions Unified Glass Panel */}
        <div className="absolute bottom-6 right-6 z-[1000] glass-panel p-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col gap-3 items-center w-[220px] sm:w-[240px]">
          {/* Main Action: Ghim vị trí của tôi */}
          <button 
            onClick={handleLocateMe}
            disabled={isLocating}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer font-semibold"
          >
            <MapPin className={`w-5 h-5 shrink-0 ${isLocating ? 'animate-bounce' : ''}`} />
            <span className="text-sm truncate">
              {isLocating ? 'Đang định vị...' : 'Ghim vị trí của tôi'}
            </span>
          </button>

          {/* GPS Locate Only Button */}
          <button 
            onClick={handleFindMyLocation}
            disabled={isLocating}
            className="w-full bg-white/5 hover:bg-white/10 text-sky-400 hover:text-sky-300 py-2 px-4 rounded-xl border border-white/5 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer text-sm font-medium"
            title="Tìm vị trí hiện tại"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
            Vị trí hiện tại
          </button>
        </div>

        {/* The Map */}
        <MapWrapper 
          checkIns={filteredCheckIns} 
          onMapClick={handleMapClick} 
          userLocation={userLocation}
          draftLocation={draftLocation}
          draftAddress={draftAddress}
          onConfirmDraft={handleConfirmDraft}
          onCancelDraft={() => setDraftLocation(null)}
          hotspots={hotspots}
          routeDays={routedDays}
          friendCheckIns={friendCheckInGroups}
        />
      </div>

      {/* Modals */}
      {selectedLocation && (
        <CheckInModal 
          location={selectedLocation} 
          address={draftAddress !== "Đang tải địa chỉ..." ? draftAddress : undefined}
          onClose={() => setSelectedLocation(null)}
          onSubmit={handleSubmitCheckIn}
        />
      )}
      
      {showStats && (
        <StatisticsModal checkIns={filteredCheckIns} currentUser={currentUser} onClose={() => setShowStats(false)} />
      )}

      {showWrapUp && (
        <WrapUpModal 
          checkIns={checkIns} 
          userProfile={userProfile} 
          year={new Date().getFullYear()} 
          onClose={() => setShowWrapUp(false)} 
        />
      )}
      
    </div>
  );
}
