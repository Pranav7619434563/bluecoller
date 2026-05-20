import { useState, useEffect, useCallback } from 'react';

export const LANG_CONFIG = {
  english: {
    label:       'English',
    speechLang:  'en-IN',   // SpeechRecognition (voice input)
    ttsLang:     'en-IN',   // SpeechSynthesis (voice output)
    placeholder: 'Type your message...',
    voiceKeywords: ['english', 'en-IN', 'en-US', 'en-GB']
  },
  hindi: {
    label:       'हिंदी',
    speechLang:  'hi-IN',
    ttsLang:     'hi-IN',
    placeholder: 'अपना संदेश लिखें...',
    voiceKeywords: ['hindi', 'hi-IN', 'हिंदी']
  },
  kannada: {
    label:       'ಕನ್ನಡ',
    speechLang:  'kn-IN',
    ttsLang:     'kn-IN',
    placeholder: 'ನಿಮ್ಮ ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...',
    voiceKeywords: ['kannada', 'kn-IN', 'ಕನ್ನಡ']
  }
};

export function useVoice(
  selectedLanguage: 'english' | 'hindi' | 'kannada',
  onTranscript: (text: string) => void,
  setInput: (text: string) => void
) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Load voices eagerly so they are ready
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input not supported. Please use Google Chrome.');
      return;
    }

    const config = LANG_CONFIG[selectedLanguage] || LANG_CONFIG['english'];
    const recognition = new SpeechRecognition();

    recognition.lang             = config.speechLang; // ← THIS matches selection
    recognition.interimResults   = false;
    recognition.maxAlternatives  = 1;
    recognition.continuous       = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript); // text appears in spoken script
      onTranscript(transcript); // auto-submits message
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert('Microphone access is blocked! Please click the camera/mic icon in the browser address bar to allow microphone access.');
      }
    };

    recognition.start();
  }, [selectedLanguage, onTranscript, setInput]);

  const speakText = useCallback((text: string, language: 'english' | 'hindi' | 'kannada', forcePlay = false) => {
    if (typeof window === 'undefined') return;

    // Cancel any ongoing speech first
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Clean up fallback audio player
    const existingAudio = document.getElementById('voice-fallback-audio') as HTMLAudioElement;
    if (existingAudio) {
      existingAudio.pause();
      existingAudio.remove();
    }

    if (isMuted && !forcePlay) return; // respect mute toggle

    const config = LANG_CONFIG[language] || LANG_CONFIG['english'];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = config.ttsLang;
    utterance.rate  = 0.88;
    utterance.pitch = 1;

    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      
      const getLangCode = (l: string) => l.toLowerCase().replace('_', '-').split('-')[0];
      const targetPrefix = getLangCode(config.ttsLang); // 'en', 'hi', 'kn'

      // Step 1: Try exact lang match ignoring hyphens/underscores
      let voice = voices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        return vLang === config.ttsLang.toLowerCase();
      });

      // Step 2: Try 2-letter prefix match (e.g. 'hi', 'kn')
      if (!voice) {
        voice = voices.find(v => {
          const vPrefix = getLangCode(v.lang);
          return vPrefix === targetPrefix;
        });
      }

      // Step 3: Try keyword match from voiceKeywords list
      if (!voice) {
        voice = voices.find(v =>
          config.voiceKeywords.some(kw =>
            v.lang.toLowerCase().includes(kw.toLowerCase()) ||
            v.name.toLowerCase().includes(kw.toLowerCase())
          )
        );
      }

      // Step 4: Use found voice if present
      if (voice) {
        utterance.voice = voice;
      }

      // Hybrid Fallback for Kannada cloud voice if no native voice is installed
      if (!voice && language === 'kannada') {
        console.log("No native Kannada voice found. Falling back to Google Cloud TTS.");
        try {
          const audio = document.createElement('audio');
          audio.id = 'voice-fallback-audio';
          audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=kn&client=tw-ob&q=${encodeURIComponent(text)}`;
          audio.play().catch(err => {
            console.warn("Autoplay audio blocked by browser policy.", err);
          });
          document.body.appendChild(audio);
          return;
        } catch (err) {
          console.error("Cloud TTS failed:", err);
        }
      }

      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet — wait if needed
    if (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceAndSpeak();
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted && typeof window !== 'undefined') {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        const existingAudio = document.getElementById('voice-fallback-audio') as HTMLAudioElement;
        if (existingAudio) {
          existingAudio.pause();
          existingAudio.remove();
        }
      }
      return newMuted;
    });
  }, []);

  return {
    isRecording: isListening,
    isMuted,
    startListening,
    speakText,
    toggleMute,
  };
}
