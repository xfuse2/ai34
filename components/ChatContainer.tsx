
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, ChatSession, MessageSource, Attachment } from '../types';
import { useSettings } from '../hooks/useSettings';
import { 
  SendIcon, DownloadIcon, EditIcon, XIcon, 
  CopyIcon, RefreshIcon, TrashIcon, WorldIcon, PaperclipIcon, FileIcon, MenuIcon, HamburgerIcon, CameraIcon, PrinterIcon, CrownIcon, BellIcon
} from './ui/Icons';

interface ChatContainerProps {
  session: ChatSession | null;
  onSend: (text: string, replyTo?: string, attachments?: Attachment[], useWeb?: boolean) => void;
  isLoading: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onOpenSidebar?: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  session, onSend, isLoading, selectedModel, onModelChange, onOpenSidebar, webSearchEnabled, onToggleWebSearch
}) => {
  const { t, settings } = useSettings();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session?.messages.length, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input, undefined, undefined, webSearchEnabled);
    setInput('');
  };

  const playVoice = (base64: string) => {
    const audio = new Audio(`data:audio/pcm;base64,${base64}`);
    audio.play();
  };

  return (
    <div className="flex flex-col h-full w-full bg-appBg text-primaryText relative">
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-borderColor bg-appBg/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-4">
          <button onClick={onOpenSidebar} className="md:hidden text-secondaryText"><HamburgerIcon /></button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">{session?.mode === 'image' ? 'Image Lab' : session?.title || 'Chat'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold text-secondaryText uppercase tracking-tighter">{selectedModel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => onToggleWebSearch(!webSearchEnabled)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase ${webSearchEnabled ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-transparent border-borderColor text-secondaryText opacity-40'}`}>
              <WorldIcon className="scale-75" /> {webSearchEnabled ? 'Search ON' : 'Search OFF'}
           </button>
           <button onClick={() => window.print()} className="p-2 text-secondaryText hover:text-brand transition-colors"><PrinterIcon /></button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 py-10 space-y-12">
        <div className="max-w-4xl mx-auto">
          {session?.messages.map((msg) => (
            <div key={msg.id} className={`group animate-in fade-in slide-in-from-bottom-2 duration-500 mb-12 last:mb-0`}>
              <div className="flex items-center gap-3 mb-3">
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${msg.role === 'user' ? 'bg-brand text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{msg.role}</span>
              </div>

              <div className="markdown-content">
                 {msg.type === 'image' ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <img src={msg.mediaUrl} className="w-full rounded-3xl border border-borderColor hover:scale-[1.02] transition-transform cursor-zoom-in" />
                      <div className="p-6 bg-hoverBg rounded-3xl border border-borderColor flex flex-col justify-center">
                         <h4 className="font-black text-brand mb-2">Creative Asset</h4>
                         <p className="text-xs text-secondaryText leading-relaxed">{msg.content}</p>
                         <button className="mt-4 flex items-center gap-2 text-xs font-bold hover:text-brand"><DownloadIcon /> Save to Gallery</button>
                      </div>
                   </div>
                 ) : (
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                 )}
              </div>

              {msg.sources && (
                <div className="mt-6 p-4 bg-brand/5 rounded-2xl border border-brand/10 flex flex-wrap gap-2">
                   {msg.sources.map((s, i) => (
                     <a key={i} href={s.url} target="_blank" className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-brand hover:underline">
                        <WorldIcon className="scale-75" /> {s.title}
                     </a>
                   ))}
                </div>
              )}
              
              {msg.type === 'audio' && (
                <button onClick={() => playVoice((msg as any).audioData)} className="mt-4 flex items-center gap-3 px-5 py-3 bg-brand text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/20">
                   <BellIcon /> <span className="text-xs font-black uppercase tracking-widest">Listen to Reply</span>
                </button>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 py-10 opacity-40">
               <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
               <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
               <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 md:p-10 bg-gradient-to-t from-appBg via-appBg to-transparent">
        <div className="max-w-4xl mx-auto relative group">
          <div className="flex flex-col bg-inputBg border border-borderColor rounded-[2rem] p-2 focus-within:border-brand/50 shadow-2xl transition-all">
            <div className="flex items-end gap-2">
               <button onClick={() => fileInputRef.current?.click()} className="p-4 text-secondaryText hover:text-brand"><PaperclipIcon /></button>
               <input type="file" className="hidden" ref={fileInputRef} />
               <textarea
                 rows={1}
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                 placeholder={t('messagePlaceholder')}
                 className="flex-1 bg-transparent border-none outline-none p-4 resize-none text-[15px] max-h-48 custom-scrollbar"
               />
               <button 
                 onMouseDown={() => setIsRecording(true)}
                 onMouseUp={() => setIsRecording(false)}
                 className={`p-4 transition-all ${isRecording ? 'text-red-500 scale-125' : 'text-secondaryText hover:text-brand'}`}
               >
                 <BellIcon />
               </button>
               <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-4 bg-brand text-white rounded-[1.5rem] hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-lg"><SendIcon /></button>
            </div>
          </div>
          {isRecording && <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">Recording Live...</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
