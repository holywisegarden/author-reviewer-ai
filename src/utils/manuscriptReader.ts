import { ManuscriptFile } from '../types';

/**
 * Extracts a readable text sample from an uploaded manuscript file (txt, md, epub, pdf, docx).
 * Reads up to 20,000 characters from text-based files or extracts ASCII text streams from binary files.
 */
export async function extractTextSampleFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Plain text / Markdown
  if (['txt', 'md', 'markdown', 'rtf', 'html', 'json'].includes(extension) || file.type.startsWith('text/')) {
    try {
      const text = await file.text();
      return text.slice(0, 16000);
    } catch {
      // fallback
    }
  }

  // Binary files (EPUB, PDF, DOCX)
  // Read first 120KB as an ArrayBuffer and decode clean text chunks
  try {
    const slice = file.slice(0, 120000);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Extract sequences of printable ASCII/UTF-8 characters
    let extracted = '';
    let currentWord = '';
    
    for (let i = 0; i < bytes.length; i++) {
      const charCode = bytes[i];
      // Printable ASCII or newline/space
      if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
        currentWord += String.fromCharCode(charCode);
        if (currentWord.length > 500) {
          extracted += currentWord;
          currentWord = '';
          if (extracted.length > 14000) break;
        }
      } else {
        if (currentWord.length > 3) {
          extracted += currentWord + ' ';
        }
        currentWord = '';
      }
    }
    extracted += currentWord;

    // Filter out common binary artifacts/xml tags
    const cleaned = extracted
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^\w\s.,!?'"()\-:;—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length > 100) {
      return cleaned.slice(0, 14000);
    }
  } catch {
    // ignore
  }

  return `Manuscript File: ${file.name} (Size: ${file.size} bytes)`;
}

/**
 * Creates a ManuscriptFile instance from an uploaded File object
 */
export function createManuscriptFileRecord(
  file: File,
  bookId: string,
  extraMetadata?: {
    wordCount?: number;
    estimatedReadingHours?: number;
    detectedTropes?: string[];
    contentWarnings?: string[];
    arcBlurbTeaser?: string;
  }
): ManuscriptFile {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  let fileType: 'pdf' | 'epub' | 'docx' | 'mobi' | 'txt' = 'pdf';
  if (extension === 'epub') fileType = 'epub';
  else if (extension === 'docx') fileType = 'docx';
  else if (extension === 'mobi') fileType = 'mobi';
  else if (extension === 'txt' || extension === 'md') fileType = 'txt';

  const wordCount = extraMetadata?.wordCount || Math.max(50000, Math.round(file.size / 30));
  const estimatedReadingHours = extraMetadata?.estimatedReadingHours || Math.round((wordCount / 13000) * 10) / 10 || 6.5;

  return {
    id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookId,
    fileName: file.name,
    fileSize: file.size,
    fileType,
    uploadDate: new Date().toISOString().split('T')[0],
    versionTag: 'Digital Galley ARC',
    watermarkText: 'CONFIDENTIAL REVIEW COPY - PROPERTY OF THE AUTHOR',
    wordCount,
    estimatedReadingHours,
    contentPreview: `Chapter One\n\nUploaded from ${file.name}. Ready for reviewer queries and galley distribution.`,
    detectedTropes: extraMetadata?.detectedTropes || ['#AuthorDraft', '#OriginalWork'],
    contentWarnings: extraMetadata?.contentWarnings || ['None specified'],
    arcBlurbTeaser: extraMetadata?.arcBlurbTeaser || 'An advance reading copy prepared for reviewer evaluation.',
    isPrimaryArc: true,
    downloadUrl: URL.createObjectURL(file),
  };
}
