import React, { useState } from 'react';
import { Topic } from '../types';
import { 
  BookOpen, CheckCircle, Clock, Copy, Check, Sparkles, 
  Lightbulb, AlertCircle, ArrowRight, Bookmark, Share2
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

  const wordCount = topic.content ? topic.content.split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadMinutes = Math.max(2, Math.ceil(wordCount / 180));

  const handleCopyNotes = () => {
    const fullText = `${topic.title}\n${topic.description}\n\n${topic.content}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-xs md:text-sm leading-relaxed';
      case 'lg': return 'text-base md:text-lg leading-loose';
      default: return 'text-sm md:text-base leading-relaxed';
    }
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
          <div key={idx} className="pt-4 pb-1 border-b border-[#1D2A3E] mb-3">
            <h4 className="text-base md:text-lg font-heading font-bold text-[#EEF3FA] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#59E3FF]" />
              {titleText}
            </h4>
          </div>
        );
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace('## ', '');
        return (
          <div key={idx} className="pt-5 pb-2 border-b border-[#3DA9FC]/30 mb-4">
            <h3 className="text-lg md:text-xl font-heading font-extrabold text-[#59E3FF] uppercase tracking-wide">
              {titleText}
            </h3>
          </div>
        );
      }

      // Unordered List (* item)
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').filter(Boolean);
        return (
          <ul key={idx} className="space-y-2.5 my-3 pl-2">
            {items.map((it, iIdx) => {
              const cleanItem = it.replace(/^[\*\-]\s*/, '');
              return (
                <li key={iIdx} className="flex items-start gap-2.5 text-[#D1DCEB]">
                  <CheckCircle className="w-4 h-4 text-[#3DA9FC] shrink-0 mt-0.5" />
                  <span>{cleanItem}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // Numbered List (1. item)
      if (/^\d+\./.test(trimmed)) {
        const items = trimmed.split('\n').filter(Boolean);
        return (
          <ol key={idx} className="space-y-2.5 my-3 pl-2">
            {items.map((it, iIdx) => {
              const cleanItem = it.replace(/^\d+\.\s*/, '');
              return (
                <li key={iIdx} className="flex items-start gap-3 text-[#D1DCEB]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#3DA9FC]/20 text-[#59E3FF] text-[10px] font-mono font-bold shrink-0 mt-0.5 border border-[#3DA9FC]/40">
                    {iIdx + 1}
                  </span>
                  <span>{cleanItem}</span>
                </li>
              );
            })}
          </ol>
        );
      }

      // Pro Tip or Warning Callout
      if (trimmed.toLowerCase().includes('pro tip:') || trimmed.toLowerCase().includes('rule of thumb:')) {
        return (
          <div key={idx} className="my-4 p-4 rounded-xl bg-[#3DA9FC]/10 border border-[#3DA9FC]/30 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#59E3FF] shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-[#EEF3FA] leading-relaxed">
              <strong className="text-[#59E3FF] block uppercase font-mono text-[10px] tracking-wider mb-1">
                Institutional Pro Insight
              </strong>
              {trimmed}
            </div>
          </div>
        );
      }

      if (trimmed.toLowerCase().includes('warning:') || trimmed.toLowerCase().includes('risk note:')) {
        return (
          <div key={idx} className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-amber-100 leading-relaxed">
              <strong className="text-amber-400 block uppercase font-mono text-[10px] tracking-wider mb-1">
                Risk Management Alert
              </strong>
              {trimmed}
            </div>
          </div>
        );
      }

      // Regular Paragraph
      return (
        <p key={idx} className="text-[#B5C6DE] leading-relaxed mb-4">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-[#0B1220] border border-[#1D2A3E] rounded-2xl overflow-hidden shadow-xl text-[#EEF3FA]">
      
      {/* Chapter Overview Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#0E1726] to-[#070B14] border-b border-[#1D2A3E] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#3DA9FC]/15 border border-[#3DA9FC]/30 text-[#59E3FF] text-[10px] font-mono font-bold uppercase tracking-wider">
              DAY {topic.dayIndex + 1} SYLLABUS
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1D2A3E] text-[#9DB0C8] text-[10px] font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#59E3FF]" />
              ~{estimatedReadMinutes} min read
            </span>
          </div>

          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              TOPIC COMPLETED
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-heading font-extrabold text-[#EEF3FA] tracking-tight">
            {topic.title}
          </h2>
          <p className="text-xs md:text-sm text-[#9DB0C8] mt-1 italic">
            {topic.description}
          </p>
        </div>

        {/* Toolbar: Font Size & Copy */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1D2A3E]/60 text-xs text-[#9DB0C8]">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#9DB0C8] uppercase mr-1">Font:</span>
            {(['sm', 'base', 'lg'] as const).map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition ${
                  fontSize === size 
                    ? 'bg-[#3DA9FC] text-[#070B14] font-bold' 
                    : 'bg-[#1D2A3E] text-[#9DB0C8] hover:text-[#EEF3FA]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyNotes}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1D2A3E] hover:bg-[#25364F] text-[#EEF3FA] font-mono text-[11px] transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#59E3FF]" />
                <span>Copy Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chapter Body Content */}
      <div className={`p-6 md:p-8 space-y-4 ${getFontSizeClass()}`}>
        {renderFormattedContent(topic.content)}
      </div>

      {/* Key Takeaways Box */}
      <div className="mx-6 md:mx-8 mb-6 p-5 rounded-xl bg-[#070B14] border border-[#1D2A3E] space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#59E3FF] uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#59E3FF]" />
          Key Chapter Takeaways
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#9DB0C8]">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#3DA9FC] shrink-0 mt-0.5" />
            <span>Always pair pattern identification with higher-timeframe market structure.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#3DA9FC] shrink-0 mt-0.5" />
            <span>Verify risk-to-reward ratio is at least 1:2 prior to entering any trade.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#3DA9FC] shrink-0 mt-0.5" />
            <span>Never move your stop-loss further away while a trade is running.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#3DA9FC] shrink-0 mt-0.5" />
            <span>Journal every trade execution to analyze win rate and emotional control.</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-[#0E1726] border-t border-[#1D2A3E] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#9DB0C8]">
          {isCompleted ? (
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> You have already completed this masterclass lesson.
            </span>
          ) : (
            <span>Ready to test your comprehension? Mark completed or take the topic quiz.</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isCompleted && (
            <button
              type="button"
              onClick={onCompleteChapter}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3DA9FC] to-[#59E3FF] hover:brightness-110 text-[#070B14] font-heading font-extrabold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Lesson as Studied
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
