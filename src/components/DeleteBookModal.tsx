import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteBookModalProps {
  bookTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteBookModal: React.FC<DeleteBookModalProps> = ({
  bookTitle,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-slate-100 text-base">
              Remove Book Campaign?
            </h3>
            <p className="text-xs text-slate-400">
              This action will remove the book from your active catalog.
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            Are you sure you want to remove <strong className="text-white">"{bookTitle}"</strong>?
          </p>
          <p className="text-[11px] text-slate-400">
            All associated pitches, outreach logs, follow-up schedules, and vaulted manuscript files for this title will be removed from your CRM.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition border border-slate-700"
          >
            Cancel / Keep Book
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow-md shadow-rose-600/20 active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Yes, Remove Book</span>
          </button>
        </div>
      </div>
    </div>
  );
};
