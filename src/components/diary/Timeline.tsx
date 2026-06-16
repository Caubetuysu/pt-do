import React, { useState } from 'react';
import { CheckIn } from '@/services/diaryService';
import { MapPin, Trash2, X, CheckSquare, Square } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
        <MapPin className="w-12 h-12 mb-4 opacity-20" />
        <p>Chưa có địa điểm nào.</p>
        <p className="text-sm mt-2">Hãy bấm vào bản đồ hoặc sử dụng GPS để Check-in!</p>
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
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-background relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Lịch sử Hành trình</h2>
        <button 
          onClick={() => {
            setIsEditing(!isEditing);
            setSelectedIds(new Set());
            setShowConfirm(false);
          }}
          className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
        >
          {isEditing ? <X className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
        </button>
      </div>

      {isEditing && (
        <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg border border-border">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm">
            {selectedIds.size === checkIns.length ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
            Chọn tất cả
          </button>
          <span className="text-sm font-medium">{selectedIds.size} đã chọn</span>
        </div>
      )}

      <div className="relative border-l-2 border-muted pl-6 space-y-8 flex-1">
        {checkIns.map((checkIn) => (
          <div key={checkIn.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] bg-background p-1">
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
            </div>
            
            {/* Content Container */}
            <div className="flex items-center gap-3">
              {isEditing && (
                <button 
                  onClick={() => toggleSelection(checkIn.id)}
                  className="p-1 flex-shrink-0"
                >
                  {selectedIds.has(checkIn.id) ? (
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              )}
              
              <div 
                className={`flex-1 bg-secondary/30 rounded-lg p-4 border transition-colors cursor-pointer active:scale-95 ${
                  selectedIds.has(checkIn.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-border/50 hover:bg-secondary/50'
                }`}
                onClick={() => {
                  if (isEditing) {
                    toggleSelection(checkIn.id);
                  } else {
                    onItemClick?.(checkIn.location.lat, checkIn.location.lng);
                  }
                }}
              >
                <div className="text-sm font-semibold text-emerald-500 mb-2 flex items-center justify-between">
                  <span>{checkIn.timestamp.toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  {checkIn.weather && (
                    <span className="text-base" title={`${checkIn.weather.desc} ${checkIn.weather.temperature}°C`}>
                      {checkIn.weather.emoji} {checkIn.weather.temperature}°C
                    </span>
                  )}
                </div>
                <p className="text-foreground whitespace-pre-wrap">{checkIn.activityText}</p>
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{checkIn.address || `${checkIn.location.lat.toFixed(4)}, ${checkIn.location.lng.toFixed(4)}`}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditing && selectedIds.size > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t border-border mt-auto">
          {showConfirm ? (
            <div className="bg-card border border-border rounded-lg p-4 shadow-xl">
              <p className="text-sm font-medium mb-3 text-center">Chắc chắn xóa {selectedIds.size} mục này?</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Xóa {selectedIds.size} mục đã chọn
            </button>
          )}
        </div>
      )}
    </div>
  );
}
