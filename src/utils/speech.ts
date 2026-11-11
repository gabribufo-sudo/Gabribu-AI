// Speech Synthesis & Recognition Utilities

export class SpeechAssistant {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static isSpeaking = false;

  static speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (!this.synth) return;

    this.stop();

    // Clean text of markdown and html tags for clean speaking
    const cleanText = text
      .replace(/<[^>]+>/g, '')
      .replace(/```[\s\S]*?```/g, 'Codice sorgente omesso.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#]/g, '')
      .slice(0, 1500); // limit spoken chunk for responsiveness

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'it-IT';
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;

    // Try to find an Italian voice
    const voices = this.synth.getVoices();
    const italianVoice = voices.find((v) => v.lang.startsWith('it'));
    if (italianVoice) {
      utterance.voice = italianVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      options?.onError?.();
    };

    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  static getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

// Web Speech API Voice Dictation
export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onError: (err: any) => void,
  onEnd: () => void
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        onResult(final, true);
      } else if (interim) {
        onResult(interim, false);
      }
    };

    recognition.onerror = (e: any) => {
      onError(e);
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (e) {
    console.error('Speech recognition init error:', e);
    return null;
  }
}
