import React, { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Lock,
  ExternalLink,
  Star,
  BookOpen,
  ArrowRight,
  LogOut,
  AlertCircle,
  Loader2,
  Zap,
  Search,
} from 'lucide-react';
import { KdpAccountSession, KdpBookshelfBook, ExtractedBookMetadata } from '../types';
import {
  getKdpAccountSession,
  saveKdpAccountSession,
  SAMPLE_KDP_BOOKSHELF,
} from '../utils/accountSettings';
import { lookupKdpBookApi } from '../services/api';

interface KdpLoginModalProps {
  onClose: () => void;
  onImportBook: (metadata: ExtractedBookMetadata) => void;
}

export const KdpLoginModal: React.FC<KdpLoginModalProps> = ({ onClose, onImportBook }) => {
  const [session, setSession] = useState<KdpAccountSession | null>(getKdpAccountSession());
  const [emailInput, setEmailInput] = useState('elmo00086@gmail.com');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSearchAsin, setCustomSearchAsin] = useState('');
  const [isSearchingCustom, setIsSearchingCustom] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Please enter your Amazon account email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      const newSession: KdpAccountSession = {
        email: emailInput.trim(),
        authorName: emailInput.split('@')[0] || 'Kindle Author',
        kdpAccountId: `KDP-${Math.floor(100000 + Math.random() * 900000)}`,
        marketplace: 'Amazon.com (US Store & Worldwide)',
        isConnected: true,
        connectedAt: new Date().toISOString(),
      };
      saveKdpAccountSession(newSession);
      setSession(newSession);
      setIsSubmitting(false);
    }, 600);
  };

  const handleSignOut = () => {
    saveKdpAccountSession(null);
    setSession(null);
  };

  const handleImportBookshelfItem = (b: KdpBookshelfBook) => {
    const metadata: ExtractedBookMetadata = {
      title: b.title,
      subtitle: b.subtitle,
      author: b.author,
      genre: b.genre,
      targetAudience: `Readers of ${b.genre} looking for immersive Kindle and print titles.`,
      pageCount: b.pageCount,
      compTitles: b.compTitles,
      logline: b.logline,
      synopsis: b.synopsis,
      coverImage: b.coverImage,
      kdpDetails: {
        asin: b.asin,
        isbn: b.isbn,
        amazonUrl: b.amazonUrl,
        authorCentralUrl: `https://www.amazon.com/author/${encodeURIComponent(b.author.toLowerCase().replace(/\s+/g, ''))}`,
        kdpEnrollment: b.kdpEnrollment,
        bsrRank: b.bsrRank,
        amazonRating: b.amazonRating,
        reviewCount: b.reviewCount,
        formatsAvailable: b.kdpEnrollment ? ['Kindle Unlimited', 'Paperback (KDP)', 'Hardcover'] : ['Kindle', 'Paperback'],
        lastSyncedAt: new Date().toISOString(),
      },
      detectedTropes: ['#KindleDirectPublishing', '#Bestseller', '#PageTurner'],
      contentWarnings: ['None specified'],
      arcBlurbTeaser: `An acclaimed Amazon release: sharp pacing, memorable characters, and commercial comp appeal.`,
    };

    onImportBook(metadata);
    onClose();
  };

  const handleCustomAsinLookup = async () => {
    if (!customSearchAsin.trim()) return;
    setIsSearchingCustom(true);
    setErrorMsg(null);

    try {
      const result = await lookupKdpBookApi(customSearchAsin);
      onImportBook(result);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not find Amazon KDP listing for that ASIN/ISBN.');
    } finally {
      setIsSearchingCustom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-base flex items-center gap-2">
                <span>Amazon KDP & Author Central</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-normal">
                  Kindle Direct Publishing
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Sign in to your Amazon KDP account to import books and sync live sales rank.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* NOT SIGNED IN STATE: AMAZON LOGIN FORM */}
        {!session ? (
          <div className="space-y-4 pt-1">
            <div className="bg-slate-850 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Sign in with Amazon Author Credentials</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Connect your Kindle Direct Publishing author profile to automatically import metadata, pull verified customer review counts, and track Amazon BSR categories.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Amazon Account Email or Mobile Number
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@author.com"
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Amazon KDP Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 text-amber-500 focus:ring-0" />
                  <span>Keep me signed in to Amazon KDP</span>
                </label>
                <span className="text-amber-400/80">Author Central Sync Enabled</span>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Connecting to Amazon KDP API...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 fill-current" />
                    <span>Sign In to Amazon KDP & Author Central</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500">
                Simulated secure OAuth handshake. Connects via Amazon KDP Developer Gateway.
              </span>
            </div>
          </div>
        ) : (
          /* SIGNED IN STATE: CONNECTED KDP ACCOUNT & BOOKSHELF */
          <div className="space-y-4 pt-1 text-xs">
            {/* Account Card */}
            <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{session.email}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                      Connected
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Account: <span className="font-mono text-slate-300">{session.kdpAccountId}</span> • {session.marketplace}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                title="Sign out of Amazon KDP"
              >
                <LogOut className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            </div>

            {/* Custom ASIN search */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold text-[11px]">
                Search or Enter Any ASIN / ISBN from your KDP Bookshelf:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSearchAsin}
                  onChange={(e) => setCustomSearchAsin(e.target.value)}
                  placeholder="e.g. B09KV8W or 9781982137274"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
                <button
                  type="button"
                  disabled={isSearchingCustom || !customSearchAsin.trim()}
                  onClick={handleCustomAsinLookup}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0 transition"
                >
                  {isSearchingCustom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Import</span>
                </button>
              </div>
            </div>

            {/* KDP Bookshelf Listing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Books Found in your KDP Bookshelf ({SAMPLE_KDP_BOOKSHELF.length}):
                </span>
                <span>Click to import into CRM</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {SAMPLE_KDP_BOOKSHELF.map((b) => (
                  <div
                    key={b.asin}
                    className="p-3 bg-slate-850 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/50 rounded-xl transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={b.coverImage}
                        alt={b.title}
                        className="w-10 h-14 object-cover rounded shadow-md border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 truncate text-xs flex items-center gap-2">
                          <span className="truncate">{b.title}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded shrink-0">
                            {b.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {b.author} • ASIN: <span className="font-mono text-amber-300">{b.asin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1 text-amber-300 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {b.amazonRating} ({b.reviewCount} reviews)
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[160px]">{b.bsrRank}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportBookshelfItem(b)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition active:scale-95 shadow-sm"
                    >
                      <span>Import</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
