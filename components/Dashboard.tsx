import React, { useEffect, useRef, useMemo } from 'react';
import { ActivityType, Child, LogEntry, VACCINE_SCHEDULE, VaccineAppointment } from '../types';
import { Milk, Baby, Moon, Utensils, Clock, Droplets, ChevronRight, Zap, Syringe, Calendar, Check } from 'lucide-react';
import gsap from 'gsap';

interface DashboardProps {
  child: Child;
  logs: LogEntry[];
  appointments: VaccineAppointment[];
  onAddLog: (entry: Partial<LogEntry>) => void;
  onChildSwitch: () => void;
  onOpenModal: (type?: ActivityType) => void;
  onQuickAdd: (type: ActivityType) => void;
  onNavigate: (view: 'dashboard' | 'analytics' | 'activity' | 'settings') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ child, logs, appointments, onAddLog, onChildSwitch, onOpenModal, onQuickAdd, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.anim-item', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'expo.out'
      });

      gsap.to('.quick-btn', {
        y: -3,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.15
      });
    }, containerRef);
    return () => ctx.revert();
  }, [child.id]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysLogs = logs.filter(l => l.timestamp >= todayStart.getTime());

  const diaperCount = todaysLogs.filter(l => l.type === ActivityType.DIAPER).length;
  const sleepMinutes = todaysLogs.filter(l => l.type === ActivityType.SLEEP).reduce((acc, curr) => acc + (curr.value || 0), 0);
  const feedCount = todaysLogs.filter(l => [ActivityType.NURSING, ActivityType.BOTTLE].includes(l.type)).length;

  const formatTimeElapsed = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (minutes < 1) return 'Just now';
    if (hours >= 24) return Math.floor(hours / 24) + 'd ago';
    if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm';
    return minutes + 'm ago';
  };

  const lastFeed = logs.find(l => [ActivityType.NURSING, ActivityType.BOTTLE, ActivityType.FOOD].includes(l.type));
  const lastDiaper = logs.find(l => l.type === ActivityType.DIAPER);

  const nextVaccine = useMemo(() => {
    const completed = logs.filter(l => l.type === ActivityType.VACCINE).map(l => l.details);
    return VACCINE_SCHEDULE.find(v => !completed.includes(v.name));
  }, [logs]);

  const appointment = useMemo(() => {
    if (!nextVaccine) return null;
    return appointments.find(a => a.vaccineName === nextVaccine.name);
  }, [nextVaccine, appointments]);

  const handleLogVaccineNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextVaccine && window.confirm(`Log "${nextVaccine.name}" as completed now?`)) {
      onAddLog({
        type: ActivityType.VACCINE,
        details: nextVaccine.name,
        timestamp: Date.now(),
        notes: 'Logged directly from dashboard'
      });
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div className="px-8 pt-12 pb-6 anim-item">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="truncate">{child.name} </span>
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full relative shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
              </div>
            </h1>
            <p className="text-slate-400 font-bold text-xs tracking-[0.1em] mt-1 uppercase">
              BIRTHDAY • {new Date(child.dob).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onChildSwitch}
            className="w-16 h-16 rounded-[1.8rem] border-[4px] border-white shadow-2xl overflow-hidden ring-4 ring-yellow-100 transition-all active:scale-90 hover:rotate-12 hover:scale-105"
          >
            <img src={child.photoUrl} alt={child.name} className="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 overflow-y-auto space-y-8 no-scrollbar">
        <div className="grid grid-cols-2 gap-4 anim-item">
          <StatusCard
            label="Last Feed"
            time={lastFeed ? formatTimeElapsed(lastFeed.timestamp) : '--'}
            icon={<Clock size={18} />}
            color="bg-yellow-400"
          />
          <StatusCard
            label="Last Diaper"
            time={lastDiaper ? formatTimeElapsed(lastDiaper.timestamp) : '--'}
            icon={<Droplets size={18} />}
            color="bg-orange-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 anim-item">
          <QuickAction
            onClick={() => onQuickAdd(ActivityType.NURSING)}
            icon={<Milk size={32} />}
            label="Nursing"
            theme="yellow"
          />
          <QuickAction
            onClick={() => onQuickAdd(ActivityType.DIAPER)}
            icon={<Baby size={32} />}
            label="Diaper"
            theme="orange"
          />
          <QuickAction
            onClick={() => onQuickAdd(ActivityType.BOTTLE)}
            icon={<Utensils size={32} />}
            label="Bottle"
            theme="cyan"
          />
          <QuickAction
            onClick={() => onQuickAdd(ActivityType.SLEEP)}
            icon={<Moon size={32} className={child.sleepStartTime ? 'animate-pulse text-yellow-200' : ''} />}
            label={child.sleepStartTime ? 'Wake Up' : 'Sleep'}
            theme={child.sleepStartTime ? 'indigo' : 'pink'}
          />
        </div>

        {nextVaccine && (
          <div className="anim-item">
            <div
              onClick={() => onNavigate('activity')}
              className="w-full bg-gradient-to-br from-red-50 to-white p-5 rounded-[2.5rem] border-2 border-red-100 shadow-sm text-left flex items-center justify-between group transition-all hover:shadow-md cursor-pointer relative"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:scale-110 transition-transform">
                  <Syringe size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    Upcoming Vaccine
                    {appointment && <Calendar size={10} />}
                  </p>
                  <p className="text-slate-800 font-black text-sm leading-tight truncate max-w-[160px]">{nextVaccine.name}</p>
                  <p className="text-slate-400 font-bold text-[10px] mt-1 italic">
                    {appointment ? `Appointment: ${new Date(appointment.plannedDate).toLocaleDateString()}` : `Due at ${nextVaccine.month === 0 ? 'Birth' : nextVaccine.month < 24 ? nextVaccine.month + ' months' : Math.floor(nextVaccine.month / 12) + ' years'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogVaccineNow}
                className="bg-red-500 text-white p-2.5 rounded-2xl shadow-lg active:scale-90 transition-all hover:bg-red-600"
              >
                <Check size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        <div className="anim-item pb-56">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-100 p-1.5 rounded-lg text-yellow-600">
                <Zap size={14} strokeWidth={3} />
              </div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Today's Pulse</h3>
            </div>
            <button onClick={() => onNavigate('analytics')} className="text-[10px] font-black text-orange-500 flex items-center gap-1 uppercase tracking-[0.15em] hover:translate-x-1 transition-transform bg-orange-50 px-3 py-1.5 rounded-full">
              Trends <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatPill count={diaperCount} label="Changes" color="bg-orange-100 text-orange-600" />
            <StatPill count={`${Math.floor(sleepMinutes / 60)}h`} label="Rest" color="bg-indigo-100 text-indigo-600" />
            <StatPill count={feedCount} label="Meals" color="bg-yellow-100 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ label, time, icon, color }: { label: string, time: string, icon: any, color: string }) => (
  <div className="bg-white/60 backdrop-blur-2xl p-4 rounded-[2.2rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col gap-3 transition-all hover:bg-white border border-white">
    <div className={`${color} text-white w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-slate-800 font-black text-base truncate">{time}</p>
    </div>
  </div>
);

const QuickAction = ({ onClick, icon, label, theme }: { onClick: () => void, icon: any, label: string, theme: 'yellow' | 'orange' | 'cyan' | 'pink' | 'indigo' }) => {
  const colors = {
    yellow: "from-yellow-300 to-yellow-500 shadow-yellow-100",
    orange: "from-orange-300 to-orange-500 shadow-orange-100",
    cyan: "from-cyan-300 to-cyan-500 shadow-cyan-100",
    pink: "from-pink-400 to-pink-600 shadow-pink-100",
    indigo: "from-indigo-500 to-purple-600 shadow-indigo-100"
  };
  return (
    <button
      onClick={onClick}
      className={`quick-btn group relative overflow-hidden bg-gradient-to-br ${colors[theme]} rounded-[2.8rem] p-6 shadow-2xl active:scale-90 transition-all text-left h-44 flex flex-col justify-between border-[5px] border-white/40`}
    >
      <div className="absolute -right-10 -top-10 bg-white/20 w-40 h-40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
      <div className="bg-white/30 w-16 h-16 rounded-3xl flex items-center justify-center backdrop-blur-xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-sm text-white">
        {icon}
      </div>
      <div>
        <span className="block text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Quick Log</span>
        <span className="block text-white text-3xl font-black tracking-tighter drop-shadow-xl">{label}</span>
      </div>
    </button>
  );
};

const StatPill = ({ count, label, color }: { count: any, label: string, color: string }) => (
  <div className={`flex flex-col items-center justify-center ${color} py-5 px-2 rounded-[2.5rem] border-2 border-white shadow-sm transition-transform hover:scale-105`}>
    <span className="text-2xl font-black tracking-tighter">{count}</span>
    <span className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-0.5">{label}</span>
  </div>
);
