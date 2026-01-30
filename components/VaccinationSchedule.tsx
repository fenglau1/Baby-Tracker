import React, { useRef, useState } from 'react';
import { VACCINE_SCHEDULE, ActivityType, LogEntry, VaccineAppointment } from '../types';
import { CheckCircle2, Circle, Syringe, ChevronRight, Info, Plus, Calendar } from 'lucide-react';

interface VaccinationScheduleProps {
  logs: LogEntry[];
  appointments: VaccineAppointment[];
  onAddLog: (entry: Partial<LogEntry>) => void;
  onUpdateAppointment: (name: string, date: string | null) => void;
  onClose: () => void;
}

export const VaccinationSchedule: React.FC<VaccinationScheduleProps> = ({ logs, appointments, onAddLog, onUpdateAppointment, onClose }) => {
  const [activeVaccine, setActiveVaccine] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const completedVaccines = logs
    .filter(l => l.type === ActivityType.VACCINE)
    .map(l => l.details);

  const toggleVaccine = (vaccineName: string) => {
    if (completedVaccines.includes(vaccineName)) {
        if (window.confirm(`"${vaccineName}" is already logged. Record another dose?`)) {
          onAddLog({
              type: ActivityType.VACCINE,
              details: vaccineName,
              timestamp: Date.now(),
              notes: 'Additional dose administered'
          });
        }
        return;
    }
    
    onAddLog({
        type: ActivityType.VACCINE,
        details: vaccineName,
        timestamp: Date.now(),
        notes: 'Administered as per National Immunisation Schedule'
    });
  };

  const handleApptChange = (vaccineName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
        onUpdateAppointment(vaccineName, e.target.value);
    }
  };

  const formatAge = (months: number) => {
    if (months === 0) return 'Birth';
    if (months < 24) return `${months} Months`;
    return `${Math.floor(months / 12)} Years`;
  };

  const groupedSchedule = VACCINE_SCHEDULE.reduce((acc, curr) => {
    const key = curr.month;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr.name);
    return acc;
  }, {} as Record<number, string[]>);

  const sortedMonths = Object.keys(groupedSchedule).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-3xl p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2.5 rounded-2xl text-white shadow-lg shadow-red-200">
                <Syringe size={24} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 leading-none">Vaccine Tracker</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Immunisation Schedule</p>
            </div>
        </div>
        <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
            <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-12 pr-1 no-scrollbar">
        {sortedMonths.map((month) => (
          <div key={month} className="space-y-3">
             <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">{formatAge(month)}</span>
                <div className="flex-1 h-px bg-slate-100"></div>
             </div>
             <div className="grid gap-2">
                {groupedSchedule[month].map(v => {
                   const isDone = completedVaccines.includes(v);
                   const appt = appointments.find(a => a.vaccineName === v);
                   return (
                     <div key={v} className="relative">
                       <button 
                          onClick={() => toggleVaccine(v)}
                          className={`w-full flex items-center justify-between p-4 rounded-3xl border-2 transition-all active:scale-95 group ${isDone ? 'bg-green-50 border-green-100 text-green-700' : 'bg-white border-slate-100 text-slate-600 hover:border-red-200'}`}
                       >
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500'}`}>
                                {isDone ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                              </div>
                              <div className="text-left pr-10">
                                <span className="block font-bold text-sm leading-tight">{v}</span>
                                {appt && !isDone && (
                                  <span className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                    <Calendar size={10} /> Appt: {new Date(appt.plannedDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                          </div>
                       </button>
                       {!isDone && (
                         <div 
                           className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center cursor-pointer pointer-events-auto"
                           onClick={(e) => { e.stopPropagation(); inputRefs.current[v]?.showPicker?.(); }}
                         >
                            <Calendar size={20} className="text-slate-300 pointer-events-none" />
                            <input 
                              ref={(el) => { inputRefs.current[v] = el; }}
                              type="date" 
                              onChange={(e) => handleApptChange(v, e)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20 pointer-events-auto block"
                            />
                         </div>
                       )}
                     </div>
                   );
                })}
             </div>
          </div>
        ))}
        
        <div className="bg-orange-50 p-5 rounded-[2rem] flex gap-4 items-start border-2 border-white shadow-sm">
            <div className="bg-orange-400 p-2 rounded-xl text-white">
                <Info size={18} />
            </div>
            <div>
                <p className="text-[11px] font-black text-orange-800 uppercase tracking-tight mb-1">Health Note</p>
                <p className="text-[10px] font-bold text-orange-700/80 leading-relaxed uppercase tracking-tight">
                    Visit your pediatrician regularly for updates. Keep your records updated for safe growth.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};