import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  Save,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import { LinkedEmailAccount } from '../types';
import { getLinkedEmailAccount, saveLinkedEmailAccount } from '../utils/accountSettings';

interface LinkedEmailModalProps {
  onClose: () => void;
  onUpdateAccount?: (acc: LinkedEmailAccount) => void;
}

export const LinkedEmailModal: React.FC<LinkedEmailModalProps> = ({ onClose, onUpdateAccount }) => {
  const [account, setAccount] = useState<LinkedEmailAccount>(getLinkedEmailAccount());
  const [testSent, setTestSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.senderEmail.trim()) return;

    const updated: LinkedEmailAccount = {
      ...account,
      isConnected: true,
      connectedAt: new Date().toISOString(),
    };

    saveLinkedEmailAccount(updated);
    setAccount(updated);
    if (onUpdateAccount) onUpdateAccount(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSendTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-base">
                Link Author Email Account
              </h3>
              <p className="text-[11px] text-slate-400">
                Connect your email to send pitches and follow-ups directly to book reviewers.
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

        {/* Current status pill */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <span className="font-bold text-slate-200">Active Outreach Sender: </span>
              <span className="text-amber-300 font-mono">{account.senderEmail}</span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded font-semibold border border-emerald-500/30">
            Linked
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Your Sender Email Address *
            </label>
            <input
              type="email"
              required
              value={account.senderEmail}
              onChange={(e) => setAccount({ ...account, senderEmail: e.target.value })}
              placeholder="e.g. author@gmail.com or jane@janedoeauthor.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Display Name in Reviewer Inbox
            </label>
            <input
              type="text"
              required
              value={account.senderName}
              onChange={(e) => setAccount({ ...account, senderName: e.target.value })}
              placeholder="e.g. Jane Doe (Author) or Harper & Grey Literary"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Preferred Email Dispatch Provider
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                  account.provider === 'gmail'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="gmail"
                  checked={account.provider === 'gmail'}
                  onChange={() => setAccount({ ...account, provider: 'gmail' })}
                  className="hidden"
                />
                <span>🔴 Gmail (1-Click Web)</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                  account.provider === 'outlook'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="outlook"
                  checked={account.provider === 'outlook'}
                  onChange={() => setAccount({ ...account, provider: 'outlook' })}
                  className="hidden"
                />
                <span>🔵 Outlook / 365</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                  account.provider === 'apple_mail'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="apple_mail"
                  checked={account.provider === 'apple_mail'}
                  onChange={() => setAccount({ ...account, provider: 'apple_mail' })}
                  className="hidden"
                />
                <span>✉️ Default Client (mailto)</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                  account.provider === 'custom_smtp'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="custom_smtp"
                  checked={account.provider === 'custom_smtp'}
                  onChange={() => setAccount({ ...account, provider: 'custom_smtp' })}
                  className="hidden"
                />
                <span>⚡ Direct App Dispatch</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Author Email Signature
            </label>
            <textarea
              rows={3}
              value={account.signature || ''}
              onChange={(e) => setAccount({ ...account, signature: e.target.value })}
              placeholder="Best regards,&#10;Author Name&#10;Website / KDP Amazon Link"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs font-sans leading-relaxed focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="bg-emerald-950/20 border border-emerald-800/30 p-3 rounded-xl flex items-center gap-2 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All reviewer pitches sent will automatically include FTC-mandated disclosure and your personal ARC links.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSendTest}
              className="text-slate-400 hover:text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              {testSent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
              <span>{testSent ? 'Test Ping Sent!' : 'Send Test Ping'}</span>
            </button>

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
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-blue-600/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveSuccess ? 'Saved!' : 'Save Linked Email'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
