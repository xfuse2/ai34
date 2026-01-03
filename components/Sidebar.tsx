
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChatSession, PanelId } from '../types';
import { PlusIcon, SearchIcon, PinIcon, MenuIcon, TrashIcon, EditIcon, XIcon, UserIcon } from './ui/Icons';
import { UserMenu } from './ui/UserMenu';
import { useSettings } from '../hooks/useSettings';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortedSessions = useMemo(() => {
    return [...(sessions || [])]
      .filter(s => (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [sessions, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRename = (id: string, currentTitle: string) => {
    const newTitle = window.prompt(t('rename'), currentTitle);
    if (newTitle !== null && newTitle.trim() !== '') {
      onRename(id, newTitle);
    }
    setOpenMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      onDelete(id);
    }
    setOpenMenuId(null);
  };

  return (
    <aside 
      className={`sidebar-mobile flex-shrink-0 flex flex-col border-borderColor bg-sidebarBg h-full min-h-0 ${
        settings.lang === 'ar' ? 'md:border-l' : 'md:border-r'
      } ${!isOpen ? 'closed' : ''}`}
    >
      {/* Header Area - Fixed */}
      <div className="p-4 md:p-5 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <UserMenu onOpenItem={onOpenSettings} />
            <h1 className="text-xl md:text-2xl font-black text-brand tracking-tighter">Pro AI</h1>
          </div>
          
          {/* Close button - visible only on mobile */}
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-secondaryText hover:text-brand transition-colors"
          >
            <XIcon />
          </button>
        </div>
        
        <div className="space-y-2 mb-4 md:mb-6">
          <button
            onClick={onNew}
            className={`flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border transition-all shadow-sm font-bold ${
              activeId !== 'portfolio' ? 'bg-brand text-white border-brand hover:opacity-90' : 'bg-transparent border-borderColor text-primaryText hover:bg-hoverBg'
            }`}
          >
            <PlusIcon />
            <span>{t('newChat')}</span>
          </button>

          <button
            onClick={() => onSelect('portfolio')}
            className={`flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border transition-all shadow-sm font-bold ${
              activeId === 'portfolio' ? 'bg-brand text-white border-brand hover:opacity-90' : 'bg-transparent border-borderColor text-primaryText hover:bg-hoverBg'
            }`}
          >
            <UserIcon />
            <span>{t('portfolioBuilder')}</span>
          </button>
        </div>

        <div className="relative mb-2 md:mb-4">
          <div className={`absolute inset-y-0 ${settings.lang === 'ar' ? 'right-3' : 'left-3'} flex items-center pointer-events-none opacity-40`}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-appBg/50 border border-borderColor rounded-xl py-2 md:py-2.5 ${settings.lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-primaryText focus:border-brand/50 focus:outline-none transition-all placeholder:text-secondaryText`}
          />
        </div>
      </div>

      {/* Sessions List - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-safe min-h-0">
        <div className="space-y-1 md:space-y-2 pb-10">
          {sortedSessions.map((session) => (
            <div
              key={session.id}
              className={`group relative flex items-center rounded-xl cursor-pointer px-3 md:px-4 py-2 md:py-3 transition-all ${
                activeId === session.id ? 'bg-brand/10 border border-brand/20' : 'hover:bg-hoverBg border border-transparent'
              }`}
              onClick={() => onSelect(session.id)}
            >
              <div className="flex items-center justify-between w-full gap-2 min-w-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 overflow-hidden">
                  {session.isPinned && (
                    <div className="text-brand flex-shrink-0">
                      <PinIcon fill="currentColor" />
                    </div>
                  )}
                  <span className={`text-sm font-semibold truncate flex-1 ${activeId === session.id ? 'text-brand' : 'text-primaryText'} overflow-hidden text-ellipsis whitespace-nowrap`}>
                    {session.title}
                  </span>
                </div>
                
                <div className="relative flex-shrink-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === session.id ? null : session.id);
                    }}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg hover:bg-borderColor/50 text-secondaryText transition-colors ${openMenuId === session.id ? 'bg-borderColor/50 text-brand' : ''}`}
                  >
                    <MenuIcon />
                  </button>

                  {openMenuId === session.id && (
                    <div 
                      ref={dropdownRef}
                      className={`absolute top-full ${settings.lang === 'ar' ? 'left-0' : 'right-0'} mt-1 w-32 bg-dropdownBg border border-borderColor rounded-lg shadow-xl z-[1100] py-1 animate-in fade-in zoom-in-95 duration-100`}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRename(session.id, session.title); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primaryText hover:bg-hoverBg transition-colors"
                      >
                        <EditIcon />
                        <span>{t('rename')}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePin(session.id); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primaryText hover:bg-hoverBg transition-colors"
                      >
                        <PinIcon />
                        <span>{session.isPinned ? t('cancel') : t('pin')}</span>
                      </button>
                      <div className="h-px bg-borderColor my-1 mx-2" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <TrashIcon />
                        <span>{t('delete')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sortedSessions.length === 0 && (
            <div className="text-center py-10 opacity-20 text-xs italic text-secondaryText">{t('noSessions')}</div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
