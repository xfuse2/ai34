
import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Message } from '../types';

const STORAGE_KEY = 'pro_ai_sessions_v1';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
          if (parsed.length > 0) setActiveId(parsed[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("Failed to parse storage", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      isPinned: false,
      mode: 'general',
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveId(newSession.id);
    return newSession;
  }, []);

  const clearSessionMessages = useCallback((id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { 
        ...s, 
        messages: [], 
        title: 'New Chat', 
        updatedAt: Date.now() 
      } : s
    ));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: crypto.randomUUID(),
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          isPinned: false,
          mode: 'general',
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) setActiveId(filtered[0].id);
      return filtered;
    });
  }, [activeId]);

  const renameSession = useCallback((id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, title: newTitle.trim(), updatedAt: Date.now() } : s
    ));
  }, []);

  const togglePinSession = useCallback((id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, isPinned: !s.isPinned } : s
    ));
  }, []);

  const addMessageToSession = useCallback((sessionId: string, messageData: Omit<Message, 'id'>) => {
    const message = { ...messageData, id: crypto.randomUUID() };
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const newMessages = [...s.messages, message];
      let newTitle = s.title;
      if ((s.messages.length === 0 || s.title === 'New Chat') && message.role === 'user') {
        const words = message.content.split(' ');
        newTitle = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
      }
      return { ...s, messages: newMessages, title: newTitle, updatedAt: Date.now() };
    }));
  }, []);

  const editMessageInSession = useCallback((sessionId: string, messageId: string, newContent: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        updatedAt: Date.now(),
        messages: s.messages.map(m => m.id === messageId ? { ...m, content: newContent } : m)
      };
    }));
  }, []);

  const activeSession = sessions.find(s => s.id === activeId) || null;

  return {
    sessions,
    setSessions,
    activeSession,
    activeId,
    setActiveId,
    createNewSession,
    clearSessionMessages,
    deleteSession,
    renameSession,
    togglePinSession,
    addMessageToSession,
    editMessageInSession
  };
};
