import React, { useState } from 'react';
import { UserProfile } from '../types';
import { MASTERCLASS_MODULES, MasterclassModule } from '../data/masterclassBlueprints';
import { 
  BookOpen, ArrowLeft, CheckCircle, Clock, ShieldCheck, 
  Lock, Download, Sparkles, ChevronRight, Play, Award, 
  HelpCircle, Copy, Check, Printer, FileText, ArrowRight,
  Zap, Flame, TrendingUp, BarChart2, Star, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LearningDashboardProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onBackToHome: () => void;
  onLaunchTerminal: () => void;
  onOpenUpgradeModal: () => void;
  theme: 'dark' | 'light';
}

export default function LearningDashboard({
  user,
  onUpdateUser,
  onBackToHome,
  onLaunchTerminal,
  onOpenUpgradeModal,
  theme
}: LearningDashboardProps) {
  const isLight = theme === 'light';
  const isPro = user.proTier !== null;

  // Selected topic for the preview prompt
  const [selectedModuleId, setSelectedModuleId] = useState<string>(MASTERCLASS_MODULES[0].id);

  // Active study mode: if non-null, user is inside the deep masterclass reader!
  const [activeStudyModule, setActiveStudyModule] = useState<MasterclassModule | null>(null);

  // Completed modules set (stored in localStorage or user profile)
  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('samzen_completed_modules');
      return saved ? JSON.parse(saved) : ['market-fundamentals-candlestick-anatomy'];
    } catch {
      return ['market-fundamentals-candlestick-anatomy'];
    }
  });

  // Quiz state inside active reader
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);

  const selectedModule = MASTERCLASS_MODULES.find(m => m.id === selectedModuleId) || MASTERCLASS_MODULES[0];

  const handleMarkModuleComplete = (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      const next = [...completedModules, moduleId];
      setCompletedModules(next);
      localStorage.setItem('samzen_completed_modules', JSON.stringify(next));
    }
  };

  const handleDownloadBlueprint = (module: MasterclassModule) => {
    if (!isPro) {
      onOpenUpgradeModal();
      return;
    }
    // Pro users can trigger instant printing/PDF generation
    window.print();
  };

  const handleCopyFormula = (formulaStr: string) => {
    navigator.clipboard.writeText(formulaStr).then(() => {
      setCopiedFormula(true);
      setTimeout(() => setCopiedFormula(false), 2000);
    });
  };

  // -------------------------------------------------------------
  // DEEP STUDY VIEW: "Learn This Topic" Active Masterclass Reader
  // -------------------------------------------------------------
  if (activeStudyModule) {
    const isModuleDone = completedModules.includes(activeStudyModule.id);

    return (
      <div className={`min-h-screen py-6 px-4 sm:px-6 lg:px-8 transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0A0E17] text-white'
      }`}>
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Top Reader Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <button
              type="button"
              onClick={() => {
                setActiveStudyModule(null);
                setQuizAnswers({});
                setQuizSubmitted(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' 
                  : 'bg-[#121A28] border-white/15 text-slate-300 hover:text-white hover:bg-[#1E293B]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Modules</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Paywall Gated Download Button */}
              {isPro ? (
                <button
                  type="button"
                  onClick={() => handleDownloadBlueprint(activeStudyModule)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    isLight 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                      : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                  }`}
                  title="Export official printable blueprint PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Blueprint (Pro PDF)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                  }`}
                  title="Download locked for free tier. Upgrade to unlock."
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Notes (Pro Only)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLaunchTerminal}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  isLight 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-[#00F0FF] hover:bg-[#00d8e6] text-[#0A0E17] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Test in Simulator</span>
              </button>
            </div>
          </div>

          {/* Module Banner */}
          <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden shadow-2xl transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider mb-3 ${
              isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30'
            }`}>
              <Sparkles className="w-3 h-3" />
              <span>Module {activeStudyModule.moduleNumber} • {activeStudyModule.badge}</span>
            </div>

            <h1 className={`text-2xl sm:text-4xl font-serif font-black tracking-tight leading-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {activeStudyModule.title}
            </h1>
            <p className={`text-xs sm:text-sm font-mono mt-1 ${isLight ? 'text-blue-700' : 'text-[#00F0FF]'}`}>
              {activeStudyModule.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {activeStudyModule.durationMinutes} min in-depth read
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Difficulty: {activeStudyModule.difficulty}
              </span>
              {isModuleDone && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Learning Objectives Box */}
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-[#00FF87]/5 border-[#00FF87]/20'
          }`}>
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-emerald-900' : 'text-[#00FF87]'
            }`}>
              <Award className="w-4 h-4" />
              Core Institutional Mastery Objectives
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activeStudyModule.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`font-bold mt-0.5 ${isLight ? 'text-emerald-700' : 'text-[#00FF87]'}`}>✓</span>
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mathematical Formula Callout if any */}
          {activeStudyModule.formula && (
            <div className={`p-6 rounded-2xl border space-y-3 ${
              isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-[#0E1A2D] border-blue-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isLight ? 'text-blue-900' : 'text-[#00F0FF]'
                }`}>
                  <BarChart2 className="w-4 h-4" />
                  Mathematical Blueprint: {activeStudyModule.formula.name}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyFormula(activeStudyModule.formula!.expression)}
                  className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition ${
                    isLight 
                      ? 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100' 
                      : 'bg-[#152338] border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Copy formula"
                >
                  {copiedFormula ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{copiedFormula ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className={`p-4 rounded-xl font-mono font-black text-sm sm:text-base border ${
                isLight ? 'bg-white border-blue-200 text-blue-950' : 'bg-[#0A101D] border-blue-500/30 text-[#00F0FF]'
              }`}>
                {activeStudyModule.formula.expression}
              </div>

              <div className="space-y-1.5 text-xs">
                {activeStudyModule.formula.variables.map((v, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono font-bold text-emerald-500 shrink-0">• {v.symbol}:</span>
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{v.meaning}</span>
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isLight ? 'bg-white/80 border-blue-200 text-slate-700' : 'bg-black/30 border-white/5 text-slate-300'
              }`}>
                <strong className={`block uppercase font-mono text-[10px] tracking-wider mb-1 ${
                  isLight ? 'text-blue-800' : 'text-blue-300'
                }`}>
                  Practical Institutional Calculation:
                </strong>
                {activeStudyModule.formula.example}
              </div>
            </div>
          )}

          {/* Main Comprehensive Written Sections */}
          <div className="space-y-6">
            {activeStudyModule.sections.map((section, idx) => (
              <div
                key={idx}
                className={`p-6 sm:p-8 rounded-3xl border space-y-4 shadow-lg transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
                }`}
              >
                <h2 className={`text-lg sm:text-xl font-serif font-bold flex items-center gap-2.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-[#00FF87]'}`} />
                  {section.title}
                </h2>

                <div className={`space-y-3 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {section.content.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                {section.bulletChecklist && (
                  <div className={`p-4 rounded-2xl border space-y-2 text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
                  }`}>
                    <span className={`font-bold uppercase tracking-wider block ${
                      isLight ? 'text-slate-900' : 'text-[#00FF87]'
                    }`}>
                      Tactical Checklist:
                    </span>
                    {section.bulletChecklist.map((item, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {section.callout && (
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                    section.callout.type === 'warning'
                      ? isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : section.callout.type === 'rule'
                      ? isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : isLight ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                  }`}>
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-mono font-bold uppercase text-[10px] tracking-wider mb-1">
                        {section.callout.title}
                      </strong>
                      <p>{section.callout.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Takeaways */}
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-3 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-gradient-to-r from-[#0E1726] to-[#0A0E17] border-[#00FF87]/30'
          }`}>
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-[#00FF87]'
            }`}>
              <ShieldCheck className="w-4 h-4" />
              Non-Negotiable Institutional Takeaways
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              {activeStudyModule.keyTakeaways.map((takeaway, tIdx) => (
                <li key={tIdx} className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Comprehension Quiz for this Module */}
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className={`text-lg font-serif font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Module Comprehension Check
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Verify your understanding of institutional rules before simulator testing
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-[#00FF87]/15 text-[#00FF87]'
              }`}>
                {activeStudyModule.quizQuestions.length} Questions
              </span>
            </div>

            <div className="space-y-6">
              {activeStudyModule.quizQuestions.map((q, qIdx) => {
                const userAns = quizAnswers[qIdx];
                const isSelected = userAns !== undefined;

                return (
                  <div key={qIdx} className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
                  }`}>
                    <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isChosen = userAns === oIdx;
                        const isCorrect = q.correctIndex === oIdx;

                        let btnStyle = isLight
                          ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-[#151D2A] hover:bg-[#1E293B] border-white/10 text-slate-300';

                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold';
                          } else if (isChosen && !isCorrect) {
                            btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-400 line-through';
                          }
                        } else if (isChosen) {
                          btnStyle = isLight 
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold' 
                            : 'bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87] font-bold';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                          >
                            <span className="font-bold opacity-60">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${
                        userAns === q.correctIndex
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!quizSubmitted ? (
              <button
                type="button"
                onClick={() => setQuizSubmitted(true)}
                disabled={Object.keys(quizAnswers).length < activeStudyModule.quizQuestions.length}
                className={`w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                  Object.keys(quizAnswers).length === activeStudyModule.quizQuestions.length
                    ? isLight 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' 
                      : 'bg-[#00FF87] text-[#0A0E17] hover:bg-[#00e577] shadow-[0_0_20px_rgba(0,255,135,0.4)]'
                    : 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-white/5'
                }`}
              >
                Submit Answers & Check Understanding
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  ✓ Comprehension Verified!
                </span>

                <button
                  type="button"
                  onClick={() => handleMarkModuleComplete(activeStudyModule.id)}
                  className={`px-6 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                    isLight ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-[#151D2A] text-white hover:bg-[#1E293B] border border-white/10'
                  }`}
                >
                  Mark Module as Completed
                </button>
              </div>
            )}
          </div>

          {/* Transition to Simulator Testing Ground */}
          <div className={`p-8 rounded-3xl border text-center space-y-4 shadow-xl ${
            isLight ? 'bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200' : 'bg-gradient-to-r from-[#0A0E17] via-[#0E1726] to-[#0A0E17] border-white/10'
          }`}>
            <h3 className={`text-xl sm:text-2xl font-serif font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Ready to Test This Knowledge in Real Time?
            </h3>
            <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Put the concepts of <strong>{activeStudyModule.title}</strong> into practice with ₹1,00,000 in virtual capital on our institutional charting terminal.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onLaunchTerminal}
                className={`px-8 py-4 rounded-2xl font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 mx-auto cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-[#00FF87] to-[#00F0FF] text-[#0A0E17] shadow-[0_0_25px_rgba(0,255,135,0.4)]'
                }`}
              >
                <TrendingUp className="w-4 h-4 stroke-[3]" />
                <span>Launch Trading Simulator</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODULE 2: UNCLUTTERED LEARNING DASHBOARD & TOPIC NAVIGATION
  // Clean, minimalist, and completely uncomplicated layout!
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors ${
      isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#0A0E17] text-white'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Minimalist Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' 
                  : 'bg-[#121A28] border-white/15 text-slate-300 hover:text-white hover:bg-[#1E293B]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Academy Home</span>
            </button>

            <img
              src="/assets/aistudio/Samzen_Neon_Trading_Emblem_c452c366.png"
              alt="Samzen Neon Trading Emblem"
              className="w-10 h-10 rounded-xl object-cover shadow-lg border border-white/20 hidden sm:inline-block"
            />

            <div>
              <span className={`text-base font-serif font-black tracking-tight block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                SAMZEN <span className={isLight ? 'text-emerald-600' : 'text-[#00FF87]'}>LEARNING DASHBOARD</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-widest">
                Distraction-Free Institutional Syllabus
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPro ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-[#00FF87]/15 border-[#00FF87]/40 text-[#00FF87]'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pro Scholar (Downloads Unlocked)</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                  isLight 
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock All Downloads (Pro)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLaunchTerminal}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                isLight 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] shadow-[0_0_15px_rgba(0,255,135,0.3)]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>
          </div>
        </div>

        {/* Motivational Learning Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className={`text-3xl sm:text-4xl font-serif font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Master the Curriculum Step-by-Step
          </h1>
          <p className={`text-xs sm:text-sm font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Select any institutional module below. Each topic contains deep written blueprints, mathematical equations, and execution checklists designed for zero lag study.
          </p>
        </div>

        {/* DAILY TRADING MISSION SECTION */}
        {(() => {
          const uncompletedForMission = MASTERCLASS_MODULES.filter(m => !completedModules.includes(m.id));
          const todayIdx = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % MASTERCLASS_MODULES.length;
          const missionModule = uncompletedForMission.length > 0 ? uncompletedForMission[0] : MASTERCLASS_MODULES[todayIdx];
          const isDoneMission = completedModules.includes(missionModule.id);

          return (
            <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden shadow-2xl transition-colors ${
              isLight
                ? 'bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-emerald-300'
                : 'bg-gradient-to-r from-[#0E1726] via-[#121D2F] to-[#0A0E17] border-[#00FF87]/40 shadow-[0_0_30px_rgba(0,255,135,0.12)]'
            }`}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none bg-[#00FF87]/10" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>🎯 Daily Trading Mission</span>
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Curated for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className={`text-xl sm:text-2xl font-serif font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {missionModule.title}
                  </h3>

                  <p className={`text-xs sm:text-sm font-mono leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {missionModule.subtitle} • {missionModule.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                    <span className="flex items-center gap-1.5 opacity-80">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {missionModule.durationMinutes} min read
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      Level: {missionModule.difficulty}
                    </span>
                    {isDoneMission ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mission Completed Today
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Pending Mission
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModuleId(missionModule.id);
                      setActiveStudyModule(missionModule);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full md:w-auto px-8 py-4 rounded-2xl font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer ${
                      isLight
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                        : 'bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#00FF87] text-[#0A0E17] shadow-[0_0_25px_rgba(0,255,135,0.4)]'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 stroke-[2.5]" />
                    <span>Start Daily Mission</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2-Column Responsive Layout: Topic Grid (Left) + "Learn This Topic" Focus Stage (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: The 4 Core Required Educational Modules List (Col 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Institutional Modules (4 Required)
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {completedModules.length}/{MASTERCLASS_MODULES.length} Completed
              </span>
            </div>

            <div className="space-y-3">
              {MASTERCLASS_MODULES.map((module) => {
                const isSelected = selectedModuleId === module.id;
                const isDone = completedModules.includes(module.id);

                return (
                  <div
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? isLight
                          ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-[#121B2A] border-[#00FF87] shadow-[0_0_20px_rgba(0,255,135,0.15)] ring-1 ring-[#00FF87]/40'
                        : isLight
                        ? 'bg-white hover:bg-slate-50 border-slate-200'
                        : 'bg-[#0E1726] hover:bg-[#121B2A] border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300'
                          }`}>
                            Module 0{module.moduleNumber}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            • {module.durationMinutes} min
                          </span>
                        </div>
                        <h3 className={`text-base font-serif font-bold ${
                          isSelected
                            ? isLight ? 'text-emerald-700' : 'text-[#00FF87]'
                            : isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {module.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1 font-mono">
                          {module.subtitle}
                        </p>
                      </div>

                      {isDone ? (
                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0" title="Completed">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-white/5 text-slate-500 shrink-0">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/5">
                      <span className="text-slate-400 text-[11px]">{module.badge}</span>
                      <span className={`text-[11px] font-bold ${
                        isSelected 
                          ? isLight ? 'text-emerald-700' : 'text-[#00FF87]' 
                          : 'text-slate-400'
                      }`}>
                        {isSelected ? 'Currently Selected' : 'Click to inspect'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: The "Learn This Topic" Prompt & Preview Stage (Col 5) */}
          <div className="lg:col-span-5 sticky top-6">
            <div className={`p-6 sm:p-7 rounded-3xl border space-y-6 shadow-2xl transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="space-y-3 border-b border-white/10 pb-5">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-[#00FF87]/15 text-[#00FF87]'
                  }`}>
                    Module 0{selectedModule.moduleNumber} Preview
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedModule.durationMinutes} mins
                  </span>
                </div>

                <h2 className={`text-xl font-serif font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedModule.title}
                </h2>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {selectedModule.summary}
                </p>
              </div>

              {/* Highlights Checklist */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  What You Will Learn:
                </span>
                <ul className="space-y-2 text-xs">
                  {selectedModule.learningObjectives.slice(0, 3).map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Paywall Status Notice */}
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-mono ${
                isPro
                  ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {isPro ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>PDF Blueprints & Study Notes fully unlocked.</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Free online access. PDF study notes locked for Pro.</span>
                  </>
                )}
              </div>

              {/* THE PROMINENT "LEARN THIS TOPIC" ACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStudyModule(selectedModule);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full py-4 rounded-2xl font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    isLight
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                      : 'bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#00FF87] text-[#0A0E17] shadow-[0_0_25px_rgba(0,255,135,0.4)] ring-2 ring-[#00FF87]/30'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Learn This Topic</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Callout: Testing Ground Simulator */}
        <div className={`p-8 rounded-3xl border text-center space-y-4 shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-gradient-to-br from-[#0E1726] to-[#0A0E17] border-white/10'
        }`}>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
            isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/10 text-[#00F0FF] border border-blue-500/30'
          }`}>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Testing Ground</span>
          </div>

          <h2 className={`text-2xl font-serif font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Ready to Practice What You Have Learned?
          </h2>
          <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Experience live synchronized market prices for Stocks, Forex, and Crypto in our high-performance TradingView-style paper trading simulator.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onLaunchTerminal}
              className={`px-8 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer ${
                isLight 
                  ? 'bg-slate-900 hover:bg-black text-white' 
                  : 'bg-[#151D2A] hover:bg-[#1E293B] text-white border border-white/15'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Launch Trading Terminal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
