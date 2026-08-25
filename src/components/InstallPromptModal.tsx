import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  WifiOff 
} from 'lucide-react';
import { Button } from './ui/Button';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  hasNativePrompt: boolean;
  onInstall: () => Promise<void>;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  hasNativePrompt,
  onInstall,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal / Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full sm:max-w-md bg-[#1E1A18] border-t sm:border border-[#C9A96E]/25 rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
          >
            {/* Mobile Pull Handle */}
            <div className="sm:hidden w-full flex justify-center pb-3">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#E8E2D9]">Install Web App</h3>
                  <p className="text-xs text-[#8A827B]">Experience Lemaire Atelier like a native app</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 text-[#8A827B] hover:text-[#E8E2D9] hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* App Features Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: WifiOff, title: 'Offline Ready', desc: 'Works without internet' },
                { icon: Zap, title: 'Instant Speed', desc: 'Zero loading delay' },
                { icon: ShieldCheck, title: 'Cloud Sync', desc: 'Safe auto-backup' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center flex flex-col items-center"
                >
                  <item.icon size={18} className="text-[#C9A96E] mb-1.5" />
                  <div className="text-xs font-bold text-[#E8E2D9]">{item.title}</div>
                  <div className="text-[10px] text-[#8A827B] mt-0.5 leading-tight">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* iOS Safari Step-by-Step Instructions */}
            {isIOS && !hasNativePrompt ? (
              <div className="space-y-3.5 mb-6 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                <div className="text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
                  How to install on iPhone / iPad:
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-[#E8E2D9] leading-relaxed">
                    Tap the <span className="font-bold text-[#C9A96E] inline-flex items-center gap-1"><Share2 size={12} /> Share button</span> in your Safari toolbar (at the bottom or top).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-[#E8E2D9] leading-relaxed">
                    Scroll down and select <span className="font-bold text-[#C9A96E] inline-flex items-center gap-1"><PlusSquare size={12} /> Add to Home Screen</span>.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs text-[#E8E2D9] leading-relaxed">
                    Tap <span className="font-bold text-[#C9A96E]">Add</span> in the top right corner to install on your home screen.
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Desktop Direct 1-Click Install */
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-[#C9A96E] shrink-0" />
                  <p className="text-xs text-[#E8E2D9] leading-relaxed">
                    Install to your home screen or desktop for a dedicated full-screen workspace with fast launch.
                  </p>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  onClick={onInstall}
                  className="w-full h-14 rounded-2xl text-base font-bold shadow-xl flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  <span>Install Lemaire Atelier App</span>
                </Button>
              </div>
            )}

            {/* Dismiss Button */}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-xs font-medium"
            >
              {isIOS && !hasNativePrompt ? 'Got It' : 'Maybe Later'}
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
