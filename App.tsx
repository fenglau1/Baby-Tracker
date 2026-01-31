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

const APP_VERSION = '2026.1.2';

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
  const [toast, setToast] = useState<string | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>(null);

  // --- Auto-Refresh On Focus ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isGoogleLinked) {
        console.log('🔄 App Focused: Triggering auto-sync...');
        syncWithDrive();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isGoogleLinked]);

  // --- Notification Engine ---
  useEffect(() => {
    const checkReminders = () => {
      const isNotifEnabled = localStorage.getItem('sunny_pref_notif') !== 'false';
      if (!isNotifEnabled || Notification.permission !== 'granted') return;

      const now = Date.now();
      const next24h = now + 24 * 60 * 60 * 1000;

      appointments.forEach(appt => {
        const apptDate = new Date(appt.plannedDate).getTime();
        if (apptDate > now && apptDate <= next24h) {
          const child = children.find(c => c.id === apptId(appt));
          const childName = child?.name || 'Baby';

          // Use a simple key to avoid duplicate pings in the same session
          const reminderKey = `sunny_rem_vax_${appt.childId}_${appt.vaccineName}_${appt.plannedDate}`;
          if (localStorage.getItem(reminderKey)) return;

          new Notification('💉 Vaccine Reminder', {
            body: `${childName} has a ${appt.vaccineName} scheduled for tomorrow!`,
            icon: '/sunnybaby_icon_192.png'
          });
          localStorage.setItem(reminderKey, 'true');
        }
      });
    };

    const apptId = (a: VaccineAppointment) => a.childId;

    // Check on mount and then every hour
    checkReminders();
    const interval = setInterval(checkReminders, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [appointments, children]);

  // Load from Dexie on mount
  useEffect(() => {
    const loadDataFromDexie = async () => {
      try {
        console.log('📦 Dexie: Loading tables...');
        // Add a safety timeout to avoid hanging if IndexedDB stalls
        const dexiePromise = Promise.all([
          db.logs.toArray(),
          db.children.toArray(),
          db.appointments.toArray(),
          db.caregivers.toArray(),
          db.joinRequests.toArray()
        ]);

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Dexie timeout")), 3000));
        const [dbLogs, dbChildren, dbAppts, dbCaregivers, dbJoinRequests] = await Promise.race([dexiePromise, timeoutPromise]) as any;

        if (dbChildren.length > 0) {
          setChildren(dbChildren);
          setLogs(dbLogs.sort((a, b) => b.timestamp - a.timestamp));
          setAppointments(dbAppts);
          setCaregivers(dbCaregivers);
          setJoinRequests(dbJoinRequests);
          setCurrentChildId(dbChildren[0].id);

          // Auto-skip onboarding if we have data
          if (localStorage.getItem('sunnyBaby_onboardingComplete') !== 'true') {
            console.log('✅ Found existing children, skipping onboarding...');
            localStorage.setItem('sunnyBaby_onboardingComplete', 'true');
            setShowOnboarding(false);
          }
        } else {
          // Fallback to legacy
          const legacyChildren = safeParse('sunnyBaby_children', INITIAL_CHILDREN);
          setChildren(legacyChildren);
          setCurrentChildId(legacyChildren[0]?.id || 'c1');

          if (legacyChildren.length > 0 && localStorage.getItem('sunnyBaby_onboardingComplete') !== 'true') {
            localStorage.setItem('sunnyBaby_onboardingComplete', 'true');
            setShowOnboarding(false);
          }
        }
      } catch (err) {
        console.error('Dexie load error, falling back to legacy state:', err);
        const legacyChildren = safeParse('sunnyBaby_children', INITIAL_CHILDREN);
        setChildren(legacyChildren);
        setCurrentChildId(legacyChildren[0]?.id || 'c1');
        setLogs(safeParse('babyTrackerLogs', []));
        setAppointments(safeParse('babyTrackerAppointments', []));
      } finally {
        setIsLoading(false);
      }
    };
    loadDataFromDexie();

    // --- Version Check ---
    const lastVersion = localStorage.getItem('sunny_app_version');
    if (lastVersion && lastVersion !== APP_VERSION) {
      setShowUpdateToast(true);
    }
    localStorage.setItem('sunny_app_version', APP_VERSION);
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

  // --- Bidirectional Merge Helpers ---
  const mergeLists = <T extends { id: string; updatedAt?: number; timestamp?: number }>(local: T[], cloud: T[]): T[] => {
    const map = new Map<string, T>();
    local.forEach(item => map.set(item.id, item));
    cloud.forEach(cloudItem => {
      const localItem = map.get(cloudItem.id);
      if (!localItem) {
        map.set(cloudItem.id, cloudItem);
      } else {
        const cloudTime = cloudItem.updatedAt || cloudItem.timestamp || 0;
        const localTime = localItem.updatedAt || localItem.timestamp || 0;
        if (cloudTime > localTime) {
          map.set(cloudItem.id, cloudItem);
        }
      }
    });
    return Array.from(map.values());
  };

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
      if (cloudData) {
        // 1. Fetch current local state
        const localLogs = await db.logs.toArray();
        const localChildren = await db.children.toArray();
        const localAppts = await db.appointments.toArray();
        const localCaregivers = await db.caregivers.toArray();
        const localRequests = await db.joinRequests.toArray();

        // 2. Merge logic
        const mergedLogs = mergeLists(localLogs, cloudData.logs || []);
        const mergedChildren = mergeLists(localChildren, cloudData.children || []);
        const mergedCaregivers = mergeLists(localCaregivers, cloudData.caregivers || []);
        const mergedRequests = mergeLists(localRequests, cloudData.joinRequests || []);

        // Appointments use a unique string key normally, but let's just union them for now
        // A better way would be [childId+vaccineName] uniqueness
        const apptKey = (a: VaccineAppointment) => `${a.childId}-${a.vaccineName}`;
        const apptMap = new Map<string, VaccineAppointment>();
        localAppts.forEach(a => apptMap.set(apptKey(a), a));
        (cloudData.appointments || []).forEach((a: VaccineAppointment) => {
          if (!apptMap.has(apptKey(a))) apptMap.set(apptKey(a), a);
        });
        const mergedAppts = Array.from(apptMap.values());

        // 3. Persist to Dexie
        await db.transaction('rw', [db.logs, db.children, db.appointments, db.caregivers, db.joinRequests], async () => {
          await Promise.all([
            db.logs.clear(),
            db.children.clear(),
            db.appointments.clear(),
            db.caregivers.clear(),
            db.joinRequests.clear()
          ]);
          await Promise.all([
            db.logs.bulkAdd(mergedLogs),
            db.children.bulkAdd(mergedChildren),
            db.appointments.bulkAdd(mergedAppts),
            db.caregivers.bulkAdd(mergedCaregivers),
            db.joinRequests.bulkAdd(mergedRequests)
          ]);
        });

        // 4. Update UI State
        setLogs(mergedLogs.sort((a, b) => b.timestamp - a.timestamp));
        setChildren(mergedChildren);
        setAppointments(mergedAppts);
        setCaregivers(mergedCaregivers);
        setJoinRequests(mergedRequests);

        console.log('✅ Bidirectional Sync Merge Complete');
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
            joinRequests,
            lastSync: Date.now()
          });
          setSyncStatus('idle');
          console.log('📦 Cloud Backup Successful: All tables synced.');
        } catch (err: any) {
          console.error('Push Sync Error Details:', err);
          setSyncStatus('error');
        }
      }, 5000); // Wait 5s after last change
    }
  }, [logs, children, appointments, caregivers, joinRequests, isGoogleLinked]);

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

  const [userProfile, setUserProfile] = useState(() => {
    return safeParse('sunny_profile', { name: 'Parent', email: 'user@sunnybaby.app', photoUrl: '' });
  });

  const handleLogin = async (googleToken?: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('sunnyBaby_isLoggedIn', 'true');

    if (googleToken) {
      localStorage.setItem('sunnyBaby_googleToken', googleToken);
      setIsGoogleLinked(true);

      // Fetch Profile from Google
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        const data = await response.json();

        const newProfile = {
          name: data.name || userProfile.name,
          email: data.email || userProfile.email,
          photoUrl: data.picture || userProfile.photoUrl
        };

        setUserProfile(newProfile);
        localStorage.setItem('sunny_profile', JSON.stringify(newProfile));
        console.log('✅ Google Profile Synced:', newProfile.email);
      } catch (err) {
        console.error('Failed to fetch Google profile:', err);
      }
    }
  };

  const handleOnboardingComplete = async (childData: Partial<Child>) => {
    const newChild: Child = {
      id: `c${Date.now()}`,
      name: childData.name || 'Baby',
      dob: childData.dob || new Date().toISOString(),
      gender: childData.gender || 'boy',
      photoUrl: childData.photoUrl || 'https://picsum.photos/200',
      updatedAt: Date.now()
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

    // --- Smart Sleep Timer Logic ---
    if (entry.type === ActivityType.SLEEP && !editingLog) {
      if (currentChild.sleepStartTime) {
        // Stop Sleeping - Calculate Duration
        const start = currentChild.sleepStartTime;
        const end = Date.now();
        const durationMin = Math.max(1, Math.round((end - start) / 60000));

        const newLog: LogEntry = {
          id: Date.now().toString(),
          childId: currentChild.id,
          timestamp: end,
          type: ActivityType.SLEEP,
          value: durationMin,
          details: `Slept for ${durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin}m`}`,
          notes: entry.notes || '',
          updatedAt: Date.now()
        };

        await db.logs.add(newLog);
        setLogs(prev => [newLog, ...prev]);

        // Clear timer
        const updates = { updatedAt: Date.now(), sleepStartTime: undefined };
        await db.children.update(currentChild.id, updates);
        setChildren(prev => prev.map(c => c.id === currentChild.id ? { ...c, ...updates } as Child : c));

        showToast(`🌅 Good morning, ${currentChild.name}! Logged ${durationMin}m sleep.`);
        return;
      } else {
        // Start Sleeping - Record Start Time
        const updates = { updatedAt: Date.now(), sleepStartTime: Date.now() };
        await db.children.update(currentChild.id, updates);
        setChildren(prev => prev.map(c => c.id === currentChild.id ? { ...c, ...updates } as Child : c));

        showToast(`🌙 Sweet dreams, ${currentChild.name}! Timer started.`);
        return;
      }
    }

    if (editingLog) {
      const updatedLog = { ...editingLog, ...entry, updatedAt: Date.now() } as LogEntry;
      await db.logs.update(editingLog.id, updatedLog);
      setLogs(prev => prev.map(l => l.id === editingLog.id ? updatedLog : l));
      setEditingLog(null);
      setIsAddModalOpen(false);
      showToast('Log updated!');
    } else {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        childId: currentChild.id,
        timestamp: Date.now(),
        type: entry.type || ActivityType.OTHER,
        details: entry.details || '',
        updatedAt: Date.now(),
        ...entry
      };
      await db.logs.add(newLog);
      setLogs(prev => [newLog, ...prev]);
      setIsAddModalOpen(false);
      showToast('Activity logged!');

      if (newLog.type === ActivityType.VACCINE) {
        await db.appointments.where({ childId: currentChild.id, vaccineName: newLog.details }).delete();
        setAppointments(prev => prev.filter(a => !(a.childId === currentChild.id && a.vaccineName === newLog.details)));
      }
    }
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
      const updates = {
        ...childData,
        updatedAt: Date.now(),
        // Preserve fields we don't edit here
        sleepStartTime: children.find(c => c.id === childData.id)?.sleepStartTime
      };
      await db.children.update(childData.id, updates);
      setChildren(prev => prev.map(c => c.id === childData.id ? { ...c, ...updates } as Child : c));
    } else {
      const newChild: Child = {
        id: `c${Date.now()}`,
        name: childData.name || 'Baby',
        dob: childData.dob || new Date().toISOString(),
        gender: childData.gender || 'boy',
        photoUrl: childData.photoUrl || `https://picsum.photos/200?random=${Date.now()}`,
        updatedAt: Date.now()
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
    if (window.confirm('WARNING: This will permanently delete all your baby logs, family info, and accounts. Are you sure?')) {
      await db.transaction('rw', [db.logs, db.children, db.appointments, db.caregivers, db.joinRequests], async () => {
        await db.logs.clear();
        await db.children.clear();
        await db.appointments.clear();
        await db.caregivers.clear();
        await db.joinRequests.clear();
      });
      localStorage.clear();
      window.location.href = window.location.origin;
    }
  };

  const handleHardRefresh = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
    }
    // Append a cache-buster query param and reload
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    window.location.href = url.toString();
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;
  if (isLoading) return (
    <div className="h-screen w-full bg-[#FFFBEB] flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-24 h-24 bg-yellow-100 rounded-[2rem] mb-6 flex items-center justify-center">
        <div className="w-12 h-12 bg-yellow-400 rounded-full animate-bounce" />
      </div>
      <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Waking up the engine...</p>
    </div>
  );
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen min-h-[100dvh] font-sans text-slate-800 select-none overflow-hidden relative">
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
                joinedAt: Date.now(),
                updatedAt: Date.now()
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
            profile={userProfile}
            onUpdateProfile={(p) => {
              setUserProfile(p);
              localStorage.setItem('sunny_profile', JSON.stringify(p));
            }}
            onHardRefresh={handleHardRefresh}
            version={APP_VERSION}
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
              const fullUpdates = { ...updates, updatedAt: Date.now() };
              await db.caregivers.update(updates.id, fullUpdates);
              setCaregivers(caregivers.map(c => c.id === updates.id ? { ...c, ...fullUpdates } as Caregiver : c));
            } else {
              const newCaregiver = {
                ...updates,
                id: Date.now().toString(),
                updatedAt: Date.now()
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

        {/* Nav Bar */}
        <nav
          ref={navRef}
          className="absolute bottom-6 left-6 right-6 min-h-[6.5rem] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2 bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] flex items-center justify-around px-2 z-50 ring-1 ring-white/80"
        >
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Home size={28} />} label="Home" />
          <NavButton active={view === 'analytics'} onClick={() => setView('analytics')} icon={<BarChart2 size={28} />} label="Trends" />
          <div className="relative -top-12">
            <button
              onClick={() => openAddModal()}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-400 flex items-center justify-center text-white shadow-[0_15px_35px_rgba(249,115,22,0.4)] border-[8px] border-white transition-all active:scale-95 active:shadow-none hover:scale-105 hover:-translate-y-1 group relative overflow-hidden ring-4 ring-black/5"
            >
              {/* Subtle shine effect */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 blur-[2px]" />
              <Plus size={44} strokeWidth={4} className="relative z-10 drop-shadow-md" />
            </button>
          </div>
          <NavButton active={view === 'activity'} onClick={() => setView('activity')} icon={<List size={28} />} label="Diary" />
          <NavButton active={view === 'settings'} onClick={() => setView('settings')} icon={<SettingsIcon size={28} />} label="Menu" />
        </nav>

        {/* Global Toast */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-800/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10">
              <span className="text-xs font-black tracking-tight">{toast}</span>
            </div>
          </div>
        )}

        {/* Update Toast */}
        {showUpdateToast && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-xs animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-orange-600 text-white p-4 rounded-3xl shadow-2xl border-4 border-white flex flex-col items-center gap-3 text-center">
              <div className="space-y-1">
                <p className="font-black text-xs uppercase tracking-widest">New Update Ready!</p>
                <p className="text-[10px] font-bold opacity-90">We've added the sleep timer & UX fixes.</p>
              </div>
              <button
                onClick={handleHardRefresh}
                className="bg-white text-orange-600 px-6 py-2 rounded-full font-black text-xs active:scale-95 transition-transform"
              >
                Refresh Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-16 rounded-[1.5rem] transition-all duration-500
      ${active
        ? 'bg-white/90 text-orange-500 -translate-y-6 shadow-[0_20px_40px_-10px_rgba(251,146,60,0.5)] scale-110'
        : 'text-slate-500 hover:text-slate-900 hover:bg-white/30'}`}
  >
    <div className={`transition-transform duration-500 ${active ? 'scale-110' : 'scale-100 opacity-60'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 28 })}
    </div>
    {active && <span className="text-[11px] font-black mt-1 uppercase tracking-widest text-orange-500 opacity-100">{label}</span>}
  </button>
);

export default App;