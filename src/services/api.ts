import {
  BookProfile,
  ExtractedBookMetadata,
  FollowUpGenerationResult,
  PitchGenerationResult,
  ReviewerMatchResult,
  ReviewerOutlet,
} from '../types';

export async function generatePitchApi(params: {
  book: BookProfile;
  reviewer: ReviewerOutlet;
  pitchStyle?: string;
  customNotes?: string;
}): Promise<PitchGenerationResult> {
  const res = await fetch('/api/generate-pitch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to generate pitch.`);
  }

  return await res.json();
}

export async function generateFollowUpApi(params: {
  book: BookProfile;
  reviewer: ReviewerOutlet;
  stage?: string;
  daysSincePitched?: number;
  originalPitchSubject?: string;
  newMilestone?: string;
}): Promise<FollowUpGenerationResult> {
  const res = await fetch('/api/generate-followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to generate follow-up.`);
  }

  return await res.json();
}

export async function matchReviewerApi(params: {
  book: BookProfile;
  reviewerGuidelines: string;
  reviewerName: string;
  reviewerOutlet: string;
}): Promise<ReviewerMatchResult> {
  const res = await fetch('/api/match-reviewer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to evaluate match.`);
  }

  return await res.json();
}

export async function extractGuidelinesApi(rawText: string): Promise<any> {
  const res = await fetch('/api/extract-guidelines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to extract guidelines.`);
  }

  return await res.json();
}

export async function generateBlurbsApi(params: {
  reviewText: string;
  reviewerName: string;
  publication: string;
  bookTitle: string;
}): Promise<any> {
  const res = await fetch('/api/generate-press-kit-blurb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to generate blurbs.`);
  }

  return await res.json();
}

export async function analyzeManuscriptApi(params: {
  fileName: string;
  fileType: string;
  textSample?: string;
  bookTitle?: string;
  genre?: string;
}): Promise<any> {
  const res = await fetch('/api/analyze-manuscript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to analyze manuscript.`);
  }

  return await res.json();
}

export async function extractBookFromManuscriptApi(params: {
  fileName: string;
  fileType: string;
  fileSize: number;
  textSample?: string;
}): Promise<ExtractedBookMetadata> {
  const res = await fetch('/api/extract-book-from-manuscript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to extract manuscript details.`);
  }

  return await res.json();
}

export async function lookupKdpBookApi(kdpUrlOrAsin: string): Promise<ExtractedBookMetadata> {
  const res = await fetch('/api/kdp-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kdpUrlOrAsin }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to retrieve Amazon KDP book details.`);
  }

  return await res.json();
}

export async function discoverReviewersApi(params: {
  genre: string;
  bookTitle?: string;
  author?: string;
  compTitles?: string;
  keywords?: string;
}): Promise<{ reviewers: ReviewerOutlet[] }> {
  const res = await fetch('/api/discover-reviewers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to discover reviewers.`);
  }

  return await res.json();
}

export async function verifyReviewerApi(reviewer: ReviewerOutlet): Promise<{
  reviewerId: string;
  publication: string;
  isVerified: boolean;
  submissionStatus: 'open' | 'closed' | 'arcs_only';
  statusReason: string;
  verifiedAt: string;
  estimatedTurnaroundDays: number;
  indieFriendlyRating: string;
  keyTakeaway: string;
}> {
  const res = await fetch('/api/verify-reviewer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `Error ${res.status}: Failed to verify reviewer status.`);
  }

  return await res.json();
}

