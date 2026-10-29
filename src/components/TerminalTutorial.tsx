import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface Step {
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { title: "Welcome to Samzen Terminal", description: "This is your professional institutional trading environment." },
  { title: "Real-Time Watchlist", description: "Monitor your favorite assets with live market syncing." },
  { title: "Advanced Charting", description: "Use our proprietary tools for deep market analysis." },
  { title: "One-Click Execution", description: "Execute trades instantly with precise risk management." },
];

export default function TerminalTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0E17] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        <h2 className="text-lg font-bold text-white mb-2">{STEPS[step].title}</h2>
        <p className="text-sm text-slate-300 mb-6">{STEPS[step].description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => <div key={i} className={`h-1.5 w-6 rounded-full ${i === step ? 'bg-[#00FF87]' : 'bg-white/10'}`} />)}
          </div>
          <div className="flex gap-2">
            {step > 0 && <button onClick={() => setStep(step - 1)} className="p-2 rounded-xl bg-white/5"><ChevronLeft className="w-4 h-4 text-white" /></button>}
            <button 
                onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : onClose()} 
                className="px-4 py-2 rounded-xl bg-[#00FF87] text-[#0A0E17] font-bold text-xs"
            >
              {step < STEPS.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
