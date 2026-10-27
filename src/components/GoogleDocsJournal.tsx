import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  FileText, Plus, ExternalLink, RefreshCw, Trash2, CheckCircle, 
  AlertCircle, BookOpen, Download, Share2, Eye, Shield, Sparkles, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createGoogleDoc, 
  listGoogleDocs, 
  getGoogleDocContent, 
  deleteGoogleDoc, 
  GoogleDocItem 
} from '../services/googleDocs';
import { 
  getAccessToken, 
  signInWithGoogle, 
  listNotesFromFirestore, 
  saveNoteToFirestore, 
  deleteNoteFromFirestore, 
  FirestoreTradeNote 
} from '../services/firebase';

interface GoogleDocsJournalProps {
  user: UserProfile;
}

export default function GoogleDocsJournal({ user }: GoogleDocsJournalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [docsList, setDocsList] = useState<GoogleDocItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Firestore Notes State
  const [notes, setNotes] = useState<FirestoreTradeNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('Trade Analysis');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Doc Preview Drawer State
  const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string; text: string; link: string } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Global Notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check token on mount
  useEffect(() => {
    getAccessToken().then((t) => {
      setToken(t);
      if (t) {
        fetchDocs(t);
      }
    });
    fetchFirestoreNotes();
  }, [user.email]);

  const fetchFirestoreNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const remoteNotes = await listNotesFromFirestore(user.email);
      setNotes(remoteNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (e: any) {
      console.warn('Could not fetch Firestore notes:', e);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const fetchDocs = async (accessToken: string) => {
    setIsLoadingDocs(true);
    try {
      const items = await listGoogleDocs(accessToken);
      setDocsList(items);
    } catch (err: any) {
      console.warn('Error fetching Google Docs:', err);
      if (err.message?.includes('401') || err.message?.includes('token')) {
        setToken(null);
      }
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setNotice(null);
    try {
      const result = await signInWithGoogle();
      if (result.accessToken) {
        setToken(result.accessToken);
        fetchDocs(result.accessToken);
        setNotice({ type: 'success', message: 'Connected successfully to Google Docs!' });
      }
    } catch (err: any) {
      console.error('Google connect error:', err);
      setNotice({ type: 'error', message: err.message || 'Could not connect to Google Docs.' });
    } finally {
      setIsConnecting(false);
    }
  };

  // Create & Save Note to Cloud Firestore
  const handleSaveFirestoreNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSavingNote(true);
    try {
      const note: FirestoreTradeNote = {
        id: `note-${Date.now()}`,
        userId: user.email,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: [newTag],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveNoteToFirestore(user.email, note);
      setNotes((prev) => [note, ...prev]);
      setNewTitle('');
      setNewContent('');
      setNotice({ type: 'success', message: 'Note saved securely to Cloud Firestore.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to save note to Firestore.' });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Export Note to Google Doc
  const handleExportNoteToDoc = async (note: FirestoreTradeNote) => {
    if (!token) {
      handleConnectGoogle();
      return;
    }

    setNotice(null);
    try {
      const docHeader = `SZTRADE LEARN • A PROJECT BY SAMZEN • TRADE JOURNAL NOTE\nTitle: ${note.title}\nDate: ${new Date(note.updatedAt).toLocaleDateString()}\nTags: ${(note.tags || []).join(', ')}\n\n`;
      const fullBody = docHeader + note.content;

      const created = await createGoogleDoc(token, `[Trade Note] ${note.title}`, fullBody);
      
      // Update note in Firestore with doc reference
      const updatedNote: FirestoreTradeNote = {
        ...note,
        googleDocId: created.id,
        googleDocUrl: created.webViewLink,
        updatedAt: new Date().toISOString()
      };
      await saveNoteToFirestore(user.email, updatedNote);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updatedNote : n)));

      fetchDocs(token);
      setNotice({
        type: 'success',
        message: `Successfully exported to Google Docs! Document "${created.title}" is ready.`
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setNotice({ type: 'error', message: err.message || 'Failed to export note to Google Docs.' });
    }
  };

  // 1-Click Institutional Template Export
  const handleCreateTemplateDoc = async (templateType: 'syllabus' | 'risk' | 'journal') => {
    if (!token) {
      handleConnectGoogle();
      return;
    }

    let title = 'SZTrade Learn Guide';
    let body = '';

    if (templateType === 'syllabus') {
      title = 'SZTrade Learn • Core Masterclass Syllabus';
      body = `INSTITUTIONAL FINANCIAL TRADING SYLLABUS & RULES\n\n` +
        `SECTION 1: MARKET STRUCTURE & PRICE ACTION\n` +
        `• Candlestick Geometry: Wicks represent liquidity probes; bodies represent committed volume.\n` +
        `• Trend Identification: Higher Highs + Higher Lows = Bullish market structure.\n` +
        `• Support & Resistance Zones: Historical institutional demand/supply barriers.\n\n` +
        `SECTION 2: TECHNICAL INDICATORS\n` +
        `• Relative Strength Index (RSI): Momentum oscillator. >70 Overbought, <30 Oversold.\n` +
        `• Exponential Moving Averages (20 & 50 EMA): Dynamic support/resistance in trending legs.\n` +
        `• Fibonacci Retracement: High-probability entry zones (0.500 & 0.618 Golden Pocket).\n\n` +
        `SECTION 3: EXECUTION CHECKLIST\n` +
        `1. Identify HTF (Higher Timeframe) macro trend.\n` +
        `2. Mark liquidity pools and order blocks.\n` +
        `3. Define Stop Loss BEFORE entering order.\n` +
        `4. Ensure minimum 1:2 Risk to Reward Ratio.`;
    } else if (templateType === 'risk') {
      title = 'Institutional Risk Management & Capital Rules';
      body = `CAPITAL PRESERVATION PROTOCOL\n\n` +
        `Rule 1: Never risk more than 1% to 2% of total capital on a single trade setup.\n` +
        `Rule 2: Position Size Formula: Position Size = (Account Capital × Risk %) / (Entry Price - Stop Loss Price).\n` +
        `Rule 3: Daily Stop-Limit: If 3 consecutive trades hit stop-loss, shut down terminal for the trading day.\n` +
        `Rule 4: Avoid revenge trading at all costs.\n` +
        `Rule 5: Take partial profits at 1.5R and move stop to break-even.`;
    } else {
      title = 'Trade Journal & Execution Log Template';
      body = `DAILY TRADE EXECUTION LOG\n\n` +
        `Date: _________________________\n` +
        `Asset / Symbol: ________________\n` +
        `Order Type (BUY/SELL): __________\n` +
        `Entry Price: __________________\n` +
        `Stop Loss Price: _______________\n` +
        `Target / Take Profit: ___________\n` +
        `Risk:Reward Ratio: _____________\n\n` +
        `SETUP REASONING:\n` +
        `• Technical Indicator Confirmation (RSI, EMA, Fib):\n` +
        `• Price Action Pattern:\n\n` +
        `POST-TRADE REVIEW & LESSONS:\n` +
        `• Did I adhere to my stop-loss rules?\n` +
        `• Emotional State during trade:`;
    }

    try {
      const created = await createGoogleDoc(token, title, body);
      fetchDocs(token);
      setNotice({
        type: 'success',
        message: `Created Google Doc: "${created.title}". Check below or open in Docs.`
      });
    } catch (e: any) {
      setNotice({ type: 'error', message: e.message || 'Failed to create Google Doc.' });
    }
  };

  // Preview Doc in App
  const handlePreviewDoc = async (docItem: GoogleDocItem) => {
    if (!token) return;
    setIsPreviewLoading(true);
    try {
      const content = await getGoogleDocContent(token, docItem.id);
      setPreviewDoc({
        id: docItem.id,
        title: content.title,
        text: content.text,
        link: docItem.webViewLink || `https://docs.google.com/document/d/${docItem.id}/edit`
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Could not fetch document content.' });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Delete Doc
  const handleDeleteDoc = async (docItem: GoogleDocItem) => {
    if (!token) return;
    try {
      const deleted = await deleteGoogleDoc(token, docItem.id, docItem.name);
      if (deleted) {
        setDocsList((prev) => prev.filter((d) => d.id !== docItem.id));
        if (previewDoc?.id === docItem.id) setPreviewDoc(null);
        setNotice({ type: 'success', message: `Deleted "${docItem.name}" from Google Drive.` });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete file.' });
    }
  };

  // Delete Firestore Note
  const handleDeleteFirestoreNote = async (noteId: string) => {
    try {
      await deleteNoteFromFirestore(user.email, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setNotice({ type: 'success', message: 'Deleted note from Cloud Firestore.' });
    } catch (e) {
      setNotice({ type: 'error', message: 'Could not delete note.' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Google Docs & Firebase Cloud Integration Header */}
      <div className="bg-[#0E1726] border-2 border-white/10 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-black text-white flex items-center gap-2">
                Google Docs & Trade Journal
                <span className="text-[10px] font-mono font-bold bg-[#05D59E]/10 text-[#05D59E] border border-[#05D59E]/30 px-2 py-0.5 rounded-full uppercase">
                  Firebase Cloud Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Create, export, and edit institutional trading notes and study guides directly in Google Docs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {token ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-mono font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Google Docs Connected
              </span>
              <a
                href="https://docs.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0E1726] hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-mono font-bold transition"
              >
                <span>Docs Home</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2.5 rounded-xl font-mono font-bold text-xs shadow-[2px_2px_0px_0px_#4285F4] transition"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Connect Google Docs</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-3.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white text-xs font-mono">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1-Click Institutional Template Generators */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0F172A] border-2 border-blue-500 rounded-2xl p-6 text-white shadow-[4px_4px_0px_0px_#3B82F6] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-amber-300">
              INSTITUTIONAL GOOGLE DOCS GENERATORS
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/50">One-click creation in your Google Drive</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleCreateTemplateDoc('syllabus')}
            className="flex flex-col items-start p-4 bg-[#0E1726]/10 hover:bg-[#0E1726]/20 border border-white/15 rounded-xl text-left transition group active:translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Full Academy Syllabus</span>
            </div>
            <p className="text-[10px] text-white/70 leading-relaxed font-sans">
              Export complete institutional modules, candlestick patterns & Fibonacci rules into a formatted Google Doc.
            </p>
          </button>

          <button
            onClick={() => handleCreateTemplateDoc('risk')}
            className="flex flex-col items-start p-4 bg-[#0E1726]/10 hover:bg-[#0E1726]/20 border border-white/15 rounded-xl text-left transition group active:translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <Shield className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Risk Management Rules</span>
            </div>
            <p className="text-[10px] text-white/70 leading-relaxed font-sans">
              Export 1% position sizing protocols, stop-limit guidelines, and execution checklists to Google Docs.
            </p>
          </button>

          <button
            onClick={() => handleCreateTemplateDoc('journal')}
            className="flex flex-col items-start p-4 bg-[#0E1726]/10 hover:bg-[#0E1726]/20 border border-white/15 rounded-xl text-left transition group active:translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <FileText className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>Trade Execution Template</span>
            </div>
            <p className="text-[10px] text-white/70 leading-relaxed font-sans">
              Export structured daily trade log sheets with entry, stop loss, target, and emotional post-trade review sections.
            </p>
          </button>
        </div>
      </div>

      {/* Main Grid: Firestore Trading Journal (Left) & Google Docs Drive Explorer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cloud Firestore Trading Notes */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Note Creator Form */}
          <div className="bg-[#0E1726] border-2 border-white/10 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#05D59E]" />
                <h3 className="text-sm font-serif font-black text-white">New Trading Journal Note</h3>
              </div>
              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                Firestore Synced
              </span>
            </div>

            <form onSubmit={handleSaveFirestoreNote} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Note Title (e.g. NIFTY Bullish Breakout Analysis)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-white/10 focus:outline-none px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                />
              </div>

              <div className="flex gap-2">
                {['Trade Analysis', 'Lesson Summary', 'Market Observation', 'Risk Strategy'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                      newTag === tag
                        ? 'bg-[#0F172A] text-white border-white/10'
                        : 'bg-[#0E1726] text-slate-600 border-white/10 hover:bg-slate-50'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your trade reasoning, technical indicator confirmation (RSI, Fib level), stop-loss logic, and lessons..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-white/10 focus:outline-none p-3 rounded-xl text-xs font-sans text-slate-800 resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingNote || !newTitle.trim()}
                className="w-full bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-50"
              >
                {isSavingNote ? 'Saving to Cloud Firestore...' : 'Save Note to Firestore'}
              </button>
            </form>
          </div>

          {/* Firestore Notes List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Saved Notes ({notes.length})
              </h4>
              <button
                onClick={fetchFirestoreNotes}
                className="text-[10px] font-mono text-[#05D59E] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {isLoadingNotes ? (
              <div className="text-center py-8 text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading Firestore notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="bg-[#0E1726] border border-white/10 rounded-2xl p-6 text-center text-xs text-slate-400 space-y-1">
                <p>No journal notes saved yet.</p>
                <p className="text-[10px]">Create your first trading note above to persist it in Cloud Firestore and export it to Google Docs.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#0E1726] border-2 border-white/10 hover:border-white/10 rounded-2xl p-4 shadow-sm transition space-y-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          #{(note.tags || ['Journal'])[0]}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1">{note.title}</h4>
                        <span className="text-[9px] font-mono text-slate-400">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteFirestoreNote(note.id)}
                        title="Delete Note"
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-sans whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {note.googleDocUrl ? (
                        <a
                          href={note.googleDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-blue-600 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Open Synced Google Doc ↗</span>
                        </a>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Not exported to Docs yet</span>
                      )}

                      <button
                        onClick={() => handleExportNoteToDoc(note)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>{note.googleDocUrl ? 'Re-Export Doc' : 'Export to Google Doc'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Google Drive & Google Docs Explorer */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#0E1726] border-2 border-white/10 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-serif font-black text-white">Your Google Docs Files</h3>
              </div>

              {token && (
                <button
                  onClick={() => fetchDocs(token)}
                  disabled={isLoadingDocs}
                  className="text-[10px] font-mono text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingDocs ? 'animate-spin' : ''}`} /> Refresh Docs
                </button>
              )}
            </div>

            {!token ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-white">Connect Your Google Account</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Authorize Google Docs to browse your trading files, open documents, and export custom curriculum guides.
                </p>
                <button
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                  className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-xl font-mono font-bold text-xs shadow-md transition"
                >
                  {isConnecting ? 'Connecting...' : 'Authorize Google Docs'}
                </button>
              </div>
            ) : isLoadingDocs ? (
              <div className="text-center py-12 text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Fetching Google Docs from Drive...</span>
              </div>
            ) : docsList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <p>No Google Docs found in your Google Drive.</p>
                <p className="text-[10px]">Use the generators above to create your first trading guide or export a note!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {docsList.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="p-3 bg-slate-50 border border-white/10 hover:border-blue-400 rounded-xl flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate" title={docItem.name}>
                          {docItem.name}
                        </h5>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Modified {docItem.modifiedTime ? new Date(docItem.modifiedTime).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePreviewDoc(docItem)}
                        title="Read Document in App"
                        className="p-1.5 bg-[#0E1726] hover:bg-slate-100 border border-white/10 text-slate-700 rounded-lg text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={docItem.webViewLink || `https://docs.google.com/document/d/${docItem.id}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in Google Docs"
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleDeleteDoc(docItem)}
                        title="Delete from Google Drive"
                        className="p-1.5 bg-[#0E1726] hover:bg-rose-50 border border-white/10 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document In-App Reader Drawer */}
          <AnimatePresence>
            {previewDoc && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-[#0E1726] border-2 border-blue-600 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <h4 className="text-xs font-bold text-white truncate">{previewDoc.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={previewDoc.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Edit in Google Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => setPreviewDoc(null)}
                      className="text-slate-400 hover:text-white text-xs font-mono px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-white/10 p-4 rounded-xl max-h-64 overflow-y-auto font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {previewDoc.text || 'Document is currently blank.'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
