"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MapWrapper } from '@/components/diary/MapWrapper';
import { Timeline } from '@/components/diary/Timeline';
import { CheckInModal } from '@/components/diary/CheckInModal';
import { diaryService, CheckIn, reverseGeocode } from '@/services/diaryService';
import { LocateFixed, Navigation, MapPin } from 'lucide-react';

const MOCK_USER_ID = "traveler-user-123";

interface Hotspot {
  lat: number;
  lng: number;
  count: number;
}

export default function DiaryPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [draftLocation, setDraftLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [draftAddress, setDraftAddress] = useState<string>("Đang tải địa chỉ...");

  useEffect(() => {
    loadCheckIns();
  }, []);

  const hotspots = useMemo(() => {
    const spots: Hotspot[] = [];
    checkIns.forEach(checkIn => {
      // 0.001 degrees is approx 111 meters
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
    return spots.filter(h => h.count >= 2);
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

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background overflow-hidden">
      
      {/* Sidebar - Timeline (Left on Desktop, Bottom on Mobile) */}
      <div className="w-full lg:w-96 h-1/3 lg:h-full border-b lg:border-b-0 lg:border-r border-border bg-card flex-shrink-0 z-10 shadow-lg">
        <div className="p-4 border-b border-border bg-background flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-500" />
            Nhật Ký Hành Trình
          </h1>
        </div>
        <div className="h-[calc(100%-60px)]">
          <Timeline checkIns={checkIns} onItemClick={handleTimelineClick} />
        </div>
      </div>

      {/* Main Content - Map */}
      <div className="flex-1 relative h-2/3 lg:h-full">
        {/* Floating Actions */}
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3 items-end">
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
      
    </div>
  );
}
