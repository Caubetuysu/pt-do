"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { TaskForm } from '../components/TaskForm';

export default function Dashboard() {
  const tasks = useStore(state => state.tasks);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calculate times
  const now = new Date();
  
  const calculateDaysLeft = (dueDate: Date) => {
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-zinc-100">
            Tổng quan <span className="text-zinc-500">công việc</span>
          </h1>
          <p className="text-zinc-400 mt-2">Quản lý tiến độ và ghi chú của bạn hôm nay.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-zinc-500">Level 12 • 450 EXP</p>
          <p className="text-xs text-zinc-600 mt-1">Hạng: Sinh viên cày cuốc</p>
        </div>
      </header>

      {/* Smart Deadline Countdown Widget */}
      <section>
        <h2 className="text-xl font-medium text-zinc-200 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          Đếm ngược Deadline
        </h2>
        
        {tasks.length === 0 ? (
          <div className="text-zinc-500 p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
            Chưa có công việc nào. Hãy thêm ở form bên dưới.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasks.map(task => {
              const daysLeft = calculateDaysLeft(task.dueDate);
              const isUrgent = daysLeft <= 1;
              const isNear = daysLeft > 1 && daysLeft <= 3;
              
              return (
                <div key={task.id} className={`p-5 rounded-xl transition-all border ${
                  isUrgent ? 'border-red-900/50 bg-red-950/20 glow-red' : 
                  isNear ? 'border-amber-900/50 bg-amber-950/20' : 
                  'border-zinc-800 bg-zinc-900/50'
                }`}>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold text-lg ${
                      isUrgent ? 'text-red-400' : isNear ? 'text-amber-400' : 'text-zinc-300'
                    }`}>{task.title}</h3>
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      isUrgent ? 'bg-red-500/20 text-red-300' : 
                      isNear ? 'bg-amber-500/20 text-amber-300' : 
                      'bg-zinc-800 text-zinc-500'
                    }`}>{task.eisenhowerMatrix}</span>
                  </div>
                  {task.description && <p className="text-zinc-400 text-sm mt-2">{task.description}</p>}
                  
                  <div className={`mt-4 pt-4 border-t ${
                    isUrgent ? 'border-red-900/30' : isNear ? 'border-amber-900/30' : 'border-zinc-800'
                  }`}>
                    <p className={`text-3xl font-mono font-bold tracking-tighter ${
                      isUrgent ? 'text-red-500' : isNear ? 'text-amber-500' : 'text-zinc-400'
                    }`}>
                      {daysLeft} Ngày
                    </p>
                    <p className={`text-xs uppercase tracking-widest mt-1 ${
                      isUrgent ? 'text-red-400/80' : isNear ? 'text-amber-500/70' : 'text-zinc-500'
                    }`}>
                      {isUrgent ? 'Khẩn cấp' : isNear ? 'Sắp đến hạn' : 'Thong thả'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Form and Todo List */}
        <div className="space-y-6">
          <TaskForm />
          
          <div>
            <h2 className="text-xl font-medium text-zinc-200 mb-4">Danh sách công việc</h2>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-zinc-500 text-sm">Trống.</p>
              ) : tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900">
                  <div className="w-5 h-5 rounded border border-zinc-500 flex items-center justify-center cursor-pointer hover:bg-zinc-800">
                    {/* Checkbox placeholder */}
                  </div>
                  <div>
                    <p className="text-zinc-200">{t.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">{t.dueDate.toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Preview */}
        <div>
          <h2 className="text-xl font-medium text-zinc-200 mb-4">Take Note Gần Đây</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
              <div className="flex justify-between">
                <h3 className="text-zinc-300 font-medium group-hover:text-white transition-colors">Ý tưởng cho đồ án</h3>
                <span className="text-xs text-zinc-500">Vừa xong</span>
              </div>
              <p className="text-xs font-mono bg-zinc-800 inline-block px-2 py-1 rounded text-zinc-400 mt-3">Web App</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
