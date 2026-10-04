import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Zap,
  ShoppingBag,
  ExternalLink,
  Star,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { BookProfile, ManuscriptFile, AmazonKdpDetails, ExtractedBookMetadata } from '../types';
import { extractBookFromManuscriptApi, lookupKdpBookApi } from '../services/api';
import { extractTextSampleFromFile, createManuscriptFileRecord } from '../utils/manuscriptReader';
import { getKdpAccountSession } from '../utils/accountSettings';
import { KdpLoginModal } from './KdpLoginModal';

interface NewBookModalProps {
  onClose: () => void;
  onAddBook: (newBook: BookProfile) => void;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({ onClose, onAddBook }) => {
  // Ingestion Mode: 'kdp' | 'manuscript'
  const [ingestMode, setIngestMode] = useState<'kdp' | 'manuscript'>('kdp');
  const [kdpSession, setKdpSession] = useState(getKdpAccountSession());
  const [showKdpLoginModal, setShowKdpLoginModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [genre, setGenre] = useState('');
  const [pubDate, setPubDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [pageCount, setPageCount] = useState(320);
  const [compTitles, setCompTitles] = useState('');
  const [logline, setLogline] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [arcLink, setArcLink] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [uniqueAngle, setUniqueAngle] = useState('');
  const [detectedTropes, setDetectedTropes] = useState<string[]>([]);
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);
  const [arcBlurbTeaser, setArcBlurbTeaser] = useState('');
  const [kdpDetails, setKdpDetails] = useState<AmazonKdpDetails | null>(null);

  // Amazon KDP lookup state
  const [kdpInput, setKdpInput] = useState('');
  const [isKdpLoading, setIsKdpLoading] = useState(false);
  const [kdpSuccessMessage, setKdpSuccessMessage] = useState<string | null>(null);

  // Manuscript upload & analysis state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [extractedFileName, setExtractedFileName] = useState<string | null>(null);
  const [wordCountEstimate, setWordCountEstimate] = useState<number | null>(null);
  const [readingHours, setReadingHours] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPasteExcerpt, setShowPasteExcerpt] = useState(false);
  const [pastedExcerpt, setPastedExcerpt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Amazon KDP / ASIN Lookup
  const handleKdpLookup = async (inputQuery?: string) => {
    const query = inputQuery || kdpInput;
    if (!query.trim()) {
      setErrorMessage('Please enter an Amazon KDP link, ASIN, ISBN, or Amazon Author Central URL.');
      return;
    }

    setIsKdpLoading(true);
    setErrorMessage(null);
    setKdpSuccessMessage(null);

    try {
      const result = await lookupKdpBookApi(query);

      if (result.title) setTitle(result.title);
      if (result.subtitle) setSubtitle(result.subtitle);
      if (result.author) setAuthor(result.author);
      if (result.authorBio) setAuthorBio(result.authorBio);
      if (result.genre) setGenre(result.genre);
      if (result.pageCount) setPageCount(result.pageCount);
      if (result.compTitles) setCompTitles(result.compTitles);
      if (result.logline) setLogline(result.logline);
      if (result.synopsis) setSynopsis(result.synopsis);
      if (result.uniqueAngle) setUniqueAngle(result.uniqueAngle);
      if (result.detectedTropes) setDetectedTropes(result.detectedTropes);
      if (result.contentWarnings) setContentWarnings(result.contentWarnings);
      if (result.arcBlurbTeaser) setArcBlurbTeaser(result.arcBlurbTeaser);
      if (result.coverImage) setCoverImage(result.coverImage);
      if (result.pubDate) setPubDate(result.pubDate);

      if (result.kdpDetails) {
        setKdpDetails(result.kdpDetails);
        if (result.kdpDetails.amazonUrl) {
          setArcLink(result.kdpDetails.amazonUrl);
        }
      }

      setKdpSuccessMessage(
        `Successfully linked Amazon KDP data for "${result.title}" by ${result.author}!`
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err?.message || 'Could not retrieve Amazon KDP information. You can enter details manually.'
      );
    } finally {
      setIsKdpLoading(false);
    }
  };

  const handleImportKdpBook = (result: ExtractedBookMetadata) => {
    if (result.title) setTitle(result.title);
    if (result.subtitle) setSubtitle(result.subtitle || '');
    if (result.author) setAuthor(result.author);
    if (result.authorBio) setAuthorBio(result.authorBio || '');
    if (result.genre) setGenre(result.genre);
    if (result.pageCount) setPageCount(result.pageCount);
    if (result.compTitles) setCompTitles(result.compTitles);
    if (result.logline) setLogline(result.logline);
    if (result.synopsis) setSynopsis(result.synopsis);
    if (result.uniqueAngle) setUniqueAngle(result.uniqueAngle || '');
    if (result.detectedTropes) setDetectedTropes(result.detectedTropes || []);
    if (result.contentWarnings) setContentWarnings(result.contentWarnings || []);
    if (result.arcBlurbTeaser) setArcBlurbTeaser(result.arcBlurbTeaser || '');
    if (result.coverImage) setCoverImage(result.coverImage || '');
    if (result.pubDate) setPubDate(result.pubDate);

    if (result.kdpDetails) {
      setKdpDetails(result.kdpDetails);
      if (result.kdpDetails.amazonUrl) {
        setArcLink(result.kdpDetails.amazonUrl);
      }
    }

    setKdpSuccessMessage(
      `Successfully imported Amazon KDP data for "${result.title}" by ${result.author}!`
    );
    setKdpSession(getKdpAccountSession());
  };

  // Process manuscript file or pasted text
  const processManuscript = async (file: File | null, rawTextOverride?: string) => {
    setIsExtracting(true);
    setErrorMessage(null);
    setExtractionStatus('Reading manuscript contents and title page...');

    try {
      let sampleText = rawTextOverride || '';
      const fName = file ? file.name : 'Pasted_Manuscript_Excerpt.txt';
      const fType = file ? file.name.split('.').pop()?.toLowerCase() || 'txt' : 'txt';
      const fSize = file ? file.size : (rawTextOverride?.length || 5000);

      if (file && !sampleText) {
        sampleText = await extractTextSampleFromFile(file);
      }

      setExtractionStatus('Analyzing narrative style, comps, and genre with AI...');

      const result = await extractBookFromManuscriptApi({
        fileName: fName,
        fileType: fType,
        fileSize: fSize,
        textSample: sampleText,
      });

      setExtractionStatus('Populating book campaign metadata...');

      // Auto-fill all form fields
      if (result.title) setTitle(result.title);
      if (result.subtitle) setSubtitle(result.subtitle);
      if (result.author) setAuthor(result.author);
      if (result.genre) setGenre(result.genre);
      if (result.pageCount) setPageCount(result.pageCount);
      if (result.compTitles) setCompTitles(result.compTitles);
      if (result.logline) setLogline(result.logline);
      if (result.synopsis) setSynopsis(result.synopsis);
      if (result.uniqueAngle) setUniqueAngle(result.uniqueAngle);
      if (result.detectedTropes) setDetectedTropes(result.detectedTropes);
      if (result.contentWarnings) setContentWarnings(result.contentWarnings);
      if (result.arcBlurbTeaser) setArcBlurbTeaser(result.arcBlurbTeaser);
      if (result.wordCountEstimate) setWordCountEstimate(result.wordCountEstimate);
      if (result.estimatedReadingHours) setReadingHours(result.estimatedReadingHours);

      setExtractedFileName(fName);
      if (file) setUploadedFile(file);
    } catch (err: any) {
      console.error('Manuscript extraction error:', err);
      setErrorMessage(
        err?.message || 'Could not parse manuscript. You can fill in the fields manually.'
      );
    } finally {
      setIsExtracting(false);
      setExtractionStatus(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processManuscript(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processManuscript(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Demo preset manuscripts for quick 1-click testing
  const loadDemoManuscript = (type: 'thriller' | 'scifi' | 'nonfiction') => {
    let demoTitle = '';
    let demoText = '';

    if (type === 'thriller') {
      demoTitle = 'The Paris Cartographer by Julian Thorne.epub';
      demoText = `PROLOGUE: THE BROKEN SEALS\n\nUnder the zinc rooftops of the Latin Quarter, the rain tasted of coal soot. Sophia Valmont unlocked the iron grates of the antiquarian atlas guild. Inside the vault lay an unrecorded 1794 celestial map depicting stars that did not exist.\n\nTwo hours later, Inspector Moreau found the brass vernier stained with dried cadmium ink. A murder disguised as an accident. Sophia had twenty-four hours before the guild's shadow council struck again...`;
    } else if (type === 'scifi') {
      demoTitle = 'Singularity Prime by Dr. Aris Thorne.pdf';
      demoText = `CHAPTER ONE: THE ORBITAL BEACON\n\nAt 400 kilometers above the Martian terminator line, the survey satellite relayed an impossible frequency. A conscious signal originating inside the core of the Phobos relay station.\n\nCommander Maya Chen adjusted the telemetry visor. The signal was not alien—it was signed with her own biometric encryption key from fifteen years in the future...`;
    } else {
      demoTitle = 'The Flow Architecture by Maya Lin, PhD.docx';
      demoText = `INTRODUCTION: SOVEREIGN ATTENTION IN THE NOISE AGE\n\nIn our cognitive neuroscience laboratory at Oxford, we recorded 8,000 hours of focus states among high-performing writers and creators. The data was unequivocal: the human mind cannot multitask. Every notification incurs a 23-minute cognitive switching tax.\n\nThis book introduces the architectural framework for deep focus, chronotype sprinting, and environmental shielding...`;
    }

    const mockFile = new File([demoText], demoTitle, { type: 'text/plain' });
    processManuscript(mockFile, demoText);
  };

  const handleResetExtraction = () => {
    setUploadedFile(null);
    setExtractedFileName(null);
    setWordCountEstimate(null);
    setReadingHours(null);
    setKdpDetails(null);
    setKdpSuccessMessage(null);
    setKdpInput('');
    setTitle('');
    setSubtitle('');
    setAuthor('');
    setAuthorBio('');
    setGenre('');
    setCompTitles('');
    setLogline('');
    setSynopsis('');
    setDetectedTropes([]);
    setContentWarnings([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const bookId = `book-${Date.now()}`;

    // If a manuscript was uploaded, create a vault record
    const manuscripts: ManuscriptFile[] = [];
    if (uploadedFile) {
      const record = createManuscriptFileRecord(uploadedFile, bookId, {
        wordCount: wordCountEstimate || pageCount * 280,
        estimatedReadingHours: readingHours || Math.round((pageCount * 280 / 13000) * 10) / 10,
        detectedTropes,
        contentWarnings,
        arcBlurbTeaser,
      });
      manuscripts.push(record);
    }

    const newBook: BookProfile = {
      id: bookId,
      title,
      subtitle: subtitle || undefined,
      author,
      genre: genre || 'Fiction',
      targetAudience: `Readers of ${genre || 'compelling literature'} looking for immersive storytelling.`,
      pubDate,
      pageCount: Number(pageCount) || 300,
      compTitles: compTitles || 'Top sellers in genre',
      logline: logline || title,
      synopsis: synopsis || logline || title,
      uniqueAngle: uniqueAngle || 'Engaging storytelling and distinctive themes',
      authorBio: authorBio || `${author} is an author published on Amazon and trade channels.`,
      arcFormats: ['ePub', 'PDF', 'NetGalley', 'Kindle (mobi/azw3)'],
      arcLink: arcLink || (manuscripts[0]?.downloadUrl ? manuscripts[0].downloadUrl : 'Available upon request'),
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      tags: detectedTropes.length > 0 ? detectedTropes.slice(0, 4) : ['Amazon KDP', 'New Release', genre],
      manuscripts,
      kdpDetails: kdpDetails || undefined,
    };

    onAddBook(newBook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-base">
                Add New Book to Campaign CRM
              </h3>
              <p className="text-[11px] text-slate-400">
                Link your Amazon KDP listing or upload a manuscript to auto-fill everything instantly.
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

        {/* ======================================================== */}
        {/* AUTO-INGESTION SWITCHER: KDP LINK vs MANUSCRIPT UPLOAD */}
        {/* ======================================================== */}
        <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setIngestMode('kdp')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              ingestMode === 'kdp'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Link Amazon KDP / ASIN</span>
          </button>

          <button
            type="button"
            onClick={() => setIngestMode('manuscript')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              ingestMode === 'manuscript'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Manuscript File</span>
          </button>
        </div>

        {/* MODE 1: AMAZON KDP & ASIN LINKING */}
        {ingestMode === 'kdp' && (
          <div className="bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900/90 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Amazon KDP & Author Central Auto-Ingestion
                </span>
              </div>
              {(kdpDetails || title) && (
                <button
                  type="button"
                  onClick={handleResetExtraction}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Amazon KDP Account Login & Bookshelf Banner */}
            {kdpSession ? (
              <div className="bg-slate-850 border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-400">Amazon KDP Account:</span>
                  <span className="font-bold text-slate-100">{kdpSession.email}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    {kdpSession.kdpAccountId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKdpLoginModal(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Browse My KDP Bookshelf</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-850/90 border border-amber-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>Sign in with Amazon KDP / Author Central</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Connect your Amazon KDP account to view and import your published bookshelf titles with 1 click.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKdpLoginModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shrink-0 shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5 fill-current" />
                  <span>Sign In to Amazon KDP</span>
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Or search any Amazon book URL, ASIN (e.g. <code>B09...</code>), or ISBN below:
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={kdpInput}
                    onChange={(e) => setKdpInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleKdpLookup())}
                    placeholder="e.g. https://www.amazon.com/dp/B09KV8W or ASIN / ISBN"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={isKdpLoading || !kdpInput.trim()}
                  onClick={() => handleKdpLookup()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shrink-0 shadow-md shadow-amber-500/20"
                >
                  {isKdpLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching KDP...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Fetch KDP Info</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Demo ASIN Presets */}
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span>Or test instant Amazon KDP link:</span>
                <button
                  type="button"
                  onClick={() => {
                    setKdpInput('https://www.amazon.com/dp/B09KV8W-the-silent-vow');
                    handleKdpLookup('https://www.amazon.com/dp/B09KV8W-the-silent-vow');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                >
                  Kindle Thriller (B09KV8W)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKdpInput('https://www.amazon.com/dp/B08XYZ2-quantum-horizon');
                    handleKdpLookup('https://www.amazon.com/dp/B08XYZ2-quantum-horizon');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition"
                >
                  Sci-Fi KDP Select
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKdpInput('https://www.amazon.com/dp/B07N8Z9-deep-work-focus');
                    handleKdpLookup('https://www.amazon.com/dp/B07N8Z9-deep-work-focus');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
                >
                  Non-Fiction / Habits
                </button>
              </div>
            </div>

            {/* KDP Success Card */}
            {kdpSuccessMessage && (
              <div className="bg-slate-850 border border-emerald-500/40 rounded-xl p-3 space-y-2 mt-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{kdpSuccessMessage}</span>
                </div>

                {kdpDetails && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-1">
                    {kdpDetails.asin && (
                      <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-amber-300 font-mono">
                        ASIN: {kdpDetails.asin}
                      </span>
                    )}
                    {kdpDetails.amazonRating && (
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {kdpDetails.amazonRating} ({kdpDetails.reviewCount || 0} reviews)
                      </span>
                    )}
                    {kdpDetails.bsrRank && (
                      <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                        {kdpDetails.bsrRank}
                      </span>
                    )}
                    {kdpDetails.formatsAvailable && (
                      <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                        Formats: {kdpDetails.formatsAvailable.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: MANUSCRIPT UPLOAD & DROPZONE */}
        {ingestMode === 'manuscript' && (
          <div className="bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900/90 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Smart Manuscript Ingestion & Auto-Fill
                </span>
              </div>
              {extractedFileName && (
                <button
                  type="button"
                  onClick={handleResetExtraction}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Upload Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-amber-400 bg-amber-500/15 scale-[1.01]'
                  : isExtracting
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : extractedFileName
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-amber-400/60 bg-slate-850/60 hover:bg-slate-800/80'
              }`}
              onClick={() => !isExtracting && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.pdf,.docx,.txt,.md,.mobi"
                onChange={handleFileChange}
                className="hidden"
              />

              {isExtracting ? (
                <div className="py-4 space-y-2.5">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <div className="text-xs font-semibold text-slate-200">
                    {extractionStatus || 'Ingesting manuscript...'}
                  </div>
                  <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Extracting Title, Author, Genre, Comps, Logline, and Synopsis with AI...
                  </div>
                </div>
              ) : extractedFileName ? (
                <div className="py-2 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-bold">
                      Successfully extracted from: {extractedFileName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    All fields have been filled automatically! You can review and tweak anything below.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {wordCountEstimate && (
                      <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                        ~{wordCountEstimate.toLocaleString()} words
                      </span>
                    )}
                    {readingHours && (
                      <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                        ~{readingHours} hrs reading time
                      </span>
                    )}
                    {detectedTropes.map((trope, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-amber-400/10 border border-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full"
                      >
                        {trope}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-3 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Drop your manuscript file here or <span className="text-amber-400 underline">browse</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Supports <strong>.epub, .pdf, .docx, .txt, .md</strong> (reads title page, chapters & style)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Previews or Text Paste Alternative */}
            {!extractedFileName && !isExtracting && (
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <span>Or test instant extraction:</span>
                  <button
                    type="button"
                    onClick={() => loadDemoManuscript('thriller')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                  >
                    Mystery / Noir
                  </button>
                  <button
                    type="button"
                    onClick={() => loadDemoManuscript('scifi')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition"
                  >
                    Sci-Fi
                  </button>
                  <button
                    type="button"
                    onClick={() => loadDemoManuscript('nonfiction')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
                  >
                    Non-Fiction
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasteExcerpt((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-200 underline ml-auto"
                >
                  {showPasteExcerpt ? 'Hide text box' : 'Paste chapter text directly'}
                </button>
              </div>
            )}

            {/* Paste Text Collapsible */}
            {showPasteExcerpt && !extractedFileName && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Paste Chapter 1, Prologue, or Synopsis Excerpt:
                </label>
                <textarea
                  rows={3}
                  value={pastedExcerpt}
                  onChange={(e) => setPastedExcerpt(e.target.value)}
                  placeholder="Paste the opening pages or chapter text of your book here..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  disabled={!pastedExcerpt.trim() || isExtracting}
                  onClick={() => processManuscript(null, pastedExcerpt)}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Extract All Book Details from Text</span>
                </button>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* MANUAL / EDITABLE CAMPAIGN FIELDS */}
        {/* ======================================================== */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Midnight Heir"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A Novel of Secrets"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Genre *
              </label>
              <input
                type="text"
                required
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Mystery & Psychological Thriller"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Publication Date *
              </label>
              <input
                type="date"
                required
                value={pubDate}
                onChange={(e) => setPubDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Page Count / Print Length
              </label>
              <input
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>Comp Titles (e.g. "For fans of X meets Y") *</span>
              <span className="text-[10px] text-amber-400 font-normal">Amazon category & market comps</span>
            </label>
            <input
              type="text"
              required
              value={compTitles}
              onChange={(e) => setCompTitles(e.target.value)}
              placeholder="e.g. Gone Girl meets The Silent Patient"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Logline / Elevator Pitch *
            </label>
            <textarea
              rows={2}
              required
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="One punchy sentence describing the core dilemma and hook..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Full Synopsis / Amazon Book Description
            </label>
            <textarea
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Amazon blurb, key characters, inciting incident, and stakes..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Amazon Listing URL / ARC Link
              </label>
              <input
                type="text"
                value={arcLink}
                onChange={(e) => setArcLink(e.target.value)}
                placeholder={kdpDetails?.amazonUrl || "https://www.amazon.com/dp/..."}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://m.media-amazon.com/images/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {authorBio && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Author Bio & Credentials (from Amazon Author Central)
              </label>
              <textarea
                rows={2}
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400">
              {kdpDetails ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Amazon KDP ASIN ({kdpDetails.asin}) linked to campaign
                </span>
              ) : uploadedFile ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Manuscript will be vaulted automatically
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95"
              >
                Add Book to CRM
              </button>
            </div>
          </div>
        </form>

        {showKdpLoginModal && (
          <KdpLoginModal
            onClose={() => {
              setShowKdpLoginModal(false);
              setKdpSession(getKdpAccountSession());
            }}
            onImportBook={handleImportKdpBook}
          />
        )}
      </div>
    </div>
  );
};
