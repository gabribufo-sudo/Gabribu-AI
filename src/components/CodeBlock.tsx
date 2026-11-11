import React, { useState } from 'react';
import { Copy, Check, Play, Code2, Eye } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const cleanLang = (language || 'plaintext').trim().toLowerCase();
  const canPreview = ['html', 'svg', 'xml', 'javascript', 'js'].includes(cleanLang);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-white/10 bg-[#16171a] overflow-hidden text-sm shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1f2024] border-b border-white/5 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono uppercase font-semibold text-gray-300">
            {cleanLang || 'code'}
          </span>
          <span className="text-[10px] text-gray-500">
            {code.split('\n').length} righe
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canPreview && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                showPreview
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              type="button"
            >
              {showPreview ? (
                <>
                  <Code2 className="w-3 h-3" />
                  Mostra Codice
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Anteprima Live
                </>
              )}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            type="button"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body: Preview or Code view */}
      {showPreview && canPreview ? (
        <div className="p-4 bg-white rounded-b-xl min-h-[160px] text-black">
          <div className="text-[11px] font-mono text-gray-500 mb-2 border-b pb-1">
            Sandbox Anteprima Interattiva
          </div>
          {cleanLang === 'svg' ? (
            <div
              className="flex justify-center items-center p-4"
              dangerouslySetInnerHTML={{ __html: code }}
            />
          ) : (
            <iframe
              srcDoc={
                cleanLang === 'javascript' || cleanLang === 'js'
                  ? `<!DOCTYPE html><html><body><div id="output" style="font-family:sans-serif;padding:12px;"></div><script>try{${code}}catch(e){document.getElementById('output').innerText = 'Errore: ' + e.message;}</script></body></html>`
                  : code
              }
              title="Code Preview"
              className="w-full min-h-[220px] border border-gray-200 rounded bg-white"
              sandbox="allow-scripts"
            />
          )}
        </div>
      ) : (
        <div className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-gray-200 selection:bg-blue-500/30">
          <pre className="m-0">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
