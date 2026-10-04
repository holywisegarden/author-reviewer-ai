import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Send,
  Clock,
  Users,
  BarChart3,
  Award,
  BookMarked,
  Plus,
  Sparkles,
  ChevronDown,
  FileCheck,
  Check,
  Trash2,
  Mail,
} from 'lucide-react';
import { BookProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  books: BookProfile[];
  activeBookId: string;
  onSelectBook: (id: string) => void;
  onDeleteBook: (id: string) => void;
  onOpenNewBookModal: () => void;
  onOpenQuickPitch: () => void;
  onOpenLinkedEmail?: () => void;
  overdueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  books,
  activeBookId,
  onSelectBook,
  onDeleteBook,
  onOpenNewBookModal,
  onOpenQuickPitch,
  onOpenLinkedEmail,
  overdueCount,
}) => {
  const [isBookMenuOpen, setIsBookMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBookMenuOpen(false);
      }
    }
    if (isBookMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBookMenuOpen]);

  const activeBook = books.find((b) => b.id === activeBookId) || books[0];
  const manuscriptCount = activeBook?.manuscripts?.length || 0;

  const navItems = [
    { id: 'pipeline', label: 'Pipeline & CRM', icon: Send },
    { id: 'pitch', label: 'AI Pitch Studio', icon: Sparkles },
    {
      id: 'followups',
      label: 'Follow-Up Radar',
      icon: Clock,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      id: 'manuscript',
      label: 'Manuscript Vault',
      icon: FileCheck,
      badge: manuscriptCount > 0 ? `${manuscriptCount} ARCs` : undefined,
      isSpecialBadge: true,
    },
    { id: 'directory', label: 'Reviewer Directory', icon: Users },
    { id: 'analytics', label: 'Success Analytics', icon: BarChart3 },
    { id: 'praise', label: 'Praise & Blurbs', icon: Award },
    { id: 'presskit', label: 'Book Press Kit', icon: BookMarked },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <BookOpen className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-slate-100 tracking-tight">
                  Review<span className="text-amber-400">Pilot</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  AI Author CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Submissions, Pitch Crafting & Automated Follow-Ups
              </p>
            </div>
          </div>

          {/* Book Selector & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Active Book Selector (Click to toggle) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsBookMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 active:bg-slate-700 border border-slate-700 hover:border-amber-500/50 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-expanded={isBookMenuOpen}
                aria-haspopup="true"
                title="Click to switch active book"
              >
                {activeBook?.coverImage ? (
                  <img
                    src={activeBook.coverImage}
                    alt={activeBook.title}
                    className="w-5 h-7 object-cover rounded shadow-sm border border-slate-700"
                  />
                ) : (
                  <BookMarked className="w-4 h-4 text-amber-400" />
                )}
                <div className="text-left max-w-[140px] sm:max-w-[200px] truncate">
                  <div className="font-semibold text-slate-200 truncate">
                    {activeBook ? activeBook.title : 'Select Book'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {activeBook ? activeBook.author : 'No book selected'}
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${
                    isBookMenuOpen ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {/* Click-triggered Dropdown Menu */}
              {isBookMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2 mb-1.5">
                    <span>Switch Active Book</span>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {books.length} Available
                    </span>
                  </div>

                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {books.map((b) => {
                      const isSelected = b.id === activeBookId;
                      return (
                        <div
                          key={b.id}
                          className={`group/item w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectBook(b.id);
                              setIsBookMenuOpen(false);
                            }}
                            className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                          >
                            {b.coverImage ? (
                              <img
                                src={b.coverImage}
                                alt={b.title}
                                className="w-6 h-8 object-cover rounded shrink-0 border border-slate-700"
                              />
                            ) : (
                              <div className="w-6 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            )}
                            <div className="truncate flex-1 min-w-0">
                              <div className="truncate font-medium text-slate-100 flex items-center gap-1.5">
                                <span className="truncate">{b.title}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">{b.author}</div>
                              <div className="text-[10px] text-slate-400 truncate">{b.genre}</div>
                            </div>
                          </button>

                          {/* Delete Book Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsBookMenuOpen(false);
                              onDeleteBook(b.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition shrink-0"
                            title={`Remove "${b.title}" from active books`}
                            aria-label={`Remove "${b.title}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-800 my-1.5 pt-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNewBookModal();
                      setIsBookMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-amber-400 hover:bg-amber-400/10 flex items-center gap-2 transition font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Book Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Linked Email Action Button */}
            {onOpenLinkedEmail && (
              <button
                type="button"
                onClick={onOpenLinkedEmail}
                className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium text-xs px-3 py-2 rounded-lg transition"
                title="Manage linked sender email account"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">Linked Email</span>
              </button>
            )}

            {/* Quick Pitch Action Button */}
            <button
              onClick={onOpenQuickPitch}
              className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md shadow-amber-500/15 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Pitch a Reviewer</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition relative ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.isSpecialBadge
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
