import React from 'react';

export default function Dashboard() {
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
          Sắp đến hạn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Urgent Task */}
          <div className="border border-red-900/50 bg-red-950/20 p-5 rounded-xl glow-red transition-all">
            <div className="flex justify-between items-start">
              <h3 className="text-red-400 font-semibold text-lg">Thi thử ĐGNL đợt 1</h3>
              <span className="text-xs font-mono bg-red-500/20 text-red-300 px-2 py-1 rounded">Q1 Urgent</span>
            </div>
            <p className="text-zinc-400 text-sm mt-2">Đại học Bách Khoa Hà Nội</p>
            <div className="mt-4 pt-4 border-t border-red-900/30">
              <p className="text-3xl font-mono text-red-500 font-bold tracking-tighter">
                14:05:59
              </p>
              <p className="text-xs text-red-400/80 uppercase tracking-widest mt-1">Còn lại (Tiếng : Phút : Giây)</p>
            </div>
          </div>

          {/* Near Task */}
          <div className="border border-amber-900/50 bg-zinc-900/50 p-5 rounded-xl">
            <div className="flex justify-between items-start">
              <h3 className="text-amber-400 font-semibold text-lg">Nộp báo cáo giữa kỳ</h3>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Q1</span>
            </div>
            <p className="text-zinc-400 text-sm mt-2">Môn: Triết học Mác-Lênin</p>
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-2xl font-mono text-amber-500 font-bold tracking-tighter">
                02 Ngày
              </p>
              <p className="text-xs text-amber-500/70 uppercase tracking-widest mt-1">Sắp đến hạn</p>
            </div>
          </div>

          {/* Safe Task */}
          <div className="border border-zinc-800 bg-zinc-900/50 p-5 rounded-xl opacity-70">
            <div className="flex justify-between items-start">
              <h3 className="text-zinc-300 font-medium text-lg">Bài tập nhóm OOP</h3>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-500 px-2 py-1 rounded">Q2</span>
            </div>
            <p className="text-zinc-500 text-sm mt-2">Phân chia UML</p>
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xl font-mono text-zinc-400 font-bold tracking-tighter">
                08 Ngày
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Thong thả</p>
            </div>
          </div>
        </div>
      </section>

      {/* Todo Matrix & Notes */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div>
          <h2 className="text-xl font-medium text-zinc-200 mb-4">Todo List (Hôm nay)</h2>
          <div className="space-y-3">
            {[
              { title: "Đọc giáo trình Chương 3", time: "19:00", done: true },
              { title: "Giải 5 bài tập Giải tích", time: "20:30", done: false },
              { title: "Viết outline báo cáo", time: "22:00", done: false },
            ].map((t, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-lg border ${t.done ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-zinc-800 bg-zinc-900'}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${t.done ? 'bg-zinc-700 border-zinc-700 text-zinc-900' : 'border-zinc-500'}`}>
                  {t.done && "✓"}
                </div>
                <div className={t.done ? 'opacity-50 line-through' : ''}>
                  <p className="text-zinc-200">{t.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium text-zinc-200 mb-4">Take Note Gần Đây</h2>
          <div className="space-y-3">
            {[
              { title: "Tóm tắt công thức Đạo hàm", tag: "Toán", date: "Hôm qua" },
              { title: "Ideas cho tiểu luận Triết", tag: "Triết học", date: "2 ngày trước" },
            ].map((n, i) => (
              <div key={i} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                <div className="flex justify-between">
                  <h3 className="text-zinc-300 font-medium group-hover:text-white transition-colors">{n.title}</h3>
                  <span className="text-xs text-zinc-500">{n.date}</span>
                </div>
                <p className="text-xs font-mono bg-zinc-800 inline-block px-2 py-1 rounded text-zinc-400 mt-3">{n.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
