import React from 'react';
import { Record } from '../utils/db';
import { TopSVG, DownSVG } from '../utils/svg';
import { Button } from './ui/Button';
import { 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Share2,
  Trash2,
  Edit3
} from 'lucide-react';

interface DetailViewProps {
  record: Record;
  onEdit: () => void;
  onDelete: () => void;
  onToggleReceived: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ record, onEdit, onDelete, onToggleReceived }) => {
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
          <Button variant="outline" size="sm">
            <Share2 size={16} /> Share
          </Button>
        </div>
      </section>

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
