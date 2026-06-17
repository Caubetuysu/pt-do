import React, { useState } from 'react';
import { MapPin, X, Home, GraduationCap, Building2 } from 'lucide-react';

const DEFAULT_LOCATIONS = [
  { label: 'Nhà ở', text: 'Nhà', icon: <Home className="w-4 h-4" /> },
  { label: 'Trường học', text: 'Trường học', icon: <GraduationCap className="w-4 h-4" /> },
  { label: 'Phòng trọ', text: 'Phòng trọ', icon: <Building2 className="w-4 h-4" /> },
];

const MOODS = [
  { emoji: '🤩', label: 'Tuyệt vời' },
  { emoji: '😊', label: 'Vui' },
  { emoji: '😐', label: 'Bình thường' },
  { emoji: '😢', label: 'Buồn' },
  { emoji: '😤', label: 'Bực bội' },
];

interface CheckInModalProps {
  location: { lat: number; lng: number };
  address?: string;
  onClose: () => void;
  onSubmit: (text: string, mood?: string) => Promise<void>;
}

export function CheckInModal({ location, address, onClose, onSubmit }: CheckInModalProps) {
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      );
      
      await Promise.race([onSubmit(text, selectedMood), timeoutPromise]);
      onClose();
    } catch (error: any) {
      console.error('Submit error', error);
      if (error.message === 'TIMEOUT') {
        alert('Lưu thất bại: Hết thời gian chờ. Có thể do Firebase Rules đang khoá quyền ghi hoặc mất mạng.');
      } else {
        alert('Lưu thất bại: Vui lòng kiểm tra quyền Firebase hoặc kết nối mạng.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Check-in Mới
          </h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Vị trí: <span className="font-medium text-foreground bg-secondary px-2 py-1 rounded">{address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
            </p>

            {/* Quick Fill Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DEFAULT_LOCATIONS.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(loc.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-sm font-medium rounded-full transition-colors border border-border"
                >
                  {loc.icon}
                  {loc.label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium mb-2">Bạn đang làm gì ở đây?</label>
            <textarea
              autoFocus
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="VD: Đang uống cafe ngắm biển..."
            />
          </div>

          {/* Mood Picker */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2.5">Tâm trạng hiện tại?</label>
            <div className="flex gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.emoji}
                  type="button"
                  title={mood.label}
                  onClick={() => setSelectedMood(selectedMood === mood.emoji ? undefined : mood.emoji)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all text-xl ${
                    selectedMood === mood.emoji
                      ? 'border-emerald-500 bg-emerald-500/10 scale-110'
                      : 'border-border bg-secondary/30 hover:border-emerald-400 hover:bg-emerald-500/5'
                  }`}
                >
                  <span>{mood.emoji}</span>
                  <span className="text-[9px] text-muted-foreground font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Check-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
