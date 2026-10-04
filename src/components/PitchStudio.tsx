import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Mail,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Clock,
  Award,
  Zap,
} from 'lucide-react';
import { BookProfile, PitchGenerationResult, ReviewerOutlet, Submission } from '../types';
import { generatePitchApi } from '../services/api';
import { getLinkedEmailAccount } from '../utils/accountSettings';

interface PitchStudioProps {
  book: BookProfile;
  reviewers: ReviewerOutlet[];
  submissions: Submission[];
  initialReviewerId?: string;
  onSavePitchToPipeline: (sub: Submission) => void;
  onGoToPipeline: () => void;
  onOpenLinkedEmail?: () => void;
}

export const PitchStudio: React.FC<PitchStudioProps> = ({
  book,
  reviewers,
  submissions,
  initialReviewerId,
  onSavePitchToPipeline,
  onGoToPipeline,
  onOpenLinkedEmail,
}) => {
  const linkedEmail = getLinkedEmailAccount();
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>(
    initialReviewerId || reviewers[0]?.id || ''
  );
  const [pitchStyle, setPitchStyle] = useState<string>('balanced');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pitchResult, setPitchResult] = useState<PitchGenerationResult | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [editedBody, setEditedBody] = useState<string>('');
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update selection if initialReviewerId changes
  useEffect(() => {
    if (initialReviewerId) {
      setSelectedReviewerId(initialReviewerId);
    }
  }, [initialReviewerId]);

  // Reset pitch generation state if active book changes
  useEffect(() => {
    setPitchResult(null);
    setSelectedSubject('');
    setEditedBody('');
    setErrorMessage(null);
  }, [book.id]);

  const selectedReviewer = reviewers.find((r) => r.id === selectedReviewerId) || reviewers[0];

  // Lead time calculation
  const calculateLeadTimeStatus = () => {
    if (!book.pubDate || !selectedReviewer) return null;
    const pubDate = new Date(book.pubDate);
    const now = new Date();
    const diffDays = Math.ceil((pubDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'post_pub',
        message: `Book was published ${Math.abs(diffDays)} days ago. Note: Prestige print reviews (NYT/PW) require pre-pub ARCs, but indie blogs, BookTok, and Goodreads happily accept post-launch books!`,
        isWarning: selectedReviewer.category === 'prestige' || selectedReviewer.category === 'trade',
      };
    } else if (diffDays < selectedReviewer.leadTimeDays) {
      return {
        status: 'tight_lead_time',
        message: `Publication is in ${diffDays} days. ${selectedReviewer.publication} prefers ${selectedReviewer.leadTimeDays} days lead time. Pitching digital galleys/NetGalley is recommended.`,
        isWarning: true,
      };
    } else {
      return {
        status: 'optimal',
        message: `Perfect lead time window! You have ${diffDays} days before release (${selectedReviewer.leadTimeDays} days required).`,
        isWarning: false,
      };
    }
  };

  const leadTimeInfo = calculateLeadTimeStatus();

  // Auto-set pitch style based on reviewer category
  useEffect(() => {
    if (selectedReviewer) {
      if (selectedReviewer.category === 'prestige') {
        setPitchStyle('prestige-editorial');
      } else if (selectedReviewer.category === 'influencer_booktok') {
        setPitchStyle('enthusiastic-blogger');
      } else if (selectedReviewer.category === 'goodreads_amazon') {
        setPitchStyle('quick-punchy');
      } else {
        setPitchStyle('balanced');
      }
    }
  }, [selectedReviewerId]);

  // Handle AI generation
  const handleGeneratePitch = async () => {
    if (!book || !selectedReviewer) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setSavedNotification(false);

    try {
      const result = await generatePitchApi({
        book,
        reviewer: selectedReviewer,
        pitchStyle,
        customNotes,
      });

      setPitchResult(result);
      setSelectedSubject(result.recommendedSubjectLine || result.subjectLineOptions[0] || '');
      setEditedBody(result.emailBody || '');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to craft pitch. Check backend connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy helper
  const handleCopySubject = () => {
    navigator.clipboard.writeText(selectedSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(editedBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  // Save to Submissions Pipeline
  const handleSaveToPipeline = () => {
    if (!selectedReviewer || !editedBody) return;

    const existingSub = submissions.find(
      (s) => s.bookId === book.id && s.reviewerId === selectedReviewer.id
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const followUpTargetDate = new Date();
    followUpTargetDate.setDate(followUpTargetDate.getDate() + 10);
    const followUpStr = followUpTargetDate.toISOString().split('T')[0];

    const submissionToSave: Submission = {
      id: existingSub ? existingSub.id : `sub-${Date.now()}`,
      bookId: book.id,
      reviewerId: selectedReviewer.id,
      status: 'pitched',
      dateDiscovered: existingSub?.dateDiscovered || todayStr,
      datePitched: todayStr,
      lastFollowUpDate: todayStr,
      nextFollowUpDate: followUpStr,
      pitchSubject: selectedSubject,
      pitchBody: editedBody,
      pitchScore: pitchResult?.matchScore || 90,
      followUpStage: 0,
      arcDelivered: existingSub?.arcDelivered || false,
      timeline: [
        ...(existingSub?.timeline || []),
        {
          id: `tl-${Date.now()}`,
          date: todayStr,
          type: 'pitched',
          title: 'Pitch Sent & Logged in Pipeline',
          note: `Pitch sent with subject: "${selectedSubject}". Automated 10-day follow-up nudge scheduled for ${followUpStr}.`,
        },
      ],
    };

    onSavePitchToPipeline(submissionToSave);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const mailtoLink = selectedReviewer?.email
    ? `mailto:${encodeURIComponent(selectedReviewer.email)}?subject=${encodeURIComponent(
        selectedSubject
      )}&body=${encodeURIComponent(editedBody)}`
    : null;

  const emailComposeHref = () => {
    if (!selectedReviewer?.email) return '#';
    if (linkedEmail.provider === 'gmail') {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        selectedReviewer.email
      )}&su=${encodeURIComponent(selectedSubject)}&body=${encodeURIComponent(editedBody)}`;
    } else if (linkedEmail.provider === 'outlook') {
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
        selectedReviewer.email
      )}&subject=${encodeURIComponent(selectedSubject)}&body=${encodeURIComponent(editedBody)}`;
    } else {
      return mailtoLink || '#';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Review Pitch Crafting Engine
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Powered by Gemini 3.8 Flash</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">
              Personalized Outreach Pitch Studio
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Pitching for <strong>"{book.title}"</strong> by {book.author}. The AI analyzes the reviewer's guidelines, lead time, and format rules to generate high-converting review queries.
            </p>
          </div>

          <button
            onClick={onGoToPipeline}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 bg-slate-800 hover:bg-slate-750 px-3.5 py-2 rounded-xl transition border border-slate-700 self-start md:self-auto"
          >
            <span>View Submissions Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Reviewer Selection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              1. Select Target Reviewer / Publication
            </h2>

            {/* Reviewer Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Reviewer Outlet
              </label>
              <select
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.publication} — {r.name} ({r.category.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Reviewer Guidelines Summary Card */}
            {selectedReviewer && (
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{selectedReviewer.publication}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    {selectedReviewer.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Contact: <span className="text-slate-300 font-medium">{selectedReviewer.name}</span>{' '}
                  ({selectedReviewer.email || 'Online Portal'})
                </div>
                <div className="text-[11px] text-slate-400">
                  Review Policy:{' '}
                  <span className="text-emerald-400 font-medium">{selectedReviewer.costPolicy}</span>
                </div>
                <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                  "{selectedReviewer.guidelines}"
                </p>

                {/* Lead time pill */}
                {leadTimeInfo && (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-start gap-1.5 ${
                      leadTimeInfo.isWarning
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {leadTimeInfo.isWarning ? (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>{leadTimeInfo.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pitch Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Outreach Style & Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'prestige-editorial', label: 'Formal Editorial', desc: 'For NYT, trad trade' },
                  { id: 'balanced', label: 'Engaging & Direct', desc: 'Standard author query' },
                  { id: 'enthusiastic-blogger', label: 'Blogger / BookTok', desc: 'Tropes, vibes, ARCs' },
                  { id: 'quick-punchy', label: 'FTC Honest Review', desc: 'Goodreads & Vine' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setPitchStyle(style.id)}
                    className={`p-2 rounded-xl text-left border transition text-xs ${
                      pitchStyle === style.id
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold">{style.label}</div>
                    <div className="text-[10px] text-slate-500">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manuscript / ARC Attachment Selector */}
            {book.manuscripts && book.manuscripts.length > 0 && (
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Attach Uploaded Manuscript ARC
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Ready for Reviewer</span>
                </div>
                <select
                  onChange={(e) => {
                    const selected = book.manuscripts?.find((m) => m.id === e.target.value);
                    if (selected) {
                      setCustomNotes((prev) =>
                        prev
                          ? `${prev}\n[Attached ARC: ${selected.fileName} (${selected.versionTag})]`
                          : `[Attached ARC: ${selected.fileName} (${selected.versionTag})]`
                      );
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  {book.manuscripts.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fileName} ({m.fileType.toUpperCase()} • {m.versionTag})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Selecting a manuscript automatically injects its format & secure download link into your pitch.
                </p>
              </div>
            )}

            {/* Personalization Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Personalized Angle / Custom Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. 'Loved their review of Yellowface', 'Mention this book touches on Los Angeles architecture', 'Ready for physical copy dispatch'..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGeneratePitch}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Gemini 3.8 Flash is Crafting Your Pitch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Generate Bespoke Review Pitch with AI</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Output & Email Editor */}
        <div className="lg:col-span-7 space-y-4">
          {pitchResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              {/* Match Score & Highlights Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center">
                    <span className="text-base font-extrabold text-amber-400">
                      {pitchResult.matchScore}%
                    </span>
                    <span className="text-[9px] uppercase font-bold text-amber-300">Match</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Reviewer Compatibility Fit
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {pitchResult.whyThisReviewer}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGeneratePitch}
                    disabled={isGenerating}
                    className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 border border-slate-700/60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Subject Lines Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    AI-Crafted Subject Lines (Select one or edit)
                  </label>
                  <button
                    onClick={handleCopySubject}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    {copiedSubject ? (
                      <>
                        <Check className="w-3 h-3" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Subject
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 mb-2">
                  {pitchResult.subjectLineOptions.map((subj, idx) => (
                    <label
                      key={idx}
                      className={`block p-2 rounded-lg border text-xs cursor-pointer transition ${
                        selectedSubject === subj
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-medium'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="subjectOption"
                        className="mr-2 text-amber-500 focus:ring-amber-500"
                        checked={selectedSubject === subj}
                        onChange={() => setSelectedSubject(subj)}
                      />
                      <span>{subj}</span>
                    </label>
                  ))}
                </div>

                <input
                  type="text"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500/60"
                  placeholder="Subject line..."
                />
              </div>

              {/* Linked Email Sender Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-850 px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-400">Linked Outreach Sender:</span>
                  <span className="font-semibold text-slate-200">{linkedEmail.senderName}</span>
                  <span className="font-mono text-amber-300 text-[11px]">&lt;{linkedEmail.senderEmail}&gt;</span>
                  <span className="text-[10px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase font-semibold">
                    {linkedEmail.provider.replace('_', ' ')}
                  </span>
                </div>
                {onOpenLinkedEmail && (
                  <button
                    type="button"
                    onClick={onOpenLinkedEmail}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 font-medium"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Change / Link Email</span>
                  </button>
                )}
              </div>

              {/* Email Body Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Review Pitch Email Body (Ready to Send)
                  </label>
                  <button
                    onClick={handleCopyBody}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    {copiedBody ? (
                      <>
                        <Check className="w-3 h-3" /> Copied Body!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Pitch Body
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={13}
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-amber-500/60 resize-y"
                />
              </div>

              {/* Pitch Highlights Checklist */}
              {pitchResult.pitchHighlights && pitchResult.pitchHighlights.length > 0 && (
                <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                    Key Pitch Selling Points Included:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                    {pitchResult.pitchHighlights.map((hl, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <a
                    href={emailComposeHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      handleSaveToPipeline();
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-blue-600/25 active:scale-95"
                    title={`Send via linked ${linkedEmail.provider} from ${linkedEmail.senderEmail}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send via {linkedEmail.provider === 'gmail' ? 'Gmail' : linkedEmail.provider === 'outlook' ? 'Outlook' : 'Email'}</span>
                  </a>

                  <button
                    onClick={handleCopyBody}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Full Pitch</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {savedNotification && (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Added to Pipeline!
                    </span>
                  )}
                  <button
                    onClick={handleSaveToPipeline}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log to Pipeline (10-Day Follow-Up)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[460px] text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">
                Your Bespoke Pitch Will Appear Here
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                Select your target reviewer and style on the left, then click{' '}
                <strong className="text-slate-300">Generate Bespoke Review Pitch</strong>. The AI will craft multi-option subject lines, formatted editorial queries, and FTC-compliant ARC disclosures.
              </p>
              <button
                onClick={handleGeneratePitch}
                disabled={isGenerating}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-4 py-2 rounded-xl transition border border-slate-700"
              >
                Generate Initial Pitch for {selectedReviewer?.publication || 'Reviewer'} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
