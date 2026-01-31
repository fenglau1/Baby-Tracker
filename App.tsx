import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_CHILDREN, LogEntry, Child, ActivityType, VaccineAppointment, Caregiver, JoinRequest } from './types';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Activity } from './components/Activity';
import { AddLogModal } from './components/AddLogModal';
import { Onboarding } from './components/Onboarding';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Background } from './components/Background';
import { BabySettingsModal } from './components/BabySettingsModal';
import { FamilySettingsModal } from './components/FamilySettingsModal';
import { Home, BarChart2, Settings as SettingsIcon, Plus, List, CloudOff, Cloud } from 'lucide-react';
import gsap from 'gsap';
import { db } from './services/db';
import { initGapi, findOrCreateDatabaseFile, uploadData, downloadData, setGapiToken } from './services/googleDriveService';

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('sunnyBaby_isLoggedIn') === 'true';
  });

  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(() => {
    return !!localStorage.getItem('sunnyBaby_googleToken');
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('sunnyBaby_onboardingComplete') !== 'true';
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [currentChildId, setCurrentChildId] = useState<string>('c1');
  const [view, setView] = useState<'dashboard' | 'analytics' | 'activity' | 'settings'>('dashboard');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [appointments, setAppointments] = useState<VaccineAppointment[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<ActivityType | null>(null);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null);
  const [isBabySettingsOpen, setIsBabySettingsOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Load from Dexie on mount
  useEffect(() => {
    const loadDataFromDexie = async () => {
      try {
        const [dbLogs, dbChildren, dbAppts, dbCaregivers, dbJoinRequests] = await Promise.all([
          db.logs.toArray(),
          db.children.toArray(),
          db.appointments.toArray(),
          db.caregivers.toArray(),
          db.joinRequests.toArray()
        ]);

        if (dbChildren.length > 0) {
          setChildren(dbChildren);
          setLogs(dbLogs.sort((a, b) => b.timestamp - a.timestamp));
          setAppointments(dbAppts);
          setCaregivers(dbCaregivers);
          setJoinRequests(dbJoinRequests);
          setCurrentChildId(dbChildren[0].id);

          // Auto-skip onboarding if we have data
          if (localStorage.getItem('sunnyBaby_onboardingComplete') !== 'true') {
            localStorage.setItem('sunnyBaby_onboardingComplete', 'true');
            setShowOnboarding(false);
          }
        } else {
          // Fallback to legacy localStorage or initial
          const legacyChildren = safeParse('sunnyBaby_children', INITIAL_CHILDREN);
          setChildren(legacyChildren);
          setCurrentChildId(legacyChildren[0]?.id || 'c1');

          // If legacy data exists, skip onboarding too
          if (legacyChildren.length > 0 && localStorage.getItem('sunnyBaby_onboardingComplete') !== 'true') {
            localStorage.setItem('sunnyBaby_onboardingComplete', 'true');
            setShowOnboarding(false);
          }
        }
      } catch (err) {
        console.error('Dexie load error, falling back to localStorage:', err);
        const legacyChildren = safeParse('sunnyBaby_children', INITIAL_CHILDREN);
        setChildren(legacyChildren);
        setCurrentChildId(legacyChildren[0]?.id || 'c1');
        setLogs(safeParse('babyTrackerLogs', []));
        setAppointments(safeParse('babyTrackerAppointments', []));
      }
    };
    loadDataFromDexie();
  }, []);

  // Detect Invite Code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      // Auto-skip onboarding if invited
      if (showOnboarding) {
        localStorage.setItem('sunnyBaby_onboardingComplete', 'true');
        setShowOnboarding(false);
      }

      // Clear the param from URL without refreshing
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      const toast = document.createElement('div');
      toast.className = 'fixed top-40 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-8 py-5 rounded-[2.5rem] text-sm font-black shadow-2xl z-[400] border-4 border-yellow-400 pointer-events-none flex flex-col items-center gap-2 text-center';
      toast.innerHTML = `
        <span class="text-2xl">👋 Welcome!</span>
        <span class="opacity-80">You've been invited to join a family!</span>
        <span class="bg-yellow-400 text-slate-800 px-3 py-1 rounded-full mt-2">Code: ${invite}</span>
      `;
      document.body.appendChild(toast);

      gsap.fromTo(toast, { y: 100, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.7)' });
      setTimeout(() => {
        gsap.to(toast, { opacity: 0, y: -40, scale: 0.9, duration: 0.5, onComplete: () => toast.remove() });
      }, 5000);

      // If not logged in, we could potentially use this to auto-fill something or just warn them
      if (!isLoggedIn) {
        console.log("Invite received, but user not logged in yet:", invite);
      }
    }
  }, [isLoggedIn]);

  // Sync Logic with Google Drive
  const syncWithDrive = async () => {
    if (!isGoogleLinked) return;
    try {
      setSyncStatus('syncing');
      await initGapi();

      const token = localStorage.getItem('sunnyBaby_googleToken');
      if (token) {
        setGapiToken(token);
      } else {
        console.warn('No Google token found in localStorage for sync');
      }

      const fileId = await findOrCreateDatabaseFile();

      // 1. Download and Merge
      const cloudData = await downloadData(fileId) as any;
      if (cloudData && cloudData.logs) {
        await db.transaction('rw', [db.logs, db.children, db.appointments, db.caregivers, db.joinRequests], async () => {
          // Simple merge: cloud overwrites local for simplicity in this version
          await db.logs.clear();
          await db.children.clear();
          await db.appointments.clear();
          await db.caregivers.clear();
          await db.joinRequests.clear();

          await db.logs.bulkAdd(cloudData.logs);
          await db.children.bulkAdd(cloudData.children);
          await db.appointments.bulkAdd(cloudData.appointments);
          if (cloudData.caregivers) await db.caregivers.bulkAdd(cloudData.caregivers);
          if (cloudData.joinRequests) await db.joinRequests.bulkAdd(cloudData.joinRequests);
        });

        // Update state
        setLogs(cloudData.logs.sort((a: any, b: any) => b.timestamp - a.timestamp));
        setChildren(cloudData.children);
        setAppointments(cloudData.appointments);
        if (cloudData.caregivers) setCaregivers(cloudData.caregivers);
        if (cloudData.joinRequests) setJoinRequests(cloudData.joinRequests);
      }

      setSyncStatus('idle');
      console.log('🏁 Sync sequence completed');
    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    if (isGoogleLinked) {
      syncWithDrive();
    }
  }, [isGoogleLinked]);

  // Push to Drive on changes (debounced)
  useEffect(() => {
    if (isGoogleLinked && (logs.length > 0 || children.length > 0)) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          setSyncStatus('syncing');
          await initGapi();

          const token = localStorage.getItem('sunnyBaby_googleToken');
          if (token) {
            setGapiToken(token);
          }

          const fileId = await findOrCreateDatabaseFile();
          await uploadData(fileId, {
            logs,
            children,
            appointments,
            caregivers,
            lastSync: Date.now()
          });
          setSyncStatus('idle');
        } catch (err: any) {
          console.error('Push Sync Error Details:', {
            message: err.message,
            error: err.error,
            details: err
          });
          setSyncStatus('error');
        }
      }, 5000); // Wait 5s after last change
    }
  }, [logs, children, appointments, isGoogleLinked]);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, x: 20, filter: 'blur(10px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }
      );
    }
  }, [view]);

  useEffect(() => {
    if (isLoggedIn && !showOnboarding && navRef.current) {
      gsap.from(navRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: 'back.out(1.7)'
      });
    }
  }, [isLoggedIn, showOnboarding]);

  const handleLogin = (googleToken?: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('sunnyBaby_isLoggedIn', 'true');
    if (googleToken) {
      localStorage.setItem('sunnyBaby_googleToken', googleToken);
      setIsGoogleLinked(true);
    }
  };

  const handleOnboardingComplete = async (childData: Partial<Child>) => {
    const newChild: Child = {
      id: `c${Date.now()}`,
      name: childData.name || 'Baby',
      dob: childData.dob || new Date().toISOString(),
      gender: childData.gender || 'boy',
      photoUrl: childData.photoUrl || 'https://picsum.photos/200'
    };

    await db.children.add(newChild);
    setChildren([newChild]);
    setCurrentChildId(newChild.id);
    localStorage.setItem('sunnyBaby_onboardingComplete', 'true');
    setShowOnboarding(false);
  };

  const currentChild = children.find(c => c.id === currentChildId) || children[0];
  const childLogs = logs.filter(l => l.childId === currentChild?.id).sort((a, b) => b.timestamp - a.timestamp);
  const childAppointments = appointments.filter(a => a.childId === currentChild?.id);

  const addLog = async (entry: Partial<LogEntry>) => {
    if (!currentChild) return;

    if (editingLog) {
      const updatedLog = { ...editingLog, ...entry } as LogEntry;
      await db.logs.update(editingLog.id, updatedLog);
      setLogs(prev => prev.map(l => l.id === editingLog.id ? updatedLog : l));
      setEditingLog(null);
    } else {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        childId: currentChild.id,
        timestamp: Date.now(),
        type: entry.type!,
        details: entry.details || '',
        ...entry
      };
      await db.logs.add(newLog);
      setLogs(prev => [newLog, ...prev]);

      if (newLog.type === ActivityType.VACCINE) {
        await db.appointments.where({ childId: currentChild.id, vaccineName: newLog.details }).delete();
        setAppointments(prev => prev.filter(a => !(a.childId === currentChild.id && a.vaccineName === newLog.details)));
      }
    }

    const toast = document.createElement('div');
    toast.className = 'fixed top-12 left-1/2 -translate-x-1/2 bg-yellow-400/90 text-yellow-950 px-6 py-3 rounded-full text-sm font-black shadow-2xl z-[300] border-2 border-white pointer-events-none flex items-center gap-2';
    toast.innerHTML = `<span>✨ Recorded for ${currentChild.name}!</span>`;
    document.body.appendChild(toast);

    gsap.fromTo(toast, { y: -50, opacity: 0, scale: 0.5 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' });
    setTimeout(() => {
      gsap.to(toast, { opacity: 0, y: -20, scale: 0.8, duration: 0.4, onComplete: () => toast.remove() });
    }, 2000);
  };

  const deleteLog = async (id: string) => {
    await db.logs.delete(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const updateAppointment = async (vaccineName: string, plannedDate: string | null) => {
    if (!currentChild) return;

    if (plannedDate) {
      const newAppt = { childId: currentChild.id, vaccineName, plannedDate };
      await db.appointments.put(newAppt);
      setAppointments(prev => {
        const filtered = prev.filter(a => !(a.childId === currentChild.id && a.vaccineName === vaccineName));
        return [...filtered, newAppt];
      });
    } else {
      await db.appointments.where({ childId: currentChild.id, vaccineName }).delete();
      setAppointments(prev => prev.filter(a => !(a.childId === currentChild.id && a.vaccineName === vaccineName)));
    }
  };

  const handleQuickAdd = (type: ActivityType) => addLog({ type, details: 'Quick Log', timestamp: Date.now() });

  const switchChild = () => {
    if (children.length <= 1) return;
    const currentIndex = children.findIndex(c => c.id === currentChildId);
    const nextIndex = (currentIndex + 1) % children.length;
    setCurrentChildId(children[nextIndex].id);
  };

  const openAddModal = (type?: ActivityType) => {
    setModalInitialType(type || null);
    setEditingLog(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (log: LogEntry) => {
    setEditingLog(log);
    setModalInitialType(log.type);
    setIsAddModalOpen(true);
  };

  const handleAddChild = () => {
    setEditingChild(null);
    setIsBabySettingsOpen(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setIsBabySettingsOpen(true);
  };

  const handleSaveChild = async (childData: Partial<Child>) => {
    if (childData.id) {
      await db.children.update(childData.id, childData);
      setChildren(prev => prev.map(c => c.id === childData.id ? { ...c, ...childData } as Child : c));
    } else {
      const newChild: Child = {
        id: `c${Date.now()}`,
        name: childData.name || 'Baby',
        dob: childData.dob || new Date().toISOString(),
        gender: childData.gender || 'boy',
        photoUrl: childData.photoUrl || `https://picsum.photos/200?random=${Date.now()}`
      };
      await db.children.add(newChild);
      setChildren(prev => [...prev, newChild]);
      setCurrentChildId(newChild.id);
    }
    setIsBabySettingsOpen(false);
  };

  const handleDeleteChild = async (id: string) => {
    await db.children.delete(id);
    await db.logs.where('childId').equals(id).delete();
    await db.appointments.where('childId').equals(id).delete();

    const newChildren = children.filter(c => c.id !== id);
    setChildren(newChildren);
    if (currentChildId === id) setCurrentChildId(newChildren[0]?.id || '');
    setIsBabySettingsOpen(false);
  };

  const handleClearData = async () => {
    if (window.confirm('WARNING: This will permanently delete all your baby logs and information. Are you sure?')) {
      await db.transaction('rw', db.logs, db.children, db.appointments, async () => {
        await db.logs.clear();
        await db.children.clear();
        await db.appointments.clear();
      });
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen font-sans text-slate-800 select-none overflow-hidden relative">
      <Background />

      {/* Cloud Status Indicator */}
      {isGoogleLinked && (
        <div className={`fixed top-4 right-4 z-[100] px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 text-[10px] font-black uppercase tracking-wider border transition-all duration-500 ${syncStatus === 'syncing' ? 'bg-orange-400/20 border-orange-400/50 text-orange-600' :
          syncStatus === 'error' ? 'bg-red-400/20 border-red-400/50 text-red-600' :
            'bg-green-400/20 border-green-400/50 text-green-600'
          }`}>
          {syncStatus === 'syncing' ? (
            <><div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" /> Syncing...</>
          ) : syncStatus === 'error' ? (
            <button onClick={() => syncWithDrive()} className="flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
              <CloudOff size={12} /> Sync Error • Retry
            </button>
          ) : (
            <><Cloud size={12} /> Cloud Saved</>
          )}
        </div>
      )}

      <div className="max-w-md mx-auto h-screen relative flex flex-col z-10">
        <div className="flex-1 overflow-hidden relative" ref={contentRef}>
          {view === 'dashboard' && currentChild && (
            <Dashboard
              child={currentChild}
              logs={childLogs}
              appointments={childAppointments}
              onAddLog={addLog}
              onChildSwitch={switchChild}
              onOpenModal={openAddModal}
              onQuickAdd={handleQuickAdd}
              onNavigate={setView}
            />
          )}
          {view === 'analytics' && currentChild && <Analytics logs={childLogs} child={currentChild} />}
          {view === 'activity' && <Activity logs={childLogs} appointments={childAppointments} onAddLog={addLog} onUpdateAppointment={updateAppointment} onEditLog={openEditModal} onDeleteLog={deleteLog} />}
          {view === 'settings' && <Settings
            logs={logs}
            children={children}
            caregivers={caregivers}
            onAddChild={handleAddChild}
            onEditChild={handleEditChild}
            onLinkGoogle={handleLogin}
            onClearData={handleClearData}
            isGoogleLinked={isGoogleLinked}
            onAddCaregiver={async (c) => {
              await db.caregivers.add(c);
              setCaregivers([...caregivers, c]);
            }}
            onDeleteCaregiver={async (id) => {
              await db.caregivers.delete(id);
              setCaregivers(caregivers.filter(c => c.id !== id));
            }}
            onUpdateCaregiver={async (id, updates) => {
              await db.caregivers.update(id, updates);
              setCaregivers(caregivers.map(c => c.id === id ? { ...c, ...updates } : c));
            }}
            onAddCaregiverClick={() => {
              setEditingCaregiver(null);
              setIsFamilyModalOpen(true);
            }}
            onEditCaregiverClick={(c) => {
              setEditingCaregiver(c);
              setIsFamilyModalOpen(true);
            }}
            joinRequests={joinRequests}
            onJoinFamily={async (code) => {
              const profile = JSON.parse(localStorage.getItem('sunny_profile') || '{}');
              const newRequest: JoinRequest = {
                id: Date.now().toString(),
                userId: Date.now().toString(), // Should be real user ID in production
                userName: profile.name || 'Anonymous',
                userEmail: profile.email || 'unknown',
                inviteCode: code,
                status: 'pending',
                timestamp: Date.now()
              };
              await db.joinRequests.add(newRequest);
              setJoinRequests([...joinRequests, newRequest]);
              const toast = document.createElement('div');
              toast.className = 'fixed top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full text-xs font-black shadow-2xl z-[300] border-2 border-white pointer-events-none';
              toast.innerHTML = `<span>Request sent: ${code}</span>`;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 3000);
            }}
            onApproveRequest={async (req) => {
              const newCaregiver: Caregiver = {
                id: req.userId,
                name: req.userName,
                email: req.userEmail,
                role: 'Caregiver',
                photoUrl: `https://picsum.photos/100?u=${req.userId}`,
                accessLevel: 'Editor',
                status: 'approved',
                joinedAt: Date.now()
              };
              await db.caregivers.add(newCaregiver);
              await db.joinRequests.delete(req.id);
              setCaregivers([...caregivers, newCaregiver]);
              setJoinRequests(joinRequests.filter(r => r.id !== req.id));
            }}
            onDenyRequest={async (req) => {
              await db.joinRequests.delete(req.id);
              setJoinRequests(joinRequests.filter(r => r.id !== req.id));
            }}
          />
          }
        </div>

        <AddLogModal
          isOpen={isAddModalOpen}
          onClose={() => { setIsAddModalOpen(false); setEditingLog(null); }}
          onSave={addLog}
          initialType={modalInitialType}
          editEntry={editingLog}
        />
        <BabySettingsModal
          isOpen={isBabySettingsOpen}
          onClose={() => setIsBabySettingsOpen(false)}
          child={editingChild}
          onSave={handleSaveChild}
          onDelete={children.length > 1 ? handleDeleteChild : undefined}
        />

        <FamilySettingsModal
          isOpen={isFamilyModalOpen}
          onClose={() => setIsFamilyModalOpen(false)}
          caregiver={editingCaregiver}
          onSave={async (updates) => {
            if (updates.id) {
              await db.caregivers.update(updates.id, updates);
              setCaregivers(caregivers.map(c => c.id === updates.id ? { ...c, ...updates } as Caregiver : c));
            } else {
              const newCaregiver = {
                ...updates,
                id: Date.now().toString()
              } as Caregiver;
              await db.caregivers.add(newCaregiver);
              setCaregivers([...caregivers, newCaregiver]);
            }
          }}
          onDelete={async (id) => {
            await db.caregivers.delete(id);
            setCaregivers(caregivers.filter(c => c.id !== id));
          }}
        />

        <nav
          ref={navRef}
          className="absolute bottom-6 left-6 right-6 min-h-[5rem] pb-[env(safe-area-inset-bottom)] bg-white/40 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-around px-1 z-50 ring-1 ring-white/80"
        >
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Home size={24} />} label="Home" />
          <NavButton active={view === 'analytics'} onClick={() => setView('analytics')} icon={<BarChart2 size={24} />} label="Trends" />

          <div className="relative -top-12">
            <button
              onClick={() => openAddModal()}
              className="w-22 h-22 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-400 flex items-center justify-center text-white shadow-[0_12px_25px_rgba(249,115,22,0.4)] border-[6px] border-white transition-all active:scale-95 active:shadow-none hover:scale-105 hover:-translate-y-1 group relative overflow-hidden ring-4 ring-black/5"
            >
              {/* Subtle shine effect */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 blur-[2px]" />
              <Plus size={40} strokeWidth={4} className="relative z-10 drop-shadow-md" />
            </button>
          </div>

          <NavButton active={view === 'activity'} onClick={() => setView('activity')} icon={<List size={24} />} label="Diary" />
          <NavButton active={view === 'settings'} onClick={() => setView('settings')} icon={<SettingsIcon size={24} />} label="Menu" />
        </nav>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500
      ${active
        ? 'bg-white/90 text-orange-500 -translate-y-4 shadow-[0_15px_30px_-10px_rgba(251,146,60,0.4)] scale-110'
        : 'text-slate-500 hover:text-slate-900 hover:bg-white/30'}`}
  >
    <div className={`transition-transform duration-500 ${active ? 'scale-110' : 'scale-100 opacity-60'}`}>
      {icon}
    </div>
    {active && <span className="text-[10px] font-black mt-1 uppercase tracking-widest text-orange-500 opacity-100">{label}</span>}
  </button>
);

export default App;