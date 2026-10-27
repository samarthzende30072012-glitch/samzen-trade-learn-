import React, { useState } from 'react';
import { QuizQuestion, UserProfile } from '../types';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizSectionProps {
  quizId?: string;
  questions?: QuizQuestion[];
  onComplete?: (scorePercentage: number) => void;
  level?: string;
  user?: UserProfile | null;
  onUpdateUser?: (updatedProfile: UserProfile) => void;
}

const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'default-1',
    question: 'What does a bullish candlestick with a long lower shadow indicate?',
    options: [
      'Strong selling pressure that persisted until the close',
      'Buyers pushed price back up after sellers pushed it lower',
      'Market consolidation with zero volume',
      'Imminent trend reversal to the downside'
    ],
    correctAnswerIndex: 1,
    explanation: 'A long lower wick (shadow) shows that sellers attempted to push prices down, but buyers stepped in aggressively to drive prices back up before the period closed.'
  },
  {
    id: 'default-2',
    question: 'What is the primary objective of Risk-to-Reward Ratio in trading?',
    options: [
      'To guarantee a 100% win rate on all trades',
      'To balance potential loss against potential gain on every position',
      'To eliminate stop loss orders completely',
      'To leverage 100x on high-volatility crypto assets'
    ],
    correctAnswerIndex: 1,
    explanation: 'A favorable Risk-to-Reward ratio (e.g. 1:2 or 1:3) ensures your profitable trades yield significantly more than your losing trades, maintaining long-term profitability even with a modest win rate.'
  },
  {
    id: 'default-3',
    question: 'Which indicator measures market momentum using overbought (>70) and oversold (<30) thresholds?',
    options: [
      'Moving Average Convergence Divergence (MACD)',
      'Relative Strength Index (RSI)',
      'Bollinger Bands',
      'Volume Weighted Average Price (VWAP)'
    ],
    correctAnswerIndex: 1,
    explanation: 'RSI (Relative Strength Index) oscillates between 0 and 100, where values above 70 typically indicate overbought conditions and below 30 indicate oversold conditions.'
  }
];

export default function QuizSection({ 
  quizId = 'general-trading-quiz', 
  questions = DEFAULT_QUIZ_QUESTIONS, 
  onComplete = () => {}, 
  level = 'beginner',
  user,
  onUpdateUser
}: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answersStatus, setAnswersStatus] = useState<boolean[]>([]); // true for correct, false for incorrect
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
    setIsFullscreen(true); // Automatically enter full screen for a immersive exam layout
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    
    setAnswersStatus((prev) => [...prev, isCorrect]);
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      const finalScorePercentage = Math.round((score / questions.length) * 100);
      onComplete(finalScorePercentage);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setAnswersStatus([]);
    setScore(0);
    setQuizFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center p-6 bg-[#151D2A] rounded border border-white/10/10">
        <p className="text-slate-300 font-serif">No quiz questions available for this topic yet.</p>
      </div>
    );
  }

  const renderQuizContent = () => {
    if (quizFinished) {
      const scorePercentage = Math.round((score / questions.length) * 100);
      const passed = scorePercentage >= 70;

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0E1726] border-2 border-white/10 rounded p-8 text-center max-w-lg mx-auto shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] w-full"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#05D59E]/10 border border-[#05D59E]/20 text-[#05D59E] mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-bold text-white mb-2">Quiz Completed!</h3>
          <p className="text-slate-300 text-sm mb-6">
            You scored <strong className="text-[#05D59E] font-mono text-lg">{scorePercentage}%</strong> ({score}/{questions.length} questions correct)
          </p>

          <div className="bg-[#151D2A] rounded p-4 border border-white/10/10 text-left space-y-2 mb-6">
            <h4 className="text-xs font-mono font-bold text-[#05D59E] uppercase tracking-wider">Topic Performance Report</h4>
            <div className="flex gap-1">
              {answersStatus.map((status, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 flex-1 rounded ${status ? 'bg-emerald-600' : 'bg-rose-500'}`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-200 mt-2">
              {passed ? '🎉 Congratulations! You have fully mastered this topic and can proceed ahead!' : '💡 We recommend reviewing this topic\'s content again to score at least 70%.'}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-4 py-2 border border-white/10/20 hover:bg-[#151D2A] rounded text-white text-sm font-bold transition-all animate-pulse"
            >
              <RotateCcw className="w-4 h-4 text-[#05D59E]" />
              <span>Retake Quiz</span>
            </button>
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 bg-[#0F172A] text-white hover:bg-[#0F172A]/90 rounded text-sm font-bold"
              >
                Exit Fullscreen
              </button>
            )}
          </div>
        </motion.div>
      );
    }

    return (
      <div className="bg-[#0E1726] border-2 border-white/10 rounded overflow-hidden max-w-2xl mx-auto shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] w-full">
        {/* Progress Header */}
        <div className="bg-[#151D2A] border-b border-white/10/10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300 font-medium uppercase tracking-wider">
              Topic Quiz
            </span>
            {level && (
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${level === 'advanced' ? 'bg-rose-100 text-rose-800 border border-rose-200' : level === 'intermediate' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                {level} Level
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-[10px] font-mono font-black text-white bg-[#0E1726] border border-white/10/15 px-2.5 py-1 rounded shadow-sm hover:bg-slate-50 transition"
            >
              {isFullscreen ? '✕ Normal Mode' : '⛶ Fullscreen Exam'}
            </button>
            <span className="text-xs font-mono font-bold bg-[#0F172A]/5 text-white px-2 py-1 rounded">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-[#0F172A]/5">
          <div 
            className="h-full bg-[#05D59E] transition-all duration-300"
            style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Question Text */}
          <h4 className="text-base md:text-lg font-serif font-bold text-white leading-relaxed">
            {currentQuestion.question}
          </h4>

          {/* Options List */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let optionStyle = "border-white/10/20 bg-[#0E1726] text-white hover:bg-[#151D2A] hover:border-black";
              
              if (selectedOption === index) {
                optionStyle = "border-[#05D59E] bg-[#05D59E]/5 text-[#05D59E] font-bold shadow-[2px_2px_0px_0px_rgba(5,213,158,0.15)]";
              }

              if (isSubmitted) {
                if (index === currentQuestion.correctAnswerIndex) {
                  optionStyle = "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold";
                } else if (selectedOption === index) {
                  optionStyle = "border-rose-500 bg-rose-50 text-rose-700 font-bold";
                } else {
                  optionStyle = "border-white/10/10 bg-[#151D2A]/30 text-slate-400 cursor-not-allowed";
                }
              }

              return (
                <button
                  key={index}
                  disabled={isSubmitted}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full p-4 rounded border text-left text-sm font-medium transition-all flex items-center justify-between ${optionStyle}`}
                >
                  <span>{option}</span>
                  {isSubmitted && index === currentQuestion.correctAnswerIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                  )}
                  {isSubmitted && selectedOption === index && index !== currentQuestion.correctAnswerIndex && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Alert */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded border text-xs leading-relaxed ${selectedOption === currentQuestion.correctAnswerIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
              >
                <strong className="font-semibold block mb-1">
                  {selectedOption === currentQuestion.correctAnswerIndex ? '✓ Correct Answer!' : '✗ Incorrect'}
                </strong>
                {currentQuestion.explanation}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer controls */}
          <div className="flex justify-between items-center pt-2">
            <div>
              {isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="text-xs text-white/60 hover:text-white font-mono"
                >
                  ✕ Close Fullscreen
                </button>
              )}
            </div>
            {!isSubmitted ? (
              <button
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className={`px-5 py-2.5 rounded font-bold text-sm transition-all duration-150 ${selectedOption !== null ? 'bg-[#05D59E] hover:bg-[#0F172A] hover:text-[#05D59E] text-white cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' : 'bg-[#151D2A] text-white/30 border border-white/10/10 cursor-not-allowed'}`}
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="bg-[#05D59E] hover:bg-[#0F172A] hover:text-[#05D59E] text-white px-5 py-2.5 rounded font-bold text-sm flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all duration-150"
              >
                <span>{currentQuestionIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-[#0F172A]/98 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl flex justify-end mb-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-4 py-2 bg-[#0E1726]/15 hover:bg-[#0E1726]/25 text-white rounded font-mono text-xs font-bold border border-white/20 transition"
          >
            ✕ Close Fullscreen Exam
          </button>
        </div>
        {renderQuizContent()}
      </div>
    );
  }

  return renderQuizContent();
}
