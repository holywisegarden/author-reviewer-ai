import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Mail,
  Calendar,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { BookProfile, FollowUpGenerationResult, ReviewerOutlet, Submission } from '../types';
import { generateFollowUpApi } from '../services/api';
import { getLinkedEmailAccount } from '../utils/accountSettings';

interface FollowUpEngineProps {
  book: BookProfile;
  submissions: Submission[];
  reviewers: ReviewerOutlet[];
  onUpdateSubmission: (updated: Submission) => void;
  onOpenPitchStudio: (reviewerId?: string) => void;
  onOpenLinkedEmail?: () => void;
}

export const FollowUpEngine: React.FC<FollowUpEngineProps> = ({
  book,
  submissions,
  reviewers,
  onUpdateSubmission,
  onOpenPitchStudio,
  onOpenLinkedEmail,
}) => {
  const linkedEmail = getLinkedEmailAccount();
  const [activeSubId, setActiveSubId] = useState<string>('');
  const [newMilestone, setNewMilestone] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('first_nudge');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [followUpResult, setFollowUpResult] = useState<FollowUpGenerationResult | null>(null);
  const [editedBody, setEditedBody] = useState<string>('');
  const [editedSubject, setEditedSubject] = useState<string>('');
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reviewer mapping
  const reviewerMap = new Map<string, ReviewerOutlet>();
  reviewers.forEach((r) => reviewerMap.set(r.id, r));

  const today = new Date().toISOString().split('T')[0];

  // Filter book submissions that are in pitched or follow-up status (not reviewed or declined)
  const activeFollowUpSubs = submissions.filter(
    (s) =>
      s.bookId === book.id &&
      ['pitched', 'followup_1', 'followup_2'].includes(s.status)
  );

  // Categorize
  const overdueSubs = activeFollowUpSubs.filter(
    (s) => s.nextFollowUpDate && s.nextFollowUpDate <= today
  );

  const upcomingSubs = activeFollowUpSubs.filter(
    (s) => !s.nextFollowUpDate || s.nextFollowUpDate > today
  );

  // Target submission to generate follow-up for
  const currentSub =
    activeFollowUpSubs.find((s) => s.id === activeSubId) ||
    overdueSubs[0] ||
    activeFollowUpSubs[0];

  const currentReviewer = currentSub ? reviewerMap.get(currentSub.reviewerId) : null;

  // Calculate days since pitched
  const getDaysSincePitched = (sub?: Submission) => {
    if (!sub || !sub.datePitched) return 8;
    const pitchedDate = new Date(sub.datePitched);
    const now = new Date();
    const diff = Math.ceil((now.getTime() - pitchedDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 8;
  };

  const handleGenerateFollowUp = async (subToGenerate = currentSub) => {
    if (!subToGenerate) return;
    const reviewer = reviewerMap.get(subToGenerate.reviewerId);
    if (!reviewer) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setActionSuccess(null);

    try {
      const days = getDaysSincePitched(subToGenerate);
      const stageToUse =
        subToGenerate.status === 'pitched'
          ? 'first_nudge'
          : subToGenerate.status === 'followup_1'
          ? 'value_add'
          : 'post_pub';

      setSelectedStage(stageToUse);

      const result = await generateFollowUpApi({
        book,
        reviewer,
        stage: stageToUse,
        daysSincePitched: days,
        originalPitchSubject: subToGenerate.pitchSubject || `Book Review Query: ${book.title}`,
        newMilestone,
      });

      setFollowUpResult(result);
      setEditedSubject(result.subjectLine);
      setEditedBody(result.emailBody);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to craft follow-up email.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleMarkFollowUpSent = (sub: Submission) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14); // Next follow-up in 14 days
    const nextStr = nextDate.toISOString().split('T')[0];

    const nextStatus = sub.status === 'pitched' ? 'followup_1' : 'followup_2';

    const updated: Submission = {
      ...sub,
      status: nextStatus,
      lastFollowUpDate: todayStr,
      nextFollowUpDate: nextStatus === 'followup_2' ? undefined : nextStr,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: todayStr,
          type: 'followup_sent',
          title: `Follow-Up Nudge Dispatched (${nextStatus.toUpperCase()})`,
          note: `Follow-up sent. ${
            nextStatus === 'followup_2'
              ? 'Sequence concluded. Waiting for response.'
              : `Next check scheduled for ${nextStr}.`
          }`,
        },
        ...sub.timeline,
      ],
    };

    onUpdateSubmission(updated);
    setActionSuccess(`Follow-up logged successfully for ${reviewerMap.get(sub.reviewerId)?.publication}!`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const mailtoLink = currentReviewer?.email
    ? `mailto:${encodeURIComponent(currentReviewer.email)}?subject=${encodeURIComponent(
        editedSubject || `Re: Review Query - ${book.title}`
      )}&body=${encodeURIComponent(editedBody || '')}`
    : null;

  const followUpComposeHref = () => {
    if (!currentReviewer?.email) return '#';
    const subject = editedSubject || `Re: Review Query - ${book.title}`;
    const body = editedBody || '';

    if (linkedEmail.provider === 'gmail') {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        currentReviewer.email
      )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (linkedEmail.provider === 'outlook') {
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
        currentReviewer.email
      )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
                <Clock className="w-3.5 h-3.5" /> Automated Follow-Up Radar & Sequencer
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Zero-Guilt High-Response Outreach</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">
              Smart Follow-Up Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Studies show over <strong>62% of book review acceptances</strong> come from the 1st or 2nd polite follow-up nudge. Reviewers get buried in queries; timely follow-ups bring your book back to the top of their inbox.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending Follow-Ups</div>
              <div className="text-base font-bold text-amber-400">
                {activeFollowUpSubs.length} Active in Queue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Follow-Up Queue */}
        <div className="lg:col-span-5 space-y-4">
          {/* Overdue / Due Today Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Due Today / Overdue Follow-Ups ({overdueSubs.length})
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">Recommended action</span>
            </div>

            {overdueSubs.length > 0 ? (
              <div className="space-y-2">
                {overdueSubs.map((sub) => {
                  const rev = reviewerMap.get(sub.reviewerId);
                  if (!rev) return null;
                  const isSelected = (currentSub?.id === sub.id);

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setActiveSubId(sub.id);
                        handleGenerateFollowUp(sub);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-slate-100'
                          : 'bg-slate-850/80 border-rose-500/30 hover:border-amber-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-100">{rev.publication}</span>
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          Due {sub.nextFollowUpDate}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {rev.name} • Stage: {sub.status.toUpperCase()}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Pitched: {sub.datePitched} ({getDaysSincePitched(sub)} days ago)</span>
                        <span className="text-amber-400 font-medium">Click to Draft Nudge →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-850/60 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                No overdue follow-ups! All active queries are on schedule.
              </div>
            )}
          </div>

          {/* Upcoming Follow-Ups */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Scheduled Upcoming ({upcomingSubs.length})
            </h2>

            {upcomingSubs.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {upcomingSubs.map((sub) => {
                  const rev = reviewerMap.get(sub.reviewerId);
                  if (!rev) return null;
                  const isSelected = (currentSub?.id === sub.id);

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setActiveSubId(sub.id);
                        handleGenerateFollowUp(sub);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-slate-100'
                          : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{rev.publication}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          Follow-up: {sub.nextFollowUpDate || 'TBD'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {rev.name} ({rev.category.replace('_', ' ')})
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">
                No other pending pitches. Pitch more reviewers from the Directory!
              </div>
            )}
          </div>

          {/* Sequence Best Practice Rules Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              The ReviewPilot Sequence Formula
            </div>
            <ul className="text-slate-400 space-y-1.5 text-[11px]">
              <li>• <strong>Day 1:</strong> Initial personalized pitch + instant ARC link</li>
              <li>• <strong>Day 7–10 (Nudge 1):</strong> Friendly 80-word check-in before reading queue closes</li>
              <li>• <strong>Day 18–21 (Nudge 2):</strong> Add value (share a 5-star excerpt or milestone)</li>
              <li>• <strong>Post-Launch:</strong> Final reminder that the book is now live</li>
            </ul>
          </div>
        </div>

        {/* Right Column: AI Follow-Up Generator & Preview */}
        <div className="lg:col-span-7 space-y-4">
          {currentSub && currentReviewer ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              {/* Target Banner */}
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      {currentSub.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">
                      Pitched {getDaysSincePitched(currentSub)} days ago
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-slate-100 text-base">
                    {currentReviewer.publication}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Editor / Reviewer: <strong className="text-slate-200">{currentReviewer.name}</strong> •{' '}
                    {currentReviewer.email || 'Web Portal'}
                  </p>
                </div>

                <button
                  onClick={() => handleGenerateFollowUp(currentSub)}
                  disabled={isGenerating}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto shrink-0 shadow-md"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Draft AI Follow-Up</span>
                </button>
              </div>

              {/* Milestone & Value Add Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Add Fresh Milestone or Praise to Mention (Optional, increases response rate by 45%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    placeholder="e.g. 'Just received a 5-star review from Midwest Book Review!', 'ARCs now trending on NetGalley'..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                  />
                  <button
                    onClick={() => handleGenerateFollowUp(currentSub)}
                    disabled={isGenerating}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl transition border border-slate-700 shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Follow-up Result / Editor */}
              {followUpResult ? (
                <div className="space-y-3 pt-2">
                  {/* Subject Line */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500/60"
                    />
                  </div>

                  {/* Body Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Follow-Up Email Body
                      </label>
                      <button
                        onClick={handleCopy}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                      >
                        {copiedBody ? (
                          <>
                            <Check className="w-3 h-3" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Text
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-amber-500/60"
                    />
                  </div>

                  {/* Strategic Tip */}
                  {followUpResult.followUpAdvice && (
                    <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{followUpResult.followUpAdvice}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <a
                        href={followUpComposeHref()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleMarkFollowUpSent(currentSub)}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm active:scale-95"
                        title={`Send via linked ${linkedEmail.provider} from ${linkedEmail.senderEmail}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Nudge via {linkedEmail.provider === 'gmail' ? 'Gmail' : 'Linked Email'}</span>
                      </a>

                      <button
                        onClick={handleCopy}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition"
                      >
                        Copy to Clipboard
                      </button>
                    </div>

                    <button
                      onClick={() => handleMarkFollowUpSent(currentSub)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Follow-Up Dispatched</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Click to generate prompt */
                <div className="bg-slate-850/60 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-slate-200">
                    Ready to draft a gentle follow-up for {currentReviewer.publication}
                  </div>
                  <p className="max-w-md mx-auto text-slate-400 text-[11px]">
                    The AI will restate the premise concisely, reference the initial {getDaysSincePitched(currentSub)}-day query, and offer an effortless digital ARC download.
                  </p>
                  <button
                    onClick={() => handleGenerateFollowUp(currentSub)}
                    disabled={isGenerating}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Draft Follow-Up Email Now →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="font-bold text-slate-300 text-sm">No Pending Submissions Found</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All book submissions have either received responses, published reviews, or haven't been pitched yet. Go to the Pitch Studio to submit to new reviewers!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
