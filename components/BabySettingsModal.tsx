import React, { useState, useEffect, useRef } from 'react';
import { Child } from '../types';
import { Button3D } from './Button3D';
import { X, Save, Camera, Check, Trash2, RefreshCw, Upload } from 'lucide-react';

interface BabySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  child?: Child | null; // If null, we are adding a new child
  onSave: (updatedChild: Partial<Child>) => void;
  onDelete?: (id: string) => void;
}

export const BabySettingsModal: React.FC<BabySettingsModalProps> = ({ isOpen, onClose, child, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'boy'|'girl'>('boy');
  const [photoUrl, setPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or Load data
  useEffect(() => {
    if (isOpen) {
      if (child) {
        setName(child.name);
        setDob(child.dob);
        setGender(child.gender);
        setPhotoUrl(child.photoUrl);
      } else {
        // New Child Defaults
        setName('');
        setDob(new Date().toISOString().split('T')[0]);
        setGender('boy');
        setPhotoUrl(`https://picsum.photos/200?random=${Date.now()}`);
      }
    }
  }, [isOpen, child]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      id: child?.id, // undefined if new
      name,
      dob,
      gender,
      photoUrl
    });
    onClose();
  };

  const handleDelete = () => {
      if (child && onDelete && window.confirm(`Are you sure you want to delete ${child.name}'s profile? This cannot be undone.`)) {
          onDelete(child.id);
          onClose();
      }
  };

  const handleRandomPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoUrl(`https://picsum.photos/200?random=${Date.now()}`);
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
                
                // Resize logic: Max 300px dimension
                const maxSize = 300;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.8 quality
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
                {child ? 'Edit Baby' : 'Add Baby'}
             </h2>
             <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
                <X size={20} />
             </button>
          </div>

          <div className="flex flex-col items-center mb-6">
             <div className="relative group cursor-pointer" onClick={triggerFileUpload}>
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 relative">
                    <img src={photoUrl} alt={name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={24} className="text-white drop-shadow-md" />
                    </div>
                </div>
                <div className="absolute bottom-1 right-1 bg-yellow-400 p-2 rounded-full shadow-md text-white border-2 border-white transition-transform active:scale-90">
                    <Camera size={16} />
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
             </div>
             
             <div className="flex gap-4 mt-3">
                 <button 
                    onClick={triggerFileUpload}
                    className="text-xs font-black text-slate-500 uppercase tracking-wide hover:text-yellow-500"
                 >
                    Upload Photo
                 </button>
                 <span className="text-slate-300">|</span>
                 <button 
                    onClick={handleRandomPhoto}
                    className="text-xs font-black text-slate-500 uppercase tracking-wide hover:text-orange-500 flex items-center gap-1"
                 >
                    <RefreshCw size={10} /> Randomize
                 </button>
             </div>
          </div>

          <div className="space-y-4">
             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-yellow-400">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Baby's Name"
                  className="w-full bg-transparent text-lg font-bold text-slate-800 focus:outline-none"
                />
             </div>

             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-yellow-400">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold text-slate-800 focus:outline-none"
                />
             </div>

             <div className="flex gap-2">
               {(['boy', 'girl'] as const).map(g => (
                 <button
                   key={g}
                   onClick={() => setGender(g)}
                   className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all capitalize flex items-center justify-center gap-2 ${gender === g ? 'bg-orange-100 border-orange-400 text-orange-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                 >
                   {gender === g && <Check size={16} />}
                   {g}
                 </button>
               ))}
             </div>
          </div>

          <div className="mt-8 space-y-3">
             <Button3D onClick={handleSave} fullWidth className="py-3">
                 <Save size={20} /> {child ? 'Save Changes' : 'Add Baby'}
             </Button3D>
             
             {child && onDelete && (
                 <button 
                    onClick={handleDelete}
                    className="w-full py-3 text-red-400 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                    <Trash2 size={16} /> Delete Profile
                 </button>
             )}
          </div>
       </div>
    </div>
  );
};