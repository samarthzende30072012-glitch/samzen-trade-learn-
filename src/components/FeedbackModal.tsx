import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export default function FeedbackModal({ isOpen, onClose, theme }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const isLight = theme === 'light';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Support & Feedback</h2>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-5 h-5" /></button>
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="How can we help? Or share your feedback..."
          className={`w-full h-32 p-3 rounded-xl border mb-4 text-xs font-mono focus:outline-none ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-[#121A28] border-white/15 text-white'
          }`}
        />
        <button
          onClick={() => {
            alert('Feedback submitted! Thank you.');
            onClose();
          }}
          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${
            isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Request
        </button>
      </div>
    </div>
  );
}
