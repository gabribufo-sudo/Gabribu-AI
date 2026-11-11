import React, { useState } from 'react';
import {
  Brain,
  X,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Code,
  Calculator,
  Compass,
  Briefcase,
  Copy,
  Check,
  SendHorizontal
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface DecomposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string, initialResponse?: string) => void;
}

const DOMAINS = [
  { id: 'Ingegneria & Software', icon: Code, label: 'Software & Algoritmi' },
  { id: 'Matematica & Logica', icon: Calculator, label: 'Matematica & Logica' },
  { id: 'Strategia & Problem Solving', icon: Compass, label: 'Strategia & Decisioni' },
  { id: 'Business & Architettura', icon: Briefcase, label: 'Business & Sistemi' },
];

const PRESETS = [
  {
    title: 'Architettura distribuita scalabile',
    text: 'Come progettare un sistema di messaggistica realtime per 1 milione di utenti concorrenti garantendo consistenza eventuale e tolleranza ai partizionamenti di rete?',
    domain: 'Ingegneria & Software',
  },
  {
    title: 'Risoluzione problema algoritmico complesso',
    text: 'Dato un grafo orientato con pesi negativi, trova il cammino minimo evitando cicli negativi e spiega la complessità temporale e spaziale.',
    domain: 'Matematica & Logica',
  },
  {
    title: 'Dilemma decisionale e allocazione risorse',
    text: 'Un team ha 6 mesi di budget e deve scegliere tra riscrivere un monolite legacy in microservizi o ottimizzare il database esistente con sharding.',
    domain: 'Strategia & Problem Solving',
  },
];

export const DecomposeModal: React.FC<DecomposeModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [problemText, setProblemText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('Ingegneria & Software');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecompose = async () => {
    if (!problemText.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problemText.trim(),
          domain: selectedDomain,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Errore nella scomposizione.');
      }

      const data = await res.json();
      setResult(data.text);
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToChat = () => {
    if (!result) return;
    onSendToChat(
      `Scomposizione del problema: "${problemText}" (${selectedDomain})`,
      result
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1b22] border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#15161c]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Laboratorio di Ragionamento & Scomposizione Logica
                <span className="px-2 py-0.5 text-[10px] uppercase font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Deep Logic
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Scompone qualsiasi problema complesso in passaggi logici, vincoli e spiegazioni passo-passo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Domain selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Seleziona Dominio del Problema
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DOMAINS.map((dom) => {
                const Icon = dom.icon;
                const isSelected = selectedDomain === dom.id;
                return (
                  <button
                    key={dom.id}
                    onClick={() => setSelectedDomain(dom.id)}
                    type="button"
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`} />
                    <span className="truncate">{dom.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Esempi di Problemi Complessi
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setProblemText(p.text);
                    setSelectedDomain(p.domain);
                  }}
                  className="text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="text-xs font-medium text-indigo-300 group-hover:text-cyan-300 mb-1">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {p.text}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input text */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Descrivi il Problema o Quesito da Risolvere
            </label>
            <textarea
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="Descrivi dettagliatamente il problema, vincoli o algoritmo da scomporre..."
              rows={4}
              className="w-full px-4 py-3 bg-[#13141a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Action button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleDecompose}
              disabled={!problemText.trim() || loading}
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Scomposizione logica in corso...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Scomponi e Risolvi Passo-Passo
                </>
              )}
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Results section */}
          {result && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">
                    Scomposizione e Soluzione Passo-Passo Ottenuta
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                    type="button"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiato' : 'Copia'}</span>
                  </button>
                  <button
                    onClick={handleApplyToChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium shadow transition-colors"
                    type="button"
                  >
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Invia alla Chat</span>
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#14151c] border border-white/10 text-sm">
                <MarkdownRenderer content={result} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
