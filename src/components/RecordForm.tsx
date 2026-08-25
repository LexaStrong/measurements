import React, { useState, useRef } from 'react';
import { Record } from '../utils/db';
import { Button } from './ui/Button';
import { useSupabase } from '../utils/supabase';
import { useUser } from '@clerk/clerk-react';
import { compressImage, uploadReferenceDesign } from '../utils/storage';
import { Camera, Image as ImageIcon, Trash2, RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface RecordFormProps {
  initialData?: Partial<Record>;
  onSubmit: (data: Record) => void;
  onCancel: () => void;
}

export const RecordForm: React.FC<RecordFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { user } = useUser();
  const supabase = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Record>>({
    name: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    garment: '',
    imageUrl: '',
    halfBack: '',
    fullBack: '',
    chest: '',
    stomach: '',
    sleeves: '',
    topLength: '',
    arm: '',
    shoulder: '',
    neck: '',
    wrist: '',
    agbada: '',
    cap: '',
    waist: '',
    downLength: '',
    hip: '',
    bass: '',
    thigh: '',
    knee: '',
    inseam: '',
    outseam: '',
    charged: '',
    paid: '',
    collection: '',
    receivedDate: '',
    received: false,
    notes: '',
    ...initialData,
  });

  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [selectedImageBlob, setSelectedImageBlob] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleProcessImage = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    try {
      setIsCompressing(true);
      const { blob, dataUrl } = await compressImage(file);
      setSelectedImageBlob(blob);
      setImagePreview(dataUrl);
    } catch (err) {
      console.error('Image optimization failed:', err);
      alert('Failed to process image. Please try another photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessImage(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setSelectedImageBlob(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsUploading(true);
    let finalImageUrl = imagePreview;

    try {
      const recordId = formData.id || Math.random().toString(36).slice(2, 11);

      // If we have a new image blob and Supabase is online with authenticated user, upload to bucket
      if (selectedImageBlob && supabase && user && navigator.onLine) {
        try {
          const publicUrl = await uploadReferenceDesign(
            supabase,
            user.id,
            recordId,
            selectedImageBlob
          );
          finalImageUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Direct Supabase image upload failed, falling back to local storage:', uploadErr);
          // Fallback: retains dataUrl in finalImageUrl so user never loses image
        }
      }

      const now = new Date().toISOString();
      const finalData: Record = {
        ...(formData as Record),
        id: recordId,
        imageUrl: finalImageUrl || '',
        updatedAt: now,
        createdAt: formData.createdAt || now,
      };

      onSubmit(finalData);
    } catch (err) {
      console.error('Error saving record:', err);
      alert('Failed to save record. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
            placeholder="Garment Type (e.g., Agbada, 3-Piece Suit, Kaftan)"
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
          />
        </div>
      </section>

      {/* Reference Design Image Upload Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#C9A96E]" />
            <span>Garment Reference Design</span>
          </label>
          {imagePreview && (
            <span className="text-[10px] text-[#4A7C59] font-semibold">✓ Image Attached</span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-[#C9A96E]/30 bg-[#2A2624] group">
            <div className="h-56 w-full flex items-center justify-center bg-black/40 overflow-hidden">
              <img
                src={imagePreview}
                alt="Garment Reference Design"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-[#1E1A18]/90 backdrop-blur-md flex items-center justify-between border-t border-white/10">
              <span className="text-xs text-[#E8E2D9] font-medium truncate max-w-[200px]">
                Reference Design Photo
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8E2D9] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-3 py-1.5 rounded-lg bg-[#C45C2A]/20 hover:bg-[#C45C2A]/30 text-[#C45C2A] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                : 'border-[#3D3834] bg-[#2A2624]/60 hover:border-[#C9A96E]/40 hover:bg-[#2A2624]'
            }`}
          >
            {isCompressing ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 size={28} className="animate-spin text-[#C9A96E]" />
                <span className="text-xs text-[#C9A96E] font-medium">Optimizing photo...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] mb-3">
                  <Camera size={22} />
                </div>
                <div className="text-sm font-semibold text-[#E8E2D9]">Upload Reference Design</div>
                <p className="text-xs text-[#6B6560] mt-1 text-center">
                  Take a photo or upload sketches, fabric styles & customer reference designs
                </p>
                <div className="mt-3 px-3 py-1 rounded-full bg-white/5 text-[10px] text-[#C9A96E] font-medium uppercase tracking-wider">
                  Supports Camera & Gallery
                </div>
              </>
            )}
          </div>
        )}
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
              { name: 'neck', label: 'Neck' },
              { name: 'wrist', label: 'Wrist' },
              { name: 'agbada', label: 'Agbada' },
              { name: 'cap', label: 'Cap' },
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
              { name: 'inseam', label: 'Inseam' },
              { name: 'outseam', label: 'Outseam' },
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
      <div className="flex gap-4 pt-4 sticky bottom-0 bg-[#1E1A18] py-4 z-10 border-t border-white/5">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" className="flex-[2] flex items-center justify-center gap-2" disabled={isUploading || isCompressing}>
          {isUploading && <Loader2 size={16} className="animate-spin" />}
          <span>{isUploading ? 'Saving...' : 'Save Record'}</span>
        </Button>
      </div>
    </form>
  );
};
