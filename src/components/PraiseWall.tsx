import React, { useState } from 'react';
import {
  Award,
  Star,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Quote,
  Share2,
  BookmarkPlus,
  BookOpen,
} from 'lucide-react';
import { BookProfile, ReviewerOutlet, Submission } from '../types';
import { generateBlurbsApi } from '../services/api';

interface PraiseWallProps {
  book: BookProfile;
  submissions: Submission[];
  reviewers: ReviewerOutlet[];
}

export const PraiseWall: React.FC<PraiseWallProps> = ({
  book,
  submissions,
  reviewers,
}) => {
  const [rawReviewText, setRawReviewText] = useState('');
  const [sourceOutlet, setSourceOutlet] = useState('');
  const [sourceReviewer, setSourceReviewer] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedBlurbs, setExtractedBlurbs] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const reviewerMap = new Map<string, ReviewerOutlet>();
  reviewers.forEach((r) => reviewerMap.set(r.id, r));

  // Find all published reviews for current book
  const publishedSubmissions = submissions.filter(
    (s) => s.bookId === book.id && s.status === 'review_published' && s.reviewQuote
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExtractBlurbs = async () => {
    if (!rawReviewText.trim()) return;
    setIsExtracting(true);

    try {
      const res = await generateBlurbsApi({
        bookTitle: book.title,
        reviewText: rawReviewText,
        publication: sourceOutlet || 'Literary Review Outlet',
        reviewerName: sourceReviewer || 'Staff Critic',
      });
      setExtractedBlurbs(res);
    } catch (e) {
      console.error('Failed to extract blurbs', e);
      alert('Failed to generate blurbs. Please check backend.');
    } finally {
      setIsExtracting(false);
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
                <Award className="w-3.5 h-3.5" /> Editorial Reviews & Praise Wall
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Social Proof & Amazon Editorial Generator</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">
              Praise, Blurbs & Press Quotes
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Turn your published reviews into punchy book cover pull quotes, Amazon product page "Editorial Reviews," and social promo assets for <strong>"{book.title}"</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Published Reviews Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Quote className="w-4 h-4 text-amber-400" />
              Landed Reviews & Editorial Praise ({publishedSubmissions.length})
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">Ready for Amazon & Book Covers</span>
          </div>

          {publishedSubmissions.length > 0 ? (
            <div className="space-y-3">
              {publishedSubmissions.map((sub) => {
                const rev = reviewerMap.get(sub.reviewerId);
                return (
                  <div
                    key={sub.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {rev?.publication || 'Review Outlet'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          {rev?.category.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: sub.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="relative pl-4 border-l-2 border-amber-500/60 text-slate-200 text-xs italic font-serif leading-relaxed">
                      "{sub.reviewQuote}"
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>Reviewed by {rev?.name}</span>
                      <div className="flex items-center gap-2">
                        {sub.reviewUrl && (
                          <a
                            href={sub.reviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                          >
                            <span>View Original Review</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => handleCopy(`"${sub.reviewQuote}" — ${rev?.publication}`, sub.id)}
                          className="text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition"
                        >
                          {copiedKey === sub.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Quote
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
              <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="font-bold text-slate-300">No Published Reviews Logged Yet</div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                As reviewers read and post reviews, update their status to "Review Published" in the Pipeline to archive their quotes here!
              </p>
            </div>
          )}
        </div>

        {/* Right: AI Blurb Extractor Tool */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Pull-Quote & Blurb Extractor
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Got a lengthy editorial review from a blog or trade journal? Paste it below to extract one-line book cover hooks and Amazon product description snippets.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                    Publication / Outlet
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kirkus Reviews, CrimeReads"
                    value={sourceOutlet}
                    onChange={(e) => setSourceOutlet(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                    Reviewer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Critic"
                    value={sourceReviewer}
                    onChange={(e) => setSourceReviewer(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                  Full Review Text:
                </label>
                <textarea
                  rows={5}
                  value={rawReviewText}
                  onChange={(e) => setRawReviewText(e.target.value)}
                  placeholder="Paste the full paragraph or article review here..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <button
                onClick={handleExtractBlurbs}
                disabled={isExtracting || !rawReviewText.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/15"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Extracting with Gemini...' : 'Generate Marketing Blurbs'}</span>
              </button>
            </div>

            {/* Results */}
            {extractedBlurbs && (
              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                {/* Pull Quotes */}
                <div>
                  <div className="font-semibold text-slate-300 text-[11px] mb-1">
                    Book Cover Pull Quotes:
                  </div>
                  {extractedBlurbs.shortPullQuotes?.map((quote: string, i: number) => (
                    <div
                      key={i}
                      onClick={() => handleCopy(quote, `quote-${i}`)}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-800 p-2 rounded-lg text-slate-200 italic mb-1.5 cursor-pointer flex items-center justify-between group transition"
                    >
                      <span>{quote}</span>
                      <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                        {copiedKey === `quote-${i}` ? 'Copied!' : 'Click to copy'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Amazon Snippet */}
                {extractedBlurbs.editorialReviewSnippet && (
                  <div>
                    <div className="flex items-center justify-between font-semibold text-slate-300 text-[11px] mb-1">
                      <span>Amazon Editorial Reviews Snippet:</span>
                      <button
                        onClick={() => handleCopy(extractedBlurbs.editorialReviewSnippet, 'amazon')}
                        className="text-amber-400 hover:text-amber-300 font-normal text-[10px]"
                      >
                        {copiedKey === 'amazon' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                      {extractedBlurbs.editorialReviewSnippet}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
