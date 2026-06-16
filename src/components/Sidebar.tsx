import Link from 'next/link';
import { 
  ChevronDown, 
  Search, 
  Home, 
  Calendar, 
  Sparkles, 
  Inbox, 
  Book, 
  Users, 
  Plus, 
  ListTodo,
  Settings,
  Mail,
  MoreHorizontal
} from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-60 bg-sidebar border-r border-border h-screen fixed top-0 left-0 flex flex-col text-[14px] text-muted-foreground font-medium group transition-all duration-300">
      {/* Workspace Switcher */}
      <div className="flex items-center justify-between px-3 py-3 hover:bg-secondary cursor-pointer transition-colors mt-2 mx-2 rounded-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 flex-shrink-0">
            P
          </div>
          <span className="text-foreground truncate font-semibold">Phước Thành's Sp...</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Main Navigation */}
        <div className="px-2 mt-2 space-y-[2px]">
          <NavItem icon={<Search className="w-4 h-4" />} label="Search" />
          <NavItem icon={<Home className="w-4 h-4" />} label="Home" />
          <NavItem icon={<Calendar className="w-4 h-4" />} label="Meetings" />
          <NavItem icon={<Sparkles className="w-4 h-4" />} label="Notion AI" />
          <NavItem icon={<Inbox className="w-4 h-4" />} label="Inbox" />
          <NavItem icon={<Book className="w-4 h-4" />} label="Library" />
          <NavItem icon={<Users className="w-4 h-4" />} label="Workers" />
        </div>

        {/* Private Section */}
        <div className="mt-6">
          <div className="px-3 flex items-center justify-between group/section cursor-pointer hover:bg-secondary py-1 transition-colors">
            <span className="text-xs font-semibold">Private</span>
            <div className="flex gap-1 opacity-0 group-hover/section:opacity-100">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="px-2 mt-1 space-y-[2px]">
            <Link href="/" className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary text-foreground cursor-pointer">
              <ListTodo className="w-4 h-4 text-emerald-500" />
              <span className="truncate">Nhiệm vụ hằng ngày</span>
            </Link>
            <NavItem icon={<span className="w-4 h-4 flex items-center justify-center text-lg">👋</span>} label="Getting Started" />
            <NavItem icon={<span className="w-4 h-4 flex items-center justify-center text-lg">🛠️</span>} label="Databases Demo" />
          </div>
        </div>

        {/* Teamspaces Section */}
        <div className="mt-6">
          <div className="px-3 flex items-center justify-between group/section cursor-pointer hover:bg-secondary py-1 transition-colors">
            <span className="text-xs font-semibold text-muted-foreground">Teamspaces</span>
            <div className="flex gap-1 opacity-0 group-hover/section:opacity-100">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="px-2 mt-1 space-y-[2px]">
            <NavItem icon={<span className="w-4 h-4 flex items-center justify-center text-lg">🏠</span>} label="Phước Thành's Space HQ" />
            <NavItem icon={<Plus className="w-4 h-4" />} label="Add new" />
          </div>
        </div>

        {/* Notion Apps Section */}
        <div className="mt-6 mb-4">
          <div className="px-3 flex items-center justify-between group/section cursor-pointer hover:bg-secondary py-1 transition-colors">
            <span className="text-xs font-semibold text-muted-foreground">Notion apps</span>
            <div className="flex gap-1 opacity-0 group-hover/section:opacity-100">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="px-2 mt-1 space-y-[2px]">
            <NavItem icon={<Mail className="w-4 h-4" />} label="Notion Mail" />
          </div>
        </div>
      </nav>
      
      {/* Footer Tools */}
      <div className="px-4 py-3 border-t border-border mt-auto flex justify-between items-center text-muted-foreground">
        <Settings className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" />
      </div>
    </aside>
  );
}

function NavItem({ icon, label, isActive = false }: { icon: React.ReactNode, label: string, isActive?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-1 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-secondary text-foreground' : 'hover:bg-secondary'}`}>
      <div className="flex items-center gap-2 truncate">
        <div className="flex-shrink-0 text-muted-foreground">
          {icon}
        </div>
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}
