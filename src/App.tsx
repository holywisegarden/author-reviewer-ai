/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  loadBooks,
  saveBooks,
  loadReviewers,
  saveReviewers,
  loadSubmissions,
  saveSubmissions,
  getActiveBookId,
  setActiveBookId,
  resetToDefaults,
  syncReviewerDirectoryDatabase,
} from './utils/storage';
import { BookProfile, ReviewerOutlet, Submission } from './types';
import { Navbar } from './components/Navbar';
import { PipelineView } from './components/PipelineView';
import { PitchStudio } from './components/PitchStudio';
import { FollowUpEngine } from './components/FollowUpEngine';
import { ReviewerDirectory } from './components/ReviewerDirectory';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PraiseWall } from './components/PraiseWall';
import { BookPressKitModal } from './components/BookPressKitModal';
import { ManuscriptVault } from './components/ManuscriptVault';
import { NewBookModal } from './components/NewBookModal';
import { DeleteBookModal } from './components/DeleteBookModal';
import { LinkedEmailModal } from './components/LinkedEmailModal';
import { Sparkles, RotateCcw } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<BookProfile[]>(() => loadBooks());
  const [activeBookId, setActiveBookIdState] = useState<string>(() =>
    getActiveBookId(loadBooks())
  );
  const [reviewers, setReviewers] = useState<ReviewerOutlet[]>(() => loadReviewers());
  const [submissions, setSubmissions] = useState<Submission[]>(() => loadSubmissions());
  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [targetPitchReviewerId, setTargetPitchReviewerId] = useState<string | undefined>(undefined);
  const [showNewBookModal, setShowNewBookModal] = useState<boolean>(false);
  const [bookIdToDelete, setBookIdToDelete] = useState<string | null>(null);
  const [showLinkedEmailModal, setShowLinkedEmailModal] = useState<boolean>(false);

  // Active book
  const activeBook = books.find((b) => b.id === activeBookId) || books[0];

  // Save changes to storage
  useEffect(() => {
    saveBooks(books);
  }, [books]);

  useEffect(() => {
    saveReviewers(reviewers);
  }, [reviewers]);

  useEffect(() => {
    saveSubmissions(submissions);
  }, [submissions]);

  // Keep activeBookId in sync with available books
  useEffect(() => {
    if (!books.some((b) => b.id === activeBookId) && books.length > 0) {
      const nextId = books[0].id;
      setActiveBookIdState(nextId);
      setActiveBookId(nextId);
    }
  }, [books, activeBookId]);

  const handleSelectBook = (id: string) => {
    setActiveBookIdState(id);
    setActiveBookId(id);
  };

  const handleUpdateSubmission = (updated: Submission) => {
    setSubmissions((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
  };

  const handleSavePitchToPipeline = (sub: Submission) => {
    handleUpdateSubmission(sub);
  };

  const handleOpenPitchStudio = (reviewerId?: string) => {
    if (reviewerId) {
      setTargetPitchReviewerId(reviewerId);
    }
    setActiveTab('pitch');
  };

  const handleOpenFollowUpStudio = (_sub: Submission) => {
    setActiveTab('followups');
  };

  const handleAddReviewer = (newRev: ReviewerOutlet) => {
    setReviewers((prev) => [newRev, ...prev]);
  };

  const handleUpdateReviewer = (updatedRev: ReviewerOutlet) => {
    setReviewers((prev) => prev.map((r) => (r.id === updatedRev.id ? updatedRev : r)));
  };

  const handleBulkAddReviewers = (newRevs: ReviewerOutlet[]) => {
    setReviewers((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const filtered = newRevs.filter((r) => !existingIds.has(r.id));
      return [...filtered, ...prev];
    });
  };

  const handleDeleteReviewer = (id: string) => {
    setReviewers((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSyncReviewers = () => {
    const refreshed = syncReviewerDirectoryDatabase(activeBook);
    setReviewers(refreshed);
  };

  const handleSaveBook = (updatedBook: BookProfile) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
  };

  const handleAddNewBook = (newBook: BookProfile) => {
    setBooks((prev) => [newBook, ...prev]);
    handleSelectBook(newBook.id);
  };

  const handleDeleteBook = (id: string) => {
    setBookIdToDelete(id);
  };

  const executeDeleteBook = () => {
    if (!bookIdToDelete) return;
    const remainingBooks = books.filter((b) => b.id !== bookIdToDelete);

    // Clean up submissions for this book
    setSubmissions((prev) => prev.filter((s) => s.bookId !== bookIdToDelete));

    if (remainingBooks.length === 0) {
      const freshBook: BookProfile = {
        id: `book-${Date.now()}`,
        title: 'My New Book Campaign',
        author: 'Author Name',
        genre: 'Fiction',
        targetAudience: 'General readers',
        pubDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pageCount: 320,
        compTitles: 'Top comp titles in genre',
        logline: 'One punchy sentence describing your story.',
        synopsis: 'A comprehensive synopsis of your book...',
        uniqueAngle: 'Unique hook for reviewers and media outlets',
        authorBio: 'Author bio and background...',
        arcFormats: ['ePub', 'PDF', 'NetGalley'],
        arcLink: 'Available upon request',
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        manuscripts: [],
      };
      setBooks([freshBook]);
      setActiveBookIdState(freshBook.id);
      setActiveBookId(freshBook.id);
      setShowNewBookModal(true);
    } else {
      setBooks(remainingBooks);
      if (activeBookId === bookIdToDelete) {
        const nextActiveId = remainingBooks[0].id;
        setActiveBookIdState(nextActiveId);
        setActiveBookId(nextActiveId);
      }
    }
    setBookIdToDelete(null);
  };

  const handleResetData = () => {
    const defs = resetToDefaults();
    setBooks(defs.books);
    setReviewers(defs.reviewers);
    setSubmissions(defs.submissions);
    setActiveBookIdState(defs.books[0].id);
  };

  // Overdue count for active book
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = submissions.filter(
    (s) =>
      s.bookId === activeBook?.id &&
      ['pitched', 'followup_1', 'followup_2'].includes(s.status) &&
      s.nextFollowUpDate &&
      s.nextFollowUpDate <= today
  ).length;

  if (!activeBook) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading ReviewPilot...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        books={books}
        activeBookId={activeBookId}
        onSelectBook={handleSelectBook}
        onDeleteBook={handleDeleteBook}
        onOpenNewBookModal={() => setShowNewBookModal(true)}
        onOpenQuickPitch={() => handleOpenPitchStudio()}
        onOpenLinkedEmail={() => setShowLinkedEmailModal(true)}
        overdueCount={overdueCount}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'pipeline' && (
          <PipelineView
            book={activeBook}
            books={books}
            onSelectBook={handleSelectBook}
            onDeleteBook={handleDeleteBook}
            submissions={submissions}
            reviewers={reviewers}
            onUpdateSubmission={handleUpdateSubmission}
            onOpenPitchStudio={handleOpenPitchStudio}
            onOpenFollowUpStudio={handleOpenFollowUpStudio}
          />
        )}

        {activeTab === 'pitch' && (
          <PitchStudio
            book={activeBook}
            reviewers={reviewers}
            submissions={submissions}
            initialReviewerId={targetPitchReviewerId}
            onSavePitchToPipeline={handleSavePitchToPipeline}
            onGoToPipeline={() => setActiveTab('pipeline')}
            onOpenLinkedEmail={() => setShowLinkedEmailModal(true)}
          />
        )}

        {activeTab === 'followups' && (
          <FollowUpEngine
            book={activeBook}
            submissions={submissions}
            reviewers={reviewers}
            onUpdateSubmission={handleUpdateSubmission}
            onOpenPitchStudio={handleOpenPitchStudio}
            onOpenLinkedEmail={() => setShowLinkedEmailModal(true)}
          />
        )}

        {activeTab === 'manuscript' && (
          <ManuscriptVault
            book={activeBook}
            onUpdateBook={handleSaveBook}
            onSelectForPitch={() => handleOpenPitchStudio()}
          />
        )}

        {activeTab === 'directory' && (
          <ReviewerDirectory
            book={activeBook}
            reviewers={reviewers}
            onSelectReviewerForPitch={handleOpenPitchStudio}
            onAddReviewer={handleAddReviewer}
            onUpdateReviewer={handleUpdateReviewer}
            onDeleteReviewer={handleDeleteReviewer}
            onBulkAddReviewers={handleBulkAddReviewers}
            onSyncDatabase={handleSyncReviewers}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            book={activeBook}
            submissions={submissions}
            reviewers={reviewers}
          />
        )}

        {activeTab === 'praise' && (
          <PraiseWall
            book={activeBook}
            submissions={submissions}
            reviewers={reviewers}
          />
        )}

        {activeTab === 'presskit' && (
          <BookPressKitModal
            book={activeBook}
            onSaveBook={handleSaveBook}
            onAddNewBook={handleAddNewBook}
            onDeleteBook={handleDeleteBook}
          />
        )}
      </main>

      {/* New Book Modal */}
      {showNewBookModal && (
        <NewBookModal
          onClose={() => setShowNewBookModal(false)}
          onAddBook={handleAddNewBook}
        />
      )}

      {/* Delete Book Confirmation Modal */}
      <DeleteBookModal
        isOpen={!!bookIdToDelete}
        bookTitle={books.find((b) => b.id === bookIdToDelete)?.title || 'this book'}
        onClose={() => setBookIdToDelete(null)}
        onConfirmDelete={executeDeleteBook}
      />

      {/* Linked Email Account Modal */}
      {showLinkedEmailModal && (
        <LinkedEmailModal onClose={() => setShowLinkedEmailModal(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-300">
              Review<span className="text-amber-400">Pilot</span> AI
            </span>
            <span>•</span>
            <span>Author Book Review Outreach CRM & Automated Follow-Up Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">
              Strictly adheres to FTC Review Endorsement Guides & Amazon Community Policies.
            </span>
            <button
              onClick={handleResetData}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
              title="Reset initial demo data"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
