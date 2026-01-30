import React, { useState, useEffect, useRef } from 'react';
import { Button3D } from './Button3D';
import { Sun, BarChart2, Baby, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Child } from '../types';
import gsap from 'gsap';

interface OnboardingProps {
  onComplete: (childData: Partial<Child>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [dob, setDob] = useState(new Date().toISOString().split('T')[0]);
  
  const stepRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      icon: <Sun size={64} className="text-yellow-500" />,
      title: "Hello Sunshine!",
      desc: "Welcome to SunnyBaby. Tracking your little ray of light just became the highlight of your day. 🌞",
      action: "Let's Start!",
      canSkip: true
    },
    {
      icon: <BarChart2 size={64} className="text-indigo-500" />,
      title: "Smart Insights",
      desc: "Instant logs, beautiful charts, and one-handed magic. We take care of the data, you enjoy the moments. 📈",
      action: "Awesome!",
      canSkip: true
    },
    {
      icon: <Sparkles size={64} className="text-orange-500" />,
      title: "Tell us about Baby",
      desc: "Quickly set up your first profile. You can always add more babies later in Settings! ✨",
      isForm: true,
      action: "Launch App!",
      canSkip: false
    }
  ];

  useEffect(() => {
    if (stepRef.current) {
      gsap.fromTo(stepRef.current, 
        { opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }, 
        { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out' }
      );
    }
    if (iconRef.current) {
        gsap.fromTo(iconRef.current,
            { scale: 0, rotation: -180 },
            { scale: 1, rotation: 0, duration: 1, ease: 'back.out(2)' }
        );
    }
  }, [step]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    setStep(steps.length - 1); 
  };

  const handleFinish = () => {
    onComplete({
      name: name.trim() || 'My Baby',
      gender,
      dob: dob || new Date().toISOString().split('T')[0],
      photoUrl: `https://picsum.photos/200?random=${Date.now()}`
    });
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[100] bg-[#fffaf0] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      
      {/* Immersive background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-yellow-200/40 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-orange-200/30 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Progress Indicator */}
      <div className="flex gap-2 mb-10 z-10">
        {steps.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-2 rounded-full transition-all duration-700 ${idx === step ? 'w-12 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'w-2 bg-slate-200'}`} 
          />
        ))}
      </div>

      <div ref={stepRef} className="w-full max-w-sm bg-white/60 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-white relative z-10 ring-1 ring-white/20">
        
        {currentStep.canSkip && (
            <button 
                onClick={handleSkip}
                className="absolute top-8 right-8 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-orange-500 transition-colors"
            >
                Skip
            </button>
        )}

        <div className="flex flex-col items-center gap-10 mb-10">
          <div ref={iconRef} className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.05)] border-2 border-orange-50 text-orange-500">
            {currentStep.icon}
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-800 leading-none tracking-tighter">
              {currentStep.title}
            </h1>
            <p className="text-slate-500 font-bold leading-relaxed text-base px-2">
              {currentStep.desc}
            </p>
          </div>
        </div>

        {currentStep.isForm && (
          <div className="space-y-4 mb-10 text-left">
             <div className="bg-slate-50/50 p-4 rounded-3xl border-2 border-slate-100 focus-within:border-yellow-400 focus-within:bg-white transition-all shadow-sm">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Baby's Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leo, Mia, Sky..."
                  className="w-full text-xl font-black text-slate-800 focus:outline-none placeholder:text-slate-200 bg-transparent"
                  autoFocus
                />
             </div>
             
             <div className="bg-slate-50/50 p-4 rounded-3xl border-2 border-slate-100 focus-within:border-yellow-400 focus-within:bg-white transition-all shadow-sm">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Birthday</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-lg font-black text-slate-800 focus:outline-none bg-transparent"
                />
             </div>

             <div className="flex gap-2">
               {(['boy', 'girl'] as const).map(g => (
                 <button
                   key={g}
                   onClick={() => setGender(g)}
                   className={`flex-1 py-4 rounded-2xl font-black border-2 transition-all capitalize flex items-center justify-center gap-2 ${gender === g ? 'bg-orange-100 border-orange-400 text-orange-700 shadow-xl shadow-orange-100' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                 >
                   {gender === g ? <Check size={18} strokeWidth={3} /> : null}
                   {g}
                 </button>
               ))}
             </div>
          </div>
        )}

        <Button3D 
          onClick={handleNext} 
          fullWidth 
          variant={currentStep.isForm ? 'primary' : 'accent'}
          className="h-16 text-lg shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)]"
          disabled={currentStep.isForm && !name.trim()}
        >
          <span className="flex items-center gap-2">
            {currentStep.action} 
            {!currentStep.isForm && <ArrowRight size={22} strokeWidth={3} />}
          </span>
        </Button3D>
      </div>
    </div>
  );
};