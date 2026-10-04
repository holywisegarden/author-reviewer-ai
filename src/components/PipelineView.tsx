import React, { useState } from 'react';
import {
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Mail,
  Star,
  Plus,
  Filter,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  RotateCw,
  Search,
  BookCheck,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { BookProfile, ReviewerOutlet, Submission, SubmissionStatus } from '../types';

interface PipelineViewProps {
  book: BookProfile;
  books?: BookProfile[];
  onSelectBook?: (id: string) => void;
  onDeleteBook?: (id: string) => void;
  submissions: Submission[];
  reviewers: ReviewerOutlet[];
  onUpdateSubmission: (updated: Submission) => void;
  onOpenPitchStudio: (reviewerId?: string) => void;
  onOpenFollowUpStudio: (submission: Submission) => void;
}

const STATUS_COLUMNS: {
  key: SubmissionStatus;
  title: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}[] = [
  {
    key: 'ready_to_pitch',
    title: 'Ready to Pitch',
    color: 'text-slate-300',
    badgeBg: 'bg-slate-700/50 text-slate-300 border-slate-600',
    borderColor: 'border-slate-800',
  },
  {
    key: 'pitched',
    title: 'Pitched / Awaiting Reply',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    borderColor: 'border-blue-500/20',
  },
  {
    key: 'followup_1',
    title: 'Follow-Up 1 Stage',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    borderColor: 'border-amber-500/20',
  },
  {
    key: 'followup_2',
    title: 'Follow-Up 2 Stage',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    borderColor: 'border-orange-500/20',
  },
  {
    key: 'arc_accepted',
    title: 'ARC Accepted / Reading',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    borderColor: 'border-emerald-500/20',
  },
  {
    key: 'review_published',
    title: 'Review Published 🎉',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    borderColor: 'border-purple-500/20',
  },
  {
    key: 'declined',
    title: 'Passed / Closed',
    color: 'text-slate-500',
    badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
    borderColor: 'border-slate-800',
  },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  book,
  books,
  onSelectBook,
  onDeleteBook,
  submissions,
  reviewers,
  onUpdateSubmission,
  onOpenPitchStudio,
  onOpenFollowUpStudio,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Helper map for reviewers
  const reviewerMap = new Map<string, ReviewerOutlet>();
  reviewers.forEach((r) => reviewerMap.set(r.id, r));

  // Current submissions for active book
  const bookSubmissions = submissions.filter((s) => s.bookId === book.id);

  // Filtered submissions
  const filteredSubmissions = bookSubmissions.filter((s) => {
    const reviewer = reviewerMap.get(s.reviewerId);
    if (!reviewer) return false;

    if (categoryFilter !== 'all' && reviewer.category !== categoryFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = reviewer.name.toLowerCase().includes(q);
      const matchPub = reviewer.publication.toLowerCase().includes(q);
      const matchSub = s.pitchSubject?.toLowerCase().includes(q);
      return matchName || matchPub || matchSub;
    }
    return true;
  });

  // Calculate overdue follow-ups
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = (sub: Submission) => {
    if (sub.status === 'review_published' || sub.status === 'declined') return false;
    if (!sub.nextFollowUpDate) return false;
    return sub.nextFollowUpDate <= today;
  };

  const overdueSubs = bookSubmissions.filter(isOverdue);

  // Stats calculation
  const totalPitched = bookSubmissions.filter((s) =>
    ['pitched', 'followup_1', 'followup_2', 'arc_accepted', 'review_published'].includes(s.status)
  ).length;
  const totalArcsAccepted = bookSubmissions.filter((s) =>
    ['arc_accepted', 'review_published'].includes(s.status)
  ).length;
  const totalReviews = bookSubmissions.filter((s) => s.status === 'review_published').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Book Campaign Pipeline
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">{book.genre}</span>
              {books && onSelectBook && (
                <div className="flex items-center gap-1.5 ml-2 bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 rounded-lg text-xs">
                  <span className="text-slate-400 text-[11px]">Active Book:</span>
                  {books.length > 1 ? (
                    <select
                      value={book.id}
                      onChange={(e) => onSelectBook(e.target.value)}
                      className="bg-transparent text-amber-300 font-semibold text-xs border-none outline-none cursor-pointer pr-1 focus:ring-0"
                    >
                      {books.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100">
                          {b.title} ({b.author})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-amber-300 font-semibold text-xs truncate max-w-[160px]">
                      {book.title}
                    </span>
                  )}
                  {onDeleteBook && (
                    <button
                      type="button"
                      onClick={() => onDeleteBook(book.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/20 transition ml-1 flex items-center gap-1"
                      title={`Remove "${book.title}" from active books`}
                      aria-label="Remove book"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline text-[11px] text-rose-300">Remove</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              {book.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl line-clamp-1">
              {book.logline}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pitches Sent</div>
              <div className="text-lg font-bold text-blue-400">{totalPitched}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">ARCs Accepted</div>
              <div className="text-lg font-bold text-emerald-400">{totalArcsAccepted}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Reviews Landed</div>
              <div className="text-lg font-bold text-purple-400">{totalReviews}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Follow-Ups Due</div>
              <div className={`text-lg font-bold ${overdueSubs.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {overdueSubs.length}
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Alert Bar if any */}
        {overdueSubs.length > 0 && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>{overdueSubs.length} review submission{overdueSubs.length > 1 ? 's are' : ' is'} due for a polite follow-up nudge today!</strong>
              </span>
            </div>
            <button
              onClick={() => onOpenFollowUpStudio(overdueSubs[0])}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 px-3 py-1 rounded-lg font-medium transition shrink-0"
            >
              Draft Nudge with AI →
            </button>
          </div>
        )}
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by publication, reviewer, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[
              { id: 'all', label: 'All Outlets' },
              { id: 'prestige', label: 'Prestige Media' },
              { id: 'trade', label: 'Trade / Library' },
              { id: 'indie_blog', label: 'Indie Blogs' },
              { id: 'influencer_booktok', label: 'BookTok' },
              { id: 'goodreads_amazon', label: 'Goodreads / Vine' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap text-xs ${
                  categoryFilter === cat.id
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-slate-800 text-slate-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-slate-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Table View
            </button>
          </div>

          {/* New Pitch Action */}
          <button
            onClick={() => onOpenPitchStudio()}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3 py-2 rounded-xl transition shadow-md shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Pitch</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((column) => {
            const columnSubs = filteredSubmissions.filter((s) => s.status === column.key);
            return (
              <div
                key={column.key}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col min-h-[480px] shadow-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${column.color.replace('text-', 'bg-')}`}></span>
                    <span className="text-xs font-semibold text-slate-200">{column.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${column.badgeBg}`}>
                    {columnSubs.length}
                  </span>
                </div>

                {/* Submissions List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {columnSubs.map((sub) => {
                    const reviewer = reviewerMap.get(sub.reviewerId);
                    if (!reviewer) return null;
                    const overdue = isOverdue(sub);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className={`group bg-slate-800/90 hover:bg-slate-800 border rounded-xl p-3 cursor-pointer transition shadow-sm hover:shadow-md relative ${
                          overdue ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-700/60 hover:border-amber-500/40'
                        }`}
                      >
                        {/* Overdue Indicator */}
                        {overdue && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <Clock className="w-3 h-3" />
                            <span>Follow-Up Due</span>
                          </div>
                        )}

                        {/* Outlet & Category */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                            {reviewer.category.replace('_', ' ')}
                          </span>
                          {sub.rating && (
                            <div className="flex items-center gap-0.5 text-amber-400 text-xs ml-auto">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="font-bold">{sub.rating}</span>
                            </div>
                          )}
                        </div>

                        <div className="font-semibold text-slate-100 text-xs line-clamp-1 group-hover:text-amber-300 transition">
                          {reviewer.publication}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {reviewer.name}
                        </div>

                        {/* Pitch Subject or Hook */}
                        {sub.pitchSubject && (
                          <div className="mt-2 text-[11px] text-slate-300 italic bg-slate-900/60 p-1.5 rounded border border-slate-700/40 line-clamp-2">
                            "{sub.pitchSubject}"
                          </div>
                        )}

                        {/* Review quote snippet if published */}
                        {sub.reviewQuote && (
                          <div className="mt-2 text-[11px] text-purple-300 bg-purple-950/30 border border-purple-800/40 p-1.5 rounded line-clamp-2">
                            "{sub.reviewQuote}"
                          </div>
                        )}

                        {/* Dates & ARC Badge */}
                        <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{sub.datePitched || sub.dateDiscovered}</span>
                          </div>
                          {sub.arcDelivered ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> ARC Sent
                            </span>
                          ) : (
                            <span className="text-slate-500">No ARC yet</span>
                          )}
                        </div>

                        {/* Quick hover trigger for follow-up */}
                        {sub.status !== 'review_published' && sub.status !== 'declined' && (
                          <div className="mt-2 hidden group-hover:flex items-center justify-between pt-1 text-[11px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenFollowUpStudio(sub);
                              }}
                              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI Follow-Up</span>
                            </button>
                            <span className="text-slate-500">Details →</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {columnSubs.length === 0 && (
                    <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-slate-600 text-xs">
                      No submissions
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Outlet / Publication</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pitched Date</th>
                  <th className="px-4 py-3">Next Follow-Up</th>
                  <th className="px-4 py-3">ARC Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubmissions.map((sub) => {
                  const reviewer = reviewerMap.get(sub.reviewerId);
                  if (!reviewer) return null;
                  const overdue = isOverdue(sub);

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-100">
                        {reviewer.publication}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{reviewer.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          {reviewer.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            STATUS_COLUMNS.find((c) => c.key === sub.status)?.badgeBg || ''
                          }`}
                        >
                          {STATUS_COLUMNS.find((c) => c.key === sub.status)?.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{sub.datePitched || 'Not yet'}</td>
                      <td className="px-4 py-3">
                        {sub.nextFollowUpDate ? (
                          <span
                            className={`font-medium ${
                              overdue ? 'text-rose-400 font-bold' : 'text-slate-300'
                            }`}
                          >
                            {sub.nextFollowUpDate} {overdue ? '⚠️ Overdue' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sub.arcDelivered ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                          </span>
                        ) : (
                          <span className="text-slate-500">Not Sent</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFollowUpStudio(sub);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded hover:bg-slate-800"
                        >
                          Follow-Up
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Detail / Edit Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          book={book}
          reviewer={reviewerMap.get(selectedSubmission.reviewerId)!}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={(updated) => {
            onUpdateSubmission(updated);
            setSelectedSubmission(updated);
          }}
          onOpenFollowUpStudio={onOpenFollowUpStudio}
          onOpenPitchStudio={onOpenPitchStudio}
        />
      )}
    </div>
  );
};

// Detailed Modal for a specific Submission
interface SubmissionDetailModalProps {
  submission: Submission;
  book: BookProfile;
  reviewer: ReviewerOutlet;
  onClose: () => void;
  onUpdate: (updated: Submission) => void;
  onOpenFollowUpStudio: (submission: Submission) => void;
  onOpenPitchStudio: (reviewerId?: string) => void;
}

const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  book,
  reviewer,
  onClose,
  onUpdate,
  onOpenFollowUpStudio,
  onOpenPitchStudio,
}) => {
  const [currentStatus, setCurrentStatus] = useState<SubmissionStatus>(submission.status);
  const [rating, setRating] = useState<number>(submission.rating || 5);
  const [reviewUrl, setReviewUrl] = useState(submission.reviewUrl || '');
  const [reviewQuote, setReviewQuote] = useState(submission.reviewQuote || '');
  const [notes, setNotes] = useState(submission.reviewerNotes || '');
  const [arcDelivered, setArcDelivered] = useState(submission.arcDelivered);
  const [newLogNote, setNewLogNote] = useState('');

  const handleSave = () => {
    const updated: Submission = {
      ...submission,
      status: currentStatus,
      rating: currentStatus === 'review_published' ? rating : submission.rating,
      reviewUrl,
      reviewQuote,
      reviewerNotes: notes,
      arcDelivered,
    };
    onUpdate(updated);
    onClose();
  };

  const handleAddTimelineEvent = () => {
    if (!newLogNote.trim()) return;
    const newEvent = {
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'status_change' as const,
      title: 'Author Note Added',
      note: newLogNote.trim(),
    };
    const updated: Submission = {
      ...submission,
      timeline: [newEvent, ...submission.timeline],
    };
    onUpdate(updated);
    setNewLogNote('');
  };

  const mailtoLink = reviewer.email
    ? `mailto:${encodeURIComponent(reviewer.email)}?subject=${encodeURIComponent(
        submission.pitchSubject || `Book Review Query: ${book.title}`
      )}&body=${encodeURIComponent(submission.pitchBody || '')}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {reviewer.category.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">
                Lead Time: {reviewer.leadTimeNotice}
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-100 mt-1">
              {reviewer.publication}
            </h2>
            <p className="text-xs text-slate-300">
              Recipient: <strong className="text-slate-100">{reviewer.name}</strong> •{' '}
              {reviewer.email || 'Web Portal Submission'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Status & Actions Control */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-850 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pipeline Stage / Status
            </label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as SubmissionStatus)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
            >
              <option value="ready_to_pitch">Ready to Pitch</option>
              <option value="pitched">Pitched / Waiting on Editorial</option>
              <option value="followup_1">Follow-Up 1 Stage</option>
              <option value="followup_2">Follow-Up 2 Stage</option>
              <option value="arc_accepted">ARC Accepted / In Reading Queue</option>
              <option value="review_published">Review Published 🎉</option>
              <option value="declined">Declined / Passed</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenFollowUpStudio(submission);
              }}
              className="flex-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Draft Follow-Up with AI</span>
            </button>
            {mailtoLink && (
              <a
                href={mailtoLink}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Email</span>
              </a>
            )}
          </div>
        </div>

        {/* ARC Checkbox & Dispatched Manuscript Selector */}
        <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="arcDeliveredCheck"
              checked={arcDelivered}
              onChange={(e) => setArcDelivered(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500"
            />
            <label htmlFor="arcDeliveredCheck" className="text-xs text-slate-200 cursor-pointer">
              <strong>Advance Reader Copy (ARC) dispatched & delivered</strong>
              <p className="text-[11px] text-slate-400">
                Mark this true once NetGalley access, digital proof, or bound galley copy is sent.
              </p>
            </label>
          </div>

          {arcDelivered && book.manuscripts && book.manuscripts.length > 0 && (
            <div className="pl-7 pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Dispatched Manuscript Proof:</span>
              <select
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                defaultValue={book.manuscripts[0].fileName}
              >
                {book.manuscripts.map((m) => (
                  <option key={m.id} value={m.fileName}>
                    {m.fileName} ({m.fileType.toUpperCase()} - {m.versionTag})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* If Review is Published: Star Rating, Link, Quote */}
        {currentStatus === 'review_published' && (
          <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-purple-400 text-purple-400" />
                Published Review Details
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Review URL / Link
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={reviewUrl}
                onChange={(e) => setReviewUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Headline / Star Quote for Book Jacket or Amazon Page
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 'A masterwork of atmospheric suspense...' — Kirkus Reviews"
                value={reviewQuote}
                onChange={(e) => setReviewQuote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
          </div>
        )}

        {/* Notes & Context */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Author / Publicist Campaign Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Editor requested physical galley, preferred tropes, or follow-up date reminder..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Saved Pitch Content if available */}
        {submission.pitchBody && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Pitch Content
            </div>
            <div className="font-semibold text-slate-200 mb-1">
              Subject: {submission.pitchSubject}
            </div>
            <pre className="text-slate-400 whitespace-pre-wrap font-sans text-xs max-h-36 overflow-y-auto">
              {submission.pitchBody}
            </pre>
          </div>
        )}

        {/* Timeline Log */}
        <div>
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Outreach Timeline & Activity</span>
            <span className="text-[10px] text-slate-500">
              {submission.timeline.length} recorded events
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {submission.timeline.map((event) => (
              <div
                key={event.id}
                className="bg-slate-850 border border-slate-800/80 rounded-lg p-2.5 text-xs flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{event.title}</span>
                    <span className="text-[10px] text-slate-500">{event.date}</span>
                  </div>
                  {event.note && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add quick note */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Add activity note (e.g. Sent signed physical galley via UPS)..."
              value={newLogNote}
              onChange={(e) => setNewLogNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTimelineEvent()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
            <button
              onClick={handleAddTimelineEvent}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg transition"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
