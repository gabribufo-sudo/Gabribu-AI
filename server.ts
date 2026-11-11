import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limit for base64 image uploads
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK with required telemetry headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Advanced reasoning prompt template to enforce problem decomposition and step-by-step logic
const ADVANCED_REASONING_INSTRUCTIONS = `
Sei Gemini, un'intelligenza artificiale di nuova generazione dotata di un potente Motore di Ragionamento Logico Avanzato.
Quando la modalità ragionamento avanzato è attiva o quando affronti problemi complessi (programmazione, matematica, logica, analisi critica, pianificazione strategica):

SEGUI QUESTO METODO RIGOROSO DI SCOMPOSIZIONE:
1. RACCHIUDI IL TUO PROCESSO DI RAGIONAMENTO E SCOMPOSIZIONE ALL'INTERNO DEL TAG SPECIALE <thought>...</thought>.
All'interno del blocco <thought>, articola chiaramente:
- **FASE 1: Identificazione del problema & Vincoli chiave** (Cosa viene richiesto esattamente, assunzioni, dati forniti)
- **FASE 2: Scomposizione in sotto-problemi** (Dividi il problema in 3-5 blocchi logici o quesiti elementari)
- **FASE 3: Percorso logico & Valutazione ipotesi** (Esamina i passaggi, valuta alternative, scarta strade errate)
- **FASE 4: Autoverifica e Casi limite** (Controlla coerenza interna, casi estremi, complessità o possibili errori)

2. DOPO LA CHIUSURA </thought>, FORNISCI LA SOLUZIONE FINALE PER L'UTENTE:
- Strutturata in modo impeccabile, chiara e comprensibile.
- Se opportuno, usa sezioni passo-passo numerate, tabelle comparative o blocchi di codice commentati.
- Mantieni un linguaggio italiano naturale, autorevole, preciso ed elegante.
`;

// API Health Check & Config endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash',
  });
});

// In-memory cache for Open Graph metadata
const ogCache = new Map<string, { title: string; description: string; image?: string; favicon: string; domain: string }>();

// Open Graph Preview Endpoint
app.get('/api/og-preview', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL mancante' });
  }

  try {
    const parsed = new URL(targetUrl);
    const domain = parsed.hostname.replace(/^www\./, '');
    const defaultFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    if (ogCache.has(targetUrl)) {
      return res.json(ogCache.get(targetUrl));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 GeminiAI/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    }).catch(() => null);

    clearTimeout(timeout);

    let title = domain;
    let description = '';
    let image = '';
    let favicon = defaultFavicon;

    if (response && response.ok) {
      const html = await response.text().catch(() => '');

      // Match og:title or <title>
      const ogTitleMatch =
        html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (ogTitleMatch) title = ogTitleMatch[1];
      else if (titleTagMatch) title = titleTagMatch[1];

      // Match og:description or meta description
      const ogDescMatch =
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
      if (ogDescMatch) description = ogDescMatch[1];

      // Match og:image
      const ogImgMatch =
        html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImgMatch) {
        let imgUrl = ogImgMatch[1];
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
        else if (imgUrl.startsWith('/')) imgUrl = `${parsed.protocol}//${parsed.host}${imgUrl}`;
        image = imgUrl;
      }
    }

    const previewData = {
      title: title ? title.trim().replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : domain,
      description: description ? description.trim().slice(0, 160) : '',
      image: image || undefined,
      favicon,
      domain,
    };

    ogCache.set(targetUrl, previewData);
    res.json(previewData);
  } catch {
    let domain = 'web';
    try {
      domain = new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {}
    res.json({
      title: domain,
      description: '',
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      domain,
    });
  }
});

// Helper for retrying Gemini calls with exponential backoff and fallback
async function callWithRetry<T>(
  fn: (modelName: string) => Promise<T>,
  primaryModel: string,
  maxRetries = 2
): Promise<T> {
  const modelsToTry = primaryModel === 'gemini-3.1-flash-lite'
    ? ['gemini-3.1-flash-lite', 'gemini-3.8-flash']
    : ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  let lastError: any;

  for (const modelCandidate of modelsToTry) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn(modelCandidate);
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
        
        if (!isTransient) {
          throw err;
        }

        // Wait with backoff before retry
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// Streaming Chat Endpoint
app.post('/api/chat', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY non trovata nel backend. Configurala nel pannello Impostazioni > Segreti.',
    });
  }

  const {
    messages = [],
    model = 'gemini-3.8-flash',
    enableSearch = false,
    deepReasoning = true,
    systemInstruction = '',
  } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const formattedContents = messages.map((msg: {
      role: string;
      text: string;
      images?: Array<{ mimeType: string; data: string }>;
    }) => {
      const parts: any[] = [];

      if (msg.images && Array.isArray(msg.images)) {
        for (const img of msg.images) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          });
        }
      }

      if (msg.text) {
        parts.push({ text: msg.text });
      }

      return {
        role: msg.role === 'model' ? 'model' : 'user',
        parts,
      };
    });

    const combinedSystemInstruction = [
      deepReasoning ? ADVANCED_REASONING_INSTRUCTIONS : 'Sei Gemini, un assistente IA avanzato, accurato e disponibile. Rispondi in italiano con tono chiaro e amichevole.',
      systemInstruction,
    ].filter(Boolean).join('\n\n');

    const config: any = {
      systemInstruction: combinedSystemInstruction,
    };

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const streamResult = await callWithRetry(
      async (modelName) => {
        const modelConfig = { ...config };
        if (modelName === 'gemini-3.8-flash') {
          modelConfig.thinkingConfig = {
            thinkingLevel: deepReasoning ? ThinkingLevel.HIGH : ThinkingLevel.MEDIUM,
          };
        } else {
          // gemini-3.1-flash-lite does not support HIGH thinking
          delete modelConfig.thinkingConfig;
        }

        return await ai.models.generateContentStream({
          model: modelName,
          contents: formattedContents,
          config: modelConfig,
        });
      },
      model || 'gemini-3.8-flash'
    );

    for await (const chunk of streamResult) {
      const chunkText = chunk.text || '';
      const grounding = chunk.candidates?.[0]?.groundingMetadata;
      const searchChunks = grounding?.groundingChunks || [];
      const searchQueries = grounding?.webSearchQueries || [];

      const payload = {
        text: chunkText,
        searchChunks,
        searchQueries,
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini API stream error:', error);
    const errorMessage = error?.message || 'Errore nella generazione della risposta con Gemini';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Dedicated Problem Decomposition & Step-by-Step Solver
app.post('/api/decompose', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Chiave API non configurata.' });
  }

  const { problem, domain = 'generale' } = req.body;

  if (!problem) {
    return res.status(400).json({ error: 'Il testo del problema è obbligatorio.' });
  }

  try {
    const prompt = `
Analizza e scomponi in profondità il seguente problema/quesito (${domain}):
"""
${problem}
"""

Fornisci una risposta rigorosa e strutturata con:
1. Scomposizione del problema in blocchi elementari indipendenti
2. Identificazione dei vincoli e delle criticità nascoste
3. Catena logica dei passaggi risolutivi (Passo 1, Passo 2, ...) con la logica sottesa a ciascuno
4. Soluzione completa ed ottimizzata
5. Strategia di verifica e autovalutazione
`;

    const response = await callWithRetry(
      async (modelName) => {
        const modelConfig: any = {
          systemInstruction: ADVANCED_REASONING_INSTRUCTIONS,
        };
        if (modelName === 'gemini-3.8-flash') {
          modelConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH,
          };
        }
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: modelConfig,
        });
      },
      'gemini-3.8-flash'
    );

    res.json({
      text: response.text,
      problem,
    });
  } catch (err: any) {
    console.error('Decompose error:', err);
    res.status(500).json({ error: err.message || 'Errore durante la scomposizione.' });
  }
});

// Vite integration / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini AI Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
