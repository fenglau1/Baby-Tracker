import React, { useState, useEffect, useRef } from 'react';
import { Bell, Download, ChevronRight, LogOut, ToggleRight, ToggleLeft, Scale, Edit2, Save, Plus, Share2, Copy, Check, Users, FileText, Camera, Sparkles, Trash2, UserPlus, Cloud } from 'lucide-react';
import { Button3D } from './Button3D';
import { LogEntry, Child, Caregiver } from '../types';
import gsap from 'gsap';
import { PrivacyModal } from './PrivacyModal';

interface SettingsProps {
    logs?: LogEntry[];
    children: Child[];
    caregivers: Caregiver[];
    onAddChild: () => void;
    onEditChild: (child: Child) => void;
    onLinkCloud: () => void;
    onClearData: () => void;
    isCloudLinked?: boolean;
    onAddCaregiver: (caregiver: Caregiver) => void;
    onDeleteCaregiver: (id: string) => void;
    onUpdateCaregiver: (id: string, updates: Partial<Caregiver>) => void;
    onAddCaregiverClick: () => void;
    onEditCaregiverClick: (caregiver: Caregiver) => void;
    profile: { name: string; email: string; photoUrl: string };
    onUpdateProfile: (profile: { name: string; email: string; photoUrl: string }) => void;
    onHardRefresh: () => void;
    version: string;
}

export const Settings: React.FC<SettingsProps> = ({
    logs = [],
    children,
    caregivers,
    onAddChild,
    onEditChild,
    onLinkCloud,
    onClearData,
    isCloudLinked,
    onAddCaregiver, // Still here for backward compatibility if needed, but not used in UI now
    onDeleteCaregiver,
    onUpdateCaregiver,
    onAddCaregiverClick,
    onEditCaregiverClick,
    profile: initialProfile,
    onUpdateProfile,
    onHardRefresh,
    version
}) => {

    // --- Persistent State Logic ---
    const [metric, setMetric] = useState(() => localStorage.getItem('sunny_pref_metric') !== 'false');
    const [notifications, setNotifications] = useState(() => localStorage.getItem('sunny_pref_notif') !== 'false');

    const [profile, setProfile] = useState(initialProfile);

    useEffect(() => {
        setProfile(initialProfile);
    }, [initialProfile]);

    const [isEditing, setIsEditing] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persist effects
    useEffect(() => localStorage.setItem('sunny_pref_metric', String(metric)), [metric]);
    useEffect(() => localStorage.setItem('sunny_pref_notif', String(notifications)), [notifications]);

    const showToast = (message: string) => {
        const existingToast = document.getElementById('settings-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'settings-toast';
        toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-[0_10px_40px_rgba(0,0,0,0.2)] z-[200] flex items-center gap-2 pointer-events-none border border-slate-700';
        toast.innerHTML = `<span class="flex items-center gap-2">✨ ${message}</span>`;
        document.body.appendChild(toast);

        gsap.fromTo(toast, { y: -50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
        setTimeout(() => {
            gsap.to(toast, { opacity: 0, y: -20, scale: 0.9, duration: 0.3, onComplete: () => toast.remove() });
        }, 2500);
    };

    const handleSaveProfile = () => {
        setIsEditing(false);
        onUpdateProfile(profile);
        showToast('Profile updated successfully!');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxSize = 300;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                    } else {
                        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                    const newProfile = { ...profile, photoUrl: dataUrl };
                    setProfile(newProfile);
                    localStorage.setItem('sunny_profile', JSON.stringify(newProfile));
                    showToast('Photo updated!');
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileUpload = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const setMetricPreference = (isMetric: boolean) => {
        setMetric(isMetric);
        showToast(isMetric ? 'Units set to Metric (kg, cm)' : 'Units set to Imperial (lb, in)');
    };

    const toggleNotifications = async () => {
        if (!notifications) {
            // Check for Secure Context
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                showToast('Notifications require a secure (HTTPS) connection');
                return;
            }

            if (!("Notification" in window)) {
                showToast('Browser does not support notifications');
                return;
            }
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                showToast('Notification permission denied');
                return;
            }
        }
        const newState = !notifications;
        setNotifications(newState);
        showToast(newState ? 'Notifications enabled!' : 'Notifications disabled');
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `sunnybaby_logs_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast('Data export started...');
    };

    const isOwner = true; // Always owner in internal use

    return (
        <div className="flex flex-col h-full px-6 pt-10 pb-48 overflow-y-auto">
            <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">Settings</h2>

            {/* Profile Section */}
            <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-5 shadow-sm border border-white/50 mb-6 transition-all hover:shadow-md hover:bg-white/80">
                <div className="flex items-center gap-4 mb-4">
                    <div
                        className={`w-16 h-16 rounded-2xl bg-slate-200 border-4 border-white shadow-md overflow-hidden relative group ${isEditing ? 'cursor-pointer ring-2 ring-yellow-400 ring-offset-2' : ''}`}
                        onClick={triggerFileUpload}
                    >
                        <img src={profile.photoUrl || "https://picsum.photos/100?u=parent"} alt="Parent" className="w-full h-full object-cover" />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-all group-hover:bg-black/40">
                                <Camera size={20} className="text-white drop-shadow-md" />
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="space-y-2 animate-in slide-in-from-left-2 duration-200">
                                <div className="flex gap-2">
                                    <input
                                        value={profile.name}
                                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                                        className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors"
                                        placeholder="Your Name"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => {
                                            const randomId = Math.floor(Math.random() * 1000);
                                            const newPhoto = `https://picsum.photos/300?u=${randomId}`;
                                            setProfile(p => ({ ...p, photoUrl: newPhoto }));
                                        }}
                                        className="p-2 bg-yellow-100 text-yellow-600 rounded-xl hover:bg-yellow-200 transition-colors"
                                        title="Randomize Photo"
                                    >
                                        <Sparkles size={18} />
                                    </button>
                                </div>
                                <input
                                    value={profile.email}
                                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 focus:outline-none focus:border-yellow-400 transition-colors"
                                    placeholder="Email Address"
                                />
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-200">
                                <h3 className="text-xl font-black text-slate-800 truncate">{profile.name}</h3>
                                <p className="text-slate-500 text-sm font-bold truncate opacity-60">{profile.email}</p>
                            </div>
                        )}
                    </div>
                </div>
                <Button3D variant="white" fullWidth className="py-2.5 text-sm" onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
                    {isEditing ? (
                        <span className="flex items-center gap-2 text-green-600"><Check size={16} strokeWidth={3} /> Save Profile</span>
                    ) : (
                        <span className="flex items-center gap-2"><Edit2 size={16} /> Edit Profile</span>
                    )}
                </Button3D>
            </div>

            {/* Baby Management */}
            <div className="space-y-4 mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">My Babies</h3>
                <div className="grid grid-cols-4 gap-3">
                    {children.map(child => (
                        <div key={child.id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => onEditChild(child)}>
                            <div className="w-16 h-16 rounded-[1.2rem] border-[3px] border-white shadow-sm overflow-hidden group-hover:scale-105 group-hover:rotate-3 transition-all relative">
                                <img src={child.photoUrl} alt={child.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 truncate max-w-full bg-white/50 px-2 py-0.5 rounded-md">{child.name}</span>
                        </div>
                    ))}
                    <button onClick={onAddChild} className="flex flex-col items-center gap-2 group">
                        <div className="w-16 h-16 rounded-[1.2rem] border-[3px] border-slate-200 border-dashed bg-white/50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:border-yellow-400 group-hover:text-yellow-500 group-active:scale-95 transition-all">
                            <Plus size={28} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-yellow-600 transition-colors">Add New</span>
                    </button>
                </div>
            </div>

            {/* Cloud & Backup */}
            <div className="space-y-4 mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Cloud & Backup</h3>
                <div className={`bg-white/70 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm border border-white flex flex-col gap-4 transition-all ${isCloudLinked ? 'ring-2 ring-green-100' : 'ring-2 ring-orange-100'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isCloudLinked ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'}`}>
                                <Cloud size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-700 text-sm">Appwrite Internal Sync</span>
                                <span className={`text-[10px] font-bold text-slate-400`}>
                                    {isCloudLinked ? 'Connected & Synced' : 'Not Connected'}
                                </span>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isCloudLinked ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`} />
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4 mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Preferences</h3>
                <div className="bg-white/70 backdrop-blur-sm rounded-[2rem] p-2 shadow-sm border border-white flex items-center justify-between pl-4 pr-2 py-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 text-indigo-500 rounded-xl">
                            <Scale size={20} />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">Units</span>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-[1.2rem]">
                        <button onClick={() => setMetricPreference(true)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${metric ? 'bg-white text-slate-800 shadow-sm scale-100' : 'text-slate-400 scale-95 hover:text-slate-600'}`}>Metric</button>
                        <button onClick={() => setMetricPreference(false)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!metric ? 'bg-white text-slate-800 shadow-sm scale-100' : 'text-slate-400 scale-95 hover:text-slate-600'}`}>Imperial</button>
                    </div>
                </div>
                <button onClick={toggleNotifications} className={`w-full bg-white/70 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm border border-white flex items-center justify-between transition-all active:scale-[0.98] ${notifications ? 'ring-2 ring-orange-100' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${notifications ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400'}`}>
                            <Bell size={20} />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">Notifications</span>
                    </div>
                    {notifications ? <ToggleRight size={36} className="text-orange-500 transition-all scale-110" /> : <ToggleLeft size={36} className="text-slate-300 transition-all" />}
                </button>
            </div>


            {/* Data & Support */}
            <div className="space-y-3 mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Data & Support</h3>
                <button onClick={handleExport} className="w-full bg-white/70 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm border border-white flex items-center justify-between active:scale-[0.98] transition-transform hover:bg-white/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-100 text-cyan-500 rounded-xl"><Download size={20} /></div>
                        <span className="font-bold text-slate-700 text-sm">Export Data (JSON)</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
                <button onClick={() => setIsPrivacyModalOpen(true)} className="w-full bg-white/70 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm border border-white flex items-center justify-between active:scale-[0.98] transition-transform hover:bg-white/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-500 rounded-xl"><FileText size={20} /></div>
                        <span className="font-bold text-slate-700 text-sm">Privacy Policy</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
                <button onClick={onHardRefresh} className="w-full bg-white/70 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm border border-white flex items-center justify-between active:scale-[0.98] transition-transform hover:bg-white/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-100 text-orange-500 rounded-xl"><Sparkles size={20} /></div>
                        <span className="font-bold text-slate-700 text-sm">Force Refresh App</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
            </div>

            {/* Privacy Modal */}
            <PrivacyModal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
            />


            <div className="text-center mt-6 mb-10 space-y-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Version {version} • Baby Tracker</p>
                <div className="flex flex-col gap-3 items-center">
                    <button onClick={onClearData} className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-wider bg-slate-50 hover:bg-red-50 px-6 py-3 rounded-full transition-all">Clear All Data</button>
                    <button onClick={() => { if (window.confirm('Are you sure you want to log out? Local records will remain.')) { localStorage.clear(); window.location.reload(); } }} className="inline-flex items-center gap-2 text-red-500 hover:text-white font-black text-xs uppercase tracking-wider bg-red-50 hover:bg-red-500 px-6 py-3 rounded-full transition-all border border-red-100"><LogOut size={14} strokeWidth={3} /> Log Out</button>
                </div>
            </div>
        </div>
    );
};