import { BookProfile, ReviewerOutlet, Submission } from '../types';
import { INITIAL_BOOKS, INITIAL_REVIEWERS, INITIAL_SUBMISSIONS } from '../data/initialData';
import { LESLIE_WALTERS_BOOKS, generateIndiesTodayReviewers } from '../data/indiesTodayDirectory';

const STORAGE_KEYS = {
  BOOKS: 'reviewpilot_books_v3',
  REVIEWERS: 'reviewpilot_reviewers_v3',
  SUBMISSIONS: 'reviewpilot_submissions_v2',
  ACTIVE_BOOK_ID: 'reviewpilot_active_book_id_v3',
};

// Clean legacy v1 keys that may contain obsolete book data
function purgeLegacyStorage() {
  try {
    localStorage.removeItem('reviewpilot_books_v1');
    localStorage.removeItem('reviewpilot_submissions_v1');
    localStorage.removeItem('reviewpilot_active_book_id_v1');
  } catch {
    // ignore
  }
}

export function loadBooks(): BookProfile[] {
  purgeLegacyStorage();
  const defaultBooks = [...LESLIE_WALTERS_BOOKS, ...INITIAL_BOOKS];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (!raw) {
      saveBooks(defaultBooks);
      return defaultBooks;
    }
    const parsed: BookProfile[] = JSON.parse(raw);
    const cleaned = parsed.filter(
      (b) => b.id !== 'book-1' && !b.title?.toLowerCase().includes('echo park')
    );

    // Ensure Leslie Walters' books are included
    const existingIds = new Set(cleaned.map((b) => b.id));
    const missingLeslieBooks = LESLIE_WALTERS_BOOKS.filter((b) => !existingIds.has(b.id));

    if (missingLeslieBooks.length > 0) {
      const merged = [...missingLeslieBooks, ...cleaned];
      saveBooks(merged);
      return merged;
    }

    if (cleaned.length === 0) {
      saveBooks(defaultBooks);
      return defaultBooks;
    }
    return cleaned;
  } catch {
    return defaultBooks;
  }
}

export function saveBooks(books: BookProfile[]) {
  try {
    const cleaned = books.filter(
      (b) => b.id !== 'book-1' && !b.title?.toLowerCase().includes('echo park')
    );
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}

export function loadReviewers(): ReviewerOutlet[] {
  const verifiedDirectory = generateIndiesTodayReviewers();
  const combinedInitial = [...INITIAL_REVIEWERS, ...verifiedDirectory];

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWERS);
    if (!raw) {
      saveReviewers(combinedInitial);
      return combinedInitial;
    }
    const parsed: ReviewerOutlet[] = JSON.parse(raw);
    // Auto-merge missing verified reviewers from 2026 directory
    const existingPubs = new Set(parsed.map((r) => r.publication.toLowerCase()));
    const missing = verifiedDirectory.filter((v) => !existingPubs.has(v.publication.toLowerCase()));

    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      saveReviewers(merged);
      return merged;
    }
    return parsed;
  } catch {
    return combinedInitial;
  }
}

export function saveReviewers(reviewers: ReviewerOutlet[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWERS, JSON.stringify(reviewers));
  } catch {
    // ignore
  }
}

export function syncReviewerDirectoryDatabase(activeBook?: BookProfile): ReviewerOutlet[] {
  const verifiedDirectory = generateIndiesTodayReviewers();
  const current = loadReviewers();
  const existingMap = new Map(current.map((r) => [r.publication.toLowerCase(), r]));

  const updated: ReviewerOutlet[] = [...current];
  const todayStr = new Date().toISOString().split('T')[0];

  verifiedDirectory.forEach((v) => {
    const key = v.publication.toLowerCase();
    if (!existingMap.has(key)) {
      updated.push({
        ...v,
        lastVerified: todayStr,
        submissionStatus: v.submissionStatus || 'open',
        verificationStatus: 'verified_active',
      });
    } else {
      const existing = existingMap.get(key)!;
      existing.lastVerified = todayStr;
      existing.source = v.source || 'Indies Today 2026 reviewer directory';
      existing.bookFitScores = { ...existing.bookFitScores, ...v.bookFitScores };
      existing.preferredGenres = v.preferredGenres.length > 0 ? v.preferredGenres : existing.preferredGenres;
      existing.reviewPlatforms = v.reviewPlatforms || existing.reviewPlatforms;
      existing.acceptsIndies = v.acceptsIndies || existing.acceptsIndies;
      existing.email = existing.email || v.email;
      existing.submissionUrl = existing.submissionUrl || v.submissionUrl;
      existing.website = existing.website || v.website;
      existing.submissionStatus = existing.submissionStatus || v.submissionStatus || 'open';
      existing.verificationStatus = 'verified_active';
      if (v.costPolicy && (!existing.costPolicy || existing.costPolicy.includes('Verify'))) {
        existing.costPolicy = v.costPolicy;
      }
    }
  });

  // If active book provided, update contextual fit score
  if (activeBook) {
    const activeGenreLower = activeBook.genre.toLowerCase();
    const activeTitleLower = activeBook.title.toLowerCase();
    const bookKey = activeTitleLower.includes('jack')
      ? 'jackAndBlaze'
      : activeTitleLower.includes('echoes')
      ? 'echoesOfTheHeart'
      : activeBook.id;

    updated.forEach((r) => {
      if (!r.bookFitScores) r.bookFitScores = {};
      const matches = r.preferredGenres.some(
        (g) => activeGenreLower.includes(g.toLowerCase()) || g.toLowerCase().includes('all')
      );
      if (matches && !r.bookFitScores[bookKey]) {
        r.bookFitScores[bookKey] = 'High';
      }
    });
  }

  saveReviewers(updated);
  return updated;
}

export function loadSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      saveSubmissions(INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    }
    const parsed: Submission[] = JSON.parse(raw);
    // Filter out submissions belonging to book-1 or referencing Echo Park
    const cleaned = parsed.filter(
      (s) =>
        s.bookId !== 'book-1' &&
        !s.pitchSubject?.toLowerCase().includes('echo park') &&
        !s.pitchBody?.toLowerCase().includes('echo park')
    );
    if (cleaned.length === 0) {
      saveSubmissions(INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    }
    return cleaned;
  } catch {
    return INITIAL_SUBMISSIONS;
  }
}

export function saveSubmissions(submissions: Submission[]) {
  try {
    const cleaned = submissions.filter(
      (s) =>
        s.bookId !== 'book-1' &&
        !s.pitchSubject?.toLowerCase().includes('echo park') &&
        !s.pitchBody?.toLowerCase().includes('echo park')
    );
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}

export function getActiveBookId(books: BookProfile[]): string {
  try {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_BOOK_ID);
    if (active && active !== 'book-1' && books.some((b) => b.id === active)) {
      return active;
    }
    return books[0]?.id || INITIAL_BOOKS[0].id;
  } catch {
    return books[0]?.id || INITIAL_BOOKS[0].id;
  }
}

export function setActiveBookId(id: string) {
  try {
    if (id !== 'book-1') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BOOK_ID, id);
    }
  } catch {
    // ignore
  }
}

export function resetToDefaults(): {
  books: BookProfile[];
  reviewers: ReviewerOutlet[];
  submissions: Submission[];
} {
  saveBooks(INITIAL_BOOKS);
  saveReviewers(INITIAL_REVIEWERS);
  saveSubmissions(INITIAL_SUBMISSIONS);
  setActiveBookId(INITIAL_BOOKS[0].id);
  return {
    books: INITIAL_BOOKS,
    reviewers: INITIAL_REVIEWERS,
    submissions: INITIAL_SUBMISSIONS,
  };
}
