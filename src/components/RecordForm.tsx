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

  // Multi-image state
  const [images, setImages] = useState<Array<{ id: string; url: string; blob?: Blob | null }>>(() => {
    if (initialData?.imageUrls && Array.isArray(initialData.imageUrls) && initialData.imageUrls.length > 0) {
      return initialData.imageUrls.map((url, i) => ({
        id: `init_${i}_${Date.now()}`,
        url,
        blob: null,
      }));
    }
    if (initialData?.imageUrl) {
      return [{ id: `init_0_${Date.now()}`, url: initialData.imageUrl, blob: null }];
    }
    return [];
  });

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

  const handleProcessFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles = files.filter((file) => {
      return (
        (file.type && file.type.startsWith('image/')) ||
        /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif|svg)$/i.test(file.name)
      );
    });

    if (validFiles.length === 0) {
      alert('Please select valid image files (JPEG, PNG, WebP, HEIC).');
      return;
    }

    try {
      setIsCompressing(true);
      const processed = await Promise.all(
        validFiles.map(async (file, idx) => {
          const { blob, dataUrl } = await compressImage(file);
          return {
            id: `img_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            url: dataUrl,
            blob,
          };
        })
      );

      setImages((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Image optimization failed:', err);
      alert('Failed to process one or more images. Please try again.');
    } finally {
      setIsCompressing(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const handleClearAllImages = () => {
    setImages([]);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsUploading(true);

    try {
      const recordId = formData.id || Math.random().toString(36).slice(2, 11);
      let finalImageUrls: string[] = [];

      // If online and Supabase is available, upload all newly attached blobs to Supabase Storage
      if (supabase && user && navigator.onLine) {
        finalImageUrls = await Promise.all(
          images.map(async (item, idx) => {
            if (item.blob) {
              try {
                return await uploadReferenceDesign(supabase, user.id, recordId, item.blob, idx);
              } catch (uploadErr) {
                console.warn(`Upload failed for image ${idx}, keeping local dataUrl:`, uploadErr);
                return item.url;
              }
            }
            return item.url;
          })
        );
      } else {
        finalImageUrls = images.map((item) => item.url);
      }

      finalImageUrls = finalImageUrls.filter(Boolean);
      const primaryImageUrl = finalImageUrls[0] || '';

      const now = new Date().toISOString();
      const finalData: Record = {
        ...(formData as Record),
        id: recordId,
        imageUrl: primaryImageUrl,
        imageUrls: finalImageUrls,
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
      {/* Hidden File Inputs: Multi-select Gallery & Live Camera */}
      <input
        ref={galleryInputRef}
        type="file"
        multiple
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
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-2xl px-5 py-4 focus:border-[#C9A96E] outline-none text-lg transition-colors placeholder:text-[#6B6560]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
            />
          </div>
          <div>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
            />
          </div>
        </div>

        <div>
          <input
            type="text"
            name="garment"
            value={formData.garment}
            onChange={handleChange}
            placeholder="Garment Type (e.g. Kaftan, Agbada, 3-Piece Suit)"
            className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-xl px-4 py-3 focus:border-[#C9A96E] outline-none"
          />
        </div>
      </section>

      {/* Reference Design Multi-Image Upload Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#C9A96E]" />
            <span>Garment Reference Designs ({images.length})</span>
          </label>
          {images.length > 0 && (
            <span className="text-[10px] text-[#4A7C59] font-semibold">
              ✓ {images.length} {images.length === 1 ? 'Photo' : 'Photos'} Attached
            </span>
          )}
        </div>

        {images.length > 0 ? (
          <div className="space-y-3">
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className="relative group rounded-2xl overflow-hidden border border-[#C9A96E]/30 bg-[#2A2624] aspect-[4/3] flex items-center justify-center shadow-md"
                >
                  <img
                    src={img.url}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Primary Cover Badge */}
                  {index === 0 ? (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#C9A96E] text-[#1E1A18] text-[9px] font-bold uppercase tracking-wider shadow">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 hover:bg-[#C9A96E] hover:text-[#1E1A18] text-[#E8E2D9] text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      title="Set as primary cover image"
                    >
                      Make Cover
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-[#C45C2A] text-[#E8E2D9] opacity-90 hover:opacity-100 transition-all backdrop-blur-sm"
                    title="Remove this photo"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Number pill */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-[#8A827B] font-mono">
                    #{index + 1}
                  </div>
                </div>
              ))}

              {/* Add More Tile */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isCompressing}
                className="rounded-2xl border-2 border-dashed border-[#3D3834] hover:border-[#C9A96E]/50 bg-[#2A2624]/40 hover:bg-[#2A2624] aspect-[4/3] flex flex-col items-center justify-center text-[#8A827B] hover:text-[#C9A96E] transition-all group"
              >
                {isCompressing ? (
                  <Loader2 size={24} className="animate-spin text-[#C9A96E]" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#C9A96E]/15 flex items-center justify-center mb-1 text-[#E8E2D9] group-hover:text-[#C9A96E] transition-colors">
                      +
                    </div>
                    <span className="text-xs font-semibold">Add More</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Action Toolbar Below Grid */}
            <div className="p-3 bg-[#1E1A18]/90 backdrop-blur-md rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#8A827B]">
                {images.length} {images.length === 1 ? 'design photo' : 'design photos'} attached
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8E2D9] text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Add photos from Gallery"
                >
                  <FolderOpen size={13} />
                  <span>Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8E2D9] text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Take photo with Camera"
                >
                  <Camera size={13} />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllImages}
                  className="px-2.5 py-1.5 rounded-lg bg-[#C45C2A]/20 hover:bg-[#C45C2A]/30 text-[#C45C2A] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Clear All</span>
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
                <span className="text-xs text-[#C9A96E] font-medium">Optimizing photos...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] mb-3">
                  <ImageIcon size={22} />
                </div>
                <div className="text-sm font-semibold text-[#E8E2D9]">Upload Reference Designs</div>
                <p className="text-xs text-[#6B6560] mt-1 text-center max-w-xs">
                  Upload multiple sketches, fabric swatches, inspiration photos or capture via camera
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
