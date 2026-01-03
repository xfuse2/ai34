
import React, { useState, useRef, useEffect } from 'react';
import { 
  UserIcon, SettingsIcon, PaletteIcon, HelpIcon, ShortcutIcon, 
  TaskIcon, BellIcon, PlugIcon, CodeIcon, CrownIcon, MapIcon 
} from './Icons';
import { PanelId } from '../../types';
import { useSettings } from '../../hooks/useSettings';

interface UserMenuProps {
  onOpenItem: (panel: PanelId) => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  panel: PanelId;
}

interface Separator {
  separator: true;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenItem }) => {
  const { t, settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_ITEMS: (MenuItem | Separator)[] = [
    { label: t('account'), icon: <UserIcon />, panel: 'account' },
    { label: t('preferences'), icon: <SettingsIcon />, panel: 'preferences' },
    { label: t('customize'), icon: <PaletteIcon />, panel: 'customize' },
    { label: t('assistant'), icon: <HelpIcon />, panel: 'assistant' },
    { label: t('shortcuts'), icon: <ShortcutIcon />, panel: 'shortcuts' },
    { label: t('tasks'), icon: <TaskIcon />, panel: 'tasks' },
    { label: t('notifications'), icon: <BellIcon />, panel: 'notifications' },
    { label: t('connectors'), icon: <PlugIcon />, panel: 'connectors' },
    { label: t('api'), icon: <CodeIcon />, panel: 'api' },
    { label: t('pro'), icon: <CrownIcon />, panel: 'pro' },
    { separator: true },
    { label: t('allSettings'), icon: <SettingsIcon />, panel: 'allSettings' },
    { label: t('plans'), icon: <MapIcon />, panel: 'plans' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-brand text-sm font-bold hover:bg-brand/20 transition-all shadow-lg active:scale-95"
      >
        {settings.profileName[0].toUpperCase()}
      </button>
      
      {isOpen && (
        <div 
          className={`absolute top-full ${settings.lang === 'ar' ? 'right-0' : 'left-0'} mt-3 w-64 bg-dropdownBg border border-borderColor rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] py-2 z-[999] animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
            {MENU_ITEMS.map((item, idx) => {
              if ('separator' in item) {
                return <div key={`sep-${idx}`} className="h-px bg-borderColor my-2 mx-3" />;
              }
              return (
                <button
                  key={item.panel}
                  onClick={() => {
                    onOpenItem(item.panel);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-3 text-[14px] text-primaryText hover:bg-hoverBg transition-colors ${settings.lang === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <span className="text-brand/70">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
