import React, { useMemo } from 'react';
import { CheckIn } from '@/services/diaryService';
import { X, Award, Map, Navigation, Moon, Coffee, Home, Zap } from 'lucide-react';

interface StatisticsModalProps {
  checkIns: CheckIn[];
  onClose: () => void;
}

// Helper for distance
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371;
  var dLat = (lat2-lat1) * (Math.PI/180);
  var dLon = (lon2-lon1) * (Math.PI/180); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export function StatisticsModal({ checkIns, onClose }: StatisticsModalProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    // Lọc check-ins của tháng hiện tại
    const thisMonthCheckIns = checkIns.filter(c => 
      c.timestamp.getMonth() === currentMonth && 
      c.timestamp.getFullYear() === currentYear
    );

    // Tính toán quãng đường tháng này
    let distance = 0;
    const sorted = [...thisMonthCheckIns].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 1; i < sorted.length; i++) {
      distance += getDistanceInKm(
        sorted[i-1].location.lat, sorted[i-1].location.lng,
        sorted[i].location.lat, sorted[i].location.lng
      );
    }

    // Phân tích danh hiệu
    let nightOwlCount = 0;
    let homeCount = 0;
    let cafeCount = 0;

    thisMonthCheckIns.forEach(c => {
      const hour = c.timestamp.getHours();
      if (hour >= 22 || hour <= 4) nightOwlCount++;
      
      const text = (c.activityText + ' ' + (c.address || '')).toLowerCase();
      if (text.includes('nhà') || text.includes('home')) homeCount++;
      if (text.includes('cafe') || text.includes('coffee') || text.includes('cà phê')) cafeCount++;
    });

    const titles = [];
    if (nightOwlCount >= 3) {
      titles.push({ icon: <Moon className="w-6 h-6 text-indigo-400" />, name: "Cú Đêm", desc: "Chuyên gia đi hoang sau 10h tối", color: "from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30" });
    }
    if (homeCount >= 5) {
      titles.push({ icon: <Home className="w-6 h-6 text-emerald-400" />, name: "Con Ngoan", desc: "Trai ngoan/gái đảm luôn về nhà đúng giờ", color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30" });
    }
    if (cafeCount >= 3) {
      titles.push({ icon: <Coffee className="w-6 h-6 text-amber-400" />, name: "Chiến Thần Cafe", desc: "Không có ngày nào thiếu Caffeine", color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30" });
    }
    if (distance >= 50) {
      titles.push({ icon: <Zap className="w-6 h-6 text-rose-400" />, name: "Phượt Thủ", desc: `Đã bào hơn ${Math.round(distance)}km tháng này`, color: "from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/30" });
    }

    if (titles.length === 0) {
      titles.push({ icon: <Map className="w-6 h-6 text-blue-400" />, name: "Tân Binh", desc: "Hành trình vạn dặm bắt đầu từ một bước chân", color: "from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30" });
    }

    return {
      distance,
      count: thisMonthCheckIns.length,
      titles
    };
  }, [checkIns, currentMonth, currentYear]);

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-yellow-300" />
            <h2 className="text-2xl font-bold">Bảng Phong Thần</h2>
          </div>
          <p className="text-emerald-100 opacity-90">Tổng kết tháng {currentMonth + 1}/{currentYear}</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-xl p-4 border border-border flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Quãng Đường</p>
                <p className="text-2xl font-bold">{stats.distance.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km</span></p>
              </div>
            </div>
            
            <div className="bg-secondary/50 rounded-xl p-4 border border-border flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-500">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Điểm Dừng</p>
                <p className="text-2xl font-bold">{stats.count} <span className="text-sm font-normal text-muted-foreground">nơi</span></p>
              </div>
            </div>
          </div>

          {/* Titles Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              Danh Hiệu Đạt Được
            </h3>
            <div className="space-y-3">
              {stats.titles.map((title, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r ${title.color} shadow-sm`}>
                  <div className="p-2 bg-background/50 rounded-lg backdrop-blur-sm">
                    {title.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{title.name}</h4>
                    <p className="text-sm opacity-90">{title.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
