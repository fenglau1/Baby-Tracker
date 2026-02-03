import React, { useRef, useEffect } from 'react';
import { Button3D } from './Button3D';
import babyMascot from '../assets/baby_mascot_clean-removebg-preview.png';
import gsap from 'gsap';

interface LoginProps {
   onLogin: (username: string, password: string, remember: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
   const [username, setUsername] = React.useState('');
   const [password, setPassword] = React.useState('');
   const [remember, setRemember] = React.useState(true);
   const [error, setError] = React.useState<string | null>(null);
   const [isLoading, setIsLoading] = React.useState(false);

   const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username || !password) {
         setError('Please enter both username and password');
         return;
      }
      setIsLoading(true);
      setError(null);
      // We pass back the values to App.tsx which handles the actual Appwrite call
      onLogin(username, password, remember);
      // Loading will be handled by App.tsx redirect/failure
   };

   return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center p-6 relative overflow-hidden">
         {/* Animated Playful Pop Background Blobs */}
         <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-yellow-200 rounded-full opacity-20 filter blur-3xl animate-blob"></div>
            <div className="absolute top-[10%] right-[-5%] w-[50%] h-[50%] bg-orange-200 rounded-full opacity-20 filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-15%] left-[20%] w-[65%] h-[65%] bg-pink-200 rounded-full opacity-20 filter blur-3xl animate-blob animation-delay-4000"></div>
            <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-100 rounded-full opacity-10 filter blur-2xl animate-blob animation-delay-6000"></div>
         </div>

         <div className="relative z-10 bg-white p-10 rounded-[4rem] shadow-2xl w-full max-w-sm text-center border-4 border-white">
            <div className="mb-10 flex justify-center">
               <div className="w-42 h-42 relative group cursor-pointer">
                  {/* Outer Glow */}
                  <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full scale-120 group-hover:scale-125 transition-transform" />
                  <img
                     src={babyMascot}
                     alt="SunnyBaby Mascot"
                     className="w-full h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
               </div>
            </div>

            <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tighter">Baby Tracker</h1>
            <p className="text-slate-600 font-bold mb-10 leading-relaxed">
               Cherish every tiny step. <br />
               <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">All in one place.</span>
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
               {error && (
                  <div className="bg-red-50 text-red-600 text-[10px] font-black uppercase p-3 rounded-2xl animate-in shake-in duration-300">
                     ⚠️ {error}
                  </div>
               )}

               <div className="space-y-2">
                  <input
                     type="text"
                     placeholder="Username"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-300"
                  />
                  <input
                     type="password"
                     placeholder="Password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-300"
                  />
               </div>

               <div className="flex items-center justify-between px-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <div className="relative">
                        <input
                           type="checkbox"
                           checked={remember}
                           onChange={(e) => setRemember(e.target.checked)}
                           className="peer sr-only"
                        />
                        <div className="w-5 h-5 border-2 border-slate-200 rounded-lg group-hover:border-yellow-400 transition-colors peer-checked:bg-yellow-400 peer-checked:border-yellow-400"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                           <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path d="M5 13l4 4L19 7" />
                           </svg>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remember Me</span>
                  </label>
               </div>

               <Button3D variant="primary" fullWidth type="submit" disabled={isLoading} className="py-5 text-white">
                  <div className="flex items-center justify-center gap-4">
                     <span className="font-black tracking-tight uppercase">
                        {isLoading ? 'Signing In...' : 'Sign In'}
                     </span>
                  </div>
               </Button3D>
            </form>

            <div className="flex flex-col items-center gap-2 opacity-40">
               <div className="flex gap-4">

                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
               </div>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] px-4">
                  Private • Secure • Synced
               </p>
            </div>
         </div>
      </div>
   );
};
