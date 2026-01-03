
export type Role = 'user' | 'assistant';
export type MessageType = 'text' | 'image' | 'file';

export interface Attachment {
  data: string; // Base64
  mimeType: string;
  name: string;
}

export type PanelId =
  | 'account' | 'preferences' | 'customize' | 'assistant' | 'shortcuts'
  | 'tasks' | 'notifications' | 'connectors' | 'api' | 'pro' | 'allSettings' | 'plans' | 'portfolio';

export interface MessageSource {
  title: string;
  url: string;
}

export type MotionStyle =
  | 'none'
  | 'subtle-fade'
  | 'subtle-slide-up'
  | 'floating-cards'
  | 'parallax'
  | 'spotlight';

export interface MediaAsset {
  type: 'image' | 'video' | 'logo';
  url: string;
  alt?: string;
  caption?: string;
  thumbnailUrl?: string;
}

export interface PortfolioProjectItem {
  title: string;
  description: string;
  role?: string;
  techStack?: string[];
  url?: string;
  highlight?: string;
  media?: MediaAsset[];
  motionStyle?: MotionStyle;
}

export type TemplateType = 'minimal' | 'modern' | 'creative' | 'corporate' | 'dark';

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
  extras: {
    testimonials: { name: string; quote: string; role: string }[];
    certifications: string[];
    contactLinks: { type: string; url: string }[];
  };
  preferredLanguage: 'en' | 'ar';
  template: TemplateType;
}

export interface PortfolioSection {
  id: string;
  title: string;
  kind: 'hero' | 'about' | 'skills' | 'projects' | 'gallery' | 'testimonials' | 'contact' | 'custom';
  bodyHtml?: string;
  items?: any[];
}

export interface PortfolioResponse {
  sections: PortfolioSection[];
  tone: 'formal' | 'casual' | 'case-study';
  language: 'en' | 'ar';
  suggestions: string[];
  template: TemplateType;
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
  usage?: {
    total_tokens: number;
  };
  replyTo?: {
    content: string;
    role: Role;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
}

export interface ChatSettings {
  modelName: string;
  temperature: number;
  systemInstruction?: string;
  enableWebGrounding?: boolean;
}

export interface ApiResponse {
  response: string;
  type: MessageType;
  imageUrl?: string;
  sources?: MessageSource[];
  groundingMetadata?: any;
  meta?: Record<string, any>;
  error?: string;
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
