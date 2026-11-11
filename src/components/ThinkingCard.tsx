import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Copy, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { parseReasoningSteps } from '../utils/textParser';

interface ThinkingCardProps {
  thoughtText: string;
  isStreaming?: boolean;
}

export const ThinkingCard: React.FC<ThinkingCardProps> = ({
  thoughtText,
  isStreaming = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  if (!thoughtText) return null;

  const steps = parseReasoningSteps(thoughtText);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(thoughtText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4 rounded-xl border border-indigo-500/25 bg-gradient-to-br from-[#181824] via-[#15161f] to-[#12131a] shadow-lg overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors group cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Brain className={`w-4 h-4 ${isStreaming ? 'animate-pulse text-cyan-400' : ''}`} />
            {isStreaming && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-indigo-200">
                Processo di Ragionamento Logico
              </span>
              <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {isStreaming ? 'Analisi in corso...' : `${steps.length} Fasi di scomposizione`}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Scomposizione passo-passo, catena deduttiva e verifica dei vincoli
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copia logica di ragionamento"
            type="button"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <div className="text-gray-400 group-hover:text-white transition-colors p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded Reasoning Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-indigo-500/15">
          <div className="space-y-3 mt-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative pl-6 pb-2 before:absolute before:left-2 before:top-2.5 before:bottom-0 before:w-px before:bg-indigo-500/20 last:before:hidden"
              >
                {/* Node icon */}
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-indigo-950 border border-indigo-400/50 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                  {idx + 1}
                </div>

                <div className="bg-[#1c1d29]/60 rounded-lg p-3 border border-indigo-500/15">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      {step.phase}
                    </span>
                    {idx === steps.length - 1 && !isStreaming && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Verificato
                      </span>
                    )}
                  </div>
                  {step.title && step.title !== step.phase && (
                    <div className="text-xs font-medium text-gray-200 mb-1">
                      {step.title}
                    </div>
                  )}
                  <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans opacity-90">
                    {step.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isStreaming && (
            <div className="flex items-center gap-2 mt-3 pt-2 text-xs text-cyan-400/80 italic font-mono border-t border-white/5">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Gemini sta valutando ipotesi e formulando la soluzione ottimale...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
