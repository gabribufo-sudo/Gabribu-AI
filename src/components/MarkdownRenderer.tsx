import React from 'react';
import { CodeBlock } from './CodeBlock';
import { ThinkingCard } from './ThinkingCard';
import { extractThoughtsAndContent } from '../utils/textParser';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
}) => {
  // Extract reasoning thought process
  const { thought, content: mainContent, isThinkingActive } = extractThoughtsAndContent(content);

  // Helper to render markdown content sections
  const renderFormattedText = (text: string) => {
    if (!text.trim()) return null;

    // Split text by code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Content before code block
      if (match.index > lastIndex) {
        const textChunk = text.substring(lastIndex, match.index);
        elements.push(
          <div key={`text-${lastIndex}`}>{renderStandardMarkdown(textChunk)}</div>
        );
      }

      // Code block
      const lang = match[1] || 'plaintext';
      const code = match[2];
      elements.push(
        <CodeBlock key={`code-${match.index}`} language={lang} code={code} />
      );

      lastIndex = match.index + match[0].length;
    }

    // Remaining content after last code block
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      elements.push(
        <div key={`text-${lastIndex}`}>{renderStandardMarkdown(remaining)}</div>
      );
    }

    return elements;
  };

  // Render paragraphs, headings, lists, blockquotes, bold, inline code
  const renderStandardMarkdown = (rawChunk: string) => {
    const lines = rawChunk.split('\n');
    const nodes: React.ReactNode[] = [];

    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (keyPrefix: number) => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const bodyRows = tableRows.slice(1);
        nodes.push(
          <div key={`table-${keyPrefix}`} className="my-3 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-xs text-left text-gray-200">
              <thead className="bg-[#1f2026] text-gray-300 uppercase tracking-wider text-[11px] border-b border-white/10">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="px-3 py-2 font-semibold">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bodyRows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.02]">
                    {r.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-gray-300">
                        {renderInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check for markdown table line: e.g. | col 1 | col 2 |
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        // Skip separator line e.g. |---|---|
        if (!/^[\|\-\s:]+$/.test(trimmed)) {
          const cells = trimmed
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable(index);
      }

      // Empty line
      if (!trimmed) {
        nodes.push(<div key={`empty-${index}`} className="h-2" />);
        return;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        nodes.push(
          <h3
            key={`h3-${index}`}
            className="text-base font-semibold text-white mt-4 mb-2 flex items-center gap-2"
          >
            {renderInlineFormatting(trimmed.substring(4))}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        nodes.push(
          <h2
            key={`h2-${index}`}
            className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 mt-5 mb-2 pb-1 border-b border-white/5"
          >
            {renderInlineFormatting(trimmed.substring(3))}
          </h2>
        );
        return;
      }

      if (trimmed.startsWith('# ')) {
        nodes.push(
          <h1
            key={`h1-${index}`}
            className="text-xl font-bold text-white mt-5 mb-2 pb-1 border-b border-white/10"
          >
            {renderInlineFormatting(trimmed.substring(2))}
          </h1>
        );
        return;
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        nodes.push(
          <blockquote
            key={`quote-${index}`}
            className="my-2 pl-3 py-1 border-l-2 border-indigo-500/60 bg-indigo-500/[0.05] rounded-r-lg text-xs italic text-gray-300"
          >
            {renderInlineFormatting(trimmed.substring(2))}
          </blockquote>
        );
        return;
      }

      // Numbered List (e.g. 1. Passo)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        nodes.push(
          <div key={`num-${index}`} className="flex items-start gap-2.5 my-1 text-sm text-gray-200 pl-1">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-300 font-semibold text-xs shrink-0 mt-0.5">
              {numMatch[1]}
            </span>
            <div className="flex-1 leading-relaxed">
              {renderInlineFormatting(numMatch[2])}
            </div>
          </div>
        );
        return;
      }

      // Bullet List (- or *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        nodes.push(
          <div key={`bullet-${index}`} className="flex items-start gap-2.5 my-1 text-sm text-gray-200 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
            <div className="flex-1 leading-relaxed">
              {renderInlineFormatting(trimmed.substring(2))}
            </div>
          </div>
        );
        return;
      }

      // Standard paragraph
      nodes.push(
        <p key={`p-${index}`} className="my-1 text-sm text-gray-200 leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return nodes;
  };

  // Helper for bold, italic, code, links with favicon previews
  const renderInlineFormatting = (text: string): React.ReactNode => {
    // Regex for inline code, bold, italic, markdown links [title](url) or raw urls
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s\)]+)/g);

    return parts.map((part, i) => {
      if (!part) return null;

      // Inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[13px] border border-white/5"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-gray-300">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Markdown Link: [text](https://...)
      const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/);
      if (mdLinkMatch) {
        const linkTitle = mdLinkMatch[1];
        const linkUrl = mdLinkMatch[2];
        let domain = 'link';
        try {
          domain = new URL(linkUrl).hostname.replace(/^www\./, '');
        } catch {}

        return (
          <a
            key={i}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 border border-blue-500/20 text-[13px] font-medium transition-colors align-baseline mx-0.5 group"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt=""
              className="w-3.5 h-3.5 rounded-xs inline-block shrink-0"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="underline underline-offset-2">{linkTitle}</span>
            <span className="text-[10px] text-gray-400 opacity-60 group-hover:opacity-100">↗</span>
          </a>
        );
      }

      // Raw URL: https://...
      if (part.startsWith('http://') || part.startsWith('https://')) {
        let domain = 'link';
        try {
          domain = new URL(part).hostname.replace(/^www\./, '');
        } catch {}

        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 border border-blue-500/20 text-[13px] font-medium transition-colors align-baseline mx-0.5 group"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt=""
              className="w-3.5 h-3.5 rounded-xs inline-block shrink-0"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="truncate max-w-[200px] underline underline-offset-2">{domain}</span>
            <span className="text-[10px] text-gray-400 opacity-60 group-hover:opacity-100">↗</span>
          </a>
        );
      }

      return part;
    });
  };

  return (
    <div className="text-gray-100 font-sans space-y-1">
      {/* Reasoning Thought Accordion */}
      {thought && (
        <ThinkingCard
          thoughtText={thought}
          isStreaming={isStreaming && isThinkingActive}
        />
      )}

      {/* Main Response Content */}
      <div className="space-y-1">
        {renderFormattedText(mainContent)}
      </div>

      {/* Streaming cursor when awaiting remaining words */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-blue-400 rounded-sm animate-pulse align-middle" />
      )}
    </div>
  );
};
