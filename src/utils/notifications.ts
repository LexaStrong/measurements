import { Record } from './db';

export interface ReminderItem {
  record: Record;
  diffDays: number;
  urgency: 'due_3_days' | 'due_today' | 'overdue' | 'future';
  urgencyLabel: string;
  badgeColor: string;
  badgeBg: string;
}

export interface CollectionReminders {
  dueIn3Days: ReminderItem[];
  dueToday: ReminderItem[];
  overdue: ReminderItem[];
  allActive: ReminderItem[];
  totalAlertsCount: number;
}

/**
 * Calculates collection reminders across all records, specifically flagging
 * garments that are due in 3 days, due today, or overdue.
 */
export const getCollectionReminders = (records: Record[]): CollectionReminders => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dueIn3Days: ReminderItem[] = [];
  const dueToday: ReminderItem[] = [];
  const overdue: ReminderItem[] = [];

  records.forEach((record) => {
    // Only uncollected garments with a collection date are eligible for reminders
    if (record.received || !record.collection) return;

    const colDate = new Date(record.collection);
    if (isNaN(colDate.getTime())) return;
    colDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((colDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      overdue.push({
        record,
        diffDays,
        urgency: 'overdue',
        urgencyLabel: `${Math.abs(diffDays)}d Overdue`,
        badgeColor: 'text-[#C45C2A]',
        badgeBg: 'bg-[#C45C2A]/15 border-[#C45C2A]/30',
      });
    } else if (diffDays === 0) {
      dueToday.push({
        record,
        diffDays,
        urgency: 'due_today',
        urgencyLabel: 'Due Today',
        badgeColor: 'text-[#C45C2A]',
        badgeBg: 'bg-[#C45C2A]/20 border-[#C45C2A]/40',
      });
    } else if (diffDays <= 3) {
      dueIn3Days.push({
        record,
        diffDays,
        urgency: 'due_3_days',
        urgencyLabel: diffDays === 1 ? 'Due Tomorrow' : `Due in ${diffDays} Days`,
        badgeColor: 'text-[#C9A96E]',
        badgeBg: 'bg-[#C9A96E]/15 border-[#C9A96E]/30',
      });
    }
  });

  // Sort by urgency: Overdue first (most overdue first), then Due Today, then Due in 3 days (nearest first)
  overdue.sort((a, b) => a.diffDays - b.diffDays);
  dueIn3Days.sort((a, b) => a.diffDays - b.diffDays);

  const allActive = [...dueToday, ...dueIn3Days, ...overdue];
  const totalAlertsCount = dueIn3Days.length + dueToday.length + overdue.length;

  return {
    dueIn3Days,
    dueToday,
    overdue,
    allActive,
    totalAlertsCount,
  };
};

/**
 * Creates a pre-filled WhatsApp message URL for sending collection/fitting reminders to clients.
 */
export const createWhatsAppReminderUrl = (
  phone: string,
  clientName: string,
  garment: string,
  collectionDate: string,
  diffDays: number
): string => {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const formattedDate = new Date(collectionDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  let message = '';
  if (diffDays === 0) {
    message = `Hello ${clientName}, this is a gentle reminder from Lemaire Atelier that your ${garment || 'garment'} is scheduled for collection today (${formattedDate}). We look forward to seeing you!`;
  } else if (diffDays === 1) {
    message = `Hello ${clientName}, friendly reminder from Lemaire Atelier: your ${garment || 'garment'} is scheduled for collection tomorrow (${formattedDate}).`;
  } else if (diffDays > 0) {
    message = `Hello ${clientName}, friendly reminder from Lemaire Atelier: your ${garment || 'garment'} is scheduled for collection in ${diffDays} days on ${formattedDate}.`;
  } else {
    message = `Hello ${clientName}, greeting from Lemaire Atelier. Your ${garment || 'garment'} was scheduled for collection on ${formattedDate}. Please let us know when you would like to pick it up.`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Requests browser notification permission.
 */
export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
};

/**
 * Dispatches a native browser notification for upcoming 3-day deadlines.
 */
export const sendBrowserReminders = (reminders: CollectionReminders) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const { dueToday, dueIn3Days } = reminders;
  const count = dueToday.length + dueIn3Days.length;
  if (count === 0) return;

  const topReminder = dueToday[0] || dueIn3Days[0];
  const title = `✂️ Lemaire Atelier: ${count} Collection ${count === 1 ? 'Deadline' : 'Deadlines'}`;
  const body = topReminder
    ? `${topReminder.record.name}'s ${topReminder.record.garment || 'Garment'} is ${topReminder.urgencyLabel.toLowerCase()}.`
    : `You have ${count} orders scheduled for collection soon.`;

  try {
    new Notification(title, {
      body,
      icon: '/logo.png',
      tag: 'lemaire-collection-reminder',
    });
  } catch (err) {
    console.warn('Native notification failed:', err);
  }
};
