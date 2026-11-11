import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Check, X, AlertCircle } from 'lucide-react';

interface FeedbackControlProps {
  messageId: string;
  currentFeedback?: 'like' | 'dislike';
  feedbackNote?: string;
  onFeedback: (feedback: 'like' | 'dislike' | null, note?: string) => void;
}

const FEEDBACK_REASONS = [
  'Informazione inesatta o errata',
  'Risposta superficiale o incompleta',
  'Non ha seguito le istruzioni fornite',
  'Allucinazione o dati non verificati',
  'Passaggi logici mancanti o errati',
];

export const FeedbackControl: React.FC<FeedbackControlProps> = ({
  messageId,
  currentFeedback,
  feedbackNote,
  onFeedback,
}) => {
  const [showDislikeMenu, setShowDislikeMenu] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(feedbackNote || '');
  const [customNote, setCustomNote] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDislikeMenu(false);
      }
    };
    if (showDislikeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDislikeMenu]);

  const handleThumbsUp = () => {
    setShowDislikeMenu(false);
    if (currentFeedback === 'like') {
      onFeedback(null);
    } else {
      onFeedback('like');
    }
  };

  const handleThumbsDownClick = () => {
    if (currentFeedback === 'dislike') {
      onFeedback(null);
      setShowDislikeMenu(false);
    } else {
      setShowDislikeMenu(true);
    }
  };

  const handleConfirmDislike = (reasonText: string) => {
    onFeedback('dislike', reasonText || customNote || 'Non soddisfacente');
    setShowDislikeMenu(false);
  };

  return (
    <div className="relative inline-flex items-center gap-1" ref={menuRef}>
      {/* Thumbs Up Button */}
      <button
        onClick={handleThumbsUp}
        className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors cursor-pointer ${
          currentFeedback === 'like'
            ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        title={currentFeedback === 'like' ? 'Feedback positivo registrato' : 'Buona risposta'}
        type="button"
      >
        <ThumbsUp className={`w-3.5 h-3.5 ${currentFeedback === 'like' ? 'fill-emerald-400/20' : ''}`} />
      </button>

      {/* Thumbs Down Button */}
      <button
        onClick={handleThumbsDownClick}
        className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors cursor-pointer ${
          currentFeedback === 'dislike'
            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        title={currentFeedback === 'dislike' ? 'Salvata nelle interazioni negative (clicca per rimuovere)' : 'Valuta negativamente e salva nel registro'}
        type="button"
      >
        <ThumbsDown className={`w-3.5 h-3.5 ${currentFeedback === 'dislike' ? 'fill-rose-400/20' : ''}`} />
      </button>

      {/* Feedback Popover when disliking */}
      {showDislikeMenu && (
        <div className="absolute left-0 bottom-full mb-2 z-40 w-72 rounded-2xl bg-[#1e1f28] border border-rose-500/30 p-3 shadow-2xl animate-fade-in text-left">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cosa non ha funzionato?</span>
            </div>
            <button
              onClick={() => setShowDislikeMenu(false)}
              className="p-1 rounded text-gray-400 hover:text-white"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1 mb-2">
            {FEEDBACK_REASONS.map((r, i) => (
              <button
                key={i}
                onClick={() => handleConfirmDislike(r)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between group cursor-pointer"
                type="button"
              >
                <span className="truncate">{r}</span>
                <span className="opacity-0 group-hover:opacity-100 text-rose-400 text-[10px]">
                  Salva →
                </span>
              </button>
            ))}
          </div>

          {/* Quick direct save button without reason */}
          <div className="pt-2 border-t border-white/10 flex justify-between items-center">
            <span className="text-[10px] text-gray-500">Salva nel registro per revisione</span>
            <button
              onClick={() => handleConfirmDislike('Segnalazione generale')}
              className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
              type="button"
            >
              Conferma
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
