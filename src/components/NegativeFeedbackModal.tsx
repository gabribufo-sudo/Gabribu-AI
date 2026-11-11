import React, { useState } from 'react';
import {
  ThumbsDown,
  X,
  Trash2,
  ExternalLink,
  Download,
  Search,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { NegativeFeedbackItem } from '../types';

interface NegativeFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: NegativeFeedbackItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onNavigateToSession?: (sessionId: string) => void;
  onRegenerateWithReasoning?: (item: NegativeFeedbackItem) => void;
}

export const NegativeFeedbackModal: React.FC<NegativeFeedbackModalProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearAll,
  onNavigateToSession,
  onRegenerateWithReasoning,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (item) =>
      item.userPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.modelResponse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gemini-feedback-negativi-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-[#1a1b23] border border-rose-500/25 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#15161c]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <ThumbsDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Registro Risposte Valutate Negativamente
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {items.length} {items.length === 1 ? 'segnalazione' : 'segnalazioni'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Archivio delle risposte da revisionare o rigenerare con ragionamento potenziato
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                  title="Esporta JSON"
                  type="button"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Esporta JSON</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Vuoi cancellare tutto lo storico delle risposte valutate negativamente?')) {
                      onClearAll();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-xs text-rose-400 transition-colors"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Svuota Registro</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {items.length > 0 && (
          <div className="px-6 py-2.5 border-b border-white/5 bg-[#171820]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtra per prompt, motivo o risposta del modello..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center text-gray-400 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-500">
                <ThumbsDown className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Nessuna segnalazione registrata</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Quando clicchi sull'icona pollice giù vicino a una risposta di Gemini, l'interazione viene salvata qui per permetterti di analizzarla o rigenerarla con logica rinforzata.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Nessun risultato corrispondente al filtro di ricerca.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const formattedDate = new Date(item.timestamp).toLocaleString('it-IT');

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#16171f] hover:border-rose-500/30 transition-all p-4 space-y-3"
                >
                  {/* Item top metadata bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{formattedDate}</span>
                      {item.sessionTitle && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[10px] truncate max-w-[200px]">
                          Chat: {item.sessionTitle}
                        </span>
                      )}
                      {item.modelUsed && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px]">
                          {item.modelUsed}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.reason && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                          Motivo: {item.reason}
                        </span>
                      )}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                        title="Rimuovi dal registro"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* User prompt question */}
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-indigo-400" />
                      Richiesta Utente
                    </div>
                    <div className="text-xs text-white leading-relaxed">{item.userPrompt}</div>
                  </div>

                  {/* Model response snippet / full */}
                  <div className="p-3 rounded-xl bg-[#1b1c26] border border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1.5 text-rose-300">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        Risposta Segnalata
                      </span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-[11px] text-indigo-300 hover:text-indigo-200 capitalize"
                        type="button"
                      >
                        {isExpanded ? 'Comprimi' : 'Mostra tutto'}
                      </button>
                    </div>

                    <div
                      className={`text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap ${
                        isExpanded ? '' : 'line-clamp-4'
                      }`}
                    >
                      {item.modelResponse}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => handleCopy(item.id, `DOMANDA:\n${item.userPrompt}\n\nRISPOSTA SEGNALATA:\n${item.modelResponse}`)}
                      className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                      type="button"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Copiato</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copia testo</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {onNavigateToSession && item.sessionId && (
                        <button
                          onClick={() => {
                            onNavigateToSession(item.sessionId);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
                          type="button"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Vai alla Chat</span>
                        </button>
                      )}

                      {onRegenerateWithReasoning && (
                        <button
                          onClick={() => {
                            onRegenerateWithReasoning(item);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white font-medium text-xs shadow-sm transition-all"
                          type="button"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Rigenera con Ragionamento</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
