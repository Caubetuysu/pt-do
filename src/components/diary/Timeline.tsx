import React, { useState } from 'react';
import { CheckIn } from '@/services/diaryService';
import { MapPin, Trash2, X, CheckSquare, Square, Calendar } from 'lucide-react';

interface TimelineProps {
  checkIns: CheckIn[];
  onItemClick?: (lat: number, lng: number) => void;
  onDeleteCheckIns?: (ids: string[]) => void;
}

export function Timeline({ checkIns, onItemClick, onDeleteCheckIns }: TimelineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  if (checkIns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 p-8 text-center bg-black/10">
        <MapPin className="w-12 h-12 mb-4 opacity-10" />
        <p className="font-semibold text-sm">Chưa có địa điểm nào</p>
        <p className="text-xs text-white/30 mt-1 max-w-[200px]">Hãy bấm vào bản đồ hoặc sử dụng GPS để Check-in!</p>
      </div>
    );
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === checkIns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(checkIns.map(c => c.id)));
    }
  };

  const handleDelete = () => {
    if (onDeleteCheckIns) {
      onDeleteCheckIns(Array.from(selectedIds));
      setIsEditing(false);
      setSelectedIds(new Set());
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214]/60 backdrop-blur-md relative overflow-y-auto">
      {/* Header panel */}
      <div className="flex items-center justify-between p-5 shrink-0 border-b border-white/[0.04]">
        <h2 className="text-lg font-bold text-white/95 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Hành trình Check-in
        </h2>
        <button 
          onClick={() => {
            setIsEditing(!isEditing);
            setSelectedIds(new Set());
            setShowConfirm(false);
          }}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isEditing 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
              : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
          title={isEditing ? "Hủy chỉnh sửa" : "Xóa check-in"}
        >
          {isEditing ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {isEditing && (
        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between bg-black/20 shrink-0">
          <button 
            onClick={toggleSelectAll} 
            className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {selectedIds.size === checkIns.length ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-white/40" />
            )}
            Chọn tất cả
          </button>
          <span className="text-xs font-semibold text-emerald-400">{selectedIds.size} đã chọn</span>
        </div>
      )}

      {/* Timeline view */}
      <div className="flex-1 p-6 overflow-y-auto min-h-0">
        <div className="relative border-l border-white/[0.08] pl-6 space-y-6">
          {checkIns.map((checkIn) => {
            const isSelected = selectedIds.has(checkIn.id);
            return (
              <div key={checkIn.id} className="relative group">
                {/* Glowing Timeline Dot */}
                <div className="absolute -left-[31px] top-4 flex h-4 w-4 items-center justify-center bg-transparent">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </div>
                
                {/* Content Container */}
                <div className="flex items-center gap-3">
                  {isEditing && (
                    <button 
                      onClick={() => toggleSelection(checkIn.id)}
                      className="p-1 shrink-0 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-white/30 hover:text-white/60 transition-colors" />
                      )}
                    </button>
                  )}
                  
                  <div 
                    className={`flex-1 glass-card rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' 
                        : 'border-white/[0.05] hover:border-white/10 hover:bg-white/[0.05]'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        toggleSelection(checkIn.id);
                      } else {
                        onItemClick?.(checkIn.location.lat, checkIn.location.lng);
                      }
                    }}
                  >
                    {/* Card Header (Date + Badges) */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-white/50 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
                        {checkIn.timestamp.toLocaleDateString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      
                      <div className="flex gap-1.5 items-center shrink-0">
                        {checkIn.mood && (
                          <span 
                            className="text-[10px] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-full" 
                            title="Tâm trạng"
                          >
                            {checkIn.mood}
                          </span>
                        )}
                        {checkIn.weather && (
                          <span 
                            className="text-[10px] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-full text-white/80" 
                            title={`${checkIn.weather.desc} ${checkIn.weather.temperature}°C`}
                          >
                            {checkIn.weather.emoji} {checkIn.weather.temperature}°C
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Activity Text */}
                    <p className="text-sm text-white/80 leading-relaxed font-medium">{checkIn.activityText}</p>

                    {/* Address Footer */}
                    <div className="mt-3 text-[11px] text-white/40 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
                      <span className="truncate">
                        {checkIn.address || `${checkIn.location.lat.toFixed(4)}, ${checkIn.location.lng.toFixed(4)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky confirm/delete bar */}
      {isEditing && selectedIds.size > 0 && (
        <div className="p-4 border-t border-white/[0.04] bg-[#121214]/90 backdrop-blur-lg shrink-0 mt-auto">
          {showConfirm ? (
            <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3 shadow-2xl">
              <p className="text-xs font-semibold mb-3 text-center text-white/85">Xác nhận xóa {selectedIds.size} check-in?</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold transition-colors cursor-pointer border border-white/5"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-950/20 active:scale-95"
                >
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirm(true)}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Xóa {selectedIds.size} mục đã chọn
            </button>
          )}
        </div>
      )}
    </div>
  );
}
