import React, { useState, useEffect, useRef } from 'react';
import { Bell, Download, ChevronRight, LogOut, ToggleRight, ToggleLeft, Scale, Edit2, Save, Plus, Share2, Copy, Check, Users, FileText, Camera, Sparkles, Trash2, UserPlus } from 'lucide-react';
import { Button3D } from './Button3D';
import { LogEntry, Child, Caregiver, JoinRequest } from '../types';
import gsap from 'gsap';
import { useGoogleLogin } from '@react-oauth/google';
import { PrivacyModal } from './PrivacyModal';

interface SettingsProps {
    logs?: LogEntry[];
    children: Child[];
    caregivers: Caregiver[];
    onAddChild: () => void;
    onEditChild: (child: Child) => void;
    onLinkGoogle: (token: string) => void;
    onClearData: () => void;
    isGoogleLinked?: boolean;
    onAddCaregiver: (caregiver: Caregiver) => void;
    onDeleteCaregiver: (id: string) => void;
    onUpdateCaregiver: (id: string, updates: Partial<Caregiver>) => void;
    onAddCaregiverClick: () => void;
    onEditCaregiverClick: (caregiver: Caregiver) => void;
    joinRequests: JoinRequest[];
    onJoinFamily: (code: string) => void;
    onApproveRequest: (request: JoinRequest) => void;
    onDenyRequest: (request: JoinRequest) => void;
    profile: { name: string; email: string; photoUrl: string };
    onUpdateProfile: (profile: { name: string; email: string; photoUrl: string }) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    logs = [],
    children,
    caregivers,
    onAddChild,
    onEditChild,
    onLinkGoogle,
    onClearData,
    isGoogleLinked,
    onAddCaregiver, // Still here for backward compatibility if needed, but not used in UI now
    onDeleteCaregiver,
    onUpdateCaregiver,
    onAddCaregiverClick,
    onEditCaregiverClick,
    joinRequests,
    onJoinFamily,
    onApproveRequest,
    onDenyRequest,
    profile: initialProfile,
    onUpdateProfile
}) => {
    const login = useGoogleLogin({
        onSuccess: tokenResponse => {
            onLinkGoogle(tokenResponse.access_token);
        },
        scope: 'https://www.googleapis.com/auth/drive.appdata',
    });

    // --- Persistent State Logic ---
    const [metric, setMetric] = useState(() => localStorage.getItem('sunny_pref_metric') !== 'false');
    const [notifications, setNotifications] = useState(() => localStorage.getItem('sunny_pref_notif') !== 'false');

    const [profile, setProfile] = useState(initialProfile);

    useEffect(() => {
        setProfile(initialProfile);
    }, [initialProfile]);

    const [isEditing, setIsEditing] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [inviteCode] = useState(() => 'BABY-' + Math.random().toString(36).substring(2, 7).toUpperCase());
    const [manualCode, setManualCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
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

        if (newState) {
            handleTestNotification();
        }
    };

    const handleTestNotification = () => {
        if (!("Notification" in window)) {
            showToast('Browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification('✨ SunnyBaby', {
                body: 'Hooray! Notifications are working on your device.',
                icon: '/assets/baby_mascot_clean.png',
            });
        } else {
            showToast('Please allow notification permission first');
        }
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

    const handleInvite = async () => {
        const url = new URL(window.location.origin);
        url.searchParams.set('invite', inviteCode);

        const shareData = {
            title: 'Join my Baby Tracker Family',
            text: `Join me on Baby Tracker to track our little one together!`,
            url: url.toString(),
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showToast('Invite sheet opened!');
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                showToast('Invite copied to clipboard!');
            }
        } catch (err) {
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                showToast('Invite copied to clipboard!');
            } catch (e) {
                showToast('Could not share invite.');
            }
        }
    };

    const handleManualJoin = () => {
        if (!manualCode.trim()) {
            showToast('Please enter a code');
            return;
        }
        onJoinFamily(manualCode.toUpperCase());
        setManualCode('');
        setIsJoining(false);
    };

    const isOwner = profile.email === caregivers.find(c => c.isMain)?.email || caregivers.length === 0;

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(inviteCode);
            showToast('Family code copied!');
        } catch (e) {
            showToast('Failed to copy code');
        }
    };

    return (
        <div className="flex flex-col h-full px-6 pt-10 pb-40 overflow-y-auto">
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

            {/* Family Management */}
            <div className="space-y-4 mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Family & Caregivers</h3>
                <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-slate-800 text-lg">Manage Family</h4>
                            <button
                                onClick={onAddCaregiverClick}
                                className="p-2 bg-yellow-400 text-yellow-950 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                            >
                                <UserPlus size={18} />
                                <span className="text-xs font-black uppercase tracking-wider pr-1">Add Member</span>
                            </button>
                        </div>

                        {caregivers.length === 0 ? (
                            <p className="text-xs text-slate-400 font-bold italic py-4 text-center">No other family members added yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {caregivers.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => onEditCaregiverClick(c)}
                                        className="bg-white/50 p-4 rounded-2xl border border-white/50 group/item transition-all hover:bg-white/80 cursor-pointer active:scale-[0.99]"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img src={c.photoUrl} className="w-12 h-12 rounded-xl border-2 border-white shadow-sm" alt={c.name} />
                                                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/5 rounded-xl transition-colors flex items-center justify-center">
                                                        <Edit2 size={12} className="text-white opacity-0 group-hover/item:opacity-100" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-700">{c.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{c.email}</p>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 bg-slate-100 rounded-lg">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.accessLevel}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-400 italic">"{c.role}"</p>
                                            <div className="text-[9px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 px-2 py-0.5 rounded-md">
                                                Syncing
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
                            {isOwner && joinRequests.length > 0 && (
                                <div className="mb-4 space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pending Requests</h5>
                                    {joinRequests.map(req => (
                                        <div key={req.id} className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-200">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-700">{req.userName}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{req.userEmail}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => onApproveRequest(req)} className="p-2 bg-green-500 text-white rounded-xl shadow-sm active:scale-95 transition-all"><Check size={16} strokeWidth={3} /></button>
                                                <button onClick={() => onDenyRequest(req)} className="p-2 bg-red-500 text-white rounded-xl shadow-sm active:scale-95 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:scale-[0.99] transition-transform shadow-lg" onClick={handleCopyCode}>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Family Code</span>
                                        <code className="text-yellow-400 font-mono text-xl font-black tracking-wider">{inviteCode}</code>
                                    </div>
                                    <Copy size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                                <Button3D variant="primary" fullWidth onClick={handleInvite} className="py-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Share2 size={18} />
                                        <span>Share Invite Link</span>
                                    </div>
                                </Button3D>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100/50">
                                {isJoining ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <input
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            placeholder="ENTER CODE (e.g. BABY-XYZ)"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 focus:outline-none focus:border-yellow-400 transition-all uppercase placeholder:normal-case"
                                        />
                                        <div className="flex gap-2">
                                            <Button3D variant="primary" fullWidth onClick={handleManualJoin} className="py-3">Join Now</Button3D>
                                            <button onClick={() => setIsJoining(false)} className="px-6 text-slate-400 font-black text-xs uppercase">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsJoining(true)}
                                        className="w-full py-4 rounded-2xl border-2 border-slate-100 border-dashed text-slate-400 font-black text-xs uppercase tracking-widest hover:border-slate-200 hover:text-slate-500 transition-all"
                                    >
                                        Join Existing Family
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
                {notifications && (
                    <button onClick={handleTestNotification} className="w-full bg-white/70 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm border border-white flex items-center justify-between active:scale-[0.98] transition-transform hover:bg-white/90">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-yellow-100 text-yellow-500 rounded-xl"><Sparkles size={20} /></div>
                            <span className="font-bold text-slate-700 text-sm">Test Notification</span>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                    </button>
                )}
                <button onClick={() => setIsPrivacyModalOpen(true)} className="w-full bg-white/70 backdrop-blur-sm rounded-[2rem] p-4 shadow-sm border border-white flex items-center justify-between active:scale-[0.98] transition-transform hover:bg-white/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-500 rounded-xl"><FileText size={20} /></div>
                        <span className="font-bold text-slate-700 text-sm">Privacy Policy</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
            </div>

            {/* Privacy Modal */}
            <PrivacyModal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
            />

            {/* Google Link for Guests */}
            {!isGoogleLinked && (
                <div className="mb-6">
                    <Button3D variant="white" fullWidth className="py-4 text-slate-700" onClick={() => login()}>
                        <div className="flex items-center justify-center gap-3">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Link Google Account
                        </div>
                    </Button3D>
                </div>
            )}

            <div className="text-center mt-6 mb-10 space-y-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Version 2026.1.0 • Baby Tracker</p>
                <div className="flex flex-col gap-3 items-center">
                    <button onClick={onClearData} className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-wider bg-slate-50 hover:bg-red-50 px-6 py-3 rounded-full transition-all">Clear All Data</button>
                    <button onClick={() => { if (window.confirm('Are you sure you want to log out? Local data will remain.')) { localStorage.removeItem('sunnyBaby_isLoggedIn'); window.location.reload(); } }} className="inline-flex items-center gap-2 text-red-500 hover:text-white font-black text-xs uppercase tracking-wider bg-red-50 hover:bg-red-500 px-6 py-3 rounded-full transition-all border border-red-100"><LogOut size={14} strokeWidth={3} /> Log Out</button>
                </div>
            </div>
        </div>
    );
};