import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { OpenGraphData } from '../types';

interface OpenGraphCardProps {
  url: string;
  fallbackTitle?: string;
  index?: number;
}

const clientOgCache = new Map<string, OpenGraphData>();

export const OpenGraphCard: React.FC<OpenGraphCardProps> = ({
  url,
  fallbackTitle,
  index,
}) => {
  let initialDomain = 'web';
  try {
    initialDomain = new URL(url).hostname.replace(/^www\./, '');
  } catch {}

  const defaultFavicon = `https://www.google.com/s2/favicons?domain=${initialDomain}&sz=64`;

  const [ogData, setOgData] = useState<OpenGraphData | null>(
    clientOgCache.get(url) || null
  );
  const [loading, setLoading] = useState<boolean>(!clientOgCache.has(url));
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    if (clientOgCache.has(url)) {
      setOgData(clientOgCache.get(url)!);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data: OpenGraphData) => {
        if (isMounted) {
          const finalData: OpenGraphData = {
            url,
            title: data.title || fallbackTitle || initialDomain,
            description: data.description || '',
            image: data.image,
            favicon: data.favicon || defaultFavicon,
            domain: data.domain || initialDomain,
          };
          clientOgCache.set(url, finalData);
          setOgData(finalData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallbackData: OpenGraphData = {
            url,
            title: fallbackTitle || initialDomain,
            favicon: defaultFavicon,
            domain: initialDomain,
          };
          clientOgCache.set(url, fallbackData);
          setOgData(fallbackData);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, fallbackTitle, initialDomain, defaultFavicon]);

  const displayTitle = ogData?.title || fallbackTitle || initialDomain;
  const displayDomain = ogData?.domain || initialDomain;
  const faviconUrl = ogData?.favicon || defaultFavicon;
  const previewImage = !imgError && ogData?.image ? ogData.image : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#16171d]/90 hover:bg-[#1c1d26] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 text-left min-w-0"
    >
      {/* Optional OG Image Banner */}
      {previewImage && (
        <div className="relative w-full h-24 overflow-hidden bg-black/40">
          <img
            src={previewImage}
            alt={displayTitle}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16171d] via-transparent to-transparent opacity-80" />
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Top domain bar with Favicon */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="relative flex items-center justify-center w-5 h-5 rounded-md bg-white/10 border border-white/10 shrink-0 overflow-hidden">
              {!faviconError ? (
                <img
                  src={faviconUrl}
                  alt={displayDomain}
                  onError={() => setFaviconError(true)}
                  className="w-3.5 h-3.5 object-contain"
                  loading="lazy"
                />
              ) : (
                <Globe className="w-3 h-3 text-blue-400" />
              )}
            </div>

            <span className="text-[11px] font-medium text-gray-400 group-hover:text-blue-300 transition-colors truncate">
              {displayDomain}
            </span>

            {typeof index === 'number' && (
              <span className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold shrink-0">
                {index + 1}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug mb-1">
            {loading ? (
              <span className="inline-block w-4/5 h-3 bg-white/10 rounded animate-pulse" />
            ) : (
              displayTitle
            )}
          </h4>

          {/* Description Snippet if available */}
          {ogData?.description && (
            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
              {ogData.description}
            </p>
          )}
        </div>

        {/* Footer Link Indicator */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">
          <span className="truncate max-w-[85%]">{url.replace(/^https?:\/\//, '')}</span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-blue-400 shrink-0" />
        </div>
      </div>
    </a>
  );
};
