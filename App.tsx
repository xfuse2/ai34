
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import { useChatSessions } from './hooks/useChatSessions';
import { useSettings } from './hooks/useSettings';
import { callGeminiProxy } from './services/geminiService';
import { Message, PanelId, Attachment } from './types';
import { Drawer } from './components/ui/Drawer';
import { LanguageToggle } from './components/ui/LanguageToggle';
import { SettingsProvider } from './contexts/SettingsContext';
import { CrownIcon, XIcon } from './components/ui/Icons';
import PortfolioBuilder from './features/portfolio/PortfolioBuilder';

// تعريف واجهة aistudio للتعامل مع المفاتيح
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const AppContent: React.FC = () => {
  const { 
    sessions, activeSession, activeId, setActiveId, setSessions, createNewSession, 
    addMessageToSession 
  } = useChatSessions();
  const { settings } = useSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  // التحقق من حالة المفتاح عند التشغيل
  useEffect(() => {
    const checkInitialKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        // إذا كان التطبيق يعتمد على موديلات Pro بشكل أساسي، يمكننا إظهار المطالبة فوراً
        // لكننا هنا سنكتفي بالتحقق عند الحاجة أو إذا كان الموديل الحالي Pro
        if (selectedModel.includes('pro') && !hasKey) {
          setNeedsApiKey(true);
        }
      }
    };
    checkInitialKey();
  }, [selectedModel]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // وفقاً للتعليمات: نفترض النجاح فوراً لتجاوز Race Condition
      setNeedsApiKey(false);
    }
  };

  const handleNewSession = (mode: string = 'general') => {
    const session = createNewSession();
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, mode: mode as any } : s));
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSend = async (content: string, replyTo?: any, attachments?: Attachment[], useWeb?: boolean) => {
    if (!activeId || !activeSession) return;

    const userMsg: Omit<Message, 'id'> = { 
      role: 'user', content, timestamp: Date.now(), type: 'text', attachments 
    };
    addMessageToSession(activeId, userMsg);
    
    setIsLoading(true);
    try {
      const result = await callGeminiProxy([...activeSession.messages, userMsg as Message], {
        modelName: selectedModel,
        mode: activeSession.mode,
        enableWebGrounding: useWeb || webSearchEnabled
      });

      // فحص دقيق للخطأ 403 أو PERMISSION_DENIED
      const errorStr = (result.error || "").toLowerCase();
      if (errorStr.includes("403") || errorStr.includes("permission_denied") || errorStr.includes("not have permission") || errorStr.includes("not found")) {
        setNeedsApiKey(true);
        setIsLoading(false);
        return;
      }

      addMessageToSession(activeId, {
        role: 'assistant',
        content: result.error ? `Error: ${result.error}` : result.response,
        timestamp: Date.now(),
        type: result.type,
        mediaUrl: result.imageUrl,
        sources: result.sources,
        groundingMetadata: result.groundingMetadata
      });

      if (result.audioData && settings.autoSpeech) {
        const audio = new Audio(`data:audio/pcm;base64,${result.audioData}`);
        audio.play();
      }
    } catch (err: any) {
      console.error("Critical handleSend Error:", err);
      if (err?.message?.includes("403") || err?.message?.includes("PERMISSION_DENIED")) {
        setNeedsApiKey(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const apiKeyOverlay = needsApiKey && (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300" dir="rtl">
      <div className="w-24 h-24 bg-brand/20 text-brand rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce shadow-2xl shadow-brand/20">
        <CrownIcon />
      </div>
      <h2 className="text-3xl font-black mb-4 text-white tracking-tighter uppercase">تنشيط الوصول المتقدم</h2>
      <p className="max-w-md text-secondaryText mb-10 text-sm leading-relaxed font-medium">
        تم اكتشاف محاولة لاستخدام ميزات مقيدة (Gemini Pro أو البحث المتقدم). 
        يجب عليك اختيار مفتاح API من مشروع Google Cloud مفعل به الفوترة.
        <br/>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-brand underline mt-3 inline-block font-bold">تعرف على كيفية إعداد الفوترة</a>
      </p>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={handleOpenKeySelector}
          className="w-full py-5 bg-brand text-white font-black rounded-3xl shadow-2xl shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-[0.2em]"
        >
          اختيار مفتاح API الآن
        </button>
        <button 
          onClick={() => setNeedsApiKey(false)}
          className="w-full py-4 text-white/40 text-xs font-black hover:text-white transition-colors uppercase tracking-widest"
        >
          إلغاء والمتابعة بالمزايا الأساسية
        </button>
      </div>
    </div>
  );

  return (
    <div dir={settings.lang === 'ar' ? 'rtl' : 'ltr'} className="flex w-full h-screen bg-appBg text-primaryText overflow-hidden">
      {apiKeyOverlay}
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewSession}
        onRename={() => {}}
        onDelete={() => {}}
        onTogglePin={() => {}}
        onOpenSettings={setActivePanel}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-appBg relative">
        {activePanel === 'portfolio' ? (
          <PortfolioBuilder onOpenSidebar={() => setIsSidebarOpen(true)} />
        ) : (
          <ChatContainer
            session={activeSession as any}
            onSend={handleSend}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={setWebSearchEnabled}
          />
        )}
        <Drawer activePanel={activePanel} onClose={() => setActivePanel(null)} />
        <LanguageToggle />
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <AppContent />
  </SettingsProvider>
);

export default App;
