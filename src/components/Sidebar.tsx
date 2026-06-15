import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 h-screen fixed top-0 left-0 flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">PT<span className="text-red-500">.DO</span></h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-900 text-zinc-100">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>
        <Link href="/matrix" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Ma trận Todo
        </Link>
        <Link href="/notes" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Ghi chú
        </Link>
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 cursor-pointer text-zinc-400 hover:text-zinc-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
            SV
          </div>
          <span className="text-sm">Hồ sơ Sinh viên</span>
        </div>
      </div>
    </aside>
  );
}
