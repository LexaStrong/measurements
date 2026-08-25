import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Record } from '../utils/db';
import { 
  CollectionReminders, 
  ReminderItem, 
  createWhatsAppReminderUrl,
  requestBrowserNotificationPermission 
} from '../utils/notifications';
import { Button } from './ui/Button';
import { 
  Bell, 
  Clock, 
  Calendar, 
  Phone, 
  MessageSquare, 
  X, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Scissors,
  Sparkles
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: CollectionReminders;
  onSelectRecord: (record: Record) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onSelectRecord,
}) => {
  const [filter, setFilter] = useState<'all' | '3days' | 'today' | 'overdue'>('all');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
  };

  const getFilteredItems = (): ReminderItem[] => {
    switch (filter) {
      case '3days':
        return reminders.dueIn3Days;
      case 'today':
        return reminders.dueToday;
      case 'overdue':
        return reminders.overdue;
      default:
        return reminders.allActive;
    }
  };

  const filteredList = getFilteredItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-full sm:max-w-xl max-h-[90vh] bg-[#1E1A18] border border-white/10 sm:rounded-[32px] rounded-t-[32px] p-6 shadow-2xl z-10 flex flex-col overflow-hidden"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#E8E2D9]">Collection Reminders</h3>
                  <p className="text-xs text-[#8A827B]">3-day upcoming deadlines & overdue alerts</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 text-[#8A827B] hover:text-[#E8E2D9] hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Browser Permission Banner (if not granted yet) */}
            {notificationPermission === 'default' && (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-[#C9A96E] shrink-0" />
                  <span className="text-xs text-[#E8E2D9]">
                    Enable device notifications for deadline reminders
                  </span>
                </div>
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1 rounded-xl bg-[#C9A96E] text-[#1E1A18] text-xs font-bold hover:bg-[#D4B985] transition-colors shrink-0"
                >
                  Enable
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 py-4 overflow-x-auto shrink-0 no-scrollbar">
              <button
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-[#C9A96E] text-[#1E1A18]'
                    : 'bg-white/5 text-[#8A827B] hover:text-[#E8E2D9]'
                }`}
              >
                All Alerts ({reminders.totalAlertsCount})
              </button>

              <button
                onClick={() => setFilter('3days')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  filter === '3days'
                    ? 'bg-[#C9A96E] text-[#1E1A18]'
                    : 'bg-white/5 text-[#8A827B] hover:text-[#E8E2D9]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#C9A96E]" />
                <span>Due in 3 Days ({reminders.dueIn3Days.length})</span>
              </button>

              <button
                onClick={() => setFilter('today')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  filter === 'today'
                    ? 'bg-[#C9A96E] text-[#1E1A18]'
                    : 'bg-white/5 text-[#8A827B] hover:text-[#E8E2D9]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#C45C2A]" />
                <span>Due Today ({reminders.dueToday.length})</span>
              </button>

              <button
                onClick={() => setFilter('overdue')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  filter === 'overdue'
                    ? 'bg-[#C9A96E] text-[#1E1A18]'
                    : 'bg-white/5 text-[#8A827B] hover:text-[#E8E2D9]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#C45C2A]" />
                <span>Overdue ({reminders.overdue.length})</span>
              </button>
            </div>

            {/* Reminder Cards List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
              {filteredList.length > 0 ? (
                filteredList.map(({ record, urgencyLabel, badgeColor, badgeBg, diffDays }) => {
                  const balance = (parseFloat(record.charged || '0') || 0) - (parseFloat(record.paid || '0') || 0);
                  const whatsAppUrl = record.phone
                    ? createWhatsAppReminderUrl(
                        record.phone,
                        record.name,
                        record.garment,
                        record.collection,
                        diffDays
                      )
                    : null;

                  return (
                    <div
                      key={record.id}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1E1A18] border border-white/10 flex items-center justify-center text-[#C9A96E] shrink-0 mt-0.5">
                          <Scissors size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-[#E8E2D9] group-hover:text-[#C9A96E] transition-colors">
                              {record.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${badgeBg} ${badgeColor}`}>
                              {urgencyLabel}
                            </span>
                          </div>

                          <div className="text-xs text-[#8A827B] mt-1 flex flex-wrap items-center gap-2">
                            <span>{record.garment || 'Custom Garment'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(record.collection).toLocaleDateString()}
                            </span>
                            {balance > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-[#C45C2A] font-semibold">
                                  ₵{balance.toFixed(2)} owed
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {record.phone && (
                          <a
                            href={`tel:${record.phone}`}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8A827B] hover:text-[#E8E2D9] transition-colors"
                            title="Call Client"
                          >
                            <Phone size={16} />
                          </a>
                        )}

                        {whatsAppUrl && (
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#4A7C59]/15 hover:bg-[#4A7C59]/25 text-[#4A7C59] transition-colors flex items-center gap-1.5 text-xs font-semibold"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare size={16} />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => {
                            onSelectRecord(record);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 text-[#C9A96E] transition-colors flex items-center gap-1 text-xs font-bold"
                        >
                          <span>View</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-[#8A827B]">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-[#4A7C59]">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-base font-semibold text-[#E8E2D9]">All Caught Up!</h4>
                  <p className="text-xs mt-1">No orders due in this category</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
