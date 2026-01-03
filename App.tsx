
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import PortfolioBuilder from './features/portfolio/PortfolioBuilder';
import { useChatSessions } from './hooks/useChatSessions';
import { useSettings } from './hooks/useSettings';
import { callGeminiProxy } from './services/geminiService';
import { Message, PanelId, Attachment } from './types';
import { Drawer } from './components/ui/Drawer';
import { LanguageToggle } from './components/ui/LanguageToggle';
import { SettingsProvider } from './contexts/SettingsContext';
import { CrownIcon } from './components/ui/Icons';

// Augment Window interface safely
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Add optional modifier to prevent modifier clash errors with other potential declarations of aistudio
    aistudio?: AIStudio;
  }
}

const AppContent: React.FC = () => {
  const { 
    sessions, activeSession, activeId, setActiveId, createNewSession, 
    clearSessionMessages, deleteSession, renameSession, togglePinSession, addMessageToSession, 
    editMessageInSession, setSessions 
  } = useChatSessions();

  const { settings, t } = useSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('pro_ai_selected_model') || 'gemini-3-flash-preview');
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [needsApiKey, setNeedsApiKey] = useState<boolean>(false);

  useEffect(() => { localStorage.setItem('pro_ai_selected_model', selectedModel); }, [selectedModel]);

  // التحقق من مفتاح API عند محاولة استخدام ميزات متقدمة
  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setNeedsApiKey(true);
        return false;
      }
    }
    return true;
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsApiKey(false);
      // بعد فتح النافذة، نفترض أن المستخدم سيختار مفتاحاً ونستمر
    }
  };

  const handleSend = async (content: string, replyTo?: Message['replyTo'], attachments?: Attachment[], useWeb?: boolean) => {
    if (!activeId || !activeSession) return;
    
    // لبعض المهام المعقدة، قد نحتاج لمفتاح مدفوع
    if (selectedModel.includes('pro')) {
      const ok = await checkApiKey();
      if (!ok) return;
    }

    const userMsg: Omit<Message, 'id'> = { 
      role: 'user', 
      content, 
      timestamp: Date.now(), 
      type: 'text', 
      replyTo,
      attachments 
    };
    addMessageToSession(activeId, userMsg);
    
    setIsLoading(true);
    try {
      const result = await callGeminiProxy([...activeSession.messages, userMsg as Message], activeId, {
        modelName: selectedModel,
        temperature: 0.7,
        enableWebGrounding: useWeb !== undefined ? useWeb : webSearchEnabled,
        systemInstruction: settings.globalSystemInstruction
      });

      if (result.error?.includes("Requested entity was not found")) {
        setNeedsApiKey(true);
        return;
      }

      addMessageToSession(activeId, {
        role: 'assistant',
        content: result.error ? `Pro AI Error: ${result.error}` : result.response,
        timestamp: Date.now(),
        type: result.type,
        mediaUrl: result.imageUrl,
        sources: result.sources,
        groundingMetadata: result.groundingMetadata
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (!activeId || !activeSession) return;
    const msgIdx = activeSession.messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;
    
    const updatedMessages = activeSession.messages.filter(m => m.id !== messageId);
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: updatedMessages } : s));

    setIsLoading(true);
    try {
      const result = await callGeminiProxy(updatedMessages, activeId, {
        modelName: selectedModel,
        temperature: 0.7,
        enableWebGrounding: webSearchEnabled,
        systemInstruction: settings.globalSystemInstruction
      });

      if (result.error?.includes("Requested entity was not found")) {
        setNeedsApiKey(true);
        return;
      }

      addMessageToSession(activeId, {
        role: 'assistant',
        content: result.error ? `Pro AI Error: ${result.error}` : result.response,
        timestamp: Date.now(),
        type: result.type,
        mediaUrl: result.imageUrl,
        sources: result.sources,
        groundingMetadata: result.groundingMetadata
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // شاشة حجب اختيار المفتاح تظهر فقط كـ Overlay عند الحاجة
  const apiKeyOverlay = needsApiKey && (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[2000] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="w-24 h-24 bg-brand/10 text-brand rounded-[2.5rem] flex items-center justify-center mb-8 animate-pulse">
        <CrownIcon />
      </div>
      <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase text-white">تفعيل ميزات Pro</h2>
      <p className="max-w-md text-secondaryText mb-8 leading-relaxed text-sm">
        تحتاج لاستخدام مفتاح API خاص بك (مع تفعيل الفوترة) لمتابعة هذه العملية. 
        <br />
        <span className="text-xs opacity-50 mt-2 block">لن يتم تخزين مفتاحك، سيتم استخدامه للطلب الحالي فقط.</span>
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          type="button"
          onClick={handleOpenKeySelector}
          className="w-full py-4 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
        >
          اختيار مفتاح API الآن
        </button>
        <button 
          type="button"
          onClick={() => setNeedsApiKey(false)}
          className="w-full py-3 bg-white/5 text-white/50 font-bold rounded-2xl hover:bg-white/10 transition-all text-xs"
        >
          تجاهل الآن
        </button>
      </div>
    </div>
  );

  return (
    <div 
      dir={settings.lang === 'ar' ? 'rtl' : 'ltr'}
      lang={settings.lang}
      className={`flex w-full h-screen bg-appBg text-primaryText overflow-hidden ${settings.compactMode ? 'compact-ui' : ''}`} 
      data-theme={settings.theme}
    >
      {apiKeyOverlay}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/45 z-[999] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={(id) => { setActiveId(id); setIsSidebarOpen(false); }}
        onNew={() => { createNewSession(); setIsSidebarOpen(false); }}
        onRename={renameSession}
        onDelete={deleteSession}
        onTogglePin={togglePinSession}
        onOpenSettings={(panel: any) => setActivePanel(panel)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-appBg relative overflow-hidden">
        {activeId === 'portfolio' ? (
          <PortfolioBuilder onOpenSidebar={() => setIsSidebarOpen(true)} />
        ) : (
          <ChatContainer
            session={activeSession}
            onSend={handleSend}
            onEdit={(id, content) => editMessageInSession(activeId!, id, content)}
            onDelete={(id) => setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: s.messages.filter(m => m.id !== id) } : s))}
            onRegenerate={handleRegenerate}
            onClear={() => activeId && clearSessionMessages(activeId)}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={setWebSearchEnabled}
          />
        )}
        
        <Drawer 
          activePanel={activePanel} 
          onClose={() => setActivePanel(null)} 
        />
        <LanguageToggle />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
