import React, { useState } from 'react';
import { X, Sliders, Shield, Volume2, Save, RotateCcw, Sparkles } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onClearAllChats,
}) => {
  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [savedAlert, setSavedAlert] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 700);
  };

  const handleReset = () => {
    const defaults: UserSettings = {
      systemInstruction: 'Sei Gemini, un assistente IA avanzato, accurato e disponibile. Rispondi in italiano con tono chiaro e amichevole.',
      defaultReasoning: true,
      defaultSearch: false,
      preferredModel: 'gemini-3.8-flash',
      speechRate: 1.0,
      speechPitch: 1.0,
    };
    setFormData(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#1c1d24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#16171c]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Impostazioni Gemini AI</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* System Instruction */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Istruzioni di Sistema Personalizzate
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Definisci il ruolo, la personalità o le regole di risposta che Gemini deve sempre seguire.
            </p>
            <textarea
              value={formData.systemInstruction}
              onChange={(e) =>
                setFormData({ ...formData, systemInstruction: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2.5 bg-[#121317] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
              placeholder="es. Rispondi sempre con esempi di codice in TypeScript..."
            />
          </div>

          {/* Defaults toggles */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
              Comportamento Predefinito Nuove Chat
            </span>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
              <div>
                <div className="text-xs font-medium text-white">
                  🧠 Ragionamento Avanzato attivo di default
                </div>
                <div className="text-[11px] text-gray-400">
                  Attiva automaticamente la scomposizione passo-passo nei problemi complessi.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.defaultReasoning}
                onChange={(e) =>
                  setFormData({ ...formData, defaultReasoning: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
              <div>
                <div className="text-xs font-medium text-white">
                  🌐 Ricerca Web Google attiva di default
                </div>
                <div className="text-[11px] text-gray-400">
                  Cerca informazioni aggiornate sul web tramite Search Grounding.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.defaultSearch}
                onChange={(e) =>
                  setFormData({ ...formData, defaultSearch: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Audio TTS Settings */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Sintesi Vocale (Lettura Risposte)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Velocità voce: {formData.speechRate}x
                </label>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={formData.speechRate}
                  onChange={(e) =>
                    setFormData({ ...formData, speechRate: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Tono voce: {formData.speechPitch}x
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={formData.speechPitch}
                  onChange={(e) =>
                    setFormData({ ...formData, speechPitch: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-red-400">Cancella cronologia</div>
                <div className="text-[11px] text-gray-500">Elimina tutte le conversazioni salvate in locale</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Sei sicuro di voler eliminare tutte le conversazioni?')) {
                    onClearAllChats();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
              >
                Elimina Tutto
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ripristina Predefiniti
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savedAlert ? 'Salvato!' : 'Salva Modifiche'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
