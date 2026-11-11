export interface MessageImage {
  mimeType: string;
  data: string; // base64 string
  previewUrl?: string;
  fileName?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface OpenGraphData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  favicon: string;
  domain: string;
}

export interface ReasoningStep {
  phase: string;
  title: string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thoughtProcess?: string; // extracted from <thought> tags
  images?: MessageImage[];
  timestamp: number;
  searchSources?: GroundingChunk[];
  searchQueries?: string[];
  isError?: boolean;
  modelUsed?: string;
  isStreaming?: boolean;
  deepReasoningUsed?: boolean;
  feedback?: 'like' | 'dislike';
  feedbackNote?: string;
}

export interface NegativeFeedbackItem {
  id: string;
  messageId: string;
  sessionId: string;
  sessionTitle?: string;
  timestamp: number;
  userPrompt: string;
  modelResponse: string;
  thoughtProcess?: string;
  modelUsed?: string;
  reason?: string;
}

export interface RecentSearchQuery {
  id: string;
  query: string;
  timestamp: number;
  sessionId?: string;
  sessionTitle?: string;
  sourceCount?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  messages: Message[];
  model: string;
  deepReasoning: boolean;
  enableSearch: boolean;
  systemInstruction?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  supportsDeepThinking: boolean;
  supportsVision: boolean;
  supportsSearch: boolean;
}

export interface UserSettings {
  systemInstruction: string;
  defaultReasoning: boolean;
  defaultSearch: boolean;
  preferredModel: string;
  speechRate: number;
  speechPitch: number;
  voiceName?: string;
}
