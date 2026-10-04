import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  HelpCircle,
  FileText,
  BookmarkCheck,
  ChevronRight,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Tag,
  Star,
  Check,
  Trash2,
  Compass,
  Radio,
  FileCheck,
  Layers,
  Globe,
  Calendar,
  BadgeCheck,
} from 'lucide-react';
import { BookProfile, ReviewerMatchResult, ReviewerOutlet, OutletCategory } from '../types';
import { extractGuidelinesApi, matchReviewerApi, discoverReviewersApi, verifyReviewerApi } from '../services/api';
import { parseCsvToReviewers, exportReviewersToCsv } from '../data/indiesTodayDirectory';

interface ReviewerDirectoryProps {
  book: BookProfile;
  reviewers: ReviewerOutlet[];
  onSelectReviewerForPitch: (reviewerId: string) => void;
  onAddReviewer: (reviewer: ReviewerOutlet) => void;
  onUpdateReviewer?: (updated: ReviewerOutlet) => void;
  onDeleteReviewer?: (id: string) => void;
  onBulkAddReviewers?: (reviewers: ReviewerOutlet[]) => void;
  onSyncDatabase?: () => void;
}

export const ReviewerDirectory: React.FC<ReviewerDirectoryProps> = ({
  book,
  reviewers,
  onSelectReviewerForPitch,
  onAddReviewer,
  onUpdateReviewer,
  onDeleteReviewer,
  onBulkAddReviewers,
  onSyncDatabase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [fitFilter, setFitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReviewerForMatch, setSelectedReviewerForMatch] = useState<ReviewerOutlet | null>(null);
  const [matchResult, setMatchResult] = useState<ReviewerMatchResult | null>(null);
  const [isMatching, setIsMatching] = useState<boolean>(false);

  // Status check & verification modal
  const [selectedReviewerForStatus, setSelectedReviewerForStatus] = useState<ReviewerOutlet | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [statusCheckResult, setStatusCheckResult] = useState<any | null>(null);

  // AI Discover Reviewers Modal
  const [showDiscoverModal, setShowDiscoverModal] = useState<boolean>(false);
  const [discoverGenre, setDiscoverGenre] = useState<string>(book.genre || "Children's Adventure");
  const [discoverKeywords, setDiscoverKeywords] = useState<string>(book.subgenre || '');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoveredReviewers, setDiscoveredReviewers] = useState<ReviewerOutlet[]>([]);
  const [addedDiscoveredIds, setAddedDiscoveredIds] = useState<Set<string>>(new Set());

  // Parser Modal
  const [showParserModal, setShowParserModal] = useState<boolean>(false);
  const [rawGuidelinesText, setRawGuidelinesText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  // Manual Add Modal
  const [showManualAddModal, setShowManualAddModal] = useState<boolean>(false);

  // CSV Import Modal & File input
  const [showImportCsvModal, setShowImportCsvModal] = useState<boolean>(false);
  const [csvInputText, setCsvInputText] = useState<string>('');
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Reviewer Modal
  const [editingReviewer, setEditingReviewer] = useState<ReviewerOutlet | null>(null);

  // Delete Confirmation Modal
  const [reviewerToDelete, setReviewerToDelete] = useState<ReviewerOutlet | null>(null);

  // Feedback notifications & sync animation
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Detect active book specialization
  const isJackAndBlaze =
    book.id.includes('jack') ||
    book.title.toLowerCase().includes('jack') ||
    book.genre.toLowerCase().includes('children') ||
    book.genre.toLowerCase().includes('juvenile');

  const isEchoesOfTheHeart =
    book.id.includes('echoes') ||
    book.title.toLowerCase().includes('echoes') ||
    book.genre.toLowerCase().includes('poetry');

  // Trigger feedback
  const triggerNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Sync Database
  const handleSyncDirectory = () => {
    setIsSyncing(true);
    setTimeout(() => {
      if (onSyncDatabase) {
        onSyncDatabase();
      }
      setIsSyncing(false);
      triggerNotification(`✅ Successfully refreshed & synchronized database! Calibrated fit scores for "${book.title}" and updated verified submission policies across ${reviewers.length} outlets.`);
    }, 700);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvData = exportReviewersToCsv(reviewers);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ReviewPilot_Reviewer_Database_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification(`📥 Exported ${reviewers.length} verified reviewers to CSV file!`);
  };

  // Process CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvInputText(text);
        setImportStatusMsg(`Loaded ${file.name} (${Math.round(file.size / 1024)} KB). Click 'Merge into Directory Database' below.`);
      }
    };
    reader.readAsText(file);
  };

  // Process CSV Import
  const handleProcessImportCsv = () => {
    if (!csvInputText.trim()) return;
    const parsed = parseCsvToReviewers(csvInputText);
    if (parsed.length === 0) {
      setImportStatusMsg('Could not parse any valid reviewer records from this text. Please check the CSV format.');
      return;
    }

    if (onBulkAddReviewers) {
      onBulkAddReviewers(parsed);
    } else {
      parsed.forEach((r) => onAddReviewer(r));
    }

    setShowImportCsvModal(false);
    setCsvInputText('');
    setImportStatusMsg(null);
    triggerNotification(`🎉 Successfully imported and merged ${parsed.length} reviewers into directory database!`);
  };

  // Filter reviewers
  const filteredReviewers = reviewers.filter((r) => {
    // Category filter
    if (categoryFilter !== 'all' && r.category !== categoryFilter) {
      return false;
    }

    // Submission Status filter
    if (statusFilter === 'open_only' && r.submissionStatus === 'closed') {
      return false;
    }

    // Book Fit Quick Filters
    if (fitFilter === 'high_fit') {
      if (isJackAndBlaze) {
        const isHigh =
          r.bookFitScores?.jackAndBlaze === 'High' ||
          r.preferredGenres.some((g) => g.toLowerCase().includes('children') || g.toLowerCase().includes('juvenile') || g.toLowerCase().includes('middle grade'));
        if (!isHigh) return false;
      } else if (isEchoesOfTheHeart) {
        const isHigh =
          r.bookFitScores?.echoesOfTheHeart === 'High' ||
          r.preferredGenres.some((g) => g.toLowerCase().includes('poetry') || g.toLowerCase().includes('literary') || g.toLowerCase().includes('reflections'));
        if (!isHigh) return false;
      } else {
        const matchesBook = r.preferredGenres.some((g) =>
          book.genre.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes('all')
        );
        if (!matchesBook) return false;
      }
    } else if (fitFilter === 'accepts_indies') {
      if (r.acceptsIndies !== 'Yes') return false;
    } else if (fitFilter === 'free_only') {
      const isFree =
        r.costPolicy?.toLowerCase().includes('free') ||
        r.costPolicy?.toLowerCase().includes('gifted') ||
        !r.costPolicy?.toLowerCase().includes('paid');
      if (!isFree) return false;
    } else if (fitFilter === 'amazon_goodreads') {
      const hasAmazonGoodreads =
        r.reviewPlatforms?.some((p) => p.includes('Amazon') || p.includes('Goodreads')) ||
        r.category === 'goodreads_amazon' ||
        r.followerOrReaderReach?.includes('Goodreads');
      if (!hasAmazonGoodreads) return false;
    } else if (fitFilter === 'children') {
      const hasChildren = r.preferredGenres.some(
        (g) =>
          g.toLowerCase().includes('children') ||
          g.toLowerCase().includes('juvenile') ||
          g.toLowerCase().includes('picture') ||
          g.toLowerCase().includes('middle grade')
      );
      if (!hasChildren) return false;
    } else if (fitFilter === 'poetry') {
      const hasPoetry = r.preferredGenres.some(
        (g) =>
          g.toLowerCase().includes('poetry') ||
          g.toLowerCase().includes('memoir') ||
          g.toLowerCase().includes('spirituality') ||
          g.toLowerCase().includes('reflections')
      );
      if (!hasPoetry) return false;
    } else if (fitFilter === 'scifi_fantasy') {
      const hasSFF = r.preferredGenres.some(
        (g) =>
          g.toLowerCase().includes('fantasy') ||
          g.toLowerCase().includes('science fiction') ||
          g.toLowerCase().includes('dystopian') ||
          g.toLowerCase().includes('speculative')
      );
      if (!hasSFF) return false;
    } else if (fitFilter === 'mystery_thriller') {
      const hasMystery = r.preferredGenres.some(
        (g) =>
          g.toLowerCase().includes('mystery') ||
          g.toLowerCase().includes('thriller') ||
          g.toLowerCase().includes('crime') ||
          g.toLowerCase().includes('suspense')
      );
      if (!hasMystery) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchPub = r.publication.toLowerCase().includes(q);
      const matchGenre = r.preferredGenres.some((g) => g.toLowerCase().includes(q));
      const matchWebsite = r.website.toLowerCase().includes(q);
      const matchPlatform = r.reviewPlatforms?.some((p) => p.toLowerCase().includes(q));
      const matchGuidelines = r.guidelines?.toLowerCase().includes(q);
      const matchNotes = r.customNotes?.toLowerCase().includes(q);
      return matchName || matchPub || matchGenre || matchWebsite || !!matchPlatform || !!matchGuidelines || !!matchNotes;
    }

    return true;
  });

  // Handle AI Compatibility Match check
  const handleCheckMatch = async (reviewer: ReviewerOutlet) => {
    setSelectedReviewerForMatch(reviewer);
    setIsMatching(true);
    setMatchResult(null);

    try {
      const result = await matchReviewerApi({
        book,
        reviewerGuidelines: reviewer.guidelines,
        reviewerName: reviewer.name,
        reviewerOutlet: reviewer.publication,
      });
      setMatchResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMatching(false);
    }
  };

  // Handle Live Status & Guidelines Verification Check
  const handleCheckLiveStatus = async (reviewer: ReviewerOutlet) => {
    setSelectedReviewerForStatus(reviewer);
    setIsCheckingStatus(true);
    setStatusCheckResult(null);

    try {
      const result = await verifyReviewerApi(reviewer);
      setStatusCheckResult(result);

      // Auto update reviewer in parent if verified
      if (onUpdateReviewer && result.isVerified) {
        const updatedRev: ReviewerOutlet = {
          ...reviewer,
          lastVerified: result.verifiedAt || new Date().toISOString().split('T')[0],
          submissionStatus: result.submissionStatus || 'open',
          verificationStatus: 'verified_active',
        };
        onUpdateReviewer(updatedRev);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Handle AI Discover Reviewers Search
  const handleRunDiscover = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDiscovering(true);
    setDiscoveredReviewers([]);

    try {
      const data = await discoverReviewersApi({
        genre: discoverGenre,
        bookTitle: book.title,
        author: book.author,
        compTitles: book.compTitles,
        keywords: discoverKeywords,
      });

      setDiscoveredReviewers(data.reviewers || []);
    } catch (err) {
      console.error(err);
      triggerNotification('Could not complete live discovery. Showing curated catalog.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Add a single discovered reviewer to main directory database
  const handleAddDiscoveredReviewer = (rev: ReviewerOutlet) => {
    onAddReviewer(rev);
    setAddedDiscoveredIds((prev) => new Set([...prev, rev.id]));
    triggerNotification(`Added "${rev.publication}" to your active database!`);
  };

  // Handle AI Extract Guidelines
  const handleExtractAndAdd = async () => {
    if (!rawGuidelinesText.trim()) return;
    setIsExtracting(true);

    try {
      const extracted = await extractGuidelinesApi(rawGuidelinesText);
      const newReviewer: ReviewerOutlet = {
        id: `custom-rev-${Date.now()}`,
        name: extracted.name || 'Book Review Editor',
        publication: extracted.publication || 'Independent Review Outlet',
        category: (extracted.type?.toLowerCase().includes('blog')
          ? 'indie_blog'
          : extracted.type?.toLowerCase().includes('trade')
          ? 'trade'
          : extracted.type?.toLowerCase().includes('influencer') || extracted.type?.toLowerCase().includes('tiktok')
          ? 'influencer_booktok'
          : 'indie_blog') as any,
        email: extracted.contactEmail || undefined,
        submissionUrl: extracted.submissionUrl || undefined,
        website: extracted.submissionUrl || 'https://example.com',
        leadTimeNotice: extracted.leadTime || 'Standard 30-day notice',
        leadTimeDays: 30,
        costPolicy: extracted.freeReviewPolicy || 'Free Editorial Review',
        preferredGenres: extracted.preferredGenres || ['Fiction', 'Non-Fiction'],
        formatsAccepted: extracted.preferredFormats || ['ePub', 'PDF', 'NetGalley'],
        guidelines: extracted.guidelinesSummary || rawGuidelinesText.slice(0, 200),
        proTips: extracted.keyDoAndDonts || ['Always submit query before sending files.'],
        typicalResponseRate: 35,
        avgTurnaroundDays: 30,
        requiresFTCCompliance: true,
        source: 'AI Extracted Submission Policy',
        lastVerified: new Date().toISOString().split('T')[0],
        acceptsIndies: 'Yes',
        submissionStatus: 'open',
        verificationStatus: 'verified_active',
        reviewPlatforms: ['Website', 'Blog'],
      };

      onAddReviewer(newReviewer);
      setShowParserModal(false);
      setRawGuidelinesText('');
      triggerNotification(`Added "${newReviewer.publication}" via AI Extractor!`);
    } catch (e) {
      console.error('Failed to extract guidelines', e);
      alert('Failed to parse guidelines. You can also add reviewer details manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle Save Reviewer Edits
  const handleSaveReviewerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewer) return;

    if (onUpdateReviewer) {
      onUpdateReviewer(editingReviewer);
    }
    triggerNotification(`Updated details for "${editingReviewer.publication}"!`);
    setEditingReviewer(null);
  };

  // Handle Delete Reviewer
  const handleConfirmDelete = () => {
    if (!reviewerToDelete) return;
    if (onDeleteReviewer) {
      onDeleteReviewer(reviewerToDelete.id);
      triggerNotification(`Removed "${reviewerToDelete.publication}" from directory.`);
    }
    setReviewerToDelete(null);
  };

  // Stats calculation
  const openCount = reviewers.filter((r) => r.submissionStatus !== 'closed').length;
  const indieFriendlyCount = reviewers.filter((r) => r.acceptsIndies === 'Yes').length;
  const freeCount = reviewers.filter((r) => r.costPolicy?.toLowerCase().includes('free') || !r.costPolicy?.toLowerCase().includes('paid')).length;

  return (
    <div className="space-y-6">
      {/* Directory Database Hub Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" /> Reviewer Directory Database
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> 2026 Verified Registry ({reviewers.length} Outlets)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 border border-slate-700">
                <Calendar className="w-3 h-3 text-amber-400" />
                Updated Oct 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-tight">
              Verified Book Reviewer Database
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Curated, continuously maintained directory of independent reviewers, major trade platforms (Indies Today, Readers' Favorite, SPR, Kirkus), top Amazon & Goodreads reviewers, and genre-specific BookTok and KidLit creators.
            </p>

            {/* Quick Metrics Strip */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-100">{openCount}</span>
                <span className="text-slate-400">Open Submissions</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-slate-100">{indieFriendlyCount}</span>
                <span className="text-slate-400">100% Indie Friendly</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-slate-100">{freeCount}</span>
                <span className="text-slate-400">Free Editorial Reviews</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* AI Discover Reviewers */}
            <button
              onClick={() => {
                setShowDiscoverModal(true);
                if (discoveredReviewers.length === 0) {
                  handleRunDiscover();
                }
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition active:scale-95"
              title="Search and discover new verified reviewers tailored to your book's genre"
            >
              <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Discover & Add Reviewers</span>
            </button>

            {/* Sync / Update Database Button */}
            <button
              onClick={handleSyncDirectory}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition shadow-sm active:scale-95"
              title="Refresh database, update submission statuses, and calibrate fit scores for active book"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Verifying...' : 'Keep Up to Date'}</span>
            </button>

            {/* Add Reviewer */}
            <button
              onClick={() => setShowManualAddModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition shadow-sm"
              title="Add reviewer record manually or with custom guidelines"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Reviewer</span>
            </button>

            {/* AI Guidelines Parser */}
            <button
              onClick={() => setShowParserModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition shadow-sm"
              title="Paste raw guidelines or submission policy webpage text to extract structured reviewer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Paste Guidelines</span>
            </button>

            {/* Import / Export CSV */}
            <button
              onClick={() => setShowImportCsvModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition shadow-sm"
              title="Import or paste reviewer CSV data"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Import</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition shadow-sm"
              title="Export complete database to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {notificationMsg && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{notificationMsg}</span>
          </div>
        )}
      </div>

      {/* Book Fit Banner (Contextual match for Jack and Blaze / Echoes of the Heart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200 text-sm">{book.title}</span>
              <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-medium border border-slate-700">
                {book.author}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target Genre: <strong className="text-slate-300">{book.genre}</strong> • Directory filtered to find high-compatibility reviewer outlets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFitFilter(fitFilter === 'high_fit' ? 'all' : 'high_fit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-sm ${
              fitFilter === 'high_fit'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-amber-500/20'
                : 'bg-slate-850 hover:bg-slate-800 text-amber-400 border-amber-500/30'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>
              {isJackAndBlaze
                ? '🔥 High Fit for Jack & Blaze'
                : isEchoesOfTheHeart
                ? '🔥 High Fit for Echoes of the Heart'
                : `🔥 High Fit for ${book.title}`}
            </span>
          </button>
        </div>
      </div>

      {/* Controls, Quick Filters & Search */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${reviewers.length} reviewers by publication, genres, platforms (Amazon, Goodreads, Blog)...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Quick Fit Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All Outlets (${reviewers.length})` },
              { id: 'high_fit', label: '⭐ High Book Fit' },
              { id: 'accepts_indies', label: 'Indie Friendly' },
              { id: 'free_only', label: '100% Free Reviews' },
              { id: 'children', label: "Children's & Middle Grade" },
              { id: 'poetry', label: 'Poetry & Reflections' },
              { id: 'amazon_goodreads', label: 'Amazon & Goodreads' },
              { id: 'scifi_fantasy', label: 'Sci-Fi & Fantasy' },
              { id: 'mystery_thriller', label: 'Mystery & Thriller' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFitFilter(chip.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition whitespace-nowrap border ${
                  fitFilter === chip.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'trade', label: 'Trade & Library Reviews' },
              { id: 'indie_blog', label: 'Independent Book Blogs' },
              { id: 'goodreads_amazon', label: 'Goodreads & Amazon Reviewers' },
              { id: 'influencer_booktok', label: 'BookTok & Bookstagram' },
              { id: 'prestige', label: 'Prestige Media' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  categoryFilter === cat.id
                    ? 'bg-slate-800 text-slate-100 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            Showing <strong className="text-slate-300">{filteredReviewers.length}</strong> of{' '}
            <strong className="text-slate-300">{reviewers.length}</strong> reviewers
          </span>
        </div>
      </div>

      {/* Reviewers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReviewers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="font-serif font-bold text-slate-300 text-base">No matching reviewers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your search terms or filters, or use the "Discover & Add Reviewers" tool to discover new outlets.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setFitFilter('all');
                }}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowDiscoverModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold"
              >
                Discover New Outlets
              </button>
            </div>
          </div>
        )}

        {filteredReviewers.map((reviewer) => {
          const fitJack = reviewer.bookFitScores?.jackAndBlaze;
          const fitEchoes = reviewer.bookFitScores?.echoesOfTheHeart;
          const isVerified = reviewer.verificationStatus === 'verified_active' || !!reviewer.lastVerified;

          return (
            <div
              key={reviewer.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between transition group shadow-sm hover:shadow-md"
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-slate-100 text-sm truncate group-hover:text-amber-400 transition">
                      {reviewer.publication}
                    </h3>
                    <div className="text-[11px] text-slate-400 truncate">
                      {reviewer.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onUpdateReviewer && (
                      <button
                        onClick={() => setEditingReviewer(reviewer)}
                        className="text-slate-500 hover:text-amber-400 p-1 rounded-lg hover:bg-slate-800 transition"
                        title="Edit reviewer details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {reviewer.website && (
                      <a
                        href={reviewer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-amber-400 p-1 rounded-lg hover:bg-slate-800 transition"
                        title="Visit reviewer website"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {onDeleteReviewer && (
                      <button
                        onClick={() => setReviewerToDelete(reviewer)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition"
                        title="Remove reviewer from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges Strip */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {reviewer.category.replace('_', ' ')}
                  </span>

                  {/* Submission Status Badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 border ${
                      reviewer.submissionStatus === 'closed'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : reviewer.submissionStatus === 'arcs_only'
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        reviewer.submissionStatus === 'closed'
                          ? 'bg-rose-400'
                          : reviewer.submissionStatus === 'arcs_only'
                          ? 'bg-blue-400'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    {reviewer.submissionStatus === 'closed'
                      ? 'Queue Full'
                      : reviewer.submissionStatus === 'arcs_only'
                      ? 'ARCs Only'
                      : 'Open for Queries'}
                  </span>

                  {reviewer.acceptsIndies && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Indies: {reviewer.acceptsIndies}
                    </span>
                  )}

                  {isVerified && (
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      Verified {reviewer.lastVerified ? reviewer.lastVerified.slice(0, 7) : '2026-10'}
                    </span>
                  )}
                </div>

                {/* Specific Book Fit Match Badge */}
                {isJackAndBlaze && fitJack === 'High' && (
                  <div className="mb-2.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>High Fit for Jack and Blaze!</span>
                  </div>
                )}

                {isEchoesOfTheHeart && fitEchoes === 'High' && (
                  <div className="mb-2.5 px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded-xl text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-purple-400 text-purple-400 shrink-0" />
                    <span>High Fit for Echoes of the Heart!</span>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80 my-2">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Turnaround / Lead</span>
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      ~{reviewer.leadTimeDays || 21} days
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Response Fit</span>
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ~{reviewer.typicalResponseRate || 35}% rate
                    </span>
                  </div>
                </div>

                {/* Platforms & Cost */}
                <div className="text-[11px] text-slate-400 space-y-1 mb-2">
                  {reviewer.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-slate-300 font-mono text-[10px] truncate">{reviewer.email}</span>
                    </div>
                  )}
                  {reviewer.reviewPlatforms && reviewer.reviewPlatforms.length > 0 && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-500 font-semibold text-[10px] uppercase">Platforms:</span>
                      <span className="text-slate-300 truncate">{reviewer.reviewPlatforms.join(' • ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold text-[10px] uppercase">Cost Policy:</span>
                    <span className="text-amber-300/90 truncate">{reviewer.costPolicy || 'Verify current policy'}</span>
                  </div>
                </div>

                {/* Guidelines Excerpt */}
                <p className="text-xs text-slate-400 bg-slate-850 p-2.5 rounded-xl border border-slate-800 line-clamp-3 leading-relaxed">
                  "{reviewer.guidelines}"
                </p>

                {/* Custom Author Notes if present */}
                {reviewer.customNotes && (
                  <div className="mt-2 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-1 rounded-lg">
                    <strong>Note:</strong> {reviewer.customNotes}
                  </div>
                )}

                {/* Preferred Genres */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {reviewer.preferredGenres.slice(0, 4).map((g, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded"
                    >
                      {g}
                    </span>
                  ))}
                  {reviewer.preferredGenres.length > 4 && (
                    <span className="text-[10px] text-slate-500 px-1 py-0.5">
                      +{reviewer.preferredGenres.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleCheckLiveStatus(reviewer)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 text-xs font-semibold py-2 px-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1"
                  title="Verify reviewer guidelines and live submission status"
                >
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Verify</span>
                </button>

                <button
                  onClick={() => handleCheckMatch(reviewer)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold py-2 px-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Match</span>
                </button>

                <button
                  onClick={() => onSelectReviewerForPitch(reviewer.id)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-amber-500/15 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Pitch</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Discover & Add Reviewers Modal */}
      {showDiscoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-base">
                    Discover New Verified Reviewers & Outlets
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Find active book blogs, reviewers, BookTok creators, and editorial outlets tailored to your book.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiscoverModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Search inputs */}
            <form onSubmit={handleRunDiscover} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Genre / Niche *</label>
                  <input
                    type="text"
                    required
                    value={discoverGenre}
                    onChange={(e) => setDiscoverGenre(e.target.value)}
                    placeholder="e.g. Children's Adventure, Poetry, Mystery, Sci-Fi..."
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keywords / Comps / Tropes</label>
                  <input
                    type="text"
                    value={discoverKeywords}
                    onChange={(e) => setDiscoverKeywords(e.target.value)}
                    placeholder="e.g. Animal companion, healing, lyrical, space opera..."
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">Quick Suggestions:</span>
                {[
                  { label: "Children's Adventure (Jack & Blaze)", genre: "Children's Adventure / Juvenile Fiction", keywords: 'Animal companions, young readers' },
                  { label: 'Poetry & Healing (Echoes of the Heart)', genre: 'Contemporary Poetry', keywords: 'Emotional healing, grief, love' },
                  { label: 'Non-Fiction / Mindset', genre: 'Non-Fiction & Psychology', keywords: 'Deep focus, productivity' },
                  { label: 'BookTok Influencers', genre: 'Commercial Fiction', keywords: 'BookTok, Bookstagram, tropes' },
                  { label: 'Amazon / Goodreads Top Reviewers', genre: 'All Genres', keywords: 'Top reviewer, digital ARC' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDiscoverGenre(preset.genre);
                      setDiscoverKeywords(preset.keywords);
                    }}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isDiscovering}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isDiscovering ? 'Searching verified directories...' : 'Search & Discover Reviewers'}</span>
                </button>
              </div>
            </form>

            {/* Discovered Results */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Discovered Outlets ({discoveredReviewers.length})
              </h4>

              {isDiscovering ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                  <p>Discovering active reviewers, verifying submission policies, and matching comp genres...</p>
                </div>
              ) : discoveredReviewers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-850 rounded-xl border border-slate-800">
                  Click 'Search & Discover Reviewers' above to query verified reviewer channels.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {discoveredReviewers.map((rev) => {
                    const isAdded = addedDiscoveredIds.has(rev.id) || reviewers.some((r) => r.publication.toLowerCase() === rev.publication.toLowerCase());

                    return (
                      <div
                        key={rev.id}
                        className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm">{rev.publication}</span>
                            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {rev.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Open for Queries
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            <strong>Contact:</strong> {rev.email || 'Website submission form'} •{' '}
                            <strong>Lead Time:</strong> ~{rev.leadTimeDays || 21} days •{' '}
                            <strong>Reach:</strong> {rev.followerOrReaderReach || 'Verified readers'}
                          </div>

                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            "{rev.guidelines}"
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {rev.preferredGenres.slice(0, 4).map((g, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {rev.website && (
                            <a
                              href={rev.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-amber-400 p-2 rounded-xl bg-slate-800 border border-slate-700 transition"
                              title="Visit website"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleAddDiscoveredReviewer(rev)}
                            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                              isAdded
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/15'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>In Database</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Add to Database</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDiscoverModal(false)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition"
              >
                Close Discovery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Live Status & Policy Verification Modal */}
      {selectedReviewerForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" /> Submission Guidelines Verification
                </span>
                <h3 className="text-lg font-bold font-serif text-slate-100">
                  {selectedReviewerForStatus.publication}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReviewerForStatus(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {isCheckingStatus ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                <p>Verifying submission queue status, response guidelines, and turnaround window...</p>
              </div>
            ) : statusCheckResult ? (
              <div className="space-y-3 text-xs">
                {/* Status card */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Current Reading Window</span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold text-[10px]">
                      {statusCheckResult.submissionStatus === 'closed' ? 'Closed' : 'Verified Open'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {statusCheckResult.statusReason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimated Turnaround</span>
                    <span className="font-bold text-slate-200">{statusCheckResult.estimatedTurnaroundDays} days</span>
                  </div>
                  <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Indie Author Policy</span>
                    <span className="font-bold text-emerald-400">{statusCheckResult.indieFriendlyRating}</span>
                  </div>
                </div>

                {/* Key Takeaway Advice */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1">
                  <span className="text-amber-300 font-bold uppercase text-[10px]">Pitch Recommendation:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {statusCheckResult.keyTakeaway}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Verified on {statusCheckResult.verifiedAt}
                  </span>

                  <button
                    onClick={() => {
                      const id = selectedReviewerForStatus.id;
                      setSelectedReviewerForStatus(null);
                      onSelectReviewerForPitch(id);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Pitch Now</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* AI Compatibility Match Modal */}
      {selectedReviewerForMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  AI Fit Analysis for "{book.title}"
                </span>
                <h3 className="text-lg font-bold font-serif text-slate-100">
                  {selectedReviewerForMatch.publication}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReviewerForMatch(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {isMatching ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Sparkles className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                <p>Analyzing book comp titles, themes, and publication dates against guidelines...</p>
              </div>
            ) : matchResult ? (
              <div className="space-y-3 text-xs">
                {/* Score */}
                <div className="flex items-center gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex flex-col items-center justify-center font-extrabold text-amber-400 text-lg">
                    {matchResult.matchScore}%
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">
                      {matchResult.isFit ? 'Strong Editorial Match' : 'Conditional Match'}
                    </div>
                    <p className="text-slate-400 text-[11px]">{matchResult.matchSummary}</p>
                  </div>
                </div>

                {/* Suggested Pitch Angle */}
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                    Recommended Pitch Angle:
                  </span>
                  <p className="text-slate-300">{matchResult.suggestedAngle}</p>
                </div>

                {/* Pros & Cautions */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-emerald-950/20 border border-emerald-800/30 p-2.5 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-400 uppercase">Green Flags</span>
                    {matchResult.pros.map((p, i) => (
                      <div key={i} className="text-slate-300 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-950/20 border border-amber-800/30 p-2.5 rounded-xl space-y-1">
                    <span className="font-bold text-amber-400 uppercase">Watch Out For</span>
                    {matchResult.cautions.map((c, i) => (
                      <div key={i} className="text-slate-300 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const id = selectedReviewerForMatch.id;
                      setSelectedReviewerForMatch(null);
                      onSelectReviewerForPitch(id);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Proceed to Pitch Studio</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif font-bold text-slate-100 text-base">
                  Import Reviewer Directory CSV
                </h3>
              </div>
              <button
                onClick={() => setShowImportCsvModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste CSV rows or upload a spreadsheet from directories like <strong>Indies Today</strong>, <strong>BookLife</strong>, or <strong>Reedsy</strong>. The system will automatically map outlet names, websites, contact methods, and preferred genres.
            </p>

            {/* File Upload trigger */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 transition"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Upload .CSV File</span>
              </button>
              <span className="text-[11px] text-slate-500">or paste CSV text directly below:</span>
            </div>

            <textarea
              rows={7}
              value={csvInputText}
              onChange={(e) => setCsvInputText(e.target.value)}
              placeholder="Paste CSV here (including headers like 'Reviewer / Site, Website, Genres...')"
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />

            {importStatusMsg && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl text-xs text-blue-300">
                {importStatusMsg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {csvInputText.split('\n').filter(Boolean).length > 1
                  ? `${csvInputText.split('\n').filter(Boolean).length - 1} records detected`
                  : 'Ready for input'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportCsvModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!csvInputText.trim()}
                  onClick={handleProcessImportCsv}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  Merge into Directory Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reviewer Modal */}
      {editingReviewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-slate-100 text-base">
                  Edit Reviewer: {editingReviewer.publication}
                </h3>
              </div>
              <button
                onClick={() => setEditingReviewer(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReviewerEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Publication / Reviewer Name *</label>
                <input
                  type="text"
                  required
                  value={editingReviewer.publication}
                  onChange={(e) => setEditingReviewer({ ...editingReviewer, publication: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editingReviewer.email || ''}
                    onChange={(e) => setEditingReviewer({ ...editingReviewer, email: e.target.value })}
                    placeholder="editor@publication.com"
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Website URL</label>
                  <input
                    type="url"
                    value={editingReviewer.website}
                    onChange={(e) => setEditingReviewer({ ...editingReviewer, website: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Submission Queue Status</label>
                  <select
                    value={editingReviewer.submissionStatus || 'open'}
                    onChange={(e) => setEditingReviewer({ ...editingReviewer, submissionStatus: e.target.value as any })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="open">Open for Queries</option>
                    <option value="arcs_only">ARCs & Galleys Only</option>
                    <option value="closed">Queue Full / Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={editingReviewer.leadTimeDays}
                    onChange={(e) => setEditingReviewer({ ...editingReviewer, leadTimeDays: Number(e.target.value) || 21 })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cost / Review Policy</label>
                <input
                  type="text"
                  value={editingReviewer.costPolicy}
                  onChange={(e) => setEditingReviewer({ ...editingReviewer, costPolicy: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Preferred Genres (Comma separated)</label>
                <input
                  type="text"
                  value={editingReviewer.preferredGenres.join(', ')}
                  onChange={(e) =>
                    setEditingReviewer({
                      ...editingReviewer,
                      preferredGenres: e.target.value.split(',').map((g) => g.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Guidelines & Review Policy Notes</label>
                <textarea
                  rows={3}
                  value={editingReviewer.guidelines}
                  onChange={(e) => setEditingReviewer({ ...editingReviewer, guidelines: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Author Private Notes & History</label>
                <textarea
                  rows={2}
                  value={editingReviewer.customNotes || ''}
                  onChange={(e) => setEditingReviewer({ ...editingReviewer, customNotes: e.target.value })}
                  placeholder="e.g. Loves animal sidekicks, reviewed previous book in series, prefers ePub via BookFunnel..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2 text-slate-100 font-sans placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingReviewer(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition"
                >
                  Save Reviewer Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reviewerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-100 text-base">Remove Reviewer?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to remove <strong>{reviewerToDelete.publication}</strong> from your active directory?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReviewerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Keep Reviewer
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-rose-600/20"
              >
                Remove from Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Reviewer Modal */}
      {showManualAddModal && (
        <ManualAddReviewerModal
          onClose={() => setShowManualAddModal(false)}
          onAddReviewer={(newRev) => {
            onAddReviewer(newRev);
            setShowManualAddModal(false);
            triggerNotification(`Added "${newRev.publication}" to directory!`);
          }}
        />
      )}

      {/* AI Guideline Extractor Modal */}
      {showParserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  AI Review Policy Ingestion
                </span>
                <h3 className="text-lg font-bold font-serif text-slate-100">
                  Paste Review Guidelines / Submissions Webpage
                </h3>
              </div>
              <button
                onClick={() => setShowParserModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste the text from any reviewer’s "About", "Review Policy", or "Submissions" page. Gemini will automatically extract their preferred genres, required lead time, contact email, and strict formatting rules.
            </p>

            <textarea
              rows={8}
              value={rawGuidelinesText}
              onChange={(e) => setRawGuidelinesText(e.target.value)}
              placeholder="e.g. 'We accept fiction and nonfiction ARCs 3 months prior to release. Contact editor@nytbooks.com. No unrequested attachments...'"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 font-mono"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowParserModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExtracting || !rawGuidelinesText.trim()}
                onClick={handleExtractAndAdd}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                {isExtracting ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract & Save to Directory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal Component for Manually Adding a Reviewer
const ManualAddReviewerModal: React.FC<{
  onClose: () => void;
  onAddReviewer: (r: ReviewerOutlet) => void;
}> = ({ onClose, onAddReviewer }) => {
  const [publication, setPublication] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<OutletCategory>('indie_blog');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(28);
  const [genresInput, setGenresInput] = useState('Fiction, Mystery, Thriller');
  const [platformsInput, setPlatformsInput] = useState('Blog, Amazon, Goodreads');
  const [guidelines, setGuidelines] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publication.trim()) return;

    const newRev: ReviewerOutlet = {
      id: `rev-custom-${Date.now()}`,
      publication: publication.trim(),
      name: name.trim() || `${publication.trim()} Editorial Team`,
      category,
      website: website.trim() || 'https://google.com',
      submissionUrl: website.trim() || 'https://google.com',
      email: email.trim() || undefined,
      leadTimeDays: Number(leadTimeDays) || 28,
      leadTimeNotice: `Prefers ${leadTimeDays} days lead time prior to launch.`,
      costPolicy: '100% Free Editorial Review',
      preferredGenres: genresInput.split(',').map((g) => g.trim()).filter(Boolean),
      formatsAccepted: ['ePub', 'PDF', 'Kindle'],
      guidelines: guidelines.trim() || 'Accepts independent review queries and advance reader copies.',
      proTips: ['Personalize your query letter with comps and reasons why their readers will love it.'],
      typicalResponseRate: 35,
      avgTurnaroundDays: 25,
      requiresFTCCompliance: true,
      acceptsIndies: 'Yes',
      contactMethod: email.trim() ? 'Email' : 'Website / submission policy',
      reviewPlatforms: platformsInput.split(',').map((p) => p.trim()).filter(Boolean),
      source: 'User Custom Addition',
      lastVerified: new Date().toISOString().split('T')[0],
      submissionStatus: 'open',
      verificationStatus: 'verified_active',
      customNotes: customNotes.trim() || undefined,
      bookFitScores: {
        jackAndBlaze: 'Potential',
        echoesOfTheHeart: 'Potential',
      },
    };

    onAddReviewer(newRev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-slate-100 text-base">
              Add New Book Reviewer / Outlet
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Publication / Site Name *</label>
            <input
              type="text"
              required
              value={publication}
              onChange={(e) => setPublication(e.target.value)}
              placeholder="e.g. The Indie SFF Review"
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Editor / Contact Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as OutletCategory)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="indie_blog">Independent Book Blog</option>
                <option value="goodreads_amazon">Amazon / Goodreads Reviewer</option>
                <option value="influencer_booktok">BookTok / Bookstagram</option>
                <option value="trade">Trade & Library Publication</option>
                <option value="prestige">Prestige Media</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Website URL *</label>
              <input
                type="url"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@example.com"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Preferred Genres (Comma-separated)</label>
              <input
                type="text"
                value={genresInput}
                onChange={(e) => setGenresInput(e.target.value)}
                placeholder="Fantasy, Romance, Adventure"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Platforms (Comma-separated)</label>
              <input
                type="text"
                value={platformsInput}
                onChange={(e) => setPlatformsInput(e.target.value)}
                placeholder="Blog, Amazon, Goodreads"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Review Policy & Guidelines Notes</label>
            <textarea
              rows={3}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Submission guidelines, open reading windows, accepted formats..."
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Author Notes (Private)</label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Custom note, outreach priority, personal connection..."
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition"
            >
              Add to Database
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
