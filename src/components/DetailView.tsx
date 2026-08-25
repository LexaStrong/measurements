import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Record } from '../utils/db';
import { TopSVG, DownSVG } from '../utils/svg';
import { Button } from './ui/Button';
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  Share2, 
  Trash2, 
  Edit3, 
  Loader2,
  Receipt,
  Scissors,
  X,
  ChevronRight,
  Sparkles,
  Maximize2,
  FileText,
  UserCheck
} from 'lucide-react';
import { shareRecord, ReceiptRecipient } from '../utils/share';

interface DetailViewProps {
  record: Record;
  onEdit: () => void;
  onDelete: () => void;
  onToggleReceived: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ record, onEdit, onDelete, onToggleReceived }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [sharingType, setSharingType] = useState<ReceiptRecipient | null>(null);
  const balance = (parseFloat(record.charged) || 0) - (parseFloat(record.paid) || 0);
  
  const getCollectionStatus = () => {
    if (record.received) return { label: 'Received', color: 'text-[#4A7C59]', bg: 'bg-[#4A7C59]/10' };
    if (!record.collection) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const colDate = new Date(record.collection);
    if (isNaN(colDate.getTime())) return null; // Invalid date handling
    
    colDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((colDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d Overdue`, color: 'text-[#C45C2A]', bg: 'bg-[#C45C2A]/10' };
    if (diffDays === 0) return { label: 'Due Today', color: 'text-[#C45C2A]', bg: 'bg-[#C45C2A]/10' };
    if (diffDays <= 2) return { label: `Due in ${diffDays}d`, color: 'text-[#C9A96E]', bg: 'bg-[#C9A96E]/10' };
    return { label: `Due in ${diffDays}d`, color: 'text-[#6B6560]', bg: 'bg-[#2A2624]' };
  };

  const handleShare = async (recipient: ReceiptRecipient) => {
    try {
      setSharingType(recipient);
      await shareRecord(record, recipient);
    } finally {
      setSharingType(null);
      setIsShareModalOpen(false);
    }
  };

  const status = getCollectionStatus();

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-[#E8E2D9] mb-1">{record.name}</h2>
        <p className="text-[#6B6560] font-medium">{record.garment || 'No Garment Specified'}</p>
        
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${record.phone}`}>
            <Phone size={16} /> Call
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Share2 size={16} />
            <span>Share</span>
          </Button>
        </div>
      </section>

      {/* Recipient Selection Modal (Mounted directly to document.body at z-[9999]) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isShareModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
              {/* Dark Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !sharingType && setIsShareModalOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
              />
              
              {/* Modal Container */}
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

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-bold text-[#E8E2D9]">Share Receipt</h3>
                    <p className="text-xs text-[#8A827B] mt-0.5">Select the target recipient format</p>
                  </div>
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    disabled={sharingType !== null}
                    className="p-2 rounded-full bg-white/5 text-[#8A827B] hover:text-[#E8E2D9] hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

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
                    onClick={() => setIsShareModalOpen(false)}
                    disabled={sharingType !== null}
                    className="w-full py-3.5 rounded-2xl text-sm font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Lightbox Modal for Reference Design */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isLightboxOpen && record.imageUrl && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsLightboxOpen(false)}
                className="fixed inset-0 bg-black/90 backdrop-blur-lg"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl max-h-[85vh] z-10 flex flex-col items-center"
              >
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-[#E8E2D9] hover:bg-white/20 transition-colors"
                  title="Close Lightbox"
                >
                  <X size={20} />
                </button>
                <img
                  src={record.imageUrl}
                  alt={`${record.name}'s Reference Design`}
                  className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
                />
                <div className="mt-3 text-center text-xs text-[#8A827B]">
                  {record.name} • {record.garment || 'Reference Design'}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Status Banners */}
      <section className="space-y-3">
        {status && (
          <div className={`p-4 rounded-2xl ${status.bg} border border-white/5 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {record.received ? <CheckCircle2 className={status.color} size={20} /> : <Clock className={status.color} size={20} />}
              <div>
                <div className={`text-sm font-bold uppercase tracking-widest ${status.color}`}>{status.label}</div>
                <div className="text-[10px] text-[#6B6560] uppercase tracking-tighter mt-0.5">
                  Collection: {new Date(record.collection).toLocaleDateString()}
                </div>
              </div>
            </div>
            <button 
              onClick={onToggleReceived}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${record.received ? 'bg-[#1E1A18] text-[#6B6560]' : 'bg-[#C9A96E] text-[#1E1A18]'}`}
            >
              {record.received ? 'Undo' : 'Mark Rcvd'}
            </button>
          </div>
        )}
      </section>

      {/* Reference Design Section (If attached) */}
      {record.imageUrl && (
        <section className="bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/10 shadow-lg group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Garment Reference Design</span>
            </h3>
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="text-xs text-[#8A827B] hover:text-[#C9A96E] flex items-center gap-1 transition-colors"
            >
              <Maximize2 size={13} />
              <span>Full View</span>
            </button>
          </div>

          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="relative h-64 w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer group/img flex items-center justify-center"
          >
            <img 
              src={record.imageUrl} 
              alt="Reference Design" 
              className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-center pb-3">
              <span className="text-xs font-semibold text-[#E8E2D9] px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                <Maximize2 size={12} /> Tap to zoom
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Diagrams */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/10 flex flex-col items-center shadow-lg hover:border-[#C9A96E]/20 transition-all">
          <span className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold mb-4">Top</span>
          <TopSVG record={record} />
        </div>
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/10 flex flex-col items-center shadow-lg hover:border-[#C9A96E]/20 transition-all">
          <span className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold mb-4">Bottom</span>
          <DownSVG record={record} />
        </div>
      </section>

      {/* Measurement Details */}
      <section className="bg-white/5 backdrop-blur-md rounded-[24px] border border-white/10 divide-y divide-white/10 shadow-lg">
        <div className="p-6">
          <h3 className="text-sm font-bold text-[#C9A96E] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>👕</span> Top Measurements
          </h3>
          <div className="grid grid-cols-2 gap-y-3">
            {[
              { label: 'Half Back', value: record.halfBack },
              { label: 'Full Back', value: record.fullBack },
              { label: 'Chest', value: record.chest },
              { label: 'Stomach', value: record.stomach },
              { label: 'Sleeves', value: record.sleeves },
              { label: 'Length', value: record.topLength },
              { label: 'Arm', value: record.arm },
              { label: 'Shoulder', value: record.shoulder },
              { label: 'Neck', value: record.neck },
              { label: 'Wrist', value: record.wrist },
              { label: 'Agbada', value: record.agbada },
              { label: 'Cap', value: record.cap },
            ].filter(f => f.value).map(f => (
              <div key={f.label} className="flex justify-between items-center pr-8">
                <span className="text-xs text-[#6B6560]">{f.label}</span>
                <span className="font-mono text-[#E8E2D9]">{f.value}"</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-sm font-bold text-[#C9A96E] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>👖</span> Down Measurements
          </h3>
          <div className="grid grid-cols-2 gap-y-3">
            {[
              { label: 'Waist', value: record.waist },
              { label: 'Length', value: record.downLength },
              { label: 'Hip', value: record.hip },
              { label: 'Bass', value: record.bass },
              { label: 'Thigh', value: record.thigh },
              { label: 'Knee', value: record.knee },
              { label: 'Inseam', value: record.inseam },
              { label: 'Outseam', value: record.outseam },
            ].filter(f => f.value).map(f => (
              <div key={f.label} className="flex justify-between items-center pr-8">
                <span className="text-xs text-[#6B6560]">{f.label}</span>
                <span className="font-mono text-[#E8E2D9]">{f.value}"</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financials */}
      <section className="bg-white/5 backdrop-blur-md p-6 rounded-[24px] border border-white/10 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <div className="text-[10px] text-[#6B6560] uppercase tracking-widest font-bold mb-1">Charged</div>
            <div className="text-lg font-bold text-[#E8E2D9]">₵{parseFloat(record.charged || '0').toFixed(2)}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-[10px] text-[#6B6560] uppercase tracking-widest font-bold mb-1">Paid</div>
            <div className="text-lg font-bold text-[#4A7C59]">₵{parseFloat(record.paid || '0').toFixed(2)}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-[10px] text-[#6B6560] uppercase tracking-widest font-bold mb-1">Balance</div>
            <div className={`text-lg font-bold ${balance > 0 ? 'text-[#C45C2A]' : 'text-[#4A7C59]'}`}>
              {balance > 0 ? `₵${balance.toFixed(2)}` : '✓ Paid'}
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      {record.notes && (
        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[24px] border border-white/10 shadow-lg">
          <h3 className="text-xs font-bold text-[#6B6560] uppercase tracking-widest mb-3">Notes</h3>
          <p className="text-sm text-[#E8E2D9] leading-relaxed whitespace-pre-wrap">{record.notes}</p>
        </section>
      )}

      {/* Footer Actions */}
      <section className="flex gap-4 pt-6 border-t border-white/10">
        <Button variant="outline" className="flex-1" onClick={onEdit}>
          <Edit3 size={18} /> Edit
        </Button>
        <Button variant="red" className="flex-1" onClick={onDelete}>
          <Trash2 size={18} /> Delete
        </Button>
      </section>
    </div>
  );
};
