import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Record } from '../utils/db';
import { 
  calculateReportSummary, 
  exportReportToCSV, 
  exportReportToJSON, 
  ReportSummary 
} from '../utils/exportReports';
import { Button } from './ui/Button';
import {
  Calendar,
  Trophy,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Users,
  Scissors,
  TrendingUp,
  Receipt,
  Eye
} from 'lucide-react';

interface ReportsViewProps {
  records: Record[];
  onSelectRecord: (record: Record) => void;
}

const MONTH_OPTIONS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ records, onSelectRecord }) => {
  const currentDate = useMemo(() => new Date(), []);
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());

  // Extract distinct available years from records (defaults to current year +/- 1)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentDate.getFullYear()]);
    records.forEach((r) => {
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d.getTime())) {
          yearsSet.add(d.getFullYear());
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [records, currentDate]);

  // Compute active report summary
  const summary: ReportSummary = useMemo(() => {
    return calculateReportSummary(records, periodType, selectedYear, selectedMonth);
  }, [records, periodType, selectedYear, selectedMonth]);

  // Navigation handlers
  const handlePrevPeriod = () => {
    if (periodType === 'monthly') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear((y) => y - 1);
      } else {
        setSelectedMonth((m) => m - 1);
      }
    } else {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNextPeriod = () => {
    if (periodType === 'monthly') {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear((y) => y + 1);
      } else {
        setSelectedMonth((m) => m + 1);
      }
    } else {
      setSelectedYear((y) => y + 1);
    }
  };

  const handleResetToCurrent = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
  };

  // Find max monthly revenue for bar scale in yearly view
  const maxMonthlyRevenue = useMemo(() => {
    if (!summary.monthlyBreakdown.length) return 1;
    const max = Math.max(...summary.monthlyBreakdown.map((m) => m.revenue));
    return max > 0 ? max : 1;
  }, [summary.monthlyBreakdown]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Period Mode Selector */}
      <section className="bg-white/5 backdrop-blur-2xl p-6 rounded-[28px] border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-[#C9A96E]" size={22} />
              <h2 className="text-2xl font-bold text-[#E8E2D9]">Atelier Reports</h2>
            </div>
            <p className="text-xs text-[#8A827B] mt-1">
              Financial, production and client analytics with Excel/Access exports
            </p>
          </div>

          {/* Monthly / Yearly Mode Toggle */}
          <div className="flex bg-[#1E1A18] p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setPeriodType('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                periodType === 'monthly'
                  ? 'bg-[#C9A96E] text-[#1E1A18] shadow-md'
                  : 'text-[#8A827B] hover:text-[#E8E2D9]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodType('yearly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                periodType === 'yearly'
                  ? 'bg-[#C9A96E] text-[#1E1A18] shadow-md'
                  : 'text-[#8A827B] hover:text-[#E8E2D9]'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Period Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevPeriod}
              title="Previous period"
              className="w-10 h-10 rounded-xl"
            >
              <ChevronLeft size={18} />
            </Button>

            {periodType === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-[#1E1A18] text-[#E8E2D9] text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#C9A96E] outline-none cursor-pointer"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-[#1E1A18] text-[#E8E2D9] text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#C9A96E] outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPeriod}
              title="Next period"
              className="w-10 h-10 rounded-xl"
            >
              <ChevronRight size={18} />
            </Button>

            <button
              onClick={handleResetToCurrent}
              className="text-xs text-[#C9A96E] hover:underline font-medium ml-2"
            >
              Current
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="gold"
              size="sm"
              onClick={() => exportReportToCSV(summary)}
              disabled={summary.totalRecords === 0}
              className="rounded-xl flex items-center gap-2 shadow-lg shadow-[#C9A96E]/10"
              title="Download Excel / Access formatted CSV file with UTF-8 BOM"
            >
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReportToJSON(summary)}
              disabled={summary.totalRecords === 0}
              className="rounded-xl flex items-center gap-2"
              title="Download structured JSON report data"
            >
              <FileCode size={16} />
              <span>Export JSON</span>
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Collected */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg"
        >
          <div className="p-2 rounded-xl bg-[#4A7C59]/15 text-[#4A7C59] w-fit mb-3">
            <Trophy size={18} />
          </div>
          <div className="text-2xl font-bold text-[#E8E2D9]">₵{summary.totalPaid.toFixed(2)}</div>
          <div className="text-xs text-[#8A827B] uppercase tracking-wider font-semibold mt-1">
            Revenue Collected
          </div>
          <div className="text-[11px] text-[#4A7C59] font-medium mt-2">
            {summary.collectionRate.toFixed(0)}% recovery rate
          </div>
        </motion.div>

        {/* Total Invoiced */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg"
        >
          <div className="p-2 rounded-xl bg-[#C9A96E]/15 text-[#C9A96E] w-fit mb-3">
            <Receipt size={18} />
          </div>
          <div className="text-2xl font-bold text-[#E8E2D9]">₵{summary.totalCharged.toFixed(2)}</div>
          <div className="text-xs text-[#8A827B] uppercase tracking-wider font-semibold mt-1">
            Total Invoiced
          </div>
          <div className="text-[11px] text-[#8A827B] mt-2">
            {summary.totalRecords} total orders
          </div>
        </motion.div>

        {/* Balance Outstanding */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg"
        >
          <div className="p-2 rounded-xl bg-[#C45C2A]/15 text-[#C45C2A] w-fit mb-3">
            <ArrowUpRight size={18} />
          </div>
          <div className={`text-2xl font-bold ${summary.totalBalance > 0 ? 'text-[#C45C2A]' : 'text-[#4A7C59]'}`}>
            ₵{summary.totalBalance.toFixed(2)}
          </div>
          <div className="text-xs text-[#8A827B] uppercase tracking-wider font-semibold mt-1">
            Outstanding Balance
          </div>
          <div className="text-[11px] text-[#C45C2A] font-medium mt-2">
            {summary.unpaidCount + summary.partialCount} pending payments
          </div>
        </motion.div>

        {/* Production Status */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg"
        >
          <div className="p-2 rounded-xl bg-white/10 text-[#E8E2D9] w-fit mb-3">
            <Scissors size={18} />
          </div>
          <div className="text-2xl font-bold text-[#E8E2D9]">{summary.totalRecords}</div>
          <div className="text-xs text-[#8A827B] uppercase tracking-wider font-semibold mt-1">
            Orders in Period
          </div>
          <div className="text-[11px] text-[#8A827B] mt-2 flex items-center gap-1.5">
            <span className="text-[#4A7C59] font-semibold">{summary.receivedCount} Delivered</span>
            <span>•</span>
            <span className="text-[#C9A96E] font-semibold">{summary.pendingCount} In Prod</span>
          </div>
        </motion.div>
      </section>

      {/* Yearly Monthly Performance Matrix (Only rendered in Yearly Mode) */}
      {periodType === 'yearly' && (
        <section className="bg-white/5 backdrop-blur-xl p-6 rounded-[28px] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-[#E8E2D9] flex items-center gap-2">
              <Calendar size={18} className="text-[#C9A96E]" />
              <span>12-Month Revenue & Volume Matrix ({selectedYear})</span>
            </h3>
            <span className="text-xs text-[#8A827B]">Monthly Cash Flow</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {summary.monthlyBreakdown.map((m) => {
              const heightPercent = Math.max(8, (m.revenue / maxMonthlyRevenue) * 100);
              const isCurrentMonth = m.monthIndex === currentDate.getMonth() && selectedYear === currentDate.getFullYear();
              return (
                <div
                  key={m.monthName}
                  onClick={() => {
                    setSelectedMonth(m.monthIndex);
                    setPeriodType('monthly');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                    isCurrentMonth
                      ? 'bg-[#C9A96E]/10 border-[#C9A96E]/40 shadow-md'
                      : 'bg-white/[0.03] border-white/5 hover:border-[#C9A96E]/30 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${isCurrentMonth ? 'text-[#C9A96E]' : 'text-[#E8E2D9]'}`}>
                      {m.monthName.substring(0, 3)}
                    </span>
                    <span className="text-[10px] text-[#8A827B] font-semibold">
                      {m.count} {m.count === 1 ? 'order' : 'orders'}
                    </span>
                  </div>

                  <div className="my-2 h-12 flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-lg transition-all ${
                        m.revenue > 0
                          ? 'bg-gradient-to-t from-[#C9A96E]/50 to-[#C9A96E] group-hover:from-[#C9A96E]/70 group-hover:to-[#E8D5B5]'
                          : 'bg-white/5'
                      }`}
                    />
                  </div>

                  <div className="text-right mt-1">
                    <div className="text-xs font-bold text-[#E8E2D9]">₵{m.revenue.toFixed(0)}</div>
                    {m.balance > 0 && (
                      <div className="text-[10px] text-[#C45C2A] font-medium">₵{m.balance.toFixed(0)} owed</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Analytics Insights: Payment Breakdown & Garment Distribution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Health Breakdown */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[28px] border border-white/10 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#E8E2D9] mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#4A7C59]" />
              <span>Payment Health Status</span>
            </h3>

            <div className="space-y-3.5">
              {/* Settled */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#4A7C59] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4A7C59]" />
                    Settled / Fully Paid
                  </span>
                  <span className="text-[#E8E2D9]">{summary.settledCount} orders</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: summary.totalRecords > 0 ? `${(summary.settledCount / summary.totalRecords) * 100}%` : '0%',
                    }}
                    className="h-full bg-[#4A7C59] rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Partial */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#C9A96E] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C9A96E]" />
                    Partially Paid (Deposit)
                  </span>
                  <span className="text-[#E8E2D9]">{summary.partialCount} orders</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: summary.totalRecords > 0 ? `${(summary.partialCount / summary.totalRecords) * 100}%` : '0%',
                    }}
                    className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Unpaid */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#C45C2A] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C45C2A]" />
                    Unpaid
                  </span>
                  <span className="text-[#E8E2D9]">{summary.unpaidCount} orders</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: summary.totalRecords > 0 ? `${(summary.unpaidCount / summary.totalRecords) * 100}%` : '0%',
                    }}
                    className="h-full bg-[#C45C2A] rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="text-[#8A827B]">Collection Efficiency</span>
            <span className="text-[#C9A96E] font-bold text-sm">
              {summary.collectionRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Garment Categories Distribution */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[28px] border border-white/10 shadow-lg">
          <h3 className="text-base font-bold text-[#E8E2D9] mb-4 flex items-center gap-2">
            <Scissors size={18} className="text-[#C9A96E]" />
            <span>Garment Production Distribution</span>
          </h3>

          {summary.garments.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {summary.garments.map((g) => (
                <div key={g.name} className="bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[#E8E2D9]">{g.name}</span>
                    <span className="text-[#C9A96E]">
                      {g.count} ({g.percentage.toFixed(0)}%) • ₵{g.revenue.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${g.percentage}%` }}
                      className="h-full bg-gradient-to-r from-[#C9A96E]/60 to-[#C9A96E] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#8A827B] text-xs">
              No garment records in this period
            </div>
          )}
        </div>
      </section>

      {/* Period Orders Table / List */}
      <section className="bg-white/5 backdrop-blur-xl p-6 rounded-[28px] border border-white/10 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#E8E2D9] flex items-center gap-2">
              <Users size={18} className="text-[#C9A96E]" />
              <span>Orders in {summary.periodLabel}</span>
            </h3>
            <p className="text-xs text-[#8A827B]">
              Showing {summary.records.length} client {summary.records.length === 1 ? 'record' : 'records'}
            </p>
          </div>

          <div className="text-xs text-[#8A827B]">
            Click any client to view or edit full details
          </div>
        </div>

        {summary.records.length > 0 ? (
          <div className="divide-y divide-white/10 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
            {summary.records.map((record) => {
              const charged = parseFloat(record.charged) || 0;
              const paid = parseFloat(record.paid) || 0;
              const balance = Math.max(0, charged - paid);

              return (
                <div
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="p-4 hover:bg-white/[0.05] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1E1A18] border border-white/10 flex items-center justify-center text-[#C9A96E] group-hover:border-[#C9A96E]/50 transition-colors">
                      <Scissors size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#E8E2D9] group-hover:text-[#C9A96E] transition-colors">
                        {record.name}
                      </div>
                      <div className="text-xs text-[#8A827B] flex items-center gap-2 mt-0.5">
                        <span>{record.garment || 'Custom Garment'}</span>
                        <span>•</span>
                        <span>
                          {record.date ? new Date(record.date).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 self-stretch sm:self-auto">
                    <div className="flex items-center gap-2">
                      {record.received ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-bold uppercase tracking-wider border border-[#4A7C59]/20">
                          Delivered
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[#C9A96E]/10 text-[#C9A96E] text-[10px] font-bold uppercase tracking-wider border border-[#C9A96E]/20">
                          In Prod
                        </span>
                      )}

                      {balance > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#C45C2A]/10 text-[#C45C2A] text-[10px] font-bold uppercase tracking-wider border border-[#C45C2A]/20">
                          ₵{balance.toFixed(2)} Owed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-bold uppercase tracking-wider border border-[#4A7C59]/20">
                          Settled
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-[#E8E2D9]">₵{paid.toFixed(2)}</div>
                      <div className="text-[10px] text-[#8A827B]">of ₵{charged.toFixed(2)}</div>
                    </div>

                    <Eye size={16} className="text-[#8A827B] group-hover:text-[#C9A96E] hidden sm:block ml-2" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-[#8A827B]">
            <div className="text-3xl mb-3">📊</div>
            <h4 className="text-base font-semibold text-[#E8E2D9]">No records for {summary.periodLabel}</h4>
            <p className="text-xs mt-1">Try selecting another month or year using the controls above</p>
          </div>
        )}
      </section>
    </div>
  );
};
