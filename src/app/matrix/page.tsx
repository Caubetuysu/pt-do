"use client";

import React from 'react';
import { useStore } from '../../store/useStore';

export default function MatrixPage() {
  const tasks = useStore(state => state.tasks);

  const q1 = tasks.filter(t => t.eisenhowerMatrix === 'Q1');
  const q2 = tasks.filter(t => t.eisenhowerMatrix === 'Q2');
  const q3 = tasks.filter(t => t.eisenhowerMatrix === 'Q3');
  const q4 = tasks.filter(t => t.eisenhowerMatrix === 'Q4');

  const MatrixBox = ({ title, tasks, colorClass }: { title: string, tasks: any[], colorClass: string }) => (
    <div className={`p-6 rounded-xl border ${colorClass} bg-zinc-900/50 min-h-[300px]`}>
      <h3 className="text-xl font-semibold mb-4 text-zinc-200">{title}</h3>
      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300">
            {t.title}
          </div>
        ))}
        {tasks.length === 0 && <p className="text-zinc-500 text-sm italic">Trống</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <header className="border-b border-zinc-800 pb-6 shrink-0">
        <h1 className="text-4xl font-light tracking-tight text-zinc-100">
          Ma trận <span className="text-zinc-500">Eisenhower</span>
        </h1>
        <p className="text-zinc-400 mt-2">Kéo thả công việc để ưu tiên xử lý.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <MatrixBox title="Q1: Khẩn cấp & Quan trọng" tasks={q1} colorClass="border-red-900/50" />
        <MatrixBox title="Q2: Quan trọng (Không khẩn cấp)" tasks={q2} colorClass="border-amber-900/50" />
        <MatrixBox title="Q3: Khẩn cấp (Không quan trọng)" tasks={q3} colorClass="border-blue-900/50" />
        <MatrixBox title="Q4: Không khẩn cấp & Không quan trọng" tasks={q4} colorClass="border-zinc-800" />
      </div>
    </div>
  );
}
