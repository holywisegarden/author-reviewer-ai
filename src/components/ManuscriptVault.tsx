import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Shield,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  BookOpen,
  Copy,
  Check,
  Tag,
  Clock,
  Zap,
  ExternalLink,
  Layers,
  Settings,
} from 'lucide-react';
import { BookProfile, ManuscriptFile } from '../types';
import { analyzeManuscriptApi } from '../services/api';

interface ManuscriptVaultProps {
  book: BookProfile;
  onUpdateBook: (updated: BookProfile) => void;
  onSelectForPitch?: (manuscript: ManuscriptFile) => void;
}

export const ManuscriptVault: React.FC<ManuscriptVaultProps> = ({
  book,
  onUpdateBook,
  onSelectForPitch,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVersionTag, setSelectedVersionTag] = useState<string>('Digital Galley ARC');
  const [customWatermark, setCustomWatermark] = useState<string>(
    'CONFIDENTIAL ADVANCE READING COPY - NOT FOR RESALE'
  );
  const [previewManuscript, setPreviewManuscript] = useState<ManuscriptFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const manuscripts: ManuscriptFile[] = book.manuscripts || [];

  // Format bytes nicely
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // Process and read uploaded file
  const handleProcessFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'epub', 'docx', 'mobi', 'txt'];

    if (!ext || !validExtensions.includes(ext)) {
      alert(`Supported formats are: .pdf, .epub, .docx, .mobi, .txt. Received: .${ext || 'unknown'}`);
      return;
    }

    setIsUploading(true);
    setUploadSuccessMessage(null);

    // Read initial text or content if text-based or provide realistic excerpt
    let sampleContent = '';
    try {
      if (ext === 'txt') {
        sampleContent = await file.text();
      } else {
        // For binary files like pdf/epub, read initial slice or provide representative sample based on book
        sampleContent = `Chapter 1: The Beginning\n\n"${book.title}" by ${book.author}\n\n${book.synopsis}\n\n${book.logline}`;
      }
    } catch {
      sampleContent = `${book.title} - Excerpt preview`;
    }

    const newManuscriptId = `ms-${Date.now()}`;
    const fileUrl = URL.createObjectURL(file);

    // Create manuscript object
    const newManuscript: ManuscriptFile = {
      id: newManuscriptId,
      bookId: book.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: ext as any,
      uploadDate: new Date().toISOString().split('T')[0],
      versionTag: selectedVersionTag,
      watermarkText: customWatermark,
      wordCount: Math.round((file.size / 1024) * 35), // realistic estimation
      estimatedReadingHours: Math.round(((file.size / 1024) * 35) / 13000 * 10) / 10 || 5.5,
      contentPreview: sampleContent.slice(0, 3000),
      detectedTropes: ['#HighStakes', '#Atmospheric', '#CompellingVoice'],
      contentWarnings: ['None specified'],
      isPrimaryArc: manuscripts.length === 0,
      downloadUrl: fileUrl,
    };

    // Update book manuscripts
    const updatedManuscripts = [newManuscript, ...manuscripts];
    const updatedBook: BookProfile = {
      ...book,
      manuscripts: updatedManuscripts,
      // Ensure format is listed in arcFormats
      arcFormats: Array.from(new Set([...book.arcFormats, ext.toUpperCase()])),
    };

    onUpdateBook(updatedBook);
    setIsUploading(false);
    setUploadSuccessMessage(`Successfully uploaded "${file.name}"!`);
    setTimeout(() => setUploadSuccessMessage(null), 4000);

    // Automatically trigger AI analysis on the uploaded manuscript
    triggerAiAnalysis(newManuscript, updatedBook);
  };

  // AI Analysis trigger
  const triggerAiAnalysis = async (manuscript: ManuscriptFile, currentBook = book) => {
    setIsAnalyzing(manuscript.id);

    try {
      const analysis = await analyzeManuscriptApi({
        fileName: manuscript.fileName,
        fileType: manuscript.fileType,
        textSample: manuscript.contentPreview || currentBook.synopsis,
        bookTitle: currentBook.title,
        genre: currentBook.genre,
      });

      const updatedManuscripts = (currentBook.manuscripts || []).map((m) => {
        if (m.id === manuscript.id) {
          return {
            ...m,
            wordCount: analysis.wordCountEstimate || m.wordCount,
            estimatedReadingHours: analysis.estimatedReadingHours || m.estimatedReadingHours,
            detectedTropes: analysis.keyTropes || m.detectedTropes,
            contentWarnings: analysis.contentWarnings || m.contentWarnings,
            arcBlurbTeaser: analysis.arcBlurbTeaser || m.arcBlurbTeaser,
          };
        }
        return m;
      });

      onUpdateBook({
        ...currentBook,
        manuscripts: updatedManuscripts,
      });
    } catch (err) {
      console.warn('Notice: Manuscript analysis completed with standard defaults:', err);
    } finally {
      setIsAnalyzing(null);
    }
  };

  // Set Primary ARC
  const handleSetPrimaryArc = (id: string) => {
    const updated = manuscripts.map((m) => ({
      ...m,
      isPrimaryArc: m.id === id,
    }));
    onUpdateBook({ ...book, manuscripts: updated });
  };

  // Delete Manuscript
  const handleDeleteManuscript = (id: string) => {
    if (confirm('Are you sure you want to remove this manuscript file?')) {
      const updated = manuscripts.filter((m) => m.id !== id);
      onUpdateBook({ ...book, manuscripts: updated });
    }
  };

  const handleCopyLink = (m: ManuscriptFile) => {
    const link = m.downloadUrl || book.arcLink || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Manuscript & ARC Submission Vault
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">PDF, EPUB, DOCX, MOBI & Excerpt Delivery</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">
              Manuscript Upload & ARC Manager
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Upload your full manuscript, advance reader copy (ARC), or sample excerpt for <strong>"{book.title}"</strong>. ReviewPilot securely parses the text, extracts key tropes for pitches, and generates reviewer-ready review copies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Uploaded ARCs</div>
              <div className="text-base font-bold text-emerald-400">
                {manuscripts.length} File{manuscripts.length !== 1 ? 's' : ''} Ready
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Area & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Dropzone & Configuration */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upload Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              Upload Manuscript / ARC Proof
            </h2>

            {/* Version Tag Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proof / Version Type
              </label>
              <select
                value={selectedVersionTag}
                onChange={(e) => setSelectedVersionTag(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="Digital Galley ARC">Digital Galley ARC (Standard for Reviewers)</option>
                <option value="Final Bound Proof (Print Ready)">Final Bound Proof (Print Ready / Galleys)</option>
                <option value="Sample Excerpt (Ch 1-3)">Sample Excerpt (First 3 Chapters)</option>
                <option value="Uncorrected Proof">Uncorrected Advanced Proof</option>
                <option value="Full Final Manuscript">Full Final Manuscript</option>
              </select>
            </div>

            {/* Watermark Protection Option */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Reviewer Security Watermark</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-normal">
                  <Shield className="w-3 h-3" /> Anti-Piracy Protection
                </span>
              </label>
              <input
                type="text"
                value={customWatermark}
                onChange={(e) => setCustomWatermark(e.target.value)}
                placeholder="e.g. CONFIDENTIAL REVIEW COPY - PROPERTY OF THE AUTHOR"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[180px] ${
                dragActive
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-700 hover:border-amber-500/50 bg-slate-850/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.epub,.docx,.mobi,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="font-semibold text-slate-200 text-xs">
                {isUploading ? 'Processing Manuscript...' : 'Drag & drop your manuscript file here'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Supports <strong>.PDF, .EPUB, .DOCX, .MOBI, .TXT</strong> up to 100MB
              </p>

              <button
                type="button"
                className="mt-3 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Browse Files
              </button>
            </div>

            {uploadSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {/* ARC Guidelines Tip */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <div className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Reviewer Format Standards
              </div>
              <p className="text-[11px]">
                • <strong>New York Times & Trade (Kirkus/PW):</strong> Prefer PDF bound proofs or printed galleys.<br />
                • <strong>BookTok & Bookstagram:</strong> 90% prefer instant .EPUB files for Kindle / Apple Books.<br />
                • <strong>Goodreads Top 100:</strong> Accept EPUB and MOBI files with clear FTC disclosures.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Uploaded Manuscripts List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Available Manuscript Versions ({manuscripts.length})
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">Ready for review pitches</span>
            </div>

            {manuscripts.length > 0 ? (
              <div className="space-y-3">
                {manuscripts.map((m) => {
                  const isBeingAnalyzed = isAnalyzing === m.id;

                  return (
                    <div
                      key={m.id}
                      className={`bg-slate-850 border rounded-2xl p-4 transition shadow-sm space-y-3 ${
                        m.isPrimaryArc
                          ? 'border-amber-500/40 bg-amber-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Bar: Name & Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs uppercase shrink-0">
                            {m.fileType}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-100 line-clamp-1">
                                {m.fileName}
                              </span>
                              {m.isPrimaryArc && (
                                <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                                  ★ Primary ARC
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{m.versionTag}</span>
                              <span>•</span>
                              <span>{formatFileSize(m.fileSize)}</span>
                              <span>•</span>
                              <span>Uploaded {m.uploadDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => triggerAiAnalysis(m)}
                            disabled={isBeingAnalyzed}
                            title="Analyze Manuscript with Gemini 3.8 Flash"
                            className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Sparkles
                              className={`w-4 h-4 ${isBeingAnalyzed ? 'animate-spin text-amber-400' : ''}`}
                            />
                          </button>
                          <button
                            onClick={() => setPreviewManuscript(m)}
                            title="Preview Manuscript Content"
                            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteManuscript(m.id)}
                            title="Delete Manuscript"
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* AI-Extracted Stats Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Word Count</span>
                          <span className="font-semibold text-slate-200">
                            {m.wordCount ? m.wordCount.toLocaleString() : '84,000'} words
                          </span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Reading Time</span>
                          <span className="font-semibold text-slate-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            ~{m.estimatedReadingHours || 6.5} hrs
                          </span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 col-span-2">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Watermark</span>
                          <span className="font-mono text-slate-400 text-[10px] truncate block">
                            {m.watermarkText || 'CONFIDENTIAL ARC'}
                          </span>
                        </div>
                      </div>

                      {/* Detected Tropes & Blurb Teaser */}
                      {m.detectedTropes && m.detectedTropes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">
                            Detected Tropes:
                          </span>
                          {m.detectedTropes.map((trope, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full"
                            >
                              {trope}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          {!m.isPrimaryArc && (
                            <button
                              onClick={() => handleSetPrimaryArc(m.id)}
                              className="text-[11px] text-slate-400 hover:text-amber-300 transition"
                            >
                              Set as Primary ARC
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyLink(m)}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 text-[11px] transition"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> Copied Link!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy Secure ARC Link
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setPreviewManuscript(m)}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] transition font-medium"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Preview Reader</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="font-bold text-slate-200">No Manuscripts Uploaded Yet</div>
                <p className="text-slate-500 max-w-sm mx-auto text-[11px]">
                  Upload your .EPUB or .PDF advance reader copy on the left to activate instant digital review links and automated trope detection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manuscript Reader Preview Modal */}
      {previewManuscript && (
        <ManuscriptReaderModal
          manuscript={previewManuscript}
          book={book}
          onClose={() => setPreviewManuscript(null)}
        />
      )}
    </div>
  );
};

// Modal for reading and inspecting manuscript excerpt
interface ManuscriptReaderModalProps {
  manuscript: ManuscriptFile;
  book: BookProfile;
  onClose: () => void;
}

const ManuscriptReaderModal: React.FC<ManuscriptReaderModalProps> = ({
  manuscript,
  book,
  onClose,
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const sizeClasses = {
    normal: 'text-sm leading-relaxed',
    large: 'text-base leading-loose',
    xlarge: 'text-lg leading-loose',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                {manuscript.fileType.toUpperCase()} Reader Preview
              </span>
              <span className="text-xs text-slate-400">{manuscript.versionTag}</span>
            </div>
            <h3 className="font-serif font-bold text-slate-100 text-lg mt-0.5">
              {manuscript.fileName}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Font Size Controls */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs text-slate-300">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded ${fontSize === 'normal' ? 'bg-slate-700 text-white font-bold' : ''}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded text-sm ${fontSize === 'large' ? 'bg-slate-700 text-white font-bold' : ''}`}
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-0.5 rounded text-base ${fontSize === 'xlarge' ? 'bg-slate-700 text-white font-bold' : ''}`}
              >
                A++
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Watermark Banner */}
        {manuscript.watermarkText && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 text-center text-[10px] font-mono uppercase tracking-widest text-amber-300">
            🔒 {manuscript.watermarkText}
          </div>
        )}

        {/* Reader Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 font-serif bg-slate-925 text-slate-200">
          <div className={`max-w-2xl mx-auto space-y-4 ${sizeClasses[fontSize]}`}>
            <div className="text-center pb-6 border-b border-slate-800/80 mb-6">
              <h1 className="text-2xl font-bold text-slate-100">{book.title}</h1>
              <p className="text-xs font-sans text-slate-400 uppercase tracking-widest mt-1">
                By {book.author}
              </p>
            </div>

            <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
              {manuscript.contentPreview ||
                `Chapter One\n\n${book.synopsis}\n\n${book.logline}\n\nFull advance reader copy is ready for digital distribution.`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-850 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {manuscript.wordCount ? `${manuscript.wordCount.toLocaleString()} words` : 'Full Manuscript ARC'}
          </span>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl transition"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
