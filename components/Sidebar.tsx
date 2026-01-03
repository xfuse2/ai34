
import React, { useState, useMemo } from 'react';
import { ChatSession, PanelId } from '../types';
import { 
  PlusIcon, SearchIcon, PinIcon, MenuIcon, TrashIcon, 
  EditIcon, XIcon, UserIcon, WorldIcon, CameraIcon, CodeIcon, BellIcon, CrownIcon
} from './ui/Icons';
import { UserMenu } from './ui/UserMenu';
import { useSettings } from '../hooks/useSettings';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: (mode?: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: (panel: PanelId) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, activeId, onSelect, onNew, onRename, onDelete, onTogglePin, onOpenSettings, isOpen, onClose 
}) => {
  const { t, settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const TOOLS = [
    { id: 'files', label: 'RAG Files', icon: <PlusIcon />, mode: 'files' },
    { id: 'image', label: 'Image Lab', icon: <CameraIcon />, mode: 'image' },
    { id: 'code', label: 'Interpreter', icon: <CodeIcon />, mode: 'code' },
    { id: 'voice', label: 'Live Voice', icon: <BellIcon />, mode: 'voice' },
  ];

  const sortedSessions = useMemo(() => {
    return [...(sessions || [])]
      .filter(s => (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.isPinned === b.isPinned) ? (b.updatedAt - a.updatedAt) : (a.isPinned ? -1 : 1));
  }, [sessions, searchQuery]);

  return (
    <aside className={`sidebar-mobile flex-shrink-0 flex flex-col border-borderColor bg-sidebarBg h-full ${settings.lang === 'ar' ? 'md:border-l' : 'md:border-r'} ${!isOpen ? 'closed' : ''}`}>
      <div className="p-4 md:p-5 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserMenu onOpenItem={onOpenSettings} />
            <h1 className="text-xl font-black text-brand tracking-tighter">Pro AI</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-secondaryText"><XIcon /></button>
        </div>
        
        <button onClick={() => onNew('general')} className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-brand text-white font-black shadow-lg hover:opacity-90 transition-all mb-4">
          <PlusIcon /> <span>{t('newChat')}</span>
        </button>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => onNew(tool.mode)} className="flex flex-col items-center justify-center p-3 rounded-xl border border-borderColor bg-appBg/40 hover:border-brand/50 transition-all gap-1">
              <span className="text-brand opacity-80 scale-90">{tool.icon}</span>
              <span className="text-[9px] font-black uppercase text-secondaryText">{tool.label}</span>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 right-3 flex items-center opacity-40"><SearchIcon /></div>
          <input type="text" placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-appBg/50 border border-borderColor rounded-xl py-2 px-10 text-xs focus:border-brand/50 outline-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-20">
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-black text-secondaryText uppercase opacity-40 mb-2">History</div>
          {sortedSessions.map((session) => (
            <div key={session.id} className={`group relative flex items-center rounded-xl cursor-pointer px-3 py-2.5 transition-all ${activeId === session.id ? 'bg-brand/10 border border-brand/20' : 'hover:bg-hoverBg'}`} onClick={() => onSelect(session.id)}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {session.isPinned && <PinIcon fill="currentColor" />}
                <span className={`text-xs font-bold truncate ${activeId === session.id ? 'text-brand' : 'text-primaryText'}`}>{session.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-borderColor bg-sidebarBg/80 backdrop-blur-xl">
        <button onClick={() => onOpenSettings('plans')} className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-brand to-emerald-500 text-white shadow-lg shadow-brand/20 active:scale-95 transition-all">
          <div className="flex items-center gap-2">
            <CrownIcon />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase leading-none">Upgrade Pro</p>
              <p className="text-[8px] opacity-80 font-bold">Try Gemini 3 Pro</p>
            </div>
          </div>
          <XIcon className="rotate-45 scale-75" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
