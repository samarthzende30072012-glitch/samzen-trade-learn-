import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export default function AIChatbot({ theme }: { theme: 'dark' | 'light' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Hello! I am your Samzen AI Trading Assistant. How can I help you analyze markets or understand trading concepts today?' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Mock AI response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `I've analyzed your query about "${input}". As an AI assistant for TradeLearn, I suggest looking into our "Smart Money Concepts" module to better understand institutional order flow for this asset.`
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-105 active:scale-95 ${
          isLight
            ? 'bg-emerald-600 text-white shadow-emerald-500/30'
            : 'bg-[#00FF87] text-[#0A0E17] shadow-[0_0_20px_rgba(0,255,135,0.4)]'
        }`}
      >
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] rounded-3xl border shadow-2xl z-50 flex flex-col overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#00FF87]/10 text-[#00FF87]'}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <span className={`font-bold font-mono text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Samzen AI Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="opacity-50 hover:opacity-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-mono leading-relaxed ${
                    m.sender === 'user'
                      ? (isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17]')
                      : (isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#1A2535] text-slate-200')
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className={`p-4 border-t flex items-center gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/10'
            }`}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className={`flex-grow p-2 rounded-xl border focus:outline-none text-xs font-mono ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-[#0A0E17] border-white/15 text-white'
                }`}
              />
              <button
                onClick={handleSend}
                className={`p-2 rounded-xl transition ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
