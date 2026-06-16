import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

interface CheckInModalProps {
  location: { lat: number; lng: number };
  address?: string;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export function CheckInModal({ location, address, onClose, onSubmit }: CheckInModalProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Set a 10-second timeout for the Firebase write
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      );
      
      await Promise.race([onSubmit(text), timeoutPromise]);
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
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden">
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
          
          <div className="flex justify-end gap-3 mt-6">
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
