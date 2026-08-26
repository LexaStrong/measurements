import React, { useState, useRef } from 'react';
import { Record } from '../utils/db';
import { Button } from './ui/Button';
import { useSupabase } from '../utils/supabase';
import { useUser } from '@clerk/clerk-react';
import { compressImage, uploadReferenceDesign } from '../utils/storage';
import { Camera, Image as ImageIcon, Trash2, RefreshCw, Loader2, Sparkles, FolderOpen } from 'lucide-react';

interface RecordFormProps {
  initialData?: Partial<Record>;
  onSubmit: (data: Record) => void;
  onCancel: () => void;
}

export const RecordForm: React.FC<RecordFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { user } = useUser();
  const supabase = useSupabase();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    const isImage = 
      (file.type && file.type.startsWith('image/')) ||
      /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif|svg)$/i.test(file.name);

    if (!file || !isImage) {
      alert('Please select a valid image file (JPEG, PNG, WebP, HEIC).');
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
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Hidden File Inputs: One for Photo Gallery and One for Live Camera */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Basic Info Section */}
      <section className="space-y-4">
        <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold">Client Information</label>
        
        <div>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Client Name *"
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="tel"
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

        <div>
          <input
            type="text"
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

        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-[#C9A96E]/30 bg-[#2A2624] group">
            <div className="h-56 w-full flex items-center justify-center bg-black/40 overflow-hidden">
              <img
                src={imagePreview}
                alt="Garment Reference Design"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-[#1E1A18]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
              <span className="text-xs text-[#E8E2D9] font-medium truncate max-w-[150px]">
                Reference Attached
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8E2D9] text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Choose another image from Gallery"
                >
                  <FolderOpen size={13} />
                  <span>Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8E2D9] text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Take new photo with Camera"
                >
                  <Camera size={13} />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-2.5 py-1.5 rounded-lg bg-[#C45C2A]/20 hover:bg-[#C45C2A]/30 text-[#C45C2A] text-xs font-semibold flex items-center gap-1 transition-colors"
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
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
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
                  <ImageIcon size={22} />
                </div>
                <div className="text-sm font-semibold text-[#E8E2D9]">Upload Reference Design</div>
                <p className="text-xs text-[#6B6560] mt-1 text-center max-w-xs">
                  Upload sketches, saved fabric styles or take a live camera photo
                </p>

                {/* Dual Buttons: Gallery and Camera */}
                <div className="flex items-center gap-3 mt-4 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 border border-[#C9A96E]/30 text-[#C9A96E] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <FolderOpen size={15} />
                    <span>From Gallery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#E8E2D9] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Camera size={15} />
                    <span>Camera</span>
                  </button>
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
            ].map((field) => (
              <div key={field.name}>
                <label className="text-[9px] uppercase tracking-tighter text-[#6B6560] block mb-1 font-semibold">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={(formData as any)[field.name]}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="w-full bg-[#1E1A18] border border-[#3D3834] text-[#E8E2D9] rounded-lg px-2 py-2 text-center text-sm font-mono focus:border-[#C9A96E] outline-none"
                />
              </div>
            ))}
          </div>

          <div className="text-sm font-semibold text-[#C9A96E] flex items-center gap-2 pt-4 border-t border-[#3D3834]">
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
            ].map((field) => (
              <div key={field.name}>
                <label className="text-[9px] uppercase tracking-tighter text-[#6B6560] block mb-1 font-semibold">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={(formData as any)[field.name]}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="w-full bg-[#1E1A18] border border-[#3D3834] text-[#E8E2D9] rounded-lg px-2 py-2 text-center text-sm font-mono focus:border-[#C9A96E] outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financials & Status Section */}
      <section className="space-y-4">
        <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold">Order Details & Tracking</label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#6B6560] block mb-1 font-semibold">Amount Charged (₵)</label>
            <input
              type="number"
              step="any"
              name="charged"
              value={formData.charged}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#6B6560] block mb-1 font-semibold">Amount Paid (₵)</label>
            <input
              type="number"
              step="any"
              name="paid"
              value={formData.paid}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B6560] block mb-1 font-semibold">Expected Collection Date</label>
          <input
            type="date"
            name="collection"
            value={formData.collection}
            onChange={handleChange}
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 bg-[#2A2624] p-4 rounded-xl border border-[#3D3834]">
          <input
            type="checkbox"
            id="received"
            name="received"
            checked={formData.received}
            onChange={handleChange}
            className="w-5 h-5 accent-[#C9A96E] rounded bg-[#1E1A18] border-[#3D3834]"
          />
          <label htmlFor="received" className="text-sm font-medium text-[#E8E2D9] cursor-pointer">
            Garment Received by Customer
          </label>
        </div>

        <div>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Special Notes (e.g. style preferences, fabric type, special tailoring requests)..."
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
          />
        </div>
      </section>

      {/* Actions */}
      <section className="flex gap-4 pt-4 border-t border-[#3D3834]">
        <Button variant="outline" className="flex-1" type="button" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button variant="gold" className="flex-1" type="submit" disabled={isUploading || isCompressing}>
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Saving...
            </span>
          ) : (
            'Save Record'
          )}
        </Button>
      </section>
    </form>
  );
};
