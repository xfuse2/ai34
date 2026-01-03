
export type Role = 'user' | 'assistant';
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'chart';

export interface Attachment {
  data: string; // Base64
  mimeType: string;
  name: string;
  content?: string; // extracted text content
}

export type PanelId =
  | 'account' | 'preferences' | 'customize' | 'assistant' | 'shortcuts'
  | 'tasks' | 'notifications' | 'connectors' | 'api' | 'pro' | 'allSettings' | 'plans' | 'portfolio' | 'workspace';

export interface MessageSource {
  title: string;
  url: string;
}

export type TemplateType = 'minimal' | 'modern' | 'creative' | 'corporate' | 'dark';

export interface PortfolioProjectItem {
  title: string;
  description: string;
  role: string;
  techStack: string[];
  url: string;
  highlight: string;
  media: string[];
}

export interface PortfolioProfile {
  name: string;
  headline: string;
  location: string;
  tagline: string;
  about: string;
  experienceYears: number;
  targetAudience: string;
  skills: { category: string; items: string[] }[];
  projects: PortfolioProjectItem[];
  extras: any;
  preferredLanguage: 'en' | 'ar';
  template: TemplateType;
}

export interface PortfolioResponse {
  template: TemplateType;
  sections: {
    id: string;
    title: string;
    bodyHtml: string;
  }[];
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

export interface Connector {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
}

export interface AppSettings {
  profileName: string;
  theme: 'dark' | 'light';
  lang: 'ar' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  bubbleRadius: number;
  compactMode: boolean;
  sidebarWidth: number;
  globalSystemInstruction: string;
  soundOnSend: boolean;
  soundOnReceive: boolean;
  autoSpeech: boolean; // جديد
  desktopNotifications: boolean;
  showTokens: boolean;
  enableSourcesButton: boolean;
  experimentalFeatures: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  type: MessageType;
  mediaUrl?: string;
  attachments?: Attachment[];
  sources?: MessageSource[];
  groundingMetadata?: any;
  isThinking?: boolean;
  usage?: { total_tokens: number };
  replyTo?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
  mode: 'general' | 'files' | 'image' | 'code' | 'voice'; // أوضاع الدردشة الجديدة
}

export interface ApiResponse {
  response: string;
  type: MessageType;
  imageUrl?: string;
  audioData?: string;
  sources?: MessageSource[];
  groundingMetadata?: any;
  error?: string;
}
