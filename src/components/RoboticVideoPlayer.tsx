import React, { useState, useEffect, useRef } from 'react';
import { Topic } from '../types';
import { 
  Play, Pause, Volume2, RotateCcw, Cpu, Radio, Sparkles, 
  Tv, MessageSquare, Terminal, HelpCircle, FastForward, Sliders, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoboticVideoPlayerProps {
  topic: Topic;
}

export default function RoboticVideoPlayer({ topic }: RoboticVideoPlayerProps) {
  // Parse video duration (e.g. "18:45" -> 1125 seconds)
  const durationStr = topic.videoDuration || '15:00';
  const parts = durationStr.split(':');
  const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');

  // Playback state
  const [videoPlayMode, setVideoPlayMode] = useState<'robotic' | 'youtube'>('youtube');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [voiceMode, setVoiceMode] = useState<'nanosynth' | 'cybertron' | 'neura-echo'>('nanosynth');
  const [pitch, setPitch] = useState<number>(55); // 10 to 90
  const [showVoiceControl, setShowVoiceControl] = useState<boolean>(false);
  const [videoLanguage, setVideoLanguage] = useState<'english' | 'hindi'>('english');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to extract clean youtube embed URL
  const getRealVideoEmbedUrl = () => {
    if (topic.videoUrl && topic.videoUrl.trim() !== '') {
      let url = topic.videoUrl.trim();
      if (url.includes('youtube.com/watch?v=')) {
        const vidId = url.split('v=')[1]?.split('&')[0];
        if (vidId) return `https://www.youtube.com/embed/${vidId}`;
      } else if (url.includes('youtu.be/')) {
        const vidId = url.split('youtu.be/')[1]?.split('?')[0];
        if (vidId) return `https://www.youtube.com/embed/${vidId}`;
      } else if (url.includes('embed/')) {
        return url;
      }
      return url;
    }

    const id = topic.id;
    if (id.includes('stocks-beg')) {
      return 'https://www.youtube.com/embed/Xn7K97_797M'; // Stock market for beginners
    } else if (id.includes('stocks-int')) {
      return 'https://www.youtube.com/embed/G6jWbN_Zf6I'; // Moving averages technical
    } else if (id.includes('stocks-adv')) {
      return 'https://www.youtube.com/embed/gTWhTst-W64'; // Fibonacci retracement
    } else if (id.includes('forex-beg')) {
      return 'https://www.youtube.com/embed/8I_Fv7jQ8sc'; // What is forex
    } else if (id.includes('forex-int')) {
      return 'https://www.youtube.com/embed/q_2m40-WjBw'; // Economic Calendars
    } else if (id.includes('forex-adv')) {
      return 'https://www.youtube.com/embed/SOfbJzVPhXk'; // SMC smart money concepts
    } else if (id.includes('crypto-beg')) {
      return 'https://www.youtube.com/embed/1YyAzVmP9xQ'; // Bitcoin/crypto beginners
    } else if (id.includes('crypto-int')) {
      return 'https://www.youtube.com/embed/gSpzXm8UreE'; // Crypto market cycles
    } else if (id.includes('crypto-adv')) {
      return 'https://www.youtube.com/embed/gU9G4_GidpA'; // Crypto On-chain analytics
    }

    return 'https://www.youtube.com/embed/Xn7K97_797M';
  };

  // Restart video when topic changes
  useEffect(() => {
    setIsPlaying(false);
    setElapsed(0);
  }, [topic]);

  // Handle play interval matching selected speed
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, totalSeconds]);

  // Real-time Robot Voice Sound Synthesizer using Web Audio API (Telemetry backup)
  const playRoboticSound = (type: 'chirp' | 'hum' | 'bleep') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const baseFreq = 160 + (pitch * 3); // modulate frequency based on pitch slider
      
      if (type === 'chirp') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } else if (type === 'bleep') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq * 1.6, ctx.currentTime);
        osc.frequency.setValueAtTime(baseFreq * 0.9, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(baseFreq - 20, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // AudioContext may be blocked before interaction, ignore gracefully
    }
  };

  // Speaks the robotic subtitles dynamically using browser TTS (Speech Synthesis)
  useEffect(() => {
    if (videoPlayMode === 'robotic' && isPlaying && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // kill overlapping speech
      
      const subtitleText = getSubtitles().replace(/🎙️\s*\[.*?\]:\s*/, '').replace(/🤖\s*\[.*?\]:\s*/, '');
      const utterance = new SpeechSynthesisUtterance(subtitleText);
      
      // Select appropriate language locale
      utterance.lang = videoLanguage === 'hindi' ? 'hi-IN' : 'en-US';
      
      // Customize speech factors based on user control panel inputs
      utterance.rate = speed * 1.05; // speed maps to speech rate
      utterance.pitch = pitch / 50; // pitch maps to speech pitch
      
      window.speechSynthesis.speak(utterance);
      
      // Play a mechanical beep sequence corresponding to the subtitle change
      playRoboticSound('chirp');
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [elapsed, isPlaying, videoLanguage, speed, pitch, videoPlayMode]);

  // Format helper (e.g. 125 -> "02:05")
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const percentComplete = (elapsed / totalSeconds) * 100;

  // Robotic Dialogue Subtitles database matching current playback fraction and language choice
  const getSubtitles = () => {
    const progressFraction = elapsed / totalSeconds;
    
    if (videoLanguage === 'hindi') {
      if (progressFraction === 0) {
        return "🎙️ [सिस्टम स्टैंडबाय]: व्याख्यान वीडियो शुरू करने के लिए PLAY दबाएं।";
      }
      if (progressFraction < 0.1) {
        return `🎙️ [AI रोबोटिक व्याख्याकार]: विषय: "${topic.title}" पर लाइव वीडियो शिक्षण लोडिंग पूरी हुई।`;
      }
      if (progressFraction < 0.25) {
        return `🎙️ [AI रोबोटिक व्याख्याकार]: हमेशा मैक्रो बाजार संरचना का विश्लेषण करें। रीटेल नुकसान को सीमित करने के लिए सही लिक्विडिटी ज़ोन की पहचान करना महत्वपूर्ण है।`;
      }
      if (progressFraction < 0.45) {
        return `🎙️ [AI रोबोटिक व्याख्याकार]: चार्ट पर जब बायर्स मजबूत वॉल्यूम के साथ आते हैं, तब ऑर्डर ब्लॉक बनते हैं। कंसोलिडेशन रेंज में जोखिम न लें।`;
      }
      if (progressFraction < 0.65) {
        return `🎙️ [AI रोबोटिक व्याख्याकार]: इस शिक्षण वीडियो में दिख रहे चार्ट विज़ुअलाइज़र को देखें। यहाँ बड़े संस्थान सक्रिय रूप से अपनी पोजीशंस बना रहे हैं।`;
      }
      if (progressFraction < 0.8) {
        return `🎙️ [AI रोबोटिक व्याख्याकार]: प्रत्येक पोजीशन पर अपनी कुल पूंजी का केवल 1% जोखिम में डालें और स्टॉप-लॉस का कड़ाई से पालन करें।`;
      }
      if (progressFraction < 0.95) {
        return `🎙️ [AI रोबोटिक व्याख्याकार]: निष्कर्ष में, हमेशा बड़े बाजार रुझान और केंद्रीय बैंकों के फैसले के अनुसार रणनीतिक ब्रेकआउट का इंतजार करें।`;
      }
      return `🎙️ [AI रोबोटिक व्याख्याकार]: यह शिक्षण व्याख्यान समाप्त हुआ। कृपया अध्ययन नोट्स पढ़ें और क्विज़ का प्रयास करें।`;
    }

    // Default English
    if (progressFraction === 0) {
      return "🎙️ [System Standby]: Press PLAY to start the AI Robotic teaching masterclass.";
    }
    if (progressFraction < 0.1) {
      return `🎙️ [AI Robotic Voice]: Initializing high-definition training video on: "${topic.title}". Loading core mechanics...`;
    }
    if (progressFraction < 0.25) {
      return `🎙️ [AI Robotic Voice]: Always evaluate the macro market structure first. Under sovereign rules, identifying high-density liquidity zones minimizes trade execution drag.`;
    }
    if (progressFraction < 0.45) {
      return `🎙️ [AI Robotic Voice]: Observe market volumes. Strong buy bids crossing ask spreads forge stable institutional order blocks. Avoid placing risk in thin ranges.`;
    }
    if (progressFraction < 0.65) {
      return `🎙️ [AI Robotic Voice]: Notice the live simulation charts on the video monitor. This visual wave reflects institutional transaction fill cycles.`;
    }
    if (progressFraction < 0.8) {
      return `🎙️ [AI Robotic Voice]: Enforce a maximum risk limit of 1% of total capital per trade and keep defensive stop-losses out of high-imbalance zones.`;
    }
    if (progressFraction < 0.95) {
      return `🎙️ [AI Robotic Voice]: In summary, follow sovereign trends, calculate pip/lot spreads, and wait for true sweeps before executing high-conviction orders.`;
    }
    return `🎙️ [AI Robotic Voice]: Training lecture complete. Please review the detailed study notes and take the topic quiz to verify retention.`;
  };

  // Color scheme based on voice mode
  const getThemeColor = () => {
    switch (voiceMode) {
      case 'cybertron': return '#06B6D4'; // cyan
      case 'neura-echo': return '#8B5CF6'; // violet
      default: return '#05D59E'; // signature mint green
    }
  };

  const activeColor = getThemeColor();

  // Dynamically renders the core teaching video matching the topic and course
  const renderTeachingVideoScreen = () => {
    if (videoPlayMode === 'youtube') {
      return (
        <div className="relative w-full h-72 md:h-80 bg-black border-2 border-black rounded overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={getRealVideoEmbedUrl()}
            title={topic.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    const progressFraction = elapsed / totalSeconds;
    const isHindi = videoLanguage === 'hindi';
    const isCrypto = topic.id.includes('crypto');
    const isForex = topic.id.includes('forex');
    const isStocks = topic.id.includes('stocks') || (!isCrypto && !isForex);

    // Dynamic price wave pulse when video is playing
    const amplitude = isPlaying ? 1 + Math.sin(elapsed * 1.8) * 0.4 : 1;

    return (
      <div 
        onClick={() => setIsPlaying(!isPlaying)}
        className="relative w-full h-72 md:h-80 bg-[#0D0D0D] border-2 border-black rounded overflow-hidden shadow-[inset_0px_0px_25px_rgba(0,0,0,0.95)] flex flex-col justify-between cursor-pointer select-none group"
      >
        {/* CRT Scanline overlay effect to make it feel like a real tech monitor video */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />

        {/* Ambient color reflection glow */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 pointer-events-none opacity-15"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${activeColor} 0%, transparent 60%)`
          }}
        />

        {/* Prominent centered Play button overlay when video is paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 transition-all duration-300">
            <div 
              className="w-16 h-16 rounded-full border-4 border-white bg-black/60 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-110 active:scale-95 transition-all duration-200"
              style={{ borderColor: activeColor }}
            >
              <Play className="w-8 h-8 text-white fill-white ml-1" style={{ color: activeColor, fill: activeColor }} />
            </div>
            <span className="mt-3.5 text-[10px] font-mono tracking-widest text-white font-bold uppercase bg-black/80 px-3 py-1.5 rounded border border-white/20 animate-pulse">
              {isHindi ? 'व्याख्यान वीडियो चलाने के लिए क्लिक करें' : 'Click to Play Lecture Video'}
            </span>
          </div>
        )}

        {/* Top HUD metrics on the video monitor */}
        <div className="p-3 bg-black/50 border-b border-white/5 flex justify-between items-center z-10 font-mono text-[9px] text-white/50">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span>COURSE STREAM: {isStocks ? 'STOCKS_MARKET_ACADEMY' : isForex ? 'GLOBAL_FOREX_LIQUIDITY' : 'DECENTRALIZED_CRYPTO_LAB'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline bg-white/10 px-1 rounded">1080P PRO</span>
            <span style={{ color: activeColor }} className="font-bold">VOICE MODE: {voiceMode.toUpperCase()} ({speed}x)</span>
          </div>
        </div>

        {/* MAIN VIDEO CONTENT GRAPHICS */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-around p-4 gap-4 z-10 overflow-hidden">
          
          {/* Left Block: Animated Live Teaching Chart Screen */}
          <div className="w-full md:w-3/5 h-full bg-black/60 border border-white/10 rounded p-2.5 flex flex-col justify-between relative">
            <div className="flex justify-between items-center text-[9px] font-mono text-white/40 border-b border-white/5 pb-1">
              <span className="text-white font-bold">{isHindi ? 'विषय' : 'Topic'}: {topic.title}</span>
              <span style={{ color: activeColor }} className="font-bold animate-pulse">● {isPlaying ? 'STREAMING' : 'PAUSED'}</span>
            </div>

            {/* Dynamic visual representation based on topic course type */}
            <div className="flex-grow flex items-center justify-center my-1.5 relative min-h-[110px]">
              {isStocks && (
                /* Candlestick technical visualizer */
                <div className="w-full h-full flex flex-col justify-between p-1">
                  <div className="text-[8px] font-mono text-emerald-400 flex justify-between">
                    <span>Stock Price: ₹3,124.80</span>
                    <span>EMA(9): ₹3,118.50</span>
                  </div>
                  
                  {/* Candlesticks structure */}
                  <div className="flex items-end justify-around h-16 px-2 relative pt-2">
                    <div className="absolute inset-x-0 top-1/2 border-t border-white/5 pointer-events-none" />
                    
                    {/* Candle 1 */}
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-3 bg-emerald-500" />
                      <div className="w-3 h-6 bg-emerald-950/90 border border-emerald-400 rounded-sm" />
                      <div className="w-0.5 h-3 bg-emerald-500" />
                    </div>
                    {/* Candle 2 */}
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-2 bg-emerald-500" />
                      <div className="w-3 h-10 bg-emerald-950/90 border border-emerald-400 rounded-sm" />
                      <div className="w-0.5 h-2 bg-emerald-500" />
                    </div>
                    {/* Candle 3 */}
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-rose-500" />
                      <div className="w-3 h-5 bg-rose-950/90 border border-rose-500 rounded-sm" />
                      <div className="w-0.5 h-4 bg-rose-500" />
                    </div>
                    {/* Candle 4 (Actively pulses/fluctuates as lecture plays) */}
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-emerald-500" />
                      <div 
                        className="w-3 bg-emerald-950/90 border border-emerald-400 rounded-sm transition-all duration-300" 
                        style={{ height: `${16 + (amplitude * 12)}px` }}
                      />
                      <div className="w-0.5 h-3 bg-emerald-500" />
                    </div>
                  </div>
                  
                  <div className="text-[7px] font-mono text-white/40 text-center uppercase tracking-wide">
                    {isHindi ? 'सिम्युलेटेड कैंडलस्टिक चार्ट सेटअप' : 'Simulated Technical Candlestick setup'}
                  </div>
                </div>
              )}

              {isForex && (
                /* Forex Exchange curves and currency indicators */
                <div className="w-full h-full flex flex-col justify-around p-1">
                  <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono">
                    <div className="bg-white/5 p-1 rounded border border-white/10 flex justify-between">
                      <span className="text-white/60">USD/INR</span>
                      <span className="text-emerald-400 font-bold">83.450 ▲</span>
                    </div>
                    <div className="bg-white/5 p-1 rounded border border-white/10 flex justify-between">
                      <span className="text-white/60">EUR/USD</span>
                      <span className="text-rose-400 font-bold">1.0724 ▼</span>
                    </div>
                  </div>
                  
                  {/* Floating waves represent active voice waves */}
                  <div className="h-10 w-full bg-black/40 rounded border border-white/5 relative overflow-hidden flex items-center">
                    <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 20">
                      <path 
                        d={`M 0,10 Q 20,${6 + Math.sin(elapsed) * 4} 40,${14 - Math.cos(elapsed) * 4} T 80,${8 + Math.sin(elapsed * 1.5) * 5} T 100,10`}
                        fill="none"
                        stroke={activeColor}
                        strokeWidth="1.2"
                      />
                    </svg>
                    <span className="text-[7px] font-mono text-white/30 mx-auto uppercase">Active Liquidity Order Spreads</span>
                  </div>
                </div>
              )}

              {isCrypto && (
                /* Crypto blockchain validation blocks and node models */
                <div className="w-full h-full flex flex-col justify-between p-1">
                  <div className="text-[8px] font-mono text-cyan-400 flex justify-between">
                    <span>CONSENSUS: PROOF-OF-STAKE</span>
                    <span>BLOCK: #{920401 + Math.floor(elapsed / 10)}</span>
                  </div>
                  
                  <div className="flex justify-center items-center gap-1.5 h-12 my-1">
                    <div className="px-2 py-1 border border-cyan-500/30 bg-cyan-950/20 rounded text-[8px] font-mono text-cyan-300">
                      Block {920400}
                    </div>
                    <span className="text-white/30">➜</span>
                    <div className="px-2 py-1 border border-purple-500/30 bg-[#8B5CF6]/10 rounded text-[8px] font-mono text-purple-300 animate-pulse">
                      Block {920401}
                    </div>
                  </div>

                  <span className="text-[7px] font-mono text-center text-white/30 uppercase">
                    Blockchain Consensus & Cryptographic ledger stream
                  </span>
                </div>
              )}
            </div>

            {/* Slide explanation subtitles HUD */}
            <div className="p-1.5 bg-black/40 border-t border-white/5 rounded text-[8px] font-mono text-white/50">
              {isHindi ? 'लाइव शिक्षण विषय-बिंदु: ' : 'Live Teaching Topic-Point: '}
              <span className="text-white font-sans">
                {progressFraction < 0.33 
                  ? (isHindi ? 'मूल संरचना और नियामक प्रणाली को डिकोड करना।' : 'Analyzing core market frameworks & regulations.')
                  : progressFraction < 0.66
                    ? (isHindi ? 'वॉल्यूम ऑर्डर बुक और ऐतिहासिक चार्ट विश्लेषण।' : 'Inspecting chart setups and order volumes.')
                    : (isHindi ? 'सख्त जोखिम नियम और पूंजी संरक्षण प्रणाली।' : 'Applying maximum capital loss protections.')
                }
              </span>
            </div>
          </div>

          {/* Right Block: Live Teacher Slide Deck Presentation Outline */}
          <div className="w-full md:w-2/5 h-full bg-black/30 border border-white/5 rounded p-2.5 flex flex-col justify-between text-xs font-sans">
            <div className="border-b border-white/10 pb-1 text-[9px] font-mono text-white/40 flex justify-between">
              <span>LECTURE DECK OUTLINE</span>
              <span style={{ color: activeColor }} className="font-bold">SLIDES</span>
            </div>

            <div className="flex-grow space-y-1.5 py-2">
              <div className={`p-1.5 rounded transition ${progressFraction < 0.33 ? 'bg-white/10 border border-white/10 text-white font-bold' : 'opacity-30 text-white/70'}`}>
                <div className="text-[8px] font-mono uppercase tracking-wider text-rose-400">Phase 1</div>
                <div className="text-[9px] font-serif leading-tight">
                  {isHindi ? '१. सैद्धांतिक बुनियादी नियम' : '1. Core Foundations'}
                </div>
              </div>

              <div className={`p-1.5 rounded transition ${progressFraction >= 0.33 && progressFraction < 0.66 ? 'bg-white/10 border border-white/10 text-white font-bold' : 'opacity-30 text-white/70'}`}>
                <div className="text-[8px] font-mono uppercase tracking-wider text-cyan-400">Phase 2</div>
                <div className="text-[9px] font-serif leading-tight">
                  {isHindi ? '२. मुख्य टेक्निकल चार्ट विश्लेषण' : '2. Chart Mechanics'}
                </div>
              </div>

              <div className={`p-1.5 rounded transition ${progressFraction >= 0.66 ? 'bg-white/10 border border-white/10 text-white font-bold' : 'opacity-30 text-white/70'}`}>
                <div className="text-[8px] font-mono uppercase tracking-wider text-emerald-400">Phase 3</div>
                <div className="text-[9px] font-serif leading-tight">
                  {isHindi ? '३. अनुशासित रिस्क मैनेजमेंट' : '3. Risk Guardrails'}
                </div>
              </div>
            </div>

            <div className="text-[7px] font-mono text-white/40 border-t border-white/5 pt-1 text-center">
              ROBOTIC TEXT-TO-SPEECH TRANSMITTER ACTIVE
            </div>
          </div>
        </div>

        {/* Dynamic Voice Waveform Oscilloscope Visualizer underneath teaching screen */}
        <div className="bg-black border-t border-white/5 p-2 flex items-center justify-between z-10">
          <span className="text-[8px] font-mono text-white/40 uppercase">Voice Waveform Response:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => {
              const h = isPlaying ? Math.floor(4 + Math.random() * 22) : 3;
              return (
                <div 
                  key={bar}
                  className="w-1 bg-white/80 rounded-t transition-all duration-150"
                  style={{ height: `${h}px`, backgroundColor: activeColor }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="robotic-video-player-container" className="bg-[#1A1A1A] border-2 border-black rounded shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] overflow-hidden">
      
      {/* Play Mode Switcher Bar */}
      <div className="bg-black text-white px-4 py-2.5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-mono">
        <span className="text-[#05D59E] font-bold tracking-wider">ACTIVE COURSE STREAM:</span>
        <div className="flex bg-white/10 p-0.5 rounded border border-white/15">
          <button
            type="button"
            onClick={() => {
              setVideoPlayMode('youtube');
              setIsPlaying(false);
            }}
            className={`px-3 py-1 text-[10px] font-bold rounded transition ${videoPlayMode === 'youtube' ? 'bg-[#05D59E] text-[#0F172A]' : 'text-white/70 hover:text-white'}`}
          >
            Lecture Video Masterclass
          </button>
          <button
            type="button"
            onClick={() => setVideoPlayMode('robotic')}
            className={`px-3 py-1 text-[10px] font-bold rounded transition ${videoPlayMode === 'robotic' ? 'bg-[#05D59E] text-[#0F172A]' : 'text-white/70 hover:text-white'}`}
          >
            🤖 AI Robotic Coach (Vocal)
          </button>
        </div>
      </div>

      {/* Title bar of the Video Terminal */}
      <div className="bg-[#1A1A1A] text-white px-4 py-2 border-b-2 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5" style={{ color: activeColor }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
            {videoPlayMode === 'youtube' ? 'High-Definition Lecture Video Screen' : 'AI Vocal Lecture & Trading Screen'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Main Video Monitor */}
      <div className="p-4 bg-[#151515] border-b-2 border-black">
        {renderTeachingVideoScreen()}
      </div>

      {/* Subtitles Overlay bar under video */}
      <div className="bg-white/95 text-black px-4 py-3 border-b-2 border-black flex items-start gap-2.5">
        <Volume2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: activeColor }} />
        <div className="flex-1 space-y-1">
          <p className="text-[#1A1A1A] text-xs font-mono leading-relaxed italic select-none">
            {getSubtitles()}
          </p>
          <div className="flex justify-between items-center text-[8px] font-mono text-black/40">
            <span>TRANSLATION TRACK: {videoLanguage === 'english' ? 'ENG (United Kingdom)' : 'HIN (भारत)'}</span>
            <span className="animate-pulse font-bold text-emerald-800">Synthesizing vocal wave via Web Speech API</span>
          </div>
        </div>
      </div>

      {/* Video controls tray */}
      <div className="bg-[#1A1A1A] p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Progress Timeline Slider with Elapsed AND Remaining Times */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:flex-1">
          <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-2 text-[10px] font-mono text-white/80 shrink-0">
            <span className="bg-black/40 px-2 py-1 rounded border border-white/5">
              Time: {formatTime(elapsed)}
            </span>
            <span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-[#05D59E]">
              Remaining: {formatTime(totalSeconds - elapsed)}
            </span>
          </div>
          
          <div className="relative flex-1 w-full group">
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-150" 
                style={{ width: `${percentComplete}%`, backgroundColor: activeColor }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={totalSeconds}
              value={elapsed}
              onChange={(e) => setElapsed(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[10px] font-mono text-white/50 shrink-0">Duration: {topic.videoDuration}</span>
        </div>

        {/* Action button container */}
        <div className="flex flex-wrap items-center gap-4 shrink-0 justify-between w-full lg:w-auto">
          
          {/* Playback speed selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-white/40 font-bold uppercase">Speed:</span>
            <div className="flex border border-white/20 rounded overflow-hidden">
              {([0.5, 1, 1.25, 1.5, 1.75, 2] as const).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSpeed(sp)}
                  className={`px-2 py-1 text-[9px] font-mono font-bold transition-all ${speed === sp ? 'bg-white text-black' : 'bg-transparent text-white/60 hover:text-white'}`}
                  title={`Play at ${sp}x speed`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          {/* Voice select triggers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowVoiceControl(!showVoiceControl)}
              className="px-2.5 py-1.5 rounded border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-[9px] font-mono font-bold flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" style={{ color: activeColor }} />
              <span>Synth Voices</span>
            </button>

            {/* Language Selection */}
            <div className="flex items-center gap-1 bg-[#151515] p-0.5 rounded border border-white/15">
              <button
                onClick={() => setVideoLanguage('english')}
                className={`px-2 py-1 text-[9px] font-mono font-bold rounded flex items-center gap-1 transition ${videoLanguage === 'english' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
              >
                ENG
              </button>
              <button
                onClick={() => setVideoLanguage('hindi')}
                className={`px-2 py-1 text-[9px] font-mono font-bold rounded flex items-center gap-1 transition ${videoLanguage === 'hindi' ? 'bg-[#05D59E] text-[#0F172A]' : 'text-white/60 hover:text-white'}`}
              >
                HIN
              </button>
            </div>
          </div>

          {/* Voice Tuning Sliders Popup */}
          <AnimatePresence>
            {showVoiceControl && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute bottom-full right-0 mb-4 w-48 bg-[#151515] border-2 border-black rounded p-3.5 z-30 shadow-2xl space-y-3"
              >
                <div>
                  <span className="block text-[8px] font-mono font-black text-white/40 uppercase pb-1.5 border-b border-white/5 mb-1.5">SELECT SYNTH ENGINE</span>
                  {[
                    { id: 'nanosynth', label: 'NanoSynth 🟢', color: '#10B981' },
                    { id: 'cybertron', label: 'CyberTron 🔵', color: '#06B6D4' },
                    { id: 'neura-echo', label: 'NeuraEcho 🟣', color: '#8B5CF6' }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setVoiceMode(v.id as any);
                        setShowVoiceControl(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-[10px] font-mono rounded transition-colors ${voiceMode === v.id ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      style={{ borderLeft: `3px solid ${v.color}` }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-2">
                  <div className="flex justify-between items-center text-[9px] font-mono text-white/70 mb-1">
                    <span>Vocal Pitch</span>
                    <span>{pitch}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={pitch}
                    onChange={(e) => setPitch(parseInt(e.target.value))}
                    className="w-full h-1 bg-black/50 rounded appearance-none cursor-pointer"
                    style={{ accentColor: activeColor }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Play / Pause buttons */}
          <div className="flex gap-2 items-center ml-auto lg:ml-0">
            <button
              onClick={() => {
                setElapsed(0);
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="p-2 rounded bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition border border-white/10"
              title="Reset Video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (isPlaying && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="px-5 py-2 rounded text-black font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
              style={{ backgroundColor: activeColor }}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-black" />
                  <span>Pause Lecture</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-black fill-black" />
                  <span>Play Lecture</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
