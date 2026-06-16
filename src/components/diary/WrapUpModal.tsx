"use client";
import React, { useState, useMemo } from 'react';
import { CheckIn } from '@/services/diaryService';
import { UserProfile, getLevelTitle } from '@/services/userService';
import { X, ChevronLeft, ChevronRight, Navigation, MapPin, Moon, Coffee, Zap, Home, Star, Award } from 'lucide-react';

interface WrapUpModalProps {
  checkIns: CheckIn[];
  userProfile: UserProfile | null;
  year: number;
  onClose: () => void;
}

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

export function WrapUpModal({ checkIns, userProfile, year, onClose }: WrapUpModalProps) {
  const [slide, setSlide] = useState(0);

  const stats = useMemo(() => {
    const yearCheckIns = checkIns.filter(c => c.timestamp.getFullYear() === year);

    // Total km
    const sorted = [...yearCheckIns].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let totalKm = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalKm += getDistanceInKm(sorted[i-1].location.lat, sorted[i-1].location.lng, sorted[i].location.lat, sorted[i].location.lng);
    }

    // Monthly counts
    const monthlyCounts = Array(12).fill(0);
    const monthlyKm = Array(12).fill(0);
    yearCheckIns.forEach((c, i) => {
      const m = c.timestamp.getMonth();
      monthlyCounts[m]++;
    });
    for (let m = 0; m < 12; m++) {
      const monthCheckins = sorted.filter(c => c.timestamp.getMonth() === m);
      for (let i = 1; i < monthCheckins.length; i++) {
        monthlyKm[m] += getDistanceInKm(monthCheckins[i-1].location.lat, monthCheckins[i-1].location.lng, monthCheckins[i].location.lat, monthCheckins[i].location.lng);
      }
    }
    const busiestMonthIdx = monthlyCounts.indexOf(Math.max(...monthlyCounts));

    // Behavior analysis
    let nightOwl = 0, earlyBird = 0, cafeCount = 0, homeCount = 0;
    yearCheckIns.forEach(c => {
      const h = c.timestamp.getHours();
      if (h >= 22 || h < 4) nightOwl++;
      if (h >= 5 && h < 8) earlyBird++;
      const t = (c.activityText + ' ' + (c.address || '')).toLowerCase();
      if (t.includes('cafe') || t.includes('cà phê') || t.includes('coffee')) cafeCount++;
      if (t.includes('nhà') || t.includes('home') || t.includes('phòng trọ')) homeCount++;
    });

    // Personality
    let personality = { emoji: '🚀', title: 'Kẻ Phiêu Lưu', desc: 'Bạn luôn tìm kiếm những điều mới mẻ!' };
    if (nightOwl > earlyBird && nightOwl >= 5) personality = { emoji: '🦉', title: 'Cú Đêm Huyền Thoại', desc: 'Bạn sống mạnh nhất khi thành phố lên đèn!' };
    else if (earlyBird >= 5) personality = { emoji: '🌅', title: 'Người Dậy Sớm', desc: 'Bạn yêu buổi sáng hơn ai hết!' };
    else if (cafeCount >= 10) personality = { emoji: '☕', title: 'Tín Đồ Cafe', desc: `${cafeCount} lần check-in tại quán cafe — bạn nghiện rồi!` };
    else if (totalKm > 200) personality = { emoji: '🏍️', title: 'Phượt Thủ Thứ Thiệt', desc: `${Math.round(totalKm)}km một năm — không phải ai cũng làm được!` };
    else if (homeCount > yearCheckIns.length * 0.5) personality = { emoji: '🏠', title: 'Con Ngoan Nhà Hiền', desc: 'Bạn biết nơi đáng trân trọng nhất là ở đâu!' };

    // Fun comparisons
    const distanceToHanoi = Math.round(totalKm);
    const funFact = totalKm < 50
      ? `Đủ để đi từ nhà đến trường và về nhà ${Math.round(totalKm / 5)} lần 🏫`
      : totalKm < 300
      ? `Tương đương với ${Math.round(totalKm / 300)} chuyến Sài Gòn - Hà Nội ✈️`
      : `Tương đương ${Math.round(totalKm / 40075 * 100)}% một vòng Trái Đất 🌍`;

    // Top month bar chart
    const maxMonth = Math.max(...monthlyCounts, 1);

    return {
      total: yearCheckIns.length,
      totalKm,
      busiestMonth: MONTH_NAMES[busiestMonthIdx],
      busiestMonthCount: monthlyCounts[busiestMonthIdx],
      monthlyCounts,
      maxMonth,
      nightOwl,
      earlyBird,
      cafeCount,
      homeCount,
      personality,
      funFact,
      monthlyKm
    };
  }, [checkIns, year]);

  const slides = [
    // Slide 0: Opening
    <div key="intro" className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
      <div className="text-8xl mb-6 animate-bounce">🗺️</div>
      <h1 className="text-4xl font-black text-white mb-3">Năm {year}</h1>
      <h2 className="text-2xl font-bold text-emerald-200 mb-6">của bạn trên Bản đồ</h2>
      <p className="text-emerald-100 text-lg">Bạn đã đi qua {stats.total} địa điểm</p>
      <p className="text-emerald-100 mt-2">và để lại dấu ấn ở khắp nơi ✨</p>
    </div>,

    // Slide 1: Total km
    <div key="km" className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-violet-600 to-purple-800">
      <Navigation className="w-16 h-16 text-violet-200 mb-6" />
      <p className="text-violet-300 text-xl font-medium mb-2">Tổng quãng đường bạn đã đi</p>
      <div className="text-8xl font-black text-white mb-2">{Math.round(stats.totalKm)}</div>
      <p className="text-violet-200 text-3xl font-bold">km</p>
      <div className="mt-8 bg-white/10 rounded-2xl p-4 max-w-sm">
        <p className="text-violet-100 text-sm leading-relaxed">{stats.funFact}</p>
      </div>
    </div>,

    // Slide 2: Places
    <div key="places" className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-orange-500 to-rose-600">
      <MapPin className="w-16 h-16 text-orange-200 mb-6" />
      <p className="text-orange-200 text-xl font-medium mb-2">Bạn đã check-in tại</p>
      <div className="text-8xl font-black text-white mb-2">{stats.total}</div>
      <p className="text-orange-100 text-3xl font-bold">địa điểm</p>
      <div className="mt-8 bg-white/10 rounded-2xl p-5 w-full max-w-sm">
        <p className="text-orange-200 text-sm font-medium mb-3">Tháng sôi động nhất</p>
        <p className="text-white text-2xl font-bold">{stats.busiestMonth}</p>
        <p className="text-orange-200 text-sm mt-1">{stats.busiestMonthCount} địa điểm</p>
      </div>
    </div>,

    // Slide 3: Monthly chart
    <div key="chart" className="flex flex-col h-full p-8 bg-gradient-to-br from-slate-800 to-slate-900">
      <p className="text-slate-400 text-sm font-medium mb-1">Check-in theo từng tháng</p>
      <h2 className="text-2xl font-bold text-white mb-6">Hành Trình {year}</h2>
      <div className="flex items-end gap-1.5 flex-1 max-h-52">
        {stats.monthlyCounts.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(4, (count / stats.maxMonth) * 100)}%`,
                background: count === stats.busiestMonthCount
                  ? 'linear-gradient(to top, #10b981, #34d399)'
                  : 'linear-gradient(to top, #334155, #475569)'
              }}
            />
            <span className="text-slate-500 text-xs">{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-slate-400 text-xs mt-4 text-center">Tháng</p>
    </div>,

    // Slide 4: Personality
    <div key="personality" className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-pink-500 via-rose-500 to-red-600">
      <div className="text-8xl mb-6">{stats.personality.emoji}</div>
      <p className="text-pink-200 text-lg font-medium mb-3">Cá tính hành trình của bạn là</p>
      <h2 className="text-4xl font-black text-white mb-4">{stats.personality.title}</h2>
      <div className="bg-white/15 rounded-2xl p-5 max-w-sm">
        <p className="text-pink-100 leading-relaxed">{stats.personality.desc}</p>
      </div>
      <div className="flex gap-4 mt-6 text-sm text-pink-200">
        {stats.nightOwl > 0 && <span>🦉 {stats.nightOwl} đêm khuya</span>}
        {stats.cafeCount > 0 && <span>☕ {stats.cafeCount} quán cafe</span>}
      </div>
    </div>,

    // Slide 5: Level & ending
    <div key="level" className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600">
      <Award className="w-20 h-20 text-yellow-200 mb-4" />
      {userProfile && (
        <>
          <p className="text-yellow-200 text-lg mb-2">Danh hiệu của bạn</p>
          <div className="text-5xl font-black text-white mb-2">Level {userProfile.level}</div>
          <p className="text-yellow-100 text-2xl font-bold mb-6">{getLevelTitle(userProfile.level)}</p>
        </>
      )}
      <div className="bg-white/20 rounded-2xl p-5 max-w-sm mt-2">
        <p className="text-yellow-100 text-lg font-semibold">Năm {year + 1} sẽ còn</p>
        <p className="text-white text-3xl font-black">EPIC hơn!</p>
        <p className="text-yellow-200 text-sm mt-2">Tiếp tục khám phá nhé 🚀</p>
      </div>
    </div>
  ];

  const prev = () => setSlide(s => Math.max(0, s - 1));
  const next = () => setSlide(s => Math.min(slides.length - 1, s + 1));

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm h-[600px] rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Slide indicators */}
        <div className="absolute top-4 left-0 right-0 z-50 flex justify-center gap-1.5 px-12">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className={`h-1 rounded-full transition-all ${i === slide ? 'bg-white w-6' : 'bg-white/40 w-3'}`} />
          ))}
        </div>

        {/* Slide content */}
        <div className="h-full">
          {slides[slide]}
        </div>

        {/* Nav buttons */}
        {slide > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 bottom-8 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {slide < slides.length - 1 && (
          <button
            onClick={next}
            className="absolute right-3 bottom-8 p-3 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Tap zones */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="flex-1 pointer-events-auto" onClick={prev} />
          <div className="flex-1 pointer-events-auto" onClick={next} />
        </div>
      </div>
    </div>
  );
}
