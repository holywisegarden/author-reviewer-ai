import React, { useState, useEffect, useRef } from 'react';
import {
  BookMarked,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Link,
  Plus,
  Save,
  BookOpen,
  Sparkles,
  Loader2,
  UploadCloud,
  Trash2,
  ShoppingBag,
  Star,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { BookProfile, AmazonKdpDetails, ExtractedBookMetadata } from '../types';
import { extractBookFromManuscriptApi, lookupKdpBookApi } from '../services/api';
import { extractTextSampleFromFile, createManuscriptFileRecord } from '../utils/manuscriptReader';
import { getKdpAccountSession } from '../utils/accountSettings';
import { KdpLoginModal } from './KdpLoginModal';

interface BookPressKitModalProps {
  book: BookProfile;
  onSaveBook: (updated: BookProfile) => void;
  onAddNewBook: (newBook: BookProfile) => void;
  onDeleteBook?: (bookId: string) => void;
}

export const BookPressKitModal: React.FC<BookPressKitModalProps> = ({
  book,
  onSaveBook,
  onAddNewBook,
  onDeleteBook,
}) => {
  const [formData, setFormData] = useState<BookProfile>(book);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'compliance'>('details');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Amazon KDP state
  const [isKdpSyncing, setIsKdpSyncing] = useState(false);
  const [kdpSyncMsg, setKdpSyncMsg] = useState<string | null>(null);
  const [kdpInputVal, setKdpInputVal] = useState(book.kdpDetails?.asin || book.isbn || '');
  const [showKdpModal, setShowKdpModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(book);
    setKdpInputVal(book.kdpDetails?.asin || book.isbn || '');
  }, [book]);

  const handleKdpSync = async (queryOverride?: string) => {
    const session = getKdpAccountSession();
    if (!session && !queryOverride && !formData.kdpDetails?.asin && !formData.isbn) {
      setShowKdpModal(true);
      return;
    }

    const query = queryOverride || kdpInputVal || formData.kdpDetails?.asin || formData.isbn || formData.title;
    if (!query || !query.trim()) {
      setShowKdpModal(true);
      return;
    }

    setIsKdpSyncing(true);
    setExtractError(null);
    setKdpSyncMsg(null);

    try {
      const result = await lookupKdpBookApi(query);

      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        subtitle: result.subtitle !== undefined ? result.subtitle : prev.subtitle,
        author: result.author || prev.author,
        authorBio: result.authorBio || prev.authorBio,
        genre: result.genre || prev.genre,
        pageCount: result.pageCount || prev.pageCount,
        compTitles: result.compTitles || prev.compTitles,
        logline: result.logline || prev.logline,
        synopsis: result.synopsis || prev.synopsis,
        coverImage: result.coverImage || prev.coverImage,
        kdpDetails: result.kdpDetails || prev.kdpDetails,
      }));

      setKdpSyncMsg(`Successfully synced Amazon KDP data for "${result.title}"!`);
      setTimeout(() => setKdpSyncMsg(null), 5000);
      setShowKdpModal(false);
    } catch (err: any) {
      console.error(err);
      setExtractError(err?.message || 'Failed to sync with Amazon KDP.');
    } finally {
      setIsKdpSyncing(false);
    }
  };

  const handleImportFromKdpModal = (result: ExtractedBookMetadata) => {
    setFormData((prev) => ({
      ...prev,
      title: result.title || prev.title,
      subtitle: result.subtitle !== undefined ? result.subtitle : prev.subtitle,
      author: result.author || prev.author,
      authorBio: result.authorBio || prev.authorBio,
      genre: result.genre || prev.genre,
      pageCount: result.pageCount || prev.pageCount,
      compTitles: result.compTitles || prev.compTitles,
      logline: result.logline || prev.logline,
      synopsis: result.synopsis || prev.synopsis,
      coverImage: result.coverImage || prev.coverImage,
      kdpDetails: result.kdpDetails || prev.kdpDetails,
    }));
    setKdpSyncMsg(`Successfully linked Amazon KDP data for "${result.title}"!`);
    setTimeout(() => setKdpSyncMsg(null), 5000);
    setShowKdpModal(false);
  };

  const handleManuscriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccessMsg(null);

    try {
      const sampleText = await extractTextSampleFromFile(file);
      const result = await extractBookFromManuscriptApi({
        fileName: file.name,
        fileType: file.name.split('.').pop()?.toLowerCase() || 'txt',
        fileSize: file.size,
        textSample: sampleText,
      });

      // Create new manuscript record for the vault
      const newManuscript = createManuscriptFileRecord(file, formData.id, {
        wordCount: result.wordCountEstimate,
        estimatedReadingHours: result.estimatedReadingHours,
        detectedTropes: result.detectedTropes,
        contentWarnings: result.contentWarnings,
        arcBlurbTeaser: result.arcBlurbTeaser,
      });

      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        subtitle: result.subtitle !== undefined ? result.subtitle : prev.subtitle,
        author: result.author || prev.author,
        genre: result.genre || prev.genre,
        pageCount: result.pageCount || prev.pageCount,
        compTitles: result.compTitles || prev.compTitles,
        logline: result.logline || prev.logline,
        synopsis: result.synopsis || prev.synopsis,
        uniqueAngle: result.uniqueAngle || prev.uniqueAngle,
        tags: result.detectedTropes ? result.detectedTropes.slice(0, 4) : prev.tags,
        manuscripts: [newManuscript, ...(prev.manuscripts || [])],
      }));

      setExtractSuccessMsg(`Extracted details from "${file.name}"! Click "Save Changes" to apply.`);
      setTimeout(() => setExtractSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error(err);
      setExtractError(err?.message || 'Failed to extract manuscript details.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChange = (field: keyof BookProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBook(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <BookMarked className="w-3.5 h-3.5" /> Book Press Kit & Author Dossier
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Review Outreach Metadata & FTC Guidelines</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">
              {book.title} — Press Kit Dossier
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Keep your synopsis, comp titles, ARC links, and metadata up to date. The AI uses these exact details when tailoring pitches to editors and reviewers.
            </p>
          </div>

          {/* Sub Navigation & Auto-Extract Action */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".epub,.pdf,.docx,.txt,.md,.mobi"
              onChange={handleManuscriptUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => handleKdpSync()}
              disabled={isKdpSyncing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-sm active:scale-95"
              title="Link or sync Amazon KDP / ASIN to pull ratings, BSR, and listing details"
            >
              {isKdpSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing KDP...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{formData.kdpDetails?.asin ? `Sync KDP (${formData.kdpDetails.asin})` : 'Link Amazon KDP'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition shadow-sm"
              title="Upload an updated manuscript file to automatically refresh your book metadata"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Metadata...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Fill from Manuscript</span>
                </>
              )}
            </button>

            <div className="flex items-center bg-slate-800 border border-slate-700 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  activeTab === 'details'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Book Profile & ARCs
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                  activeTab === 'compliance'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>FTC & Amazon Review Rules</span>
              </button>
            </div>

            {onDeleteBook && (
              <button
                type="button"
                onClick={() => onDeleteBook(formData.id)}
                className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs px-3 py-1.5 rounded-xl transition shadow-sm active:scale-95"
                title={`Remove "${formData.title}" from active CRM campaigns`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Remove Book</span>
              </button>
            )}
          </div>
        </div>

        {extractSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{extractSuccessMsg}</span>
          </div>
        )}

        {extractError && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}
      </div>

      {activeTab === 'details' ? (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Metadata & ARC links */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Cover & Key Metadata
              </h2>

              {/* Cover Preview */}
              <div className="flex items-center gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
                {formData.coverImage ? (
                  <img
                    src={formData.coverImage}
                    alt={formData.title}
                    className="w-16 h-24 object-cover rounded-lg border border-slate-700 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                    No Cover
                  </div>
                )}
                <div className="text-xs flex-1">
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                    Cover Image URL:
                  </label>
                  <input
                    type="url"
                    value={formData.coverImage || ''}
                    onChange={(e) => handleChange('coverImage', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Author & Pub Date */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Author Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => handleChange('author', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Genre & Categories *</label>
                  <input
                    type="text"
                    required
                    value={formData.genre}
                    onChange={(e) => handleChange('genre', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pub Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.pubDate}
                      onChange={(e) => handleChange('pubDate', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Page Count</label>
                    <input
                      type="number"
                      value={formData.pageCount || 300}
                      onChange={(e) => handleChange('pageCount', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ISBN / Print Identifier</label>
                  <input
                    type="text"
                    value={formData.isbn || ''}
                    onChange={(e) => handleChange('isbn', e.target.value)}
                    placeholder="978-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Amazon KDP & Author Central Integration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  Amazon KDP & Author Central
                </h2>
                {formData.kdpDetails?.asin && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    ASIN: {formData.kdpDetails.asin}
                  </span>
                )}
              </div>

              {formData.kdpDetails ? (
                <div className="space-y-2.5 bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Amazon Rating:</span>
                    <span className="font-semibold text-amber-300 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {formData.kdpDetails.amazonRating || 4.7} ({formData.kdpDetails.reviewCount || 0} reviews)
                    </span>
                  </div>

                  {formData.kdpDetails.bsrRank && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Best Sellers Rank:</span>
                      <span className="font-medium text-slate-200 truncate max-w-[150px]">
                        {formData.kdpDetails.bsrRank}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">KDP Select / KU:</span>
                    <span className="text-emerald-400 font-semibold">Kindle Unlimited Eligible</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    {formData.kdpDetails.amazonUrl && (
                      <a
                        href={formData.kdpDetails.amazonUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <span>View on Amazon</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleKdpSync()}
                      disabled={isKdpSyncing}
                      className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 transition"
                    >
                      {isKdpSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
                      <span>Sync KDP</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-400">
                    Sign in with your Amazon KDP account to sync verified customer ratings, BSR rankings, and sales page blurbs.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowKdpModal(true)}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 fill-current" />
                    <span>Sign in with Amazon KDP</span>
                  </button>
                  <div className="text-[10px] text-center text-slate-500">
                    Or enter any ASIN / ISBN manually:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={kdpInputVal}
                      onChange={(e) => setKdpInputVal(e.target.value)}
                      placeholder="e.g. B09KV8W or ISBN"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                    <button
                      type="button"
                      disabled={isKdpSyncing || !kdpInputVal.trim()}
                      onClick={() => handleKdpSync(kdpInputVal)}
                      className="bg-slate-750 hover:bg-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs shrink-0 transition border border-slate-700"
                    >
                      {isKdpSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Fetch'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ARC Distribution Links */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Link className="w-4 h-4 text-emerald-400" />
                ARC Access & Download Link
              </h2>
              <p className="text-[11px] text-slate-400">
                Reviewers prefer an instant one-click digital copy (NetGalley, BookFunnel, StoryOrigin, or secure Drive link).
              </p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Primary ARC / NetGalley URL
                </label>
                <input
                  type="url"
                  value={formData.arcLink || ''}
                  onChange={(e) => handleChange('arcLink', e.target.value)}
                  placeholder="https://netgalley.com/... or https://bookfunnel.com/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Pitch Content */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Narrative Pitch Elements (Used by AI Pitch Engine)
              </h2>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtitle / Series</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="A Novel of Obsession and Vanishing Truths"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Comp Titles (Essential for Reviewers) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.compTitles}
                  onChange={(e) => handleChange('compTitles', e.target.value)}
                  placeholder="e.g. Gone Girl meets The Silent Patient with the grit of Michael Connelly"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Comp titles give reviewers instant context on where your book sits on bookstore shelves.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Logline / One-Sentence Hook *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.logline}
                  onChange={(e) => handleChange('logline', e.target.value)}
                  placeholder="When a disgraced photographer captures what looks like a crime in a glass reflection..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Synopsis</label>
                <textarea
                  rows={5}
                  value={formData.synopsis}
                  onChange={(e) => handleChange('synopsis', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Unique Thematic Hook / "Why Now?"
                </label>
                <input
                  type="text"
                  value={formData.uniqueAngle}
                  onChange={(e) => handleChange('uniqueAngle', e.target.value)}
                  placeholder="e.g. Explores modern memory surveillance, architectural noir, and trauma recovery"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Author Bio & Credentials
                </label>
                <textarea
                  rows={3}
                  value={formData.authorBio}
                  onChange={(e) => handleChange('authorBio', e.target.value)}
                  placeholder="Author credentials, previous publication credits, or relevant background..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200"
                />
              </div>

              {/* Save Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  {saveSuccess ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Book Profile Updated Successfully!
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">
                      Changes will be used across all outreach & pitches.
                    </span>
                  )}

                  {onDeleteBook && (
                    <button
                      type="button"
                      onClick={() => onDeleteBook(formData.id)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition"
                      title="Remove this book from your active campaign CRM"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Book Campaign</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Press Kit Changes</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* FTC & Platform Compliance Guide */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Author Guidelines: Amazon Review Policies & FTC Compliance
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Understanding review ethics protects your Amazon account, preserves your book ranking, and ensures 100% legal compliance when distributing free Advance Reader Copies (ARCs).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Rule 1: Free ARCs are 100% Allowed */}
            <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                1. Free ARCs for Honest Reviews ARE Permitted
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Both Amazon and Goodreads officially permit authors and publishers to provide free Advance Reader Copies (ARCs) to readers and reviewers, as long as it is done exclusively for honest review consideration.
              </p>
            </div>

            {/* Rule 2: Strictly NO Incentives or Paid Customer Reviews */}
            <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertCircle className="w-4 h-4" />
                2. NEVER Pay for Customer Reviews or Offer Gift Cards
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                You must never offer money, gift cards, discounts, or entry into a raffle conditioned on leaving a review. Paying readers to leave customer reviews violates Amazon Community Guidelines and FTC federal regulations.
              </p>
            </div>

            {/* Rule 3: No Requiring 5-Star Reviews */}
            <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                3. Never Demand a Positive Rating
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Outreach emails must always state: "A complimentary copy is provided for your honest, unbiased consideration." Never say "In exchange for a 5-star review." ReviewPilot automatically inserts this disclosure.
              </p>
            </div>

            {/* Rule 4: Editorial vs Customer Reviews */}
            <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
                4. Editorial Reviews vs Customer Reviews
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Editorial reviews (such as Midwest Book Review, Kirkus Indie, or newspaper blurbs) can be pasted directly into the "Editorial Reviews" section in your Amazon Author Central dashboard. Customer reviews must come from readers themselves.
              </p>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl text-xs space-y-1.5">
            <span className="font-bold text-emerald-400 text-xs">
              ReviewPilot Automated Compliance Guarantee:
            </span>
            <p className="text-slate-300 text-[11px]">
              Every pitch generated by ReviewPilot for Goodreads, Amazon reviewers, or book bloggers includes the official FTC disclaimer:
              <br />
              <em className="text-amber-200">
                "In accordance with FTC guidelines, a complimentary advance reader copy is provided solely for your honest, unbiased review consideration."
              </em>
            </p>
          </div>
        </div>
      )}

      {showKdpModal && (
        <KdpLoginModal
          onClose={() => setShowKdpModal(false)}
          onImportBook={handleImportFromKdpModal}
        />
      )}
    </div>
  );
};
