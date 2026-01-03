
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppSettings, Task, Connector } from '../types';
import { i18n } from '../i18n';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  t: (key: keyof typeof i18n['ar']) => string;
  tasks: Task[];
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  connectors: Connector[];
  addConnector: (name: string, baseUrl: string, apiKey?: string) => void;
  deleteConnector: (id: string) => void;
  toggleConnector: (id: string) => void;
  resetProfile: () => void;
  exportSettings: () => void;
  importSettings: (json: string) => void;
}

const SETTINGS_KEY = 'proai_settings_v1';
const TASKS_KEY = 'proai_tasks_v1';
const CONNECTORS_KEY = 'proai_connectors_v1';

const defaultSettings: AppSettings = {
  profileName: 'مستخدم محترف',
  theme: 'dark',
  lang: 'ar',
  fontSize: 'medium',
  bubbleRadius: 16,
  compactMode: false,
  sidebarWidth: 288,
  globalSystemInstruction: 'أنت Pro AI، مساعد ذكي ومفيد. قدم إجابات دقيقة وموثقة.',
  soundOnSend: true,
  soundOnReceive: true,
  desktopNotifications: false,
  showTokens: false,
  enableSourcesButton: true,
  experimentalFeatures: false
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [connectors, setConnectors] = useState<Connector[]>(() => {
    const stored = localStorage.getItem(CONNECTORS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    // Apply global attributes to document
    document.documentElement.className = settings.theme;
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.lang = settings.lang;
    document.documentElement.dir = settings.lang === 'ar' ? 'rtl' : 'ltr';
    
    document.body.style.fontSize = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';
    document.documentElement.style.setProperty('--bubble-radius', `${settings.bubbleRadius}px`);
    document.documentElement.style.setProperty('--sidebar-width', `${settings.sidebarWidth}px`);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(CONNECTORS_KEY, JSON.stringify(connectors));
  }, [connectors]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const t = useCallback((key: keyof typeof i18n['ar']) => {
    return i18n[settings.lang][key] || key;
  }, [settings.lang]);

  const addTask = useCallback((title: string) => {
    const newTask: Task = { id: crypto.randomUUID(), title, done: false };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const addConnector = useCallback((name: string, baseUrl: string, apiKey?: string) => {
    const newConn: Connector = { id: crypto.randomUUID(), name, baseUrl, apiKey, enabled: true };
    setConnectors(prev => [...prev, newConn]);
  }, []);

  const deleteConnector = useCallback((id: string) => {
    setConnectors(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleConnector = useCallback((id: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  }, []);

  const resetProfile = useCallback(() => {
    updateSettings({ profileName: settings.lang === 'ar' ? 'مستخدم محترف' : 'Pro User' });
  }, [settings.lang, updateSettings]);

  const exportSettings = useCallback(() => {
    const data = { settings, tasks, connectors };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proai-settings-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [settings, tasks, connectors]);

  const importSettings = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.settings) setSettings(data.settings);
      if (data.tasks) setTasks(data.tasks);
      if (data.connectors) setConnectors(data.connectors);
      alert(settings.lang === 'ar' ? 'تم استيراد الإعدادات بنجاح!' : 'Settings imported successfully!');
    } catch (e) {
      alert(settings.lang === 'ar' ? 'خطأ في ملف الإعدادات.' : 'Error in settings file.');
    }
  }, [settings.lang]);

  const value = {
    settings,
    updateSettings,
    t,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    connectors,
    addConnector,
    deleteConnector,
    toggleConnector,
    resetProfile,
    exportSettings,
    importSettings
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
