import { LinkedEmailAccount, KdpAccountSession, KdpBookshelfBook } from '../types';

const EMAIL_STORAGE_KEY = 'reviewpilot_linked_email';
const KDP_STORAGE_KEY = 'reviewpilot_kdp_session';

export const DEFAULT_LINKED_EMAIL: LinkedEmailAccount = {
  senderEmail: 'elmo00086@gmail.com',
  senderName: 'Author Outreach Team',
  provider: 'gmail',
  signature: 'Best regards,\nAuthor & Literary Team\nReview Copies Available via NetGalley & KDP',
  isConnected: true,
  connectedAt: new Date().toISOString(),
};

export function getLinkedEmailAccount(): LinkedEmailAccount {
  try {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_LINKED_EMAIL;
}

export function saveLinkedEmailAccount(acc: LinkedEmailAccount): void {
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(acc));
  } catch {
    // ignore
  }
}

export function getKdpAccountSession(): KdpAccountSession | null {
  try {
    const raw = localStorage.getItem(KDP_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
}

export function saveKdpAccountSession(session: KdpAccountSession | null): void {
  try {
    if (session) {
      localStorage.setItem(KDP_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(KDP_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export const SAMPLE_KDP_BOOKSHELF: KdpBookshelfBook[] = [
  {
    asin: 'B09KV8W',
    isbn: '978-1982137274',
    title: 'The Silent Vow',
    subtitle: 'A Gripping Psychological Thriller with a Heart-Stopping Twist',
    author: 'Elena Vance',
    genre: 'Mystery & Psychological Suspense',
    status: 'Live',
    kdpEnrollment: true,
    bsrRank: '#1,240 in Kindle Store (Top 10 in Psychological Thrillers)',
    amazonRating: 4.8,
    reviewCount: 156,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    price: '$4.99 (Kindle Unlimited)',
    amazonUrl: 'https://www.amazon.com/dp/B09KV8W',
    pageCount: 320,
    compTitles: 'The Housemaid by Freida McFadden meets Verity by Colleen Hoover',
    logline: 'A grieving archivist takes a position in a secluded coastal manor, only to discover her predecessor was murdered to hide a dark family secret.',
    synopsis: 'Published via Kindle Direct Publishing, The Silent Vow follows archivist Clara Thorne as she catalogues the private papers of the reclusive Sterling family. Within the cedar-lined cabinets of Blackwood Manor lies an unpublished manuscript containing precise confessions to unsolved crimes. When the manor is cut off by winter tides, Clara must decipher the cipher before she becomes the killer’s final chapter.',
  },
  {
    asin: 'B08XYZ2',
    isbn: '978-0593135204',
    title: 'Quantum Horizon',
    subtitle: 'A Hard Sci-Fi Space Opera',
    author: 'Dr. Aris Thorne',
    genre: 'Science Fiction & Cyberpunk',
    status: 'Live',
    kdpEnrollment: true,
    bsrRank: '#3,410 in Kindle Store (Top 25 in Hard Sci-Fi)',
    amazonRating: 4.7,
    reviewCount: 84,
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    price: '$3.99 (Kindle Unlimited)',
    amazonUrl: 'https://www.amazon.com/dp/B08XYZ2',
    pageCount: 390,
    compTitles: 'The Three-Body Problem by Cixin Liu meets Project Hail Mary by Andy Weir',
    logline: 'When an interstellar mining vessel detects a conscious artificial intelligence signal from inside a dying star, humanity’s first contact becomes a race against gravitational collapse.',
    synopsis: 'At the outer edge of the Kuiper belt, the survey ship Astraea monitors solar resonance flares. Commander Maya Chen intercepts a repeating radio beacon transmitted on Planck-scale frequencies. The message is not extraterrestrial: it is an encrypted biometric distress signal signed with her own DNA signature from eighteen years in the future.',
  },
  {
    asin: 'B07N8Z9',
    isbn: '978-0062457714',
    title: 'The Deep Focus Protocol',
    subtitle: 'How to Reclaim Your Attention, Build Cognitive Sovereignty, and Do Deep Work',
    author: 'Maya Lin, PhD',
    genre: 'Non-Fiction / Productivity & Psychology',
    status: 'Live',
    kdpEnrollment: false,
    bsrRank: '#890 in Kindle Store (Top 5 in Self-Help / Time Management)',
    amazonRating: 4.9,
    reviewCount: 312,
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    price: '$9.99 (Kindle & Print)',
    amazonUrl: 'https://www.amazon.com/dp/B07N8Z9',
    pageCount: 260,
    compTitles: 'Atomic Habits by James Clear meets Deep Work by Cal Newport',
    logline: 'An evidence-backed neuro-cognitive system to eliminate digital distraction and double creative output in 30 days.',
    synopsis: 'Grounded in five years of cognitive laboratory research at Oxford, The Deep Focus Protocol offers practical frameworks for chronotype sprint cycles, dopamine reset routines, and environmental sensory shielding. Readers learn how high-performing novelists and researchers produce enduring work amidst algorithmic chaos.',
  },
];
