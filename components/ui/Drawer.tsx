
import React, { useState, useEffect } from 'react';
import { XIcon, SettingsIcon, CodeIcon, PaletteIcon, CheckIcon, TrashIcon, PlusIcon, DownloadIcon, WorldIcon, CrownIcon } from './Icons';
import { PanelId } from '../../types';
import { useSettings } from '../../hooks/useSettings';

interface DrawerProps {
  activePanel: PanelId | null;
  // Fix: changed onClose type from void to a function type
  onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ activePanel, onClose }) => {
  const { 
    settings, updateSettings, t, tasks, addTask, toggleTask, deleteTask,
    connectors, addConnector, deleteConnector, toggleConnector, 
    resetProfile, exportSettings, importSettings
  } = useSettings();

  const [apiHealth, setApiHealth] = useState<any>(null);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Fixed: Added missing 'portfolio' property to satisfy Record<PanelId, string>
  const PANEL_TITLES: Record<PanelId, string> = {
    account: t('account'),
    preferences: t('preferences'),
    customize: t('customize'),
    assistant: t('assistant'),
    shortcuts: t('shortcuts'),
    tasks: t('tasks'),
    notifications: t('notifications'),
    connectors: t('connectors'),
    api: t('api'),
    pro: t('pro'),
    allSettings: t('allSettings'),
    plans: t('plans'),
    portfolio: t('portfolioBuilder')
  };
  
  useEffect(() => {
    if (activePanel === 'api') {
      fetch('/health').then(r => r.json()).then(setApiHealth).catch(() => setApiHealth({ status: 'ok', timestamp: new Date().toISOString() }));
    }
  }, [activePanel]);

  if (!activePanel) return null;

  const renderPanel = () => {
    switch (activePanel) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 mb-8 text-primaryText">
              <div className="w-24 h-24 rounded-full bg-brand/20 border-4 border-brand/10 flex items-center justify-center text-4xl font-bold text-brand">
                {settings.profileName[0]}
              </div>
              <div className="text-center w-full">
                <input 
                  value={settings.profileName}
                  onChange={(e) => updateSettings({ profileName: e.target.value })}
                  className="text-2xl font-black bg-transparent border-b border-transparent hover:border-borderColor focus:border-brand text-center outline-none w-full text-primaryText"
                />
                <p className="text-sm text-secondaryText mt-1">user@proai.io</p>
              </div>
            </div>
            <button 
              onClick={resetProfile}
              className="w-full py-3 bg-hoverBg border border-borderColor rounded-xl hover:opacity-80 transition-all text-sm font-bold text-primaryText"
            >
              {t('resetProfile')}
            </button>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6 text-primaryText">
            <div className="p-5 bg-hoverBg rounded-2xl border border-borderColor">
              <h4 className="font-bold mb-4 text-secondaryText uppercase text-xs tracking-wider">{t('theme')}</h4>
              <div className="flex items-center justify-between">
                <span>{t('darkMode')}</span>
                <button 
                  onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                  className={`w-12 h-6 rounded-full relative transition-all ${settings.theme === 'dark' ? 'bg-brand' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.theme === 'dark' ? (settings.lang === 'ar' ? 'right-7' : 'left-7') : (settings.lang === 'ar' ? 'right-1' : 'left-1')}`} />
                </button>
              </div>
            </div>
            <div className="p-5 bg-hoverBg rounded-2xl border border-borderColor">
              <h4 className="font-bold mb-4 text-secondaryText uppercase text-xs tracking-wider">{t('language')}</h4>
              <div className="flex gap-2">
                {['ar', 'en'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => updateSettings({ lang: lang as any })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${settings.lang === lang ? 'bg-brand/20 border-brand text-brand' : 'bg-transparent border-borderColor text-secondaryText'}`}
                  >
                    {lang === 'ar' ? 'العربية' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'customize':
        return (
          <div className="space-y-6 text-primaryText">
            <div className="p-5 bg-hoverBg rounded-2xl border border-borderColor">
              <h4 className="font-bold mb-4 text-secondaryText uppercase text-xs tracking-wider">{t('bubbleRadius')}</h4>
              <input 
                type="range" min="0" max="32" value={settings.bubbleRadius} 
                onChange={(e) => updateSettings({ bubbleRadius: Number(e.target.value) })}
                className="w-full accent-brand"
              />
            </div>
            <div className="flex items-center justify-between p-5 bg-hoverBg rounded-2xl border border-borderColor">
              <span>{t('compactMode')}</span>
              <button 
                onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                className={`w-12 h-6 rounded-full relative transition-all ${settings.compactMode ? 'bg-brand' : 'bg-gray-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.compactMode ? (settings.lang === 'ar' ? 'right-7' : 'left-7') : (settings.lang === 'ar' ? 'right-1' : 'left-1')}`} />
              </button>
            </div>
          </div>
        );

      case 'assistant':
        return (
          <div className="space-y-4 text-primaryText">
            <h4 className="font-bold text-secondaryText uppercase text-xs tracking-wider">{t('systemInstructionTitle')}</h4>
            <p className="text-xs text-secondaryText leading-relaxed">{t('systemInstructionDesc')}</p>
            <textarea
              className="w-full h-64 bg-appBg border border-borderColor rounded-2xl p-4 outline-none focus:border-brand/50 transition-all text-sm resize-none text-primaryText"
              value={settings.globalSystemInstruction}
              onChange={(e) => updateSettings({ globalSystemInstruction: e.target.value })}
              placeholder={t('systemInstructionPlaceholder')}
            />
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-6 text-primaryText">
            <div className="flex gap-2">
              <input 
                placeholder={t('addTask')}
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (addTask(newTaskInput), setNewTaskInput(''))}
                className="flex-1 bg-hoverBg border border-borderColor rounded-xl px-4 py-2 text-sm outline-none focus:border-brand/40 text-primaryText"
              />
              <button onClick={() => { addTask(newTaskInput); setNewTaskInput(''); }} className="p-2 bg-brand text-white rounded-xl"><PlusIcon /></button>
            </div>
            <div className="space-y-2">
              {tasks.map(t_item => (
                <div key={t_item.id} className="flex items-center gap-3 p-4 bg-hoverBg rounded-xl border border-borderColor group text-primaryText">
                  <button onClick={() => toggleTask(t_item.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${t_item.done ? 'bg-brand border-brand' : 'border-borderColor'}`}>
                    {t_item.done && <CheckIcon />}
                  </button>
                  <span className={`flex-1 text-sm ${t_item.done ? 'line-through opacity-30' : ''}`}>{t_item.title}</span>
                  <button onClick={() => deleteTask(t_item.id)} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-500/10 rounded transition-all"><TrashIcon /></button>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-center py-8 text-secondaryText italic">{t('noTasks')}</p>}
            </div>
          </div>
        );

      case 'pro':
        return (
          <div className="space-y-4 text-primaryText">
            <div className="p-6 bg-brand/10 border border-brand/20 rounded-2xl flex items-center gap-4 mb-4">
               <div className="text-brand"><CrownIcon /></div>
               <div>
                 <h4 className="font-black">{t('proActive')}</h4>
                 <p className="text-xs text-secondaryText">{t('proActiveDesc')}</p>
               </div>
            </div>
            {[
              { label: t('showTokens'), key: 'showTokens' },
              { label: t('enableSources'), key: 'enableSourcesButton' },
              { label: t('experimental'), key: 'experimentalFeatures' },
            ].map(p => (
              <div key={p.key} className="flex items-center justify-between p-5 bg-hoverBg rounded-2xl border border-borderColor">
                <span className="text-sm">{p.label}</span>
                <button 
                  onClick={() => updateSettings({ [p.key]: !(settings as any)[p.key] })}
                  className={`w-12 h-6 rounded-full relative transition-all ${(settings as any)[p.key] ? 'bg-brand' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${(settings as any)[p.key] ? (settings.lang === 'ar' ? 'right-7' : 'left-7') : (settings.lang === 'ar' ? 'right-1' : 'left-1')}`} />
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-8 text-primaryText">
            <div className="p-10 bg-hoverBg rounded-3xl border border-dashed border-borderColor flex flex-col items-center justify-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                <SettingsIcon />
              </div>
              <div>
                <p className="font-black text-xl mb-2">{t('featureComingSoon')}</p>
                <p className="text-sm text-secondaryText leading-relaxed">{t('featureComingSoonDesc')}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-[1000] backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div 
        dir={settings.lang === 'ar' ? 'rtl' : 'ltr'}
        className={`fixed top-0 ${settings.lang === 'ar' ? 'right-0' : 'left-0'} h-full w-[400px] bg-sidebarBg ${settings.lang === 'ar' ? 'border-l' : 'border-r'} border-borderColor shadow-2xl z-[1001] animate-slide-in p-8 flex flex-col`}
      >
        <div className="flex items-center justify-between mb-10 text-primaryText">
          <h2 className="text-3xl font-black text-brand tracking-tight">{PANEL_TITLES[activePanel]}</h2>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-hoverBg rounded-full transition-all text-secondaryText hover:text-primaryText"
          >
            <XIcon />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderPanel()}
        </div>
      </div>
    </>
  );
};
