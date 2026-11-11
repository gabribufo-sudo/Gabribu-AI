import React from 'react';
import { Globe, Search, Layers } from 'lucide-react';
import { GroundingChunk } from '../types';
import { OpenGraphCard } from './OpenGraphCard';

interface GroundingSourcesProps {
  sources?: GroundingChunk[];
  queries?: string[];
}

export const GroundingSources: React.FC<GroundingSourcesProps> = ({
  sources = [],
  queries = [],
}) => {
  // Deduplicate and filter valid web sources
  const validWebSources = sources.filter((s) => s.web && s.web.uri);
  const seenUrls = new Set<string>();
  const uniqueSources: GroundingChunk[] = [];

  for (const s of validWebSources) {
    if (s.web?.uri && !seenUrls.has(s.web.uri)) {
      seenUrls.add(s.web.uri);
      uniqueSources.push(s);
    }
  }

  if (uniqueSources.length === 0 && queries.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-white/10 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <span>Fonti Web & Open Graph Preview</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {uniqueSources.length} {uniqueSources.length === 1 ? 'fonte' : 'fonti'} verificate
          </span>
        </div>
      </div>

      {/* Queries performed by Google Search */}
      {queries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[11px] text-gray-500 flex items-center gap-1 mr-1">
            <Search className="w-3 h-3 text-gray-400" />
            Ricerche effettuate:
          </span>
          {queries.map((q, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]"
            >
              <span>"{q}"</span>
            </span>
          ))}
        </div>
      )}

      {/* Grid of Rich Open Graph Preview Cards */}
      {uniqueSources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {uniqueSources.slice(0, 6).map((source, idx) => (
            <OpenGraphCard
              key={source.web!.uri + idx}
              url={source.web!.uri}
              fallbackTitle={source.web!.title}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
};
