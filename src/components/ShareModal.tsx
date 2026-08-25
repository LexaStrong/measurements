import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Record } from '../utils/db';
import { Button } from './ui/Button';
import { shareRecord, ReceiptRecipient } from '../utils/share';
import { Receipt, Scissors, X, ChevronRight, Loader2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  record: Record | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, record, onClose }) => {
  const [sharingType, setSharingType] = useState<ReceiptRecipient | null>(null);

  if (!record) return null;

  const handleShare = async (recipient: ReceiptRecipient) => {
    try {
      setSharingType(recipient);
      await shareRecord(record, recipient);
    } finally {
      setSharingType(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !sharingType && onClose()}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal / Drawer Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full sm:max-w-md bg-[#1E1A18] border-t sm:border border-[#C9A96E]/25 rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
          >
            {/* Pull Handle for mobile */}
            <div className="sm:hidden w-full flex justify-center pb-3">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-[#E8E2D9]">Share Receipt</h3>
                <p className="text-xs text-[#8A827B] mt-0.5">Select receipt type for {record.name}</p>
              </div>
              <button
                onClick={onClose}
                disabled={sharingType !== null}
                className="p-2 rounded-full bg-white/5 text-[#8A827B] hover:text-[#E8E2D9] hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selection Options */}
            <div className="space-y-3.5">
              {/* Option 1: Customer Receipt */}
              <button
                type="button"
                onClick={() => handleShare('customer')}
                disabled={sharingType !== null}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none touch-manipulation active:scale-[0.98] ${
                  sharingType === 'customer'
                    ? 'bg-[#C9A96E]/15 border-[#C9A96E] shadow-lg shadow-[#C9A96E]/10'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-[#C9A96E]/40'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E] shrink-0">
                    {sharingType === 'customer' ? (
                      <Loader2 size={22} className="animate-spin text-[#C9A96E]" />
                    ) : (
                      <Receipt size={22} />
                    )}
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#E8E2D9] flex items-center gap-2">
                      <span>Customer Receipt</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30">
                        Client Copy
                      </span>
                    </div>
                    <p className="text-xs text-[#8A827B] mt-0.5 leading-relaxed">
                      Invoice & payment summary (measurements omitted)
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {sharingType === 'customer' ? (
                    <span className="text-xs text-[#C9A96E] font-bold animate-pulse">Generating...</span>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8A827B]">
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
              </button>

              {/* Option 2: Apprentice / Designer */}
              <button
                type="button"
                onClick={() => handleShare('apprentice')}
                disabled={sharingType !== null}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none touch-manipulation active:scale-[0.98] ${
                  sharingType === 'apprentice'
                    ? 'bg-[#C45C2A]/15 border-[#C45C2A] shadow-lg shadow-[#C45C2A]/10'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-[#C45C2A]/40'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#C45C2A]/15 border border-[#C45C2A]/30 flex items-center justify-center text-[#C45C2A] shrink-0">
                    {sharingType === 'apprentice' ? (
                      <Loader2 size={22} className="animate-spin text-[#C45C2A]" />
                    ) : (
                      <Scissors size={22} />
                    )}
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#E8E2D9] flex items-center gap-2">
                      <span>Apprentice / Tailor</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#C45C2A]/20 text-[#C45C2A] border border-[#C45C2A]/30">
                        Work Order
                      </span>
                    </div>
                    <p className="text-xs text-[#8A827B] mt-0.5 leading-relaxed">
                      Technical work order with full precision measurements
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {sharingType === 'apprentice' ? (
                    <span className="text-xs text-[#C45C2A] font-bold animate-pulse">Generating...</span>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8A827B]">
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="mt-5 pt-3 border-t border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={sharingType !== null}
                className="w-full py-3.5 rounded-2xl text-sm font-medium"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
