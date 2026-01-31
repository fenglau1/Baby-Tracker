import React, { useRef, useEffect } from 'react';
import { Button3D } from './Button3D';
import babyMascot from '../assets/baby_mascot_clean-removebg-preview.png';
import { useGoogleLogin } from '@react-oauth/google';
import gsap from 'gsap';

interface LoginProps {
   onLogin: (token?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
   const login = useGoogleLogin({
      onSuccess: tokenResponse => {
         onLogin(tokenResponse.access_token);
      },
      scope: 'https://www.googleapis.com/auth/drive.appdata',
   });

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

            <div className="space-y-6">
               <Button3D variant="white" fullWidth onClick={() => login()} className="py-5 text-slate-700">
                  <div className="flex items-center justify-center gap-4">
                     <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                           <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                           <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                           <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                           <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                     </div>
                     <span className="font-black tracking-tight">Sign in with Google</span>
                  </div>
               </Button3D>

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
      </div>
   );
};
