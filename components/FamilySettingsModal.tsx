import React, { useState, useEffect, useRef } from 'react';
import { Caregiver } from '../types';
import { Button3D } from './Button3D';
import { X, Save, Camera, Check, Trash2, RefreshCw, Upload, Shield, User, Mail } from 'lucide-react';

interface FamilySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    caregiver?: Caregiver | null; // If null, we are adding a new member
    onSave: (updatedCaregiver: Partial<Caregiver>) => void;
    onDelete?: (id: string) => void;
}

export const FamilySettingsModal: React.FC<FamilySettingsModalProps> = ({ isOpen, onClose, caregiver, onSave, onDelete }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [accessLevel, setAccessLevel] = useState<'Owner' | 'Editor' | 'Viewer'>('Editor');
    const [photoUrl, setPhotoUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset or Load data
    useEffect(() => {
        if (isOpen) {
            if (caregiver) {
                setName(caregiver.name);
                setEmail(caregiver.email);
                setRole(caregiver.role);
                setAccessLevel(caregiver.accessLevel);
                setPhotoUrl(caregiver.photoUrl);
            } else {
                // New Member Defaults
                setName('');
                setEmail('');
                setRole('');
                setAccessLevel('Editor');
                setPhotoUrl(`https://picsum.photos/200?u=${Math.random()}`);
            }
        }
    }, [isOpen, caregiver]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim() || !email.trim()) return;

        onSave({
            id: caregiver?.id, // undefined if new
            name,
            email,
            role,
            accessLevel,
            photoUrl
        });
        onClose();
    };

    const handleDelete = () => {
        if (caregiver && onDelete && window.confirm(`Are you sure you want to remove ${caregiver.name} from the family?`)) {
            onDelete(caregiver.id);
            onClose();
        }
    };

    const handleRandomPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPhotoUrl(`https://picsum.photos/200?u=${Math.random()}`);
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
                    setPhotoUrl(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800">
                        {caregiver ? 'Edit Family' : 'Add Member'}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer" onClick={triggerFileUpload}>
                        <div className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-lg overflow-hidden bg-slate-100 relative">
                            <img src={photoUrl} alt={name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={20} className="text-white drop-shadow-md" />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-2 rounded-xl shadow-md text-white border-2 border-white transition-transform active:scale-90">
                            <Camera size={14} />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <button
                        onClick={handleRandomPhoto}
                        className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-yellow-600 flex items-center gap-1 transition-colors"
                    >
                        <RefreshCw size={10} /> Randomize Photo
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 ml-1">Full Name</label>
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Caregiver's Name"
                                className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 ml-1">Google Email</label>
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@gmail.com"
                                className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-100/50 p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                            <Shield size={16} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Access Level</label>
                            <div className="flex gap-1">
                                {(['Viewer', 'Editor', 'Owner'] as const).map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setAccessLevel(level)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${accessLevel === level ? 'bg-slate-800 text-yellow-400 shadow-md' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 ml-1">Role Description</label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. Dad, Grandma, Nanny"
                            className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    <Button3D onClick={handleSave} fullWidth className="py-3.5">
                        <Save size={18} /> <span className="text-sm">{caregiver ? 'Update Member' : 'Add to Family'}</span>
                    </Button3D>

                    {caregiver && onDelete && (
                        <button
                            onClick={handleDelete}
                            className="w-full py-2 text-red-400 font-bold text-xs hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                            <Trash2 size={14} /> Remove Member
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
