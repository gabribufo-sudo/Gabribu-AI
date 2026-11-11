import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  Search,
  Brain,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ThumbsDown,
  Globe,
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenDecomposeModal: () => void;
  onOpenSettings: () => void;
  onOpenNegativeFeedbackModal: () => void;
  negativeFeedbackCount: number;
  onOpenSearchQueries: () => void;
  recentQueriesCount: number;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onTogglePin,
  onRenameSession,
  onOpenDecomposeModal,
  onOpenSettings,
  onOpenNegativeFeedbackModal,
  negativeFeedbackCount,
  onOpenSearchQueries,
  recentQueriesCount,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const recentSessions = filteredSessions.filter((s) => !s.pinned);

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#17181f] border-r border-white/5 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            {/* Gemini Iconic Star Logo */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-500 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Gemini</span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Pro
                </span>
              </div>
              <div className="text-[10px] text-gray-400">Ragionamento Avanzato</div>
            </div>
          </div>

          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:hidden"
            type="button"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 hover:from-blue-600 hover:to-purple-600 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer group"
            type="button"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Nuova Chat</span>
          </button>

          {/* Dedicated Problem Decomposition Lab Button */}
          <button
            onClick={onOpenDecomposeModal}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-200 text-xs font-medium transition-all cursor-pointer"
            type="button"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scomposizione Logica</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              Lab
            </span>
          </button>

          {/* Dedicated Negative Feedback List Button */}
          <button
            onClick={onOpenNegativeFeedbackModal}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 text-gray-300 hover:text-rose-300 text-xs font-medium transition-all cursor-pointer"
            type="button"
          >
            <div className="flex items-center gap-2">
              <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Feedback Negativi</span>
            </div>
            {negativeFeedbackCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {negativeFeedbackCount}
              </span>
            ) : (
              <span className="text-[9px] text-gray-500">0</span>
            )}
          </button>

          {/* Dedicated Recent Web Queries Sidebar Button */}
          <button
            onClick={onOpenSearchQueries}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 text-gray-300 hover:text-blue-300 text-xs font-medium transition-all cursor-pointer"
            type="button"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Ricerche Web Recenti</span>
            </div>
            {recentQueriesCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                {recentQueriesCount}
              </span>
            ) : (
              <span className="text-[9px] text-gray-500">0</span>
            )}
          </button>
        </div>

        {/* Search Chat History */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca nelle chat..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {/* Pinned Section */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="px-3 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3 text-amber-400" />
                <span>Fissate</span>
              </div>
              <div className="space-y-0.5">
                {pinnedSessions.map((s) => renderSessionItem(s))}
              </div>
            </div>
          )}

          {/* Recent Section */}
          <div>
            <div className="px-3 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {pinnedSessions.length > 0 ? 'Recenti' : 'Conversazioni'}
            </div>
            {recentSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-500">
                Nessuna conversazione trovata.
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentSessions.map((s) => renderSessionItem(s))}
              </div>
            )}
          </div>
        </div>

        {/* Footer User Profile & Settings */}
        <div className="p-3 border-t border-white/5 bg-[#14151a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                G
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">Gabri</div>
                <div className="text-[10px] text-gray-400 truncate">gabribufo@gmail.com</div>
              </div>
            </div>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Impostazioni"
              type="button"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  function renderSessionItem(session: ChatSession) {
    const isActive = session.id === activeSessionId;
    const isEditing = session.id === editingId;

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
          isActive
            ? 'bg-white/10 text-white font-medium border border-white/10'
            : 'text-gray-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />

          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(e, session.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-full bg-black/40 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
            />
          ) : (
            <span className="truncate">{session.title || 'Nuova conversazione'}</span>
          )}
        </div>

        {/* Hover / Active Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          {isEditing ? (
            <button
              onClick={(e) => handleSaveRename(e, session.id)}
              className="p-1 rounded text-green-400 hover:bg-white/10"
              type="button"
            >
              <Check className="w-3 h-3" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(session.id);
                }}
                className={`p-1 rounded hover:bg-white/10 ${
                  session.pinned ? 'text-amber-400' : 'text-gray-400 hover:text-white'
                }`}
                title={session.pinned ? 'Sblocca' : 'Fissa in alto'}
                type="button"
              >
                <Pin className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => handleStartRename(e, session)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Rinomina"
                type="button"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Vuoi eliminare questa chat?')) {
                    onDeleteSession(session.id);
                  }
                }}
                className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/10"
                title="Elimina"
                type="button"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
};
