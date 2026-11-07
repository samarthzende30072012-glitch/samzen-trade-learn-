import React, { useState, useEffect } from 'react';
import { Topic } from '../types';
import { 
  BookOpen, CheckCircle, Clock, Copy, Check, Sparkles, 
  Lightbulb, AlertCircle, ArrowRight, Bookmark, Share2, Bot, 
  Volume2, Play, Pause, Square, ChevronDown, ChevronUp, Zap, HelpCircle
} from 'lucide-react';

interface ChapterNotesViewerProps {
  topic: Topic;
  isCompleted: boolean;
  onCompleteChapter: () => void;
}

export default function ChapterNotesViewer({
  topic,
  isCompleted,
  onCompleteChapter
}: ChapterNotesViewerProps) {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Audio Playback & Speech Synthesis State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechProgress, setSpeechProgress] = useState<number>(0);

  // AI Note Explainer State
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const wordCount = topic.content ? topic.content.split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadMinutes = Math.max(2, Math.ceil(wordCount / 180));

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [topic.id]);

  const handlePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }

    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanContent = topic.content
      .replace(/\[DIAGRAM:[^\]]+\]/g, '')
      .replace(/[#*`_]/g, '');

    const textToSpeak = `${topic.title}. ${topic.description}. ${cleanContent}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
      setSpeechProgress(10);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setSpeechProgress(100);
      setTimeout(() => setSpeechProgress(0), 1000);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setSpeechProgress(0);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.pause();
        setIsPlayingAudio(false);
        setIsPausedAudio(true);
      }
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setSpeechProgress(0);
    }
  };

  const handleChangeRate = (rate: number) => {
    setSpeechRate(rate);
    if (isPlayingAudio) {
      handleStopAudio();
      setTimeout(handlePlayAudio, 150);
    }
  };

  const handleCopyNotes = () => {
    const fullText = `${topic.title}\n${topic.description}\n\n${topic.content}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleExplainWithAi = async () => {
    if (aiExplanation) {
      setIsAiExplaining(!isAiExplaining);
      return;
    }

    setIsAiExplaining(true);
    setIsLoadingAi(true);

    try {
      const res = await fetch('/api/ai-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Explain this trading lesson clearly to a beginner in bullet points with institutional tips: Title: "${topic.title}", Content: "${topic.description}. ${topic.content.slice(0, 300)}"`
        })
      });
      const data = await res.json();
      if (data.reply) {
        setAiExplanation(data.reply);
      } else {
        setAiExplanation(
          `• Core Takeaway: ${topic.title} is designed to spot high-probability price behavior before the crowd.\n` +
          `• Risk Rule: Never enter without confirming stop-loss level below support.\n` +
          `• Institutional Edge: Watch for volume divergence when candles test key swing levels.`
        );
      }
    } catch {
      setAiExplanation(
        `• Core Takeaway: ${topic.title} enables you to read market supply and demand.\n` +
        `• Practice: Test this exact pattern in our Paper Trading Terminal with virtual ₹10,00,000 cash.\n` +
        `• Risk Discipline: Always target minimum 1:2 risk-to-reward ratio.`
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-xs md:text-sm leading-relaxed';
      case 'lg': return 'text-base md:text-lg leading-loose';
      default: return 'text-sm md:text-base leading-relaxed';
    }
  };

  // Render Visual Candlestick / Chart Pattern Diagram Poster
  const renderVisualPoster = (topicTitle: string) => {
    const titleLower = topicTitle.toLowerCase();

    if (titleLower.includes('candle') || titleLower.includes('price action')) {
      return (
        <div className="my-6 p-5 rounded-2xl bg-[#070B14] border-2 border-emerald-500/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-[#00FF87] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Educational Visual Diagram • Candlestick Anatomy
            </span>
            <span className="text-[10px] font-mono text-slate-400">Institutional Blueprint</span>
          </div>

          <div className="h-44 sm:h-52 w-full flex items-center justify-center gap-8 bg-gradient-to-b from-[#0A0E17] to-[#0E1726] rounded-xl border border-white/10 p-4">
            {/* Bullish Candle */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-emerald-400 font-bold mb-1">Bullish Candle</span>
              <div className="w-0.5 h-6 bg-emerald-400" />
              <div className="w-14 h-24 rounded bg-emerald-500/90 border-2 border-emerald-300 flex flex-col justify-between p-1 text-[9px] font-mono text-black font-bold text-center shadow-lg shadow-emerald-500/30">
                <span>CLOSE</span>
                <span>OPEN</span>
              </div>
              <div className="w-0.5 h-8 bg-emerald-400" />
              <span className="text-[9px] font-mono text-slate-400 mt-1">Lower Shadow / Wick</span>
            </div>

            {/* Bearish Candle */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-rose-400 font-bold mb-1">Bearish Candle</span>
              <div className="w-0.5 h-8 bg-rose-400" />
              <div className="w-14 h-24 rounded bg-rose-500/90 border-2 border-rose-300 flex flex-col justify-between p-1 text-[9px] font-mono text-white font-bold text-center shadow-lg shadow-rose-500/30">
                <span>OPEN</span>
                <span>CLOSE</span>
              </div>
              <div className="w-0.5 h-6 bg-rose-400" />
              <span className="text-[9px] font-mono text-slate-400 mt-1">Rejection Wick</span>
            </div>
          </div>
        </div>
      );
    }

    if (titleLower.includes('support') || titleLower.includes('resistance') || titleLower.includes('breakout')) {
      return (
        <div className="my-6 p-5 rounded-2xl bg-[#070B14] border-2 border-indigo-500/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Educational Visual Diagram • Key Level Breakout & Retest
            </span>
            <span className="text-[10px] font-mono text-slate-400">Order Block Zone</span>
          </div>

          <div className="h-44 sm:h-52 w-full flex flex-col justify-between bg-[#0A0E17] rounded-xl border border-white/10 p-4 relative overflow-hidden">
            <div className="border-b-2 border-dashed border-rose-500/60 pb-1 flex justify-between text-[10px] font-mono text-rose-400">
              <span>RESISTANCE ZONE (Major Supply)</span>
              <span>SELL LIQUIDITY</span>
            </div>

            {/* Svg path showing price impulse, breakout, retest, and expansion */}
            <svg className="w-full h-24 overflow-visible" viewBox="0 0 400 80">
              <polyline
                fill="none"
                stroke="#00FF87"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="20,70 60,35 110,65 170,25 220,10 260,25 340,5"
              />
              <circle cx="260" cy="25" r="5" fill="#00FF87" className="animate-ping" />
              <circle cx="260" cy="25" r="4" fill="#FFFFFF" />
            </svg>

            <div className="border-t-2 border-dashed border-emerald-500/60 pt-1 flex justify-between text-[10px] font-mono text-emerald-400">
              <span>SUPPORT ZONE (Demand Floor)</span>
              <span>CONFIRMED RETEST ENTRY ↗</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Helper to parse topic markdown content into cleanly formatted blocks
  const renderFormattedContent = (content: string) => {
    if (!content) {
      return (
        <p className="text-[#9DB0C8] italic">No detailed notes available for this topic yet.</p>
      );
    }

    const blocks = content.split('\n\n');

    return blocks.map((block, idx) => {
      const trimmed = block.trim();

      // Heading 3
      if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace('### ', '');
        return (
          <div key={idx} className="pt-4 pb-1 border-b border-white/10 mb-3">
            <h4 className="text-base md:text-lg font-heading font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF87]" />
              {titleText}
            </h4>
          </div>
        );
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace('## ', '');
        return (
          <div key={idx} className="pt-5 pb-2 border-b border-[#00FF87]/30 mb-4">
            <h3 className="text-lg md:text-xl font-heading font-extrabold text-[#00FF87] uppercase tracking-wide">
              {titleText}
            </h3>
          </div>
        );
      }

      // Unordered List
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').filter(Boolean);
        return (
          <ul key={idx} className="space-y-2.5 my-3 pl-2">
            {items.map((it, iIdx) => {
              const cleanItem = it.replace(/^[\*\-]\s*/, '');
              return (
                <li key={iIdx} className="flex items-start gap-2.5 text-slate-200">
                  <CheckCircle className="w-4 h-4 text-[#00FF87] shrink-0 mt-0.5" />
                  <span>{cleanItem}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // Numbered List
      if (/^\d+\./.test(trimmed)) {
        const items = trimmed.split('\n').filter(Boolean);
        return (
          <ol key={idx} className="space-y-2.5 my-3 pl-2">
            {items.map((it, iIdx) => {
              const cleanItem = it.replace(/^\d+\.\s*/, '');
              return (
                <li key={iIdx} className="flex items-start gap-3 text-slate-200">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-[#00FF87] text-[10px] font-mono font-bold shrink-0 mt-0.5 border border-emerald-500/40">
                    {iIdx + 1}
                  </span>
                  <span>{cleanItem}</span>
                </li>
              );
            })}
          </ol>
        );
      }

      // Callout: Pro Tip
      if (trimmed.toLowerCase().includes('pro tip:') || trimmed.toLowerCase().includes('rule of thumb:')) {
        return (
          <div key={idx} className="my-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#00FF87] shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-white leading-relaxed">
              <strong className="text-[#00FF87] block uppercase font-mono text-[10px] tracking-wider mb-1">
                Institutional Pro Insight
              </strong>
              {trimmed}
            </div>
          </div>
        );
      }

      // Callout: Warning
      if (trimmed.toLowerCase().includes('warning:') || trimmed.toLowerCase().includes('risk note:')) {
        return (
          <div key={idx} className="my-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-rose-100 leading-relaxed">
              <strong className="text-rose-400 block uppercase font-mono text-[10px] tracking-wider mb-1">
                Risk Management Protocol
              </strong>
              {trimmed}
            </div>
          </div>
        );
      }

      // Regular Paragraph
      return (
        <p key={idx} className="text-slate-300 leading-relaxed mb-4">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-[#0B1220] border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white">
      {/* Chapter Overview Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#0E1726] to-[#070B14] border-b border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#00FF87] text-[10px] font-mono font-bold uppercase tracking-wider">
              DAY {topic.dayIndex + 1} SYLLABUS
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-400 text-[10px] font-mono flex items-center gap-1.5 border border-white/5">
              <Clock className="w-3 h-3 text-[#00FF87]" />
              ~{estimatedReadMinutes} min read
            </span>
          </div>

          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              LESSON COMPLETED
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl md:text-3xl font-serif font-black text-white tracking-tight">
            {topic.title}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 italic font-sans">
            {topic.description}
          </p>
        </div>

        {/* AUDIO PLAYBACK / TEXT-TO-SPEECH CONTROL BAR */}
        <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/30 flex items-center justify-center text-[#00FF87]">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white block">
                  Listen to Lesson (Text-To-Speech Audio)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Study on the go with clear audio narration
                </span>
              </div>
            </div>

            {/* Play / Pause / Stop Buttons */}
            <div className="flex items-center gap-2">
              {!isPlayingAudio ? (
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="px-4 py-2 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPausedAudio ? 'Resume' : 'Play Audio'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseAudio}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              {(isPlayingAudio || isPausedAudio) && (
                <button
                  type="button"
                  onClick={handleStopAudio}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-mono text-xs transition cursor-pointer"
                  title="Stop audio"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}

              {/* Speed Selector */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[10px] font-mono">
                {[1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleChangeRate(rate)}
                    className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                      speechRate === rate ? 'bg-[#00FF87] text-[#0A0E17] font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Animated Wave Indicator when playing */}
          {isPlayingAudio && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-emerald-400">Audio Narration Active:</span>
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-1 bg-[#00FF87] h-2 animate-pulse" />
                <span className="w-1 bg-[#00FF87] h-3 animate-ping" />
                <span className="w-1 bg-[#00FF87] h-1 animate-pulse" />
                <span className="w-1 bg-[#00FF87] h-3 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Font Size, AI Explainer & Copy */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase">Font:</span>
            {(['sm', 'base', 'lg'] as const).map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition cursor-pointer ${
                  fontSize === size 
                    ? 'bg-[#00FF87] text-[#0A0E17] font-bold shadow' 
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExplainWithAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold transition cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAiExplaining ? 'Hide AI Explainer' : 'Explain with AI'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* AI Note Explainer Expandable Box */}
        {isAiExplaining && (
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                AI Smart Concept Breakdown
              </span>
              <button
                type="button"
                onClick={() => setIsAiExplaining(false)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {isLoadingAi ? (
              <p className="text-xs font-mono text-purple-200 animate-pulse">
                Analyzing chapter content and structuring simplified institutional breakdown...
              </p>
            ) : (
              <div className="text-xs text-purple-100 font-sans leading-relaxed whitespace-pre-line">
                {aiExplanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded Visual Poster & Diagrams */}
      <div className="px-6 md:px-8">
        {renderVisualPoster(topic.title)}
      </div>

      {/* Chapter Body Content with Large Typography */}
      <div className={`p-6 md:p-8 space-y-4 font-sans ${getFontSizeClass()}`}>
        {renderFormattedContent(topic.content)}
      </div>

      {/* Key Takeaways Box */}
      <div className="mx-6 md:mx-8 mb-6 p-5 rounded-2xl bg-[#070B14] border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00FF87] uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#00FF87]" />
          Key Chapter Takeaways
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 font-sans">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#00FF87] shrink-0 mt-0.5" />
            <span>Always pair pattern identification with higher-timeframe market structure.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#00FF87] shrink-0 mt-0.5" />
            <span>Verify risk-to-reward ratio is at least 1:2 prior to entering any trade.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#00FF87] shrink-0 mt-0.5" />
            <span>Never move your stop-loss further away while a trade is running.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#00FF87] shrink-0 mt-0.5" />
            <span>Practice this lesson in the Paper Trading Terminal with virtual cash.</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-[#0E1726] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          {isCompleted ? (
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> You have completed this lesson.
            </span>
          ) : (
            <span>Finished reading or listening? Mark this masterclass lesson completed.</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isCompleted && (
            <button
              type="button"
              onClick={onCompleteChapter}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Lesson Studied</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
