"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MapWrapper } from '@/components/diary/MapWrapper';
import { Timeline } from '@/components/diary/Timeline';
import { CheckInModal } from '@/components/diary/CheckInModal';
import { StatisticsModal } from '@/components/diary/StatisticsModal';
import { diaryService, CheckIn, reverseGeocode } from '@/services/diaryService';
import { LocateFixed, Navigation, MapPin, Award, Plane, X } from 'lucide-react';

const MOCK_USER_ID = "traveler-user-123";

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
  const [showStats, setShowStats] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadCheckIns();
  }, []);

  const { hotspots, totalDistance, routeDays } = useMemo(() => {
    const spots: Hotspot[] = [];
    
    // Sort chronologically for polyline
    const sorted = [...checkIns].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let distance = 0;
    const daysMap = new Map<string, {lat: number, lng: number}[]>();

    sorted.forEach((checkIn, i) => {
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

      // Route and Distance Calculation
      if (i > 0) {
        const prev = sorted[i-1];
        distance += getDistanceInKm(prev.location.lat, prev.location.lng, checkIn.location.lat, checkIn.location.lng);
      }
      
      const dateStr = checkIn.timestamp.toLocaleDateString('vi-VN');
      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, []);
      }
      daysMap.get(dateStr)!.push(checkIn.location);
    });

    return {
      hotspots: spots.filter(h => h.count >= 2),
      totalDistance: distance,
      routeDays: Array.from(daysMap.entries()).map(([dateStr, points]) => ({ dateStr, points }))
    };
  }, [checkIns]);

  const loadCheckIns = async () => {
    try {
      const data = await diaryService.getCheckIns(MOCK_USER_ID);
      setCheckIns(data);
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

  const handleSubmitCheckIn = async (text: string) => {
    if (!selectedLocation) return;
    
    await diaryService.addCheckIn({
      userId: MOCK_USER_ID,
      location: selectedLocation,
      address: draftAddress !== "Đang tải địa chỉ..." ? draftAddress : undefined,
      timestamp: new Date(),
      activityText: text
    });
    
    setDraftLocation(null);
    setSelectedLocation(null);
    await loadCheckIns();
  };

  const handleTimelineClick = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    // This will trigger the UserLocationMarker in BaseMap to flyTo this location
  };

  const handleDeleteCheckIns = async (ids: string[]) => {
    try {
      await diaryService.deleteCheckIns(ids);
      await loadCheckIns();
    } catch (error) {
      console.error("Failed to delete check-ins:", error);
      alert("Đã xảy ra lỗi khi xóa dữ liệu.");
    }
  };

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden">
      
      {/* Sidebar - Timeline (Sliding drawer) */}
      <div className={`absolute top-0 left-0 h-full w-full sm:w-96 bg-card z-[2000] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-border bg-background flex items-center justify-between shadow-sm z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-500" />
            Nhật Ký Hành Trình
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Timeline checkIns={checkIns} onItemClick={handleTimelineClick} onDeleteCheckIns={handleDeleteCheckIns} />
        </div>
      </div>

      {/* Main Content - Map */}
      <div className="w-full h-full relative">
        {/* Toggle Sidebar Button (Airplane) */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`absolute top-6 left-6 z-[1000] bg-emerald-500 text-white p-3 rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2 ${isSidebarOpen ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'}`}
          title="Mở Nhật Ký Hành Trình"
        >
          <Plane className="w-6 h-6" />
          <span className="font-semibold hidden sm:inline">Nhật Ký</span>
        </button>

        {/* Distance Overlay */}
        <div className="absolute top-6 right-6 z-[1000] bg-background/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-border flex items-center gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-full">
            <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng Quãng Đường</p>
            <p className="text-xl font-bold text-foreground">
              {totalDistance > 10 ? Math.round(totalDistance) : totalDistance.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km</span>
            </p>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3 items-end">
          {/* Stats Button */}
          <button 
            onClick={() => setShowStats(true)}
            className="bg-background text-foreground p-3 rounded-full shadow-lg border border-border hover:bg-secondary transition-colors active:scale-95 flex items-center justify-center"
            title="Bảng Phong Thần (Thống Kê)"
          >
            <Award className="w-6 h-6 text-yellow-500" />
          </button>

          {/* GPS Locate Only Button */}
          <button 
            onClick={handleFindMyLocation}
            disabled={isLocating}
            className="bg-background text-foreground p-3 rounded-full shadow-lg border border-border hover:bg-secondary transition-colors active:scale-95 disabled:opacity-70 flex items-center justify-center"
            title="Định vị vị trí của tôi"
          >
            <LocateFixed className={`w-6 h-6 text-blue-500 ${isLocating ? 'animate-pulse' : ''}`} />
          </button>

          {/* Floating Action Button for Check-in at GPS */}
          <button 
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-emerald-500 text-white p-4 rounded-full shadow-xl hover:bg-emerald-600 transition-transform active:scale-95 disabled:opacity-70 flex items-center gap-2"
          >
            <MapPin className={`w-6 h-6 ${isLocating ? 'animate-bounce' : ''}`} />
            <span className="font-semibold hidden sm:inline">
              {isLocating ? 'Đang lấy vị trí...' : 'Ghim vị trí của tôi'}
            </span>
          </button>
        </div>

        {/* The Map */}
        <MapWrapper 
          checkIns={checkIns} 
          onMapClick={handleMapClick} 
          userLocation={userLocation}
          draftLocation={draftLocation}
          draftAddress={draftAddress}
          onConfirmDraft={handleConfirmDraft}
          onCancelDraft={() => setDraftLocation(null)}
          hotspots={hotspots}
          routeDays={routeDays}
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
        <StatisticsModal checkIns={checkIns} onClose={() => setShowStats(false)} />
      )}
      
    </div>
  );
}
