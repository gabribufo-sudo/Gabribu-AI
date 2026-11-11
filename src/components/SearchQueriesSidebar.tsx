import React, { useState } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Send,
  CornerDownLeft,
  ExternalLink,
  Globe,
  Sparkles,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { RecentSearchQuery } from '../types';

interface SearchQueriesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  queries: RecentSearchQuery[];
  onExecuteQuery: (queryText: string) => void;
  onInsertQuery: (queryText: string) => void;
  onRemoveQuery: (id: string) => void;
  onClearAll: () => void;
}

const SUGGESTED_QUERIES = [
  'Ultime novità intelligenza artificiale e modelli multimodali',
  'Scoperte recenti telescopio spaziale James Webb',
  'Sviluppi nella fusione nucleare e transizione energetica',
  'Migliori pratiche architettura microservizi 2026',
];

export const SearchQueriesSidebar: React.FC<SearchQueriesSidebarProps> = ({
  isOpen,
  onClose,
  queries,
  onExecuteQuery,
  onInsertQuery,
  onRemoveQuery,
  onClearAll,
}) => {
  const [filterText, setFilterText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredQueries = queries.filter((q) =>
    q.query.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Pochi istanti fa';
    if (diffMins < 60) return `${diffMins} min fa`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ore fa`;
    return new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Slide-out Sidebar Drawer (Right side) */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-80 sm:w-96 bg-[#16171f] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#13141a]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Query Web Recenti</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {queries.length}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Ricerche Google effettuate nella sessione</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {queries.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Vuoi cancellare la cronologia delle query di ricerca?')) {
                    onClearAll();
                  }
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                title="Svuota cronologia query"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Chiudi pannello ricerche"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Input */}
        {queries.length > 0 && (
          <div className="px-4 py-2.5 border-b border-white/5 bg-[#14151c]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Cerca tra le query recenti..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* List of Queries */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {queries.length === 0 ? (
            <div className="py-10 px-3 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto text-gray-500">
                <Search className="w-5 h-5 opacity-40 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white mb-1">Nessuna query recente</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Quando Gemini effettua ricerche sul web tramite Google Search Grounding, le query compariranno qui per essere riutilizzate rapidamente.
                </p>
              </div>

              {/* Quick suggestions to click */}
              <div className="pt-2 text-left">
                <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">
                  Query Consigliate da Provare
                </span>
                <div className="space-y-1.5">
                  {SUGGESTED_QUERIES.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onExecuteQuery(sug);
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-blue-500/30 text-xs text-gray-300 hover:text-white transition-all group flex items-center justify-between"
                      type="button"
                    >
                      <span className="truncate pr-2">{sug}</span>
                      <ArrowRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Nessuna query corrispondente al filtro.
            </div>
          ) : (
            filteredQueries.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-white/10 bg-[#1b1c24] hover:border-blue-500/40 p-3 space-y-2.5 transition-all shadow-sm"
              >
                {/* Query Header: Time and Session */}
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>{formatTime(item.timestamp)}</span>
                    {item.sourceCount && item.sourceCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {item.sourceCount} fonti
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onRemoveQuery(item.id)}
                    className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                    title="Rimuovi dalla lista"
                    type="button"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Query Text */}
                <div className="text-xs font-semibold text-white leading-relaxed flex items-start gap-2">
                  <Search className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="break-words select-text">"{item.query}"</span>
                </div>

                {/* Session tag if present */}
                {item.sessionTitle && (
                  <div className="text-[10px] text-gray-400 truncate bg-black/20 px-2 py-0.5 rounded">
                    Chat: {item.sessionTitle}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleCopy(item.id, item.query)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Copia query"
                    type="button"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Copiato</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copia</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Insert into textarea */}
                    <button
                      onClick={() => {
                        onInsertQuery(item.query);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                      title="Inserisci nel box di testo per modificare"
                      type="button"
                    >
                      <CornerDownLeft className="w-3 h-3 text-indigo-400" />
                      <span>Inserisci</span>
                    </button>

                    {/* Execute query directly with Google search */}
                    <button
                      onClick={() => {
                        onExecuteQuery(item.query);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-sm transition-all"
                      title="Esegui subito la ricerca con Google Grounding"
                      type="button"
                    >
                      <Send className="w-3 h-3" />
                      <span>Cerca</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-[#13141a] text-center">
          <p className="text-[10px] text-gray-500">
            Le query web consentono di verificare informazioni e fatti in tempo reale con Google Grounding.
          </p>
        </div>
      </aside>
    </>
  );
};
