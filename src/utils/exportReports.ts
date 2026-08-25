import { Record } from './db';

export interface GarmentStat {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface MonthStat {
  monthIndex: number;
  monthName: string;
  count: number;
  revenue: number;
  charged: number;
  balance: number;
}

export interface ReportSummary {
  periodType: 'monthly' | 'yearly';
  year: number;
  month?: number; // 0-11
  periodLabel: string;
  totalRecords: number;
  totalCharged: number;
  totalPaid: number;
  totalBalance: number;
  collectionRate: number; // percentage of charged that has been paid
  settledCount: number;
  partialCount: number;
  unpaidCount: number;
  receivedCount: number;
  pendingCount: number;
  overdueCount: number;
  garments: GarmentStat[];
  monthlyBreakdown: MonthStat[];
  records: Record[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Calculates all analytical metrics for a given monthly or yearly period.
 */
export const calculateReportSummary = (
  records: Record[],
  periodType: 'monthly' | 'yearly',
  year: number,
  month: number = new Date().getMonth()
): ReportSummary => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Filter records by period
  const periodRecords = records.filter((r) => {
    if (!r.date) return false;
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return false;
    if (periodType === 'yearly') {
      return d.getFullYear() === year;
    }
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Sort descending by date
  periodRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let totalCharged = 0;
  let totalPaid = 0;
  let settledCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let receivedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  const garmentMap: { [key: string]: { count: number; revenue: number } } = {};

  periodRecords.forEach((r) => {
    const ch = parseFloat(r.charged) || 0;
    const pd = parseFloat(r.paid) || 0;
    const bal = ch - pd;

    totalCharged += ch;
    totalPaid += pd;

    if (bal <= 0 && ch > 0) {
      settledCount++;
    } else if (pd > 0 && bal > 0) {
      partialCount++;
    } else {
      unpaidCount++;
    }

    if (r.received) {
      receivedCount++;
    } else {
      pendingCount++;
      if (r.collection) {
        const colDate = new Date(r.collection);
        if (!isNaN(colDate.getTime()) && colDate < now) {
          overdueCount++;
        }
      }
    }

    const garmentName = (r.garment || 'Custom / Unspecified').trim();
    if (!garmentMap[garmentName]) {
      garmentMap[garmentName] = { count: 0, revenue: 0 };
    }
    garmentMap[garmentName].count++;
    garmentMap[garmentName].revenue += pd;
  });

  const totalBalance = Math.max(0, totalCharged - totalPaid);
  const collectionRate = totalCharged > 0 ? (totalPaid / totalCharged) * 100 : 0;

  // Garment statistics array
  const garments: GarmentStat[] = Object.entries(garmentMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      percentage: periodRecords.length > 0 ? (data.count / periodRecords.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 12-Month breakdown (primarily for yearly view)
  const monthlyBreakdown: MonthStat[] = MONTH_NAMES.map((name, index) => {
    const monthRecs = records.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === index;
    });

    const mCharged = monthRecs.reduce((sum, r) => sum + (parseFloat(r.charged) || 0), 0);
    const mPaid = monthRecs.reduce((sum, r) => sum + (parseFloat(r.paid) || 0), 0);
    const mBal = Math.max(0, mCharged - mPaid);

    return {
      monthIndex: index,
      monthName: name,
      count: monthRecs.length,
      revenue: mPaid,
      charged: mCharged,
      balance: mBal,
    };
  });

  const periodLabel =
    periodType === 'monthly' ? `${MONTH_NAMES[month]} ${year}` : `${year}`;

  return {
    periodType,
    year,
    month: periodType === 'monthly' ? month : undefined,
    periodLabel,
    totalRecords: periodRecords.length,
    totalCharged,
    totalPaid,
    totalBalance,
    collectionRate,
    settledCount,
    partialCount,
    unpaidCount,
    receivedCount,
    pendingCount,
    overdueCount,
    garments,
    monthlyBreakdown,
    records: periodRecords,
  };
};

/**
 * Escapes a string cell value for RFC 4180 CSV compliance.
 */
const escapeCsvCell = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If string contains comma, quote, or newline, escape internal quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Generates an Excel & Microsoft Access compatible CSV string with UTF-8 BOM.
 */
export const generateReportCSV = (summary: ReportSummary): string => {
  const headers = [
    'Record ID',
    'Client Name',
    'Phone Number',
    'Order Date',
    'Garment Type',
    'Reference Design Image URL',
    'Collection Due Date',
    'Delivery Status',
    'Amount Charged (GHS)',
    'Amount Paid (GHS)',
    'Balance Owed (GHS)',
    'Payment Status',
    // Top Measurements
    'Half Back',
    'Full Back',
    'Chest',
    'Stomach',
    'Sleeves',
    'Top Length',
    'Arm',
    'Shoulder',
    'Neck',
    'Wrist',
    'Agbada',
    'Cap',
    // Down Measurements
    'Waist',
    'Down Length',
    'Hip',
    'Bass',
    'Thigh',
    'Knee',
    'Inseam',
    'Outseam',
    'Notes',
  ];

  const rows: string[][] = [];

  summary.records.forEach((r) => {
    const charged = parseFloat(r.charged) || 0;
    const paid = parseFloat(r.paid) || 0;
    const balance = Math.max(0, charged - paid);

    let paymentStatus = 'Unpaid';
    if (balance <= 0 && charged > 0) paymentStatus = 'Settled';
    else if (paid > 0) paymentStatus = 'Partial';

    const deliveryStatus = r.received ? 'Delivered / Received' : 'In Production';

    rows.push([
      r.id || '',
      r.name || '',
      r.phone || '',
      r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      r.garment || '',
      r.imageUrl || '',
      r.collection ? new Date(r.collection).toISOString().split('T')[0] : '',
      deliveryStatus,
      charged.toFixed(2),
      paid.toFixed(2),
      balance.toFixed(2),
      paymentStatus,
      r.halfBack || '',
      r.fullBack || '',
      r.chest || '',
      r.stomach || '',
      r.sleeves || '',
      r.topLength || '',
      r.arm || '',
      r.shoulder || '',
      r.neck || '',
      r.wrist || '',
      r.agbada || '',
      r.cap || '',
      r.waist || '',
      r.downLength || '',
      r.hip || '',
      r.bass || '',
      r.thigh || '',
      r.knee || '',
      r.inseam || '',
      r.outseam || '',
      (r.notes || '').replace(/\r?\n/g, ' '),
    ]);
  });

  // Summary row at the bottom
  const summaryRow = [
    'TOTALS / SUMMARY',
    `${summary.totalRecords} Clients`,
    '',
    summary.periodLabel,
    '',
    '',
    '',
    `${summary.receivedCount} Delivered`,
    summary.totalCharged.toFixed(2),
    summary.totalPaid.toFixed(2),
    summary.totalBalance.toFixed(2),
    `${summary.collectionRate.toFixed(1)}% Collected`,
    ...Array(21).fill(''),
  ];

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    summaryRow.map(escapeCsvCell).join(','),
  ].join('\r\n');

  // Prefix with UTF-8 Byte Order Mark (\uFEFF) for immediate Excel / Access encoding recognition
  return '\uFEFF' + csvContent;
};

/**
 * Generates a structured JSON payload for analytical reporting.
 */
export const generateReportJSON = (summary: ReportSummary): string => {
  const payload = {
    reportTitle: `Lemaire Atelier - ${summary.periodType === 'monthly' ? 'Monthly' : 'Yearly'} Report`,
    period: summary.periodLabel,
    generatedAt: new Date().toISOString(),
    currency: 'GHS (₵)',
    summary: {
      totalOrders: summary.totalRecords,
      totalCharged: summary.totalCharged,
      totalPaid: summary.totalPaid,
      totalBalance: summary.totalBalance,
      collectionRatePercent: Number(summary.collectionRate.toFixed(2)),
      paymentStatusBreakdown: {
        settled: summary.settledCount,
        partial: summary.partialCount,
        unpaid: summary.unpaidCount,
      },
      productionStatusBreakdown: {
        delivered: summary.receivedCount,
        inProduction: summary.pendingCount,
        overdue: summary.overdueCount,
      },
      garmentDistribution: summary.garments,
      monthlyBreakdown: summary.periodType === 'yearly' ? summary.monthlyBreakdown : undefined,
    },
    records: summary.records,
  };

  return JSON.stringify(payload, null, 2);
};

/**
 * Triggers a client-side file download.
 */
export const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Exports the report as an Excel/Access compatible CSV.
 */
export const exportReportToCSV = (summary: ReportSummary) => {
  const csv = generateReportCSV(summary);
  const cleanLabel = summary.periodLabel.replace(/\s+/g, '_');
  const filename = `Lemaire_Report_${cleanLabel}.csv`;
  triggerFileDownload(csv, filename, 'text/csv;charset=utf-8;');
};

/**
 * Exports the report as formatted JSON.
 */
export const exportReportToJSON = (summary: ReportSummary) => {
  const json = generateReportJSON(summary);
  const cleanLabel = summary.periodLabel.replace(/\s+/g, '_');
  const filename = `Lemaire_Report_${cleanLabel}.json`;
  triggerFileDownload(json, filename, 'application/json;charset=utf-8;');
};
