import React, { useState, useEffect } from 'react';
import { Record } from '../utils/db';
import { Button } from './ui/Button';

interface RecordFormProps {
  initialData?: Partial<Record>;
  onSubmit: (data: Record) => void;
  onCancel: () => void;
}

export const RecordForm: React.FC<RecordFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Record>>({
    name: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    garment: '',
    halfBack: '',
    fullBack: '',
    chest: '',
    stomach: '',
    sleeves: '',
    topLength: '',
    arm: '',
    shoulder: '',
    waist: '',
    downLength: '',
    hip: '',
    bass: '',
    thigh: '',
    knee: '',
    charged: '',
    paid: '',
    collection: '',
    receivedDate: '',
    received: false,
    notes: '',
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const now = new Date().toISOString();
    const finalData: Record = {
      ...(formData as Record),
      id: formData.id || Math.random().toString(36).slice(2, 11),
      updatedAt: now,
      createdAt: formData.createdAt || now,
    };
    
    onSubmit(finalData);
  };

  const balance = (parseFloat(formData.charged || '0') || 0) - (parseFloat(formData.paid || '0') || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Client Info Section */}
      <section className="space-y-4">
        <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold">Client Information</label>
        <div className="space-y-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Client Name"
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-4 focus:border-[#C9A96E] outline-none transition-all text-lg font-medium"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
            />
          </div>
          <input
            name="garment"
            value={formData.garment}
            onChange={handleChange}
            placeholder="Garment Type (e.g., Traditional Suit)"
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
          />
        </div>
      </section>

      {/* Measurements Section */}
      <section className="space-y-6">
        <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold">Measurements (inches)</label>
        
        <div className="bg-[#2A2624] p-6 rounded-[24px] border border-[#3D3834] space-y-6">
          <div className="text-sm font-semibold text-[#C9A96E] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#C9A96E]/10 flex items-center justify-center text-[10px]">👕</span>
            Top Measurements
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'chest', label: 'Chest' },
              { name: 'stomach', label: 'Stomach' },
              { name: 'sleeves', label: 'Sleeves' },
              { name: 'topLength', label: 'Length' },
              { name: 'arm', label: 'Arm' },
              { name: 'shoulder', label: 'Shoulder' },
              { name: 'halfBack', label: 'Half Back' },
              { name: 'fullBack', label: 'Full Back' },
            ].map(f => (
              <div key={f.name} className="space-y-1.5">
                <span className="text-[9px] text-[#6B6560] uppercase tracking-tighter">{f.label}</span>
                <input
                  name={f.name}
                  value={(formData as any)[f.name]}
                  onChange={handleChange}
                  placeholder='0.0'
                  className="w-full bg-[#1E1A18] border border-[#3D3834] text-[#E8E2D9] rounded-lg px-3 py-2.5 focus:border-[#C9A96E] outline-none text-center font-mono"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#3D3834] text-sm font-semibold text-[#C9A96E] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#C9A96E]/10 flex items-center justify-center text-[10px]">👖</span>
            Down Measurements
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'waist', label: 'Waist' },
              { name: 'downLength', label: 'Length' },
              { name: 'hip', label: 'Hip' },
              { name: 'bass', label: 'Bass' },
              { name: 'thigh', label: 'Thigh' },
              { name: 'knee', label: 'Knee' },
            ].map(f => (
              <div key={f.name} className="space-y-1.5">
                <span className="text-[9px] text-[#6B6560] uppercase tracking-tighter">{f.label}</span>
                <input
                  name={f.name}
                  value={(formData as any)[f.name]}
                  onChange={handleChange}
                  placeholder='0.0'
                  className="w-full bg-[#1E1A18] border border-[#3D3834] text-[#E8E2D9] rounded-lg px-3 py-2.5 focus:border-[#C9A96E] outline-none text-center font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logistics Section */}
      <section className="space-y-4">
        <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold">Logistics & Payment</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs text-[#6B6560]">Charged</span>
            <input
              name="charged"
              value={formData.charged}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none font-mono"
            />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-[#6B6560]">Paid</span>
            <input
              name="paid"
              value={formData.paid}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none font-mono"
            />
          </div>
          <div className="col-span-2 p-4 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/20 flex justify-between items-center">
            <span className="text-sm font-medium text-[#C9A96E]">Outstanding Balance</span>
            <span className={`text-xl font-bold ${balance > 0 ? 'text-[#C45C2A]' : 'text-[#4A7C59]'}`}>
              ₵{balance.toFixed(2)}
            </span>
          </div>
          <div className="col-span-2 space-y-2">
            <span className="text-xs text-[#6B6560]">Expected Collection Date</span>
            <input
              type="date"
              name="collection"
              value={formData.collection}
              onChange={handleChange}
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
            />
          </div>
        </div>
      </section>

      {/* Notes Section */}
      <section className="space-y-4">
        <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold">Additional Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Special requirements or design details..."
          rows={4}
          className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-4 focus:border-[#C9A96E] outline-none transition-all resize-none"
        />
      </section>

      {/* Actions */}
      <div className="flex gap-4 pt-4 sticky bottom-0 bg-[#1E1A18] py-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="gold" className="flex-[2]">Save Record</Button>
      </div>
    </form>
  );
};
