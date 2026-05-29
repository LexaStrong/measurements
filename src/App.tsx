import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Trophy, 
  ArrowUpRight,
  Settings,
  Bell,
  X,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignInButton,
  useUser 
} from '@clerk/clerk-react';
import { useRecords } from './hooks/useRecords';
import { Button } from './components/ui/Button';
import { Record } from './utils/db';
import { Sheet } from './components/Sheet';
import { RecordForm } from './components/RecordForm';
import { DetailView } from './components/DetailView';

const App: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { records, loading: recordsLoading, addRecord, updateRecord, deleteRecord } = useRecords();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'records' | 'timeline'>('records');
  
  // Sheet State
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);

  console.log("App: Render", { isUserLoaded, user: !!user, recordsCount: records.length });

  const stats = useMemo(() => {
    try {
      const now = new Date();
      const currentMonth = records.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const totalRevenue = records.reduce((sum, r) => sum + (parseFloat(r.paid) || 0), 0);
      const pendingCollections = records.filter(r => !r.received && r.collection).length;
      const owedCount = records.filter(r => (parseFloat(r.charged) || 0) - (parseFloat(r.paid) || 0) > 0).length;

      return {
        total: records.length,
        monthly: currentMonth.length,
        revenue: totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + 'k' : totalRevenue.toFixed(0),
        pending: pendingCollections,
        owed: owedCount
      };
    } catch (e) {
      console.error("Stats calculation error:", e);
      return { total: 0, monthly: 0, revenue: '0', pending: 0, owed: 0 };
    }
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.garment || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [records, searchQuery]);

  const handleOpenDetail = (record: Record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: Record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteRecord(id);
      setIsDetailOpen(false);
    }
  };

  const handleToggleReceived = async (record: Record) => {
    const updated = {
      ...record,
      received: !record.received,
      receivedDate: !record.received ? new Date().toISOString().split('T')[0] : '',
      updatedAt: new Date().toISOString()
    };
    await updateRecord(updated);
    setSelectedRecord(updated);
  };

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-[#1E1A18] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-[#C9A96E] selection:text-[#1E1A18] bg-[#1E1A18] text-[#E8E2D9]">
      <SignedOut>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C9A96E] opacity-5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#C45C2A] opacity-5 blur-[120px] rounded-full" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center z-10 max-w-md"
          >
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-[#2A2624] rounded-[24px] border border-[#3D3834] flex items-center justify-center text-4xl shadow-2xl animate-float">
                ✂️
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight leading-tight">
              Lemaire <span className="text-[#C9A96E]">Atelier</span>
            </h1>
            <p className="text-[#6B6560] text-lg mb-12 font-medium leading-relaxed">
              Professional measurement tracking for elite tailors. Real-time syncing, cross-device access, and precision data.
            </p>
            
            <div className="space-y-4">
              <SignInButton mode="modal">
                <Button variant="gold" size="lg" className="w-full h-16 text-lg rounded-2xl">
                  Get Started
                </Button>
              </SignInButton>
              
              <div className="pt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: Globe, label: 'Cloud' },
                  { icon: Zap, label: 'Realtime' },
                  { icon: ShieldCheck, label: 'Secure' },
                ].map((feat) => (
                  <div key={feat.label} className="text-center">
                    <div className="flex justify-center text-[#C9A96E] mb-2">
                      <feat.icon size={20} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-[#6B6560] font-bold">{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <div className="absolute bottom-10 text-[10px] uppercase tracking-[3px] text-[#3D3834] font-bold">
            Established 2026
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="pb-24">
          {/* Header */}
          <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#1E1A18]/80 backdrop-blur-lg z-30">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#E8E2D9]">Lemaire</h1>
              <p className="text-[#6B6560] text-sm font-medium">Welcome back, {user?.firstName || 'Atelier'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="relative group">
                <Bell size={20} className="group-hover:text-[#C9A96E] transition-colors" />
                {stats.pending > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#C45C2A] rounded-full border-2 border-[#1E1A18]" />
                )}
              </Button>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 border border-[#3D3834] hover:border-[#C9A96E] transition-all"
                  }
                }}
              />
            </div>
          </header>

          {/* Stats Grid */}
          <section className="px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Clients', value: stats.total, icon: Users, color: 'text-[#C9A96E]' },
              { label: 'This Month', value: stats.monthly, icon: Calendar, color: 'text-[#4A7C59]' },
              { label: 'Revenue', value: `₵${stats.revenue}`, icon: Trophy, color: 'text-[#C9A96E]' },
              { label: 'Owed', value: stats.owed, icon: ArrowUpRight, color: 'text-[#C45C2A]' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#2A2624] p-5 rounded-2xl border border-[#3D3834] relative overflow-hidden group hover:border-[#C9A96E]/20 transition-all"
              >
                <div className={`mb-3 p-2 rounded-xl bg-[#1E1A18] w-fit ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={18} />
                </div>
                <div className="text-2xl font-bold text-[#E8E2D9] mb-1">{stat.value}</div>
                <div className="text-xs text-[#6B6560] font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </section>

          {/* Search & Actions */}
          <section className="px-6 py-4 flex gap-3 sticky top-[88px] bg-[#1E1A18] z-20">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6560] group-focus-within:text-[#C9A96E] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search clients or garments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2A2624] border border-[#3D3834] text-[#E8E2D9] rounded-2xl pl-12 pr-4 py-4 focus:border-[#C9A96E] outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#E8E2D9]"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <Button variant="outline" size="icon" className="h-[58px] w-[58px] rounded-2xl">
              <Filter size={20} />
            </Button>
          </section>

          {/* Record List */}
          <section className="px-6 py-4 space-y-4">
            {recordsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-[#6B6560]">
                <div className="w-10 h-10 border-4 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Syncing Cloud...</p>
              </div>
            ) : activeTab === 'timeline' ? (
              <div className="relative border-l border-[#3D3834] ml-3 pl-5 space-y-6">
                {records.length > 0 ? records.map((record, i) => (
                  <motion.div 
                    key={`${record.id}-tl`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative"
                    onClick={() => handleOpenDetail(record)}
                  >
                    <span className="absolute -left-[25px] top-2 w-3 h-3 bg-[#C9A96E] rounded-full border-2 border-[#1E1A18]" />
                    <div className="bg-[#2A2624] p-4 rounded-xl border border-[#3D3834] group hover:border-[#C9A96E]/30 cursor-pointer transition-all">
                      <div className="text-[10px] text-[#C9A96E] font-bold uppercase tracking-widest mb-1">
                        {record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No Date Scheduled'}
                      </div>
                      <h3 className="text-lg font-medium text-[#E8E2D9] group-hover:text-[#C9A96E] transition-colors">{record.name}</h3>
                      <p className="text-sm text-[#6B6560] mt-1">{record.garment || 'Measurements Only'} • {record.received ? 'Delivered' : 'Pending Fitting'}</p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-10 text-center text-[#6B6560]">No timeline history available</div>
                )}
              </div>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record, i) => {
                const balance = (parseFloat(record.charged) || 0) - (parseFloat(record.paid) || 0);
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleOpenDetail(record)}
                    className="bg-[#2A2624] p-5 rounded-2xl border border-[#3D3834] group hover:border-[#C9A96E]/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-medium text-[#E8E2D9] group-hover:text-[#C9A96E] transition-colors">{record.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-[#6B6560]">
                        <span>{record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}</span>
                        {record.garment && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#3D3834]" />
                            <span>{record.garment}</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        {record.received ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-bold uppercase tracking-wider border border-[#4A7C59]/20">Received</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#C45C2A]/10 text-[#C45C2A] text-[10px] font-bold uppercase tracking-wider border border-[#C45C2A]/20">Pending</span>
                        )}
                        {balance > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#C9A96E]/10 text-[#C9A96E] text-[10px] font-bold uppercase tracking-wider border border-[#C9A96E]/20">₵{balance.toFixed(2)} Owed</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#4A7C59]/10 text-[#4A7C59] text-[10px] font-bold uppercase tracking-wider border border-[#4A7C59]/20">Paid</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${balance > 0 ? 'text-[#C45C2A]' : 'text-[#4A7C59]'}`}>
                        {balance > 0 ? `₵${balance.toFixed(0)}` : '✓'}
                      </div>
                      <div className="text-[10px] text-[#6B6560] uppercase tracking-widest mt-1">
                        {balance > 0 ? 'Balance' : 'Settled'}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-[#6B6560]">
                <div className="text-4xl mb-4 text-[#C9A96E]">✂️</div>
                <h3 className="text-lg font-medium text-[#E8E2D9]">No records found</h3>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </section>

          {/* FAB */}
          <button 
            onClick={handleOpenAdd}
            className="fixed bottom-24 right-8 w-16 h-16 bg-[#C9A96E] text-[#1E1A18] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
          >
            <Plus size={32} />
          </button>

          {/* Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 p-4 bg-[#1E1A18]/80 backdrop-blur-xl border-t border-[#3D3834] flex justify-around items-center z-30 lg:max-w-md lg:mx-auto lg:rounded-t-3xl">
            <button 
              onClick={() => setActiveTab('records')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'records' ? 'text-[#C9A96E]' : 'text-[#6B6560]'}`}
            >
              <Users size={24} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Clients</span>
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'timeline' ? 'text-[#C9A96E]' : 'text-[#6B6560]'}`}
            >
              <Calendar size={24} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Timeline</span>
            </button>
          </nav>

          {/* Detail Sheet */}
          <Sheet 
            isOpen={isDetailOpen} 
            onClose={() => setIsDetailOpen(false)} 
            title="Client Details"
          >
            {selectedRecord && (
              <DetailView 
                record={selectedRecord} 
                onEdit={() => handleOpenEdit(selectedRecord)}
                onDelete={() => handleDelete(selectedRecord.id)}
                onToggleReceived={() => handleToggleReceived(selectedRecord)}
              />
            )}
          </Sheet>

          {/* Add/Edit Sheet */}
          <Sheet 
            isOpen={isFormOpen} 
            onClose={() => setIsFormOpen(false)} 
            title={editingRecord ? 'Edit Record' : 'New Client'}
          >
            <RecordForm 
              initialData={editingRecord || {}} 
              onCancel={() => setIsFormOpen(false)}
              onSubmit={async (data) => {
                if (editingRecord) await updateRecord(data);
                else await addRecord(data);
                setIsFormOpen(false);
              }}
            />
          </Sheet>
        </div>
      </SignedIn>
    </div>
  );
};

export default App;
