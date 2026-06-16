import React from 'react';
import { CheckIn } from '@/services/diaryService';
import { MapPin } from 'lucide-react';

interface TimelineProps {
  checkIns: CheckIn[];
  onItemClick?: (lat: number, lng: number) => void;
}

export function Timeline({ checkIns, onItemClick }: TimelineProps) {
  if (checkIns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
        <MapPin className="w-12 h-12 mb-4 opacity-20" />
        <p>Chưa có địa điểm nào.</p>
        <p className="text-sm mt-2">Hãy bấm vào bản đồ hoặc sử dụng GPS để Check-in!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-background">
      <h2 className="text-2xl font-bold mb-4">Lịch sử Hành trình</h2>
      <div className="relative border-l-2 border-muted pl-6 space-y-8">
        {checkIns.map((checkIn) => (
          <div key={checkIn.id} className="relative">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] bg-background p-1">
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
            </div>
            
            {/* Content */}
            <div 
              className="bg-secondary/30 rounded-lg p-4 border border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer active:scale-95"
              onClick={() => onItemClick?.(checkIn.location.lat, checkIn.location.lng)}
            >
              <div className="text-sm font-semibold text-emerald-500 mb-2">
                {checkIn.timestamp.toLocaleDateString('vi-VN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <p className="text-foreground whitespace-pre-wrap">{checkIn.activityText}</p>
              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{checkIn.address || `${checkIn.location.lat.toFixed(4)}, ${checkIn.location.lng.toFixed(4)}`}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
