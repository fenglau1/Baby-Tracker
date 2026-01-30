import React from 'react';
import { X, Shield, Lock, EyeOff, Database, Cloud } from 'lucide-react';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 ring-1 ring-black/5 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Privacy</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 no-scrollbar">
                    <section className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                            <Database size={16} className="text-blue-500" />
                            <h3>Local-First Security</h3>
                        </div>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed">
                            Your baby's data is stored primarily on your device. We use an encrypted local database (Dexie.js) to ensure your records are accessible even offline.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                            <Cloud size={16} className="text-blue-500" />
                            <h3>Private Cloud Sync</h3>
                        </div>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed">
                            When you enable Google Drive sync, your data is stored in the **App Data Folder**. This is a private space that only this app can see—not even you can browse it via the regular Google Drive UI.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                            <EyeOff size={16} className="text-blue-500" />
                            <h3>No Third-Parties</h3>
                        </div>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed">
                            We do not track you, sell your data, or use third-party analytics. Your family's journey is strictly your own.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                            <Lock size={16} className="text-blue-500" />
                            <h3>Encryption</h3>
                        </div>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed">
                            All communications between your device and Google Drive are handled over secure, encrypted SSL channels.
                        </p>
                    </section>
                </div>

                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 text-white py-4 rounded-[1.5rem] font-black tracking-tight hover:bg-slate-700 active:scale-95 transition-all shadow-lg"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
};
