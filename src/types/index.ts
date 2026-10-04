export type OutletCategory =
  | 'prestige'
  | 'trade'
  | 'indie_blog'
  | 'influencer_booktok'
  | 'goodreads_amazon'
  | 'podcast';

export type SubmissionStatus =
  | 'discovered'
  | 'ready_to_pitch'
  | 'pitched'
  | 'followup_1'
  | 'followup_2'
  | 'arc_accepted'
  | 'review_published'
  | 'declined';

export interface ManuscriptFile {
  id: string;
  bookId: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: 'pdf' | 'epub' | 'docx' | 'mobi' | 'txt';
  uploadDate: string;
  versionTag: string; // 'Digital Galley ARC' | 'Uncorrected Proof' | 'Sample Excerpt (Ch 1-3)' | 'Final Manuscript'
  watermarkText?: string;
  wordCount?: number;
  estimatedReadingHours?: number;
  contentPreview?: string;
  detectedTropes?: string[];
  contentWarnings?: string[];
  arcBlurbTeaser?: string;
  isPrimaryArc: boolean;
  downloadUrl?: string;
}

export interface AmazonKdpDetails {
  asin?: string;
  isbn?: string;
  amazonUrl?: string;
  authorCentralUrl?: string;
  kdpEnrollment?: boolean;
  bsrRank?: string;
  amazonRating?: number;
  reviewCount?: number;
  formatsAvailable?: string[];
  lastSyncedAt?: string;
}

export interface LinkedEmailAccount {
  senderEmail: string;
  senderName: string;
  provider: 'gmail' | 'outlook' | 'apple_mail' | 'custom_smtp';
  signature?: string;
  isConnected: boolean;
  connectedAt?: string;
}

export interface KdpAccountSession {
  email: string;
  authorName: string;
  kdpAccountId: string;
  marketplace: string;
  isConnected: boolean;
  connectedAt: string;
}

export interface KdpBookshelfBook {
  asin: string;
  isbn?: string;
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  status: 'Live' | 'Draft' | 'In Review';
  kdpEnrollment: boolean;
  bsrRank: string;
  amazonRating: number;
  reviewCount: number;
  coverImage: string;
  price: string;
  amazonUrl: string;
  pageCount: number;
  compTitles: string;
  logline: string;
  synopsis: string;
}

export interface BookProfile {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  subgenre?: string;
  targetAudience: string;
  pubDate: string; // YYYY-MM-DD
  pageCount: number;
  isbn?: string;
  compTitles: string; // e.g. "Gone Girl meets The Silent Patient"
  logline: string;
  synopsis: string;
  uniqueAngle: string;
  authorBio: string;
  arcFormats: string[]; // e.g. ['ePub', 'PDF', 'NetGalley', 'Physical Galleys']
  arcLink: string; // NetGalley or BookFunnel URL
  coverImage?: string;
  tags?: string[];
  manuscripts?: ManuscriptFile[];
  kdpDetails?: AmazonKdpDetails;
}

export interface ExtractedBookMetadata {
  title: string;
  subtitle?: string;
  author: string;
  authorBio?: string;
  genre: string;
  subgenre?: string;
  targetAudience: string;
  pubDate?: string;
  pageCount: number;
  wordCountEstimate?: number;
  estimatedReadingHours?: number;
  compTitles: string;
  logline: string;
  synopsis: string;
  uniqueAngle?: string;
  detectedTropes?: string[];
  contentWarnings?: string[];
  arcBlurbTeaser?: string;
  kdpDetails?: AmazonKdpDetails;
  coverImage?: string;
}

export interface ReviewerOutlet {
  id: string;
  name: string;
  publication: string;
  category: OutletCategory;
  email?: string;
  submissionUrl?: string;
  website: string;
  leadTimeNotice: string;
  leadTimeDays: number;
  costPolicy: string; // e.g. "100% Free Editorial Review"
  preferredGenres: string[];
  formatsAccepted: string[];
  guidelines: string;
  proTips: string[];
  physicalAddress?: string;
  typicalResponseRate: number; // percentage, e.g. 24%
  avgTurnaroundDays: number; // e.g. 30
  followerOrReaderReach?: string; // e.g. "1.2M monthly readers" or "145k BookTok followers"
  requiresFTCCompliance: boolean;
  isPreloaded?: boolean;
  acceptsIndies?: string; // "Yes" | "Verify"
  contactMethod?: string; // "Website / submission policy" | "Email"
  reviewPlatforms?: string[]; // ["Blog", "Amazon", "Goodreads", "Social Media", "Website"]
  submissionRequirements?: string;
  source?: string; // "Indies Today 2026 reviewer directory"
  lastVerified?: string; // "2026-10-04"
  submissionStatus?: 'open' | 'closed' | 'arcs_only' | 'waitlist'; // Current submission queue status
  customNotes?: string; // User private notes
  tags?: string[]; // Quick tags
  verificationStatus?: 'verified_active' | 'recently_updated' | 'user_added';
  bookFitScores?: {
    jackAndBlaze?: 'High' | 'Potential' | 'Verify';
    echoesOfTheHeart?: 'High' | 'Potential' | 'Verify';
    [bookKey: string]: string | undefined;
  };
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'created' | 'pitched' | 'followup_sent' | 'reply_received' | 'arc_dispatched' | 'review_logged' | 'status_change';
  title: string;
  note?: string;
}

export interface Submission {
  id: string;
  bookId: string;
  reviewerId: string;
  status: SubmissionStatus;
  dateDiscovered: string;
  datePitched?: string;
  lastFollowUpDate?: string;
  nextFollowUpDate?: string;
  pitchSubject?: string;
  pitchBody?: string;
  pitchScore?: number;
  followUpStage?: number; // 0, 1, 2
  arcDelivered: boolean;
  arcFormatSent?: string;
  reviewerNotes?: string;
  reviewUrl?: string;
  rating?: number; // 1-5
  reviewQuote?: string;
  timeline: TimelineEvent[];
}

export interface PitchGenerationResult {
  subjectLineOptions: string[];
  recommendedSubjectLine: string;
  salutation: string;
  emailBody: string;
  openingHook: string;
  whyThisReviewer: string;
  matchScore: number;
  leadTimeWarning?: string;
  pitchHighlights: string[];
}

export interface FollowUpGenerationResult {
  subjectLine: string;
  emailBody: string;
  stageName: string;
  followUpAdvice: string;
  alternateVariation: string;
}

export interface ReviewerMatchResult {
  matchScore: number;
  isFit: boolean;
  matchSummary: string;
  pros: string[];
  cautions: string[];
  suggestedAngle: string;
  recommendedFormat: string;
  complianceNotes: string;
}
