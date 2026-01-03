
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, ChatSession, MessageSource, Attachment } from '../types';
import { useSettings } from '../hooks/useSettings';
import { 
  SendIcon, DownloadIcon, EditIcon, XIcon, 
  CopyIcon, RefreshIcon, TrashIcon, WorldIcon, PaperclipIcon, FileIcon, MenuIcon, HamburgerIcon, CameraIcon, PrinterIcon
} from './ui/Icons';

const BroomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 2-2m4-4 12-12"/><path d="m21 3-2 2"/><path d="m5 19 4-4"/><path d="m11 13 4-4"/><path d="M19 5l2-2"/><path d="M15 9l2-2"/><path d="m8 22 3-3"/><path d="m2 16 3-3"/></svg>
);

interface ChatContainerProps {
  session: ChatSession | null;
  onSend: (text: string, replyTo?: Message['replyTo'], attachments?: Attachment[], useWeb?: boolean) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onClear: () => void;
  isLoading: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onOpenSidebar?: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  session, onSend, onEdit, onDelete, onRegenerate, onClear, isLoading, selectedModel, onModelChange, onOpenSidebar, webSearchEnabled, onToggleWebSearch
}) => {
  const { t, settings } = useSettings();
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgMenuRef = useRef<HTMLDivElement>(null);

  const MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: t('modelFast') },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: t('modelDeep') },
    { id: 'gemini-2.5-flash-image', name: 'Nano Banana', desc: t('modelImage') },
  ];

  const messages = session?.messages || [];

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) setShowModelMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if ((!input.trim() && (pendingFiles || []).length === 0) || isLoading) return;
    onSend(input, undefined, (pendingFiles || []).length > 0 ? pendingFiles : undefined, webSearchEnabled);
    setInput('');
    setPendingFiles([]);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div 
      className={`flex flex-col h-full w-full overflow-hidden relative bg-appBg text-primaryText transition-all duration-300 ${isDragging ? 'bg-brand/5' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
    >
      <header className="no-print flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-borderColor bg-appBg/80 backdrop-blur-md z-40 ui-no-select">
        <div className="flex items-center gap-4">
          <button onClick={onOpenSidebar} className="p-2 -ml-2 text-secondaryText md:hidden"><HamburgerIcon /></button>
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tighter leading-none">{session?.title || t('newChat')}</h2>
            <div className="relative mt-1" ref={modelMenuRef}>
              <button onClick={() => setShowModelMenu(!showModelMenu)} className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-1">
                {MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              {showModelMenu && (
                <div className={`absolute top-full ${settings.lang === 'ar' ? 'right-0' : 'left-0'} mt-2 w-56 bg-dropdownBg border border-borderColor rounded-xl shadow-2xl p-1 z-[100]`}>
                  {MODELS.map((model) => (
                    <button key={model.id} onClick={() => { onModelChange(model.id); setShowModelMenu(false); }} className={`flex flex-col w-full p-3 rounded-lg text-right transition-colors ${selectedModel === model.id ? 'bg-brand/10' : 'hover:bg-hoverBg'}`}>
                      <span className="text-sm font-bold">{model.name}</span>
                      <span className="text-[10px] opacity-40">{model.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
           {webSearchEnabled && <span className="bg-brand/10 text-brand text-[9px] font-black px-2 py-1 rounded-full animate-pulse uppercase mr-2"><WorldIcon className="inline scale-75" /> Live Web</span>}
           <button 
             onClick={handleExportPDF} 
             className="p-2 text-secondaryText hover:text-brand transition-colors group relative" 
             title="تصدير المحادثة لـ PDF"
           >
             <PrinterIcon />
             <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">تصدير PDF</span>
           </button>
           <button onClick={onClear} className="p-2 text-secondaryText hover:text-red-500 transition-colors"><BroomIcon /></button>
        </div>
      </header>

      {/* المحتوى المستهدف للطباعة */}
      <div ref={scrollRef} className="print-content flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 py-8 space-y-12">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header ONLY in Print */}
          <div className="hidden print:block mb-10 border-b-4 border-brand pb-4">
             <h1 className="text-3xl font-black text-brand uppercase">{session?.title || "Pro AI Conversation"}</h1>
             <p className="text-sm opacity-50 font-bold">{new Date().toLocaleString()}</p>
          </div>

          {(messages || []).map((msg) => (
            <div key={msg.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-500 mb-12 last:mb-0">
              <div className="flex items-center justify-between mb-3 ui-no-select">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${msg.role === 'user' ? 'bg-brand shadow-[0_0_10px_rgba(77,166,255,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                  <span className={`text-[12px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-brand' : 'text-emerald-500'}`}>
                    {msg.role === 'user' ? (settings.lang === 'ar' ? 'أنت' : 'YOU') : (settings.lang === 'ar' ? 'برو ذكاء اصطناعي' : 'PRO AI')}
                  </span>
                  {msg.usage && <span className="no-print text-[9px] opacity-30 font-bold">{msg.usage.total_tokens} tokens</span>}
                </div>
                
                <div className="no-print flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingMessageId(msg.id); setEditInput(msg.content); }} className="p-1.5 hover:text-brand text-secondaryText"><EditIcon /></button>
                  <button onClick={() => navigator.clipboard.writeText(msg.content)} className="p-1.5 hover:text-brand text-secondaryText" title="نسخ"><CopyIcon /></button>
                  <button onClick={handleExportPDF} className="p-1.5 hover:text-brand text-secondaryText" title="طباعة هذه الرسالة"><PrinterIcon /></button>
                  {msg.role === 'assistant' && <button onClick={() => onRegenerate(msg.id)} className="p-1.5 hover:text-brand text-secondaryText"><RefreshIcon /></button>}
                </div>
              </div>

              <div className={`text-[15px] md:text-[17px] leading-[1.8] chat-selectable ${msg.role === 'user' ? 'font-medium' : ''}`}>
                {msg.attachments && (msg.attachments || []).length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {(msg.attachments || []).map((att, i) => (
                      <div key={i} className="max-w-[300px] border border-borderColor/30 rounded-2xl overflow-hidden shadow-xl">
                        {att.mimeType.startsWith('image/') ? <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full object-cover" /> : <div className="p-4 flex items-center gap-3 bg-sidebarBg"><FileIcon /> <span className="text-xs truncate">{att.name}</span></div>}
                      </div>
                    ))}
                  </div>
                )}
                
                {editingMessageId === msg.id ? (
                  <div className="no-print mt-2 p-4 bg-sidebarBg rounded-2xl border border-brand/30">
                    <textarea autoFocus className="w-full bg-transparent border-none outline-none resize-none h-32" value={editInput} onChange={(e) => setEditInput(e.target.value)} />
                    <div className="flex justify-end gap-2 mt-2">
                       <button onClick={() => setEditingMessageId(null)} className="px-4 py-1 text-xs">{t('cancel')}</button>
                       <button onClick={() => { onEdit(msg.id, editInput); setEditingMessageId(null); }} className="px-4 py-1 bg-brand text-white text-xs font-bold rounded-lg">{t('save')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="markdown-content">
                    {msg.type === 'image' && msg.mediaUrl ? <img src={msg.mediaUrl} className="w-full rounded-3xl border border-borderColor mb-4" /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
                  </div>
                )}

                {msg.sources && (msg.sources || []).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-borderColor/10 flex flex-wrap gap-2 no-print">
                    {(msg.sources || []).map((s, i) => (
                      <a key={i} href={s.url} target="_blank" className="flex items-center gap-2 px-3 py-1 bg-brand/5 border border-brand/10 rounded-full text-[10px] font-bold text-brand hover:bg-brand/10 transition-all">
                        <WorldIcon className="scale-75" /> {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="no-print flex items-center gap-4 py-8 ui-no-select">
              <div className="w-2 h-2 bg-brand rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Hide in Print */}
      <div className="no-print flex-shrink-0 p-6 md:p-10 bg-gradient-to-t from-appBg via-appBg to-transparent ui-no-select">
        <div className="max-w-4xl mx-auto flex flex-col bg-inputBg border border-borderColor rounded-[2rem] p-2 focus-within:border-brand/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all">
          <div className="flex items-end gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-4 text-secondaryText hover:text-brand transition-colors"><PaperclipIcon /></button>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={async (e) => {
              const files = Array.from(e.target.files || []) as File[];
              const atts = await Promise.all(files.map(f => new Promise<Attachment>((res) => {
                const r = new FileReader();
                r.onload = (re) => res({ data: (re.target?.result as string).split(',')[1], mimeType: f.type, name: f.name });
                r.readAsDataURL(f);
              })));
              setPendingFiles(prev => [...prev, ...atts]);
            }} />
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={t('messagePlaceholder')}
              className="flex-1 bg-transparent border-none outline-none p-4 resize-none max-h-48 text-[16px] custom-scrollbar"
            />
            <button onClick={() => onToggleWebSearch(!webSearchEnabled)} className={`p-4 transition-colors ${webSearchEnabled ? 'text-brand' : 'text-secondaryText'}`}><WorldIcon /></button>
            <button onClick={handleSend} disabled={!input.trim() && pendingFiles.length === 0} className="p-4 bg-brand text-white rounded-[1.5rem] hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-lg"><SendIcon /></button>
          </div>
          {pendingFiles.length > 0 && (
            <div className="flex gap-2 p-2 px-4 border-t border-borderColor/10 mt-2">
              {pendingFiles.map((f, i) => (
                <div key={i} className="relative w-12 h-12 rounded-lg border border-borderColor overflow-hidden">
                   {f.mimeType.startsWith('image/') ? <img src={`data:${f.mimeType};base64,${f.data}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-primaryText bg-sidebarBg"><FileIcon /></div>}
                   <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><XIcon /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
