import { ReasoningStep } from '../types';

/**
 * Extracts <thought>...</thought> blocks from the AI response
 * Even handles partially streamed <thought> tags seamlessly!
 */
export function extractThoughtsAndContent(rawText: string): {
  thought: string;
  content: string;
  isThinkingActive: boolean;
} {
  if (!rawText) {
    return { thought: '', content: '', isThinkingActive: false };
  }

  const thoughtOpenIndex = rawText.indexOf('<thought>');
  
  if (thoughtOpenIndex === -1) {
    // No thought tag started
    return { thought: '', content: rawText, isThinkingActive: false };
  }

  const thoughtCloseIndex = rawText.indexOf('</thought>');

  if (thoughtCloseIndex === -1) {
    // Currently still inside an unclosed <thought> block (streaming)
    const thoughtContent = rawText.substring(thoughtOpenIndex + '<thought>'.length);
    const beforeThought = rawText.substring(0, thoughtOpenIndex);
    return {
      thought: thoughtContent.trim(),
      content: beforeThought.trim(),
      isThinkingActive: true,
    };
  }

  // Fully closed thought tag
  const thoughtContent = rawText.substring(
    thoughtOpenIndex + '<thought>'.length,
    thoughtCloseIndex
  );
  const afterThought = rawText.substring(thoughtCloseIndex + '</thought>'.length);
  const beforeThought = rawText.substring(0, thoughtOpenIndex);

  const finalContent = (beforeThought + '\n\n' + afterThought).trim();

  return {
    thought: thoughtContent.trim(),
    content: finalContent,
    isThinkingActive: false,
  };
}

/**
 * Parses markdown thought content into discrete reasoning phases
 */
export function parseReasoningSteps(thoughtText: string): ReasoningStep[] {
  if (!thoughtText) return [];

  // Match headers like "**FASE 1: ...**" or "### Passo 1: ..." or "1. ..."
  const lines = thoughtText.split('\n');
  const steps: ReasoningStep[] = [];
  let currentPhase = 'Ragionamento Iniziale';
  let currentTitle = 'Analisi preliminare del problema';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Check if line looks like a phase header
    const phaseMatch = trimmed.match(/^(?:(?:\*\*|###|\#\#)\s*)?(FASE\s*\d+|Passo\s*\d+|Fase\s*[A-Z]|\d+\.\s+)([^\n\*#:]+)(?:\*\*|:)?(.*)$/i);

    if (phaseMatch) {
      if (currentContent.length > 0 || steps.length > 0) {
        steps.push({
          phase: currentPhase,
          title: currentTitle,
          content: currentContent.join('\n').trim(),
        });
        currentContent = [];
      }
      currentPhase = phaseMatch[1].replace(/[:*#]/g, '').trim();
      currentTitle = (phaseMatch[2] + (phaseMatch[3] || '')).replace(/[*#]/g, '').trim();
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0 || steps.length === 0) {
    steps.push({
      phase: currentPhase,
      title: currentTitle,
      content: currentContent.join('\n').trim() || thoughtText,
    });
  }

  return steps;
}
