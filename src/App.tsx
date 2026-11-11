import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  Search,
  Brain,
  Globe,
  Sliders,
  Menu,
  Download,
  Share2,
  Layers,
  ArrowDown,
  Info,
  HelpCircle,
  ThumbsDown,
} from 'lucide-react';
import {
  Message,
  ChatSession,
  MessageImage,
  ModelOption,
  UserSettings,
  NegativeFeedbackItem,
  RecentSearchQuery,
} from './types';
import { Sidebar } from './components/Sidebar';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { GroundingSources } from './components/GroundingSources';
import { DecomposeModal } from './components/DecomposeModal';
import { SettingsModal } from './components/SettingsModal';
import { NegativeFeedbackModal } from './components/NegativeFeedbackModal';
import { FeedbackControl } from './components/FeedbackControl';
import { SearchQueriesSidebar } from './components/SearchQueriesSidebar';
import { SpeechAssistant, createSpeechRecognizer } from './utils/speech';

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tagline: 'Ragionamento avanzato & Multimodale',
    description: 'Il modello più versatile di Google per analisi logica, coding e visione.',
    badge: 'Consigliato',
    supportsDeepThinking: true,
    supportsVision: true,
    supportsSearch: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tagline: 'Ultrarapido & Leggero',
    description: 'Ottimizzato per risposte immediate e compiti concisi.',
    supportsDeepThinking: false,
    supportsVision: true,
    supportsSearch: true,
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  systemInstruction:
    'Sei Gemini, un assistente IA avanzato, accurato e disponibile. Rispondi in italiano con tono chiaro e amichevole.',
  defaultReasoning: true,
  defaultSearch: false,
  preferredModel: 'gemini-3.8-flash',
  speechRate: 1.0,
  speechPitch: 1.0,
};

const SUGGESTIONS = [
  {
    icon: '🧠',
    title: 'Scomposizione Logica & Algoritmi',
    prompt:
      'Scomponi e risolvi passo-passo il problema di sincronizzazione del Reader-Writer con semafori, evidenziando i potenziali deadlock e la soluzione ottima.',
  },
  {
    icon: '💻',
    title: 'Architettura & Design Pattern',
    prompt:
      'Progetta un’architettura backend scalabile per un sistema di notifiche push distribuito. Mostra i componenti, la gestione code e i casi limite.',
  },
  {
    icon: '🌐',
    title: 'Ricerca Web & Aggiornamenti',
    prompt:
      'Quali sono i progressi più significativi dell’ultimo anno nella fusione nucleare e nei modelli di intelligenza artificiale? Cerca fonti attendibili.',
    forceSearch: true,
  },
  {
    icon: '📐',
    title: 'Analisi Matematica & Deduzione',
    prompt:
      'Dimostra passo-passo perché la radice quadrata di 2 è un numero irrazionale, esplicitando ogni assunzione logica e passaggio della dimostrazione per assurdo.',
  },
];

export default function App() {
  // Persistence states
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('gemini_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved sessions', e);
      }
    }
    const initialSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'Nuova conversazione',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      messages: [],
      model: 'gemini-3.8-flash',
      deepReasoning: true,
      enableSearch: false,
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session-' + Date.now();
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('gemini_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  // Current session parameters
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedImages, setAttachedImages] = useState<MessageImage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [deepReasoning, setDeepReasoning] = useState<boolean>(
    currentSession?.deepReasoning ?? settings.defaultReasoning
  );
  const [enableSearch, setEnableSearch] = useState<boolean>(
    currentSession?.enableSearch ?? settings.defaultSearch
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    currentSession?.model || settings.preferredModel
  );

  // Negative Feedback interactions list
  const [negativeFeedbackItems, setNegativeFeedbackItems] = useState<NegativeFeedbackItem[]>(() => {
    const saved = localStorage.getItem('gemini_negative_feedback');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse negative feedback items', e);
      }
    }
    return [];
  });

  // Recent Web Search Queries list
  const [recentSearchQueries, setRecentSearchQueries] = useState<RecentSearchQuery[]>(() => {
    const saved = localStorage.getItem('gemini_recent_queries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse recent search queries', e);
      }
    }
    return [];
  });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDecomposeModalOpen, setIsDecomposeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNegativeFeedbackModalOpen, setIsNegativeFeedbackModalOpen] = useState(false);
  const [isSearchQueriesOpen, setIsSearchQueriesOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('gemini_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Save negative feedback items to localStorage
  useEffect(() => {
    localStorage.setItem('gemini_negative_feedback', JSON.stringify(negativeFeedbackItems));
  }, [negativeFeedbackItems]);

  // Save recent search queries to localStorage
  useEffect(() => {
    localStorage.setItem('gemini_recent_queries', JSON.stringify(recentSearchQueries));
  }, [recentSearchQueries]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('gemini_settings', JSON.stringify(settings));
  }, [settings]);

  // Keep session controls in sync when changing active session
  useEffect(() => {
    if (currentSession) {
      setDeepReasoning(currentSession.deepReasoning);
      setEnableSearch(currentSession.enableSearch);
      setSelectedModel(currentSession.model);
    }
  }, [activeSessionId]);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isStreaming]);

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  // Create new session
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'Nuova conversazione',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      messages: [],
      model: settings.preferredModel,
      deepReasoning: settings.defaultReasoning,
      enableSearch: settings.defaultSearch,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setAttachedImages([]);
    setInputPrompt('');
    SpeechAssistant.stop();
    setSpeakingMessageId(null);
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fallback: ChatSession = {
          id: 'session-' + Date.now(),
          title: 'Nuova conversazione',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pinned: false,
          messages: [],
          model: settings.preferredModel,
          deepReasoning: settings.defaultReasoning,
          enableSearch: settings.defaultSearch,
        };
        return [fallback];
      }
      return filtered;
    });

    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Toggle pin
  const handleTogglePin = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Clear all chats
  const handleClearAllChats = () => {
    localStorage.removeItem('gemini_sessions');
    handleNewChat();
  };

  // File & Image attachment handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFiles(Array.from(files));
    e.target.value = '';
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64Data = result.split(',')[1];
          setAttachedImages((prev) => [
            ...prev,
            {
              mimeType: file.type,
              data: base64Data,
              previewUrl: result,
              fileName: file.name,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Plain text, code, json, md files
        const reader = new FileReader();
        reader.onload = (event) => {
          const textContent = event.target?.result as string;
          setInputPrompt((prev) =>
            prev
              ? `${prev}\n\n[Contenuto file: ${file.name}]\n\`\`\`\n${textContent}\n\`\`\``
              : `[Contenuto file: ${file.name}]\n\`\`\`\n${textContent}\n\`\`\``
          );
        };
        reader.readAsText(file);
      }
    });
  };

  // Clipboard paste support (e.g. screenshot paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      processFiles(files);
    }
  };

  // Voice dictation toggle
  const toggleSpeechRecognition = () => {
    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (text, isFinal) => {
        setInputPrompt((prev) => (isFinal ? prev + ' ' + text : prev + ' ' + text));
      },
      (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      speechRecognizerRef.current = recognizer;
      recognizer.start();
      setIsListening(true);
    } else {
      alert('La dettatura vocale non è supportata su questo browser.');
    }
  };

  // Text to Speech playback
  const handleToggleSpeak = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      SpeechAssistant.stop();
      setSpeakingMessageId(null);
    } else {
      SpeechAssistant.speak(text, {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        onEnd: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
      });
      setSpeakingMessageId(messageId);
    }
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string, forceSearch?: boolean) => {
    const textToSend = (customPrompt ?? inputPrompt).trim();
    if ((!textToSend && attachedImages.length === 0) || isStreaming) return;

    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: textToSend,
      images: attachedImages.length > 0 ? [...attachedImages] : undefined,
      timestamp: Date.now(),
    };

    // Update session title if first message
    const shouldUpdateTitle = currentSession.messages.length === 0;
    const newTitle = shouldUpdateTitle
      ? textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : '')
      : currentSession.title;

    // Model placeholder message
    const modelMessageId = 'model-' + (Date.now() + 1);
    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      modelUsed: selectedModel,
      deepReasoningUsed: deepReasoning,
      isStreaming: true,
    };

    const updatedMessages = [...currentSession.messages, userMessage, modelMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    // Clear input
    setInputPrompt('');
    setAttachedImages([]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...currentSession.messages, userMessage],
          model: selectedModel,
          enableSearch: forceSearch ?? enableSearch,
          deepReasoning,
          systemInstruction: settings.systemInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore server: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Impossibile stabilire lo stream');

      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let accumulatedSources: any[] = [];
      let accumulatedQueries: string[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataPayload = trimmed.replace(/^data:\s*/, '');
          if (dataPayload === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              accumulatedText += parsed.text;
            }

            if (parsed.searchChunks && parsed.searchChunks.length > 0) {
              accumulatedSources = [...accumulatedSources, ...parsed.searchChunks];
            }

            if (parsed.searchQueries && parsed.searchQueries.length > 0) {
              accumulatedQueries = [...accumulatedQueries, ...parsed.searchQueries];
            }

            // Update active message in state
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSession.id) return s;
                const msgs = s.messages.map((m) => {
                  if (m.id !== modelMessageId) return m;
                  return {
                    ...m,
                    text: accumulatedText,
                    searchSources: accumulatedSources,
                    searchQueries: accumulatedQueries,
                    isStreaming: true,
                  };
                });
                return { ...s, messages: msgs };
              })
            );
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }

      // Mark streaming done
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSession.id) return s;
          const msgs = s.messages.map((m) => {
            if (m.id !== modelMessageId) return m;
            return {
              ...m,
              isStreaming: false,
            };
          });
          return { ...s, messages: msgs };
        })
      );

      // Record web search queries into recent search history
      if (accumulatedQueries.length > 0) {
        accumulatedQueries.forEach((q) => {
          recordSearchQuery(q, accumulatedSources.length);
        });
      } else if (forceSearch || enableSearch) {
        recordSearchQuery(textToSend, accumulatedSources.length);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSession.id) return s;
          const msgs = s.messages.map((m) => {
            if (m.id !== modelMessageId) return m;
            return {
              ...m,
              text: `⚠️ Si è verificato un errore durante la risposta di Gemini:\n\n${err.message || 'Errore di connessione'}`,
              isError: true,
              isStreaming: false,
            };
          });
          return { ...s, messages: msgs };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Record a search query into recent queries list
  const recordSearchQuery = (queryText: string, count = 0) => {
    if (!queryText || !queryText.trim()) return;
    const clean = queryText.trim();
    setRecentSearchQueries((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== clean.toLowerCase());
      const newItem: RecentSearchQuery = {
        id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        query: clean,
        timestamp: Date.now(),
        sessionId: currentSession.id,
        sessionTitle: currentSession.title,
        sourceCount: count,
      };
      return [newItem, ...filtered].slice(0, 50);
    });
  };

  // Search Query Handlers
  const handleExecuteSearchQuery = (queryText: string) => {
    setEnableSearch(true);
    handleSendMessage(queryText, true);
  };

  const handleInsertSearchQuery = (queryText: string) => {
    setInputPrompt(queryText);
    setEnableSearch(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleRemoveSearchQuery = (id: string) => {
    setRecentSearchQueries((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearAllSearchQueries = () => {
    setRecentSearchQueries([]);
  };

  // Export conversation as Markdown
  const handleExportMarkdown = () => {
    let md = `# Conversazione con Gemini AI - ${currentSession.title}\n`;
    md += `*Data: ${new Date(currentSession.createdAt).toLocaleString('it-IT')}*\n\n---\n\n`;

    currentSession.messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? '### Utente' : '### Gemini';
      md += `${roleName}\n\n${msg.text}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemini-chat-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy text to clipboard
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Feedback rating (thumbs up / thumbs down)
  const handleFeedbackChange = (
    messageId: string,
    feedback: 'like' | 'dislike' | null,
    note?: string
  ) => {
    // Update message state in sessions
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        const msgs = s.messages.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            feedback: feedback || undefined,
            feedbackNote: note || undefined,
          };
        });
        return { ...s, messages: msgs };
      })
    );

    if (feedback === 'dislike') {
      // Find the user prompt immediately preceding this message
      const msgIndex = currentSession.messages.findIndex((m) => m.id === messageId);
      let userPromptText = 'Richiesta non disponibile';
      if (msgIndex > 0) {
        for (let i = msgIndex - 1; i >= 0; i--) {
          if (currentSession.messages[i].role === 'user') {
            userPromptText = currentSession.messages[i].text;
            break;
          }
        }
      }
      const currentMsg = currentSession.messages.find((m) => m.id === messageId);

      const newItem: NegativeFeedbackItem = {
        id: 'fb-' + messageId,
        messageId,
        sessionId: currentSession.id,
        sessionTitle: currentSession.title,
        timestamp: Date.now(),
        userPrompt: userPromptText,
        modelResponse: currentMsg?.text || '',
        thoughtProcess: currentMsg?.thoughtProcess,
        modelUsed: currentMsg?.modelUsed || currentSession.model,
        reason: note || 'Segnalazione generale',
      };

      setNegativeFeedbackItems((prev) => {
        const filtered = prev.filter((item) => item.messageId !== messageId);
        return [newItem, ...filtered];
      });
    } else {
      // If 'like' or reset, remove from negative feedback list
      setNegativeFeedbackItems((prev) =>
        prev.filter((item) => item.messageId !== messageId)
      );
    }
  };

  // Remove single negative feedback item
  const handleRemoveNegativeFeedbackItem = (id: string) => {
    const itemToRemove = negativeFeedbackItems.find((i) => i.id === id);
    setNegativeFeedbackItems((prev) => prev.filter((i) => i.id !== id));

    // Clear dislike flag on message if present in current session
    if (itemToRemove) {
      setSessions((prev) =>
        prev.map((s) => {
          const msgs = s.messages.map((m) => {
            if (m.id === itemToRemove.messageId && m.feedback === 'dislike') {
              return { ...m, feedback: undefined, feedbackNote: undefined };
            }
            return m;
          });
          return { ...s, messages: msgs };
        })
      );
    }
  };

  // Clear all negative feedback items
  const handleClearAllNegativeFeedback = () => {
    setNegativeFeedbackItems([]);
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.feedback === 'dislike' ? { ...m, feedback: undefined, feedbackNote: undefined } : m
        ),
      }))
    );
  };

  // Regenerate an interaction with high reasoning
  const handleRegenerateWithReasoning = (item: NegativeFeedbackItem) => {
    if (item.sessionId) {
      setActiveSessionId(item.sessionId);
    }
    setDeepReasoning(true);
    handleSendMessage(
      `Per favore, rigenera e correggi la tua risposta precedente alla seguente richiesta con il massimo livello di ragionamento logico e verifica dei passaggi:\n\n"${item.userPrompt}"\n\n(Motivo della revisione: ${item.reason || 'Miglioramento accuratezza'})`
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] overflow-hidden select-text">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          SpeechAssistant.stop();
          setSpeakingMessageId(null);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onTogglePin={handleTogglePin}
        onRenameSession={handleRenameSession}
        onOpenDecomposeModal={() => setIsDecomposeModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNegativeFeedbackModal={() => setIsNegativeFeedbackModalOpen(true)}
        negativeFeedbackCount={negativeFeedbackItems.length}
        onOpenSearchQueries={() => setIsSearchQueriesOpen(true)}
        recentQueriesCount={recentSearchQueries.length}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#131314] relative">
        {/* Top Navbar */}
        <header className="h-14 px-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#131314]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Menu laterale"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Model Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-xs font-semibold text-white transition-all cursor-pointer"
                type="button"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name ||
                    'Gemini 3.8 Flash'}
                </span>
                <span className="text-[10px] text-gray-400">▼</span>
              </button>

              {modelDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#1e1f26] border border-white/10 shadow-2xl p-2 z-50">
                  <div className="text-[10px] uppercase font-semibold text-gray-400 px-3 py-1.5">
                    Modelli Gemini Disponibili
                  </div>
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        selectedModel === model.id
                          ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{model.name}</span>
                        {model.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-indigo-300 mt-0.5">
                        {model.tagline}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 leading-snug">
                        {model.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Badges */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setDeepReasoning(!deepReasoning)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  deepReasoning
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                    : 'bg-white/[0.03] text-gray-400 border border-white/5 hover:text-gray-200'
                }`}
                title="Attiva/disattiva motore di scomposizione logica"
                type="button"
              >
                <Brain className={`w-3.5 h-3.5 ${deepReasoning ? 'text-cyan-400' : ''}`} />
                <span>Ragionamento Avanzato</span>
                {deepReasoning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>

              <button
                onClick={() => setEnableSearch(!enableSearch)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  enableSearch
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/20'
                    : 'bg-white/[0.03] text-gray-400 border border-white/5 hover:text-gray-200'
                }`}
                title="Ricerca in tempo reale sul Web tramite Google Search"
                type="button"
              >
                <Globe className={`w-3.5 h-3.5 ${enableSearch ? 'text-blue-400' : ''}`} />
                <span>Ricerca Web</span>
                {enableSearch && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsDecomposeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 hover:from-indigo-600/30 hover:to-cyan-600/30 border border-indigo-500/30 text-cyan-300 text-xs font-medium transition-all cursor-pointer"
              title="Apri Laboratorio di Scomposizione Logica"
              type="button"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Laboratorio Logica</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              disabled={currentSession.messages.length === 0}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Esporta conversazione in Markdown"
              type="button"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Negative Feedback review button */}
            <button
              onClick={() => setIsNegativeFeedbackModalOpen(true)}
              className="relative p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
              title="Registro Risposte Valutate Negativamente"
              type="button"
            >
              <ThumbsDown className="w-4 h-4" />
              {negativeFeedbackItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {negativeFeedbackItems.length}
                </span>
              )}
            </button>

            {/* Recent Search Queries sidebar toggle button */}
            <button
              onClick={() => setIsSearchQueriesOpen(!isSearchQueriesOpen)}
              className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
                isSearchQueriesOpen
                  ? 'text-blue-400 bg-blue-500/15 border border-blue-500/30'
                  : 'text-gray-400 hover:text-blue-300 hover:bg-white/5'
              }`}
              title="Ultime Query di Ricerca Web"
              type="button"
            >
              <Globe className="w-4 h-4" />
              {recentSearchQueries.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                  {recentSearchQueries.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Impostazioni"
              type="button"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {currentSession.messages.length === 0 ? (
            /* Gemini Welcome Screen */
            <div className="max-w-3xl mx-auto h-full flex flex-col justify-center items-center py-12 text-center animate-fade-in">
              {/* Big Animated Gemini Star */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-rose-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-pulse-subtle">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold">
                  Pro Logic
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight gemini-gradient-text mb-2">
                {getGreeting()}, Gabri
              </h1>
              <p className="text-base text-gray-400 max-w-lg mb-8 leading-relaxed">
                Come posso aiutarti oggi? Il mio motore di ragionamento logico scompone problemi complessi, individua vincoli e genera soluzioni passo-passo.
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sug.prompt, sug.forceSearch)}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
                    type="button"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{sug.icon}</span>
                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {sug.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {sug.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Messages */
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {currentSession.messages.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 md:gap-4 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Gemini Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    {/* Message Body */}
                    <div
                      className={`relative max-w-[88%] md:max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#282a36] border border-white/10 text-white rounded-tr-xs shadow-md'
                          : 'bg-transparent text-gray-100 flex-1 min-w-0'
                      }`}
                    >
                      {/* Attached images preview */}
                      {message.images && message.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {message.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.previewUrl || `data:${img.mimeType};base64,${img.data}`}
                              alt={img.fileName || 'Immagine allegata'}
                              className="max-h-48 rounded-xl border border-white/15 object-cover shadow"
                            />
                          ))}
                        </div>
                      )}

                      {/* Content Renderer */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{message.text}</div>
                      ) : (
                        <div>
                          {message.text ? (
                            <MarkdownRenderer
                              content={message.text}
                              isStreaming={message.isStreaming}
                            />
                          ) : message.isStreaming ? (
                            <div className="flex items-center gap-2 text-indigo-300 text-xs py-2">
                              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                              <span>Gemini sta analizzando il problema e strutturando i passaggi logici...</span>
                            </div>
                          ) : null}

                          {/* Search Grounding Sources */}
                          <GroundingSources
                            sources={message.searchSources}
                            queries={message.searchQueries}
                          />

                          {/* Model Message Action Bar */}
                          {!message.isStreaming && message.text && (
                            <div className="flex items-center gap-1.5 mt-3 pt-2 text-gray-400 text-xs">
                              <button
                                onClick={() => handleCopyMessage(message.id, message.text)}
                                className="flex items-center gap-1 p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                title="Copia risposta"
                                type="button"
                              >
                                {copiedId === message.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-green-400 text-[11px]">Copiato</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">Copia</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleToggleSpeak(message.id, message.text)}
                                className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  speakingMessageId === message.id
                                    ? 'text-cyan-400 bg-cyan-500/10'
                                    : 'hover:text-white hover:bg-white/5'
                                }`}
                                title={
                                  speakingMessageId === message.id
                                    ? 'Interrompi lettura'
                                    : 'Ascolta risposta'
                                }
                                type="button"
                              >
                                {speakingMessageId === message.id ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">Ferma</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">Ascolta</span>
                                  </>
                                )}
                              </button>

                              {/* Thumbs Up / Thumbs Down Feedback Controls */}
                              <FeedbackControl
                                messageId={message.id}
                                currentFeedback={message.feedback}
                                feedbackNote={message.feedbackNote}
                                onFeedback={(fb, note) =>
                                  handleFeedbackChange(message.id, fb, note)
                                }
                              />

                              <button
                                onClick={() =>
                                  handleSendMessage(
                                    `Approfondisci e scomponi ulteriormente i passaggi logici di questa risposta, esplicitando tutti i vincoli e le alternative.`
                                  )
                                }
                                className="flex items-center gap-1 p-1.5 rounded-lg hover:text-cyan-300 hover:bg-cyan-500/10 text-indigo-300 transition-colors cursor-pointer ml-auto"
                                title="Richiedi scomposizione dettagliata dei passaggi"
                                type="button"
                              >
                                <Brain className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Scomponi ulteriormente</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 font-bold text-xs mt-1">
                        G
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Dock */}
        <div className="p-4 md:px-8 border-t border-white/5 bg-[#131314]/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            {/* Toggles bar */}
            <div className="flex items-center justify-between gap-2 mb-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeepReasoning(!deepReasoning)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                    deepReasoning
                      ? 'bg-indigo-600/20 text-cyan-300 border border-indigo-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Ragionamento Avanzato</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      deepReasoning ? 'bg-cyan-400 text-black' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {deepReasoning ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnableSearch(!enableSearch)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                    enableSearch
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Google Search</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      enableSearch ? 'bg-blue-400 text-black' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {enableSearch ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 hidden sm:block">
                Shift + Invio per andare a capo
              </div>
            </div>

            {/* Attached Images preview bar */}
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.previewUrl}
                      alt="anteprima"
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                    />
                    <button
                      onClick={() =>
                        setAttachedImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Floating Card */}
            <div className="relative flex items-end gap-2 p-2.5 rounded-2xl bg-[#1e1f26] border border-white/10 focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xl transition-all">
              {/* File upload trigger */}
              <label
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                title="Allega immagine o file di codice"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  multiple
                  accept="image/*,.txt,.md,.json,.js,.ts,.py,.html,.css,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Dictation voice trigger */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={isListening ? 'Interrompi registrazione' : 'Dettatura vocale'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isListening
                    ? 'In ascolto della tua voce...'
                    : 'Chiedi a Gemini (es. spiegami passo-passo, scomponi un problema...)'
                }
                rows={1}
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none resize-none max-h-36 py-1 leading-relaxed"
                style={{
                  height: 'auto',
                  minHeight: '24px',
                }}
              />

              {/* Send Button */}
              <button
                type="button"
                disabled={(!inputPrompt.trim() && attachedImages.length === 0) || isStreaming}
                onClick={() => handleSendMessage()}
                className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
                title="Invia messaggio"
              >
                {isStreaming ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Disclaimer */}
            <div className="text-center mt-2">
              <span className="text-[11px] text-gray-500">
                Gemini può commettere errori. Verifica le informazioni importanti. Modello:{' '}
                <span className="text-gray-400 font-mono">
                  {selectedModel}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decompose Modal */}
      <DecomposeModal
        isOpen={isDecomposeModalOpen}
        onClose={() => setIsDecomposeModalOpen(false)}
        onSendToChat={(prompt, response) => {
          handleSendMessage(prompt);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setDeepReasoning(newSettings.defaultReasoning);
          setEnableSearch(newSettings.defaultSearch);
          setSelectedModel(newSettings.preferredModel);
        }}
        onClearAllChats={handleClearAllChats}
      />

      {/* Negative Feedback Queue Modal */}
      <NegativeFeedbackModal
        isOpen={isNegativeFeedbackModalOpen}
        onClose={() => setIsNegativeFeedbackModalOpen(false)}
        items={negativeFeedbackItems}
        onRemoveItem={handleRemoveNegativeFeedbackItem}
        onClearAll={handleClearAllNegativeFeedback}
        onNavigateToSession={(sessionId) => setActiveSessionId(sessionId)}
        onRegenerateWithReasoning={handleRegenerateWithReasoning}
      />

      {/* Dedicated Recent Search Queries Sidebar */}
      <SearchQueriesSidebar
        isOpen={isSearchQueriesOpen}
        onClose={() => setIsSearchQueriesOpen(false)}
        queries={recentSearchQueries}
        onExecuteQuery={handleExecuteSearchQuery}
        onInsertQuery={handleInsertSearchQuery}
        onRemoveQuery={handleRemoveSearchQuery}
        onClearAll={handleClearAllSearchQueries}
      />
    </div>
  );
}
