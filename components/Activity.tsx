import React, { useState, useRef, useEffect } from 'react';
import { LogEntry, ActivityType, VaccineAppointment } from '../types';
import { Button3D } from './Button3D';
import { StickyNote, Syringe, Milk, Moon, Baby, Utensils, Ruler, Thermometer, MoreHorizontal, ChevronLeft, ChevronRight, Calendar, MapPin, Edit2, Trash2 } from 'lucide-react';
import { VaccinationSchedule } from './VaccinationSchedule';
import gsap from 'gsap';

interface ActivityProps {
  logs: LogEntry[];
  appointments: VaccineAppointment[];
  onAddLog: (entry: Partial<LogEntry>) => void;
  onUpdateAppointment: (name: string, date: string | null) => void;
  onEditLog: (log: LogEntry) => void;
  onDeleteLog: (id: string) => void;
}

export const Activity: React.FC<ActivityProps> = ({ logs, appointments, onAddLog, onUpdateAppointment, onEditLog, onDeleteLog }) => {
  const [noteText, setNoteText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showVaccineGuide, setShowVaccineGuide] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        const cards = containerRef.current.querySelectorAll('.activity-card');
        if (cards.length > 0) {
            gsap.fromTo(cards, 
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'back.out(1.2)', overwrite: 'auto' }
            );
        }
    }
  }, [selectedDate, showVaccineGuide, logs.length]);

  const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === selectedDate.toDateString();
  });

  const changeDate = (days: number) => {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + days);
      
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      if (nextDate > now) return;
      
      setSelectedDate(nextDate);
      setExpandedLogId(null);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
          const [year, month, day] = e.target.value.split('-').map(Number);
          const newDate = new Date(year, month - 1, day);
          setSelectedDate(newDate);
          setExpandedLogId(null);
      }
  };

  const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const jumpToToday = () => {
      setSelectedDate(new Date());
      setExpandedLogId(null);
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isFuture = (date: Date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const now = new Date();
    now.setHours(0,0,0,0);
    return d > now;
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    let timestamp = isToday(selectedDate) ? Date.now() : new Date(selectedDate).setHours(12, 0, 0, 0);

    onAddLog({
      type: ActivityType.OTHER,
      details: noteText,
      subType: 'Note',
      timestamp: timestamp
    });
    setNoteText('');
    setShowInput(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getIcon = (type: ActivityType) => {
      switch (type) {
          case ActivityType.NURSING:
          case ActivityType.BOTTLE: return <Milk size={18} />;
          case ActivityType.FOOD: return <Utensils size={18} />;
          case ActivityType.SLEEP: return <Moon size={18} />;
          case ActivityType.DIAPER: return <Baby size={18} />;
          case ActivityType.HEALTH: return <Thermometer size={18} />;
          case ActivityType.VACCINE: return <Syringe size={18} />;
          case ActivityType.GROWTH: return <Ruler size={18} />;
          default: return <MoreHorizontal size={18} />;
      }
  };

  const getColor = (type: ActivityType) => {
      switch (type) {
          case ActivityType.NURSING: 
          case ActivityType.BOTTLE:
          case ActivityType.FOOD: return 'bg-yellow-400 text-yellow-800';
          case ActivityType.SLEEP: return 'bg-indigo-400 text-indigo-800';
          case ActivityType.DIAPER: return 'bg-orange-400 text-orange-800';
          case ActivityType.HEALTH: 
          case ActivityType.VACCINE: return 'bg-red-400 text-red-800';
          case ActivityType.GROWTH: return 'bg-green-400 text-green-800';
          default: return 'bg-slate-400 text-slate-800';
      }
  };

  const getBgColor = (type: ActivityType) => {
      switch (type) {
          case ActivityType.NURSING: 
          case ActivityType.BOTTLE:
          case ActivityType.FOOD: return 'bg-yellow-50/80';
          case ActivityType.SLEEP: return 'bg-indigo-50/80';
          case ActivityType.DIAPER: return 'bg-orange-50/80';
          case ActivityType.HEALTH: 
          case ActivityType.VACCINE: return 'bg-red-50/80';
          default: return 'bg-white/80';
      }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      const logToDelete = logs.find(l => l.id === id);
      const logDetails = logToDelete ? `${logToDelete.type}: ${logToDelete.details.substring(0, 30)}${logToDelete.details.length > 30 ? '...' : ''}` : 'this entry';
      
      // Create custom confirmation modal
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-6';
      confirmDialog.innerHTML = `
        <div class="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-red-100" id="delete-confirm">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-800">Delete Entry?</h3>
              <p class="text-sm text-slate-600 font-medium">"${logDetails}"</p>
            </div>
          </div>
          <p class="text-slate-500 text-sm mb-6 font-medium">This action cannot be undone. The entry will be permanently removed.</p>
          <div class="flex gap-3">
            <button id="cancel-delete" class="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-sm hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button id="confirm-delete" class="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-sm hover:bg-red-600 transition-colors shadow-lg">
              Delete Forever
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmDialog);
      
      // Animate entrance
      gsap.from('#delete-confirm', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
      
      const handleCancel = () => {
        gsap.to(confirmDialog, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => confirmDialog.remove()
        });
      };
      
      const handleConfirm = () => {
        // Add visual feedback during deletion
        const element = document.querySelector(`[data-log-id="${id}"]`);
        if (element) {
            gsap.to(element, {
                scale: 0.8,
                opacity: 0,
                duration: 0.3,
                ease: "back.in(1.7)",
                onComplete: () => {
                    onDeleteLog(id);
                    if (expandedLogId === id) setExpandedLogId(null);
                }
            });
        } else {
            onDeleteLog(id);
            if (expandedLogId === id) setExpandedLogId(null);
        }
        
        gsap.to(confirmDialog, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => confirmDialog.remove()
        });
      };
      
      document.getElementById('cancel-delete')?.addEventListener('click', handleCancel);
      document.getElementById('confirm-delete')?.addEventListener('click', handleConfirm);
      confirmDialog.addEventListener('click', (e) => {
        if (e.target === confirmDialog) handleCancel();
      });
  };

  const handleOpenPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current?.click();
      }
    } catch (err) {
      dateInputRef.current?.click();
    }
  };

  if (showVaccineGuide) {
      return (
        <div className="flex flex-col h-full overflow-hidden px-6 pt-10 pb-40">
           <VaccinationSchedule logs={logs} appointments={appointments} onAddLog={onAddLog} onUpdateAppointment={onUpdateAppointment} onClose={() => setShowVaccineGuide(false)} />
        </div>
      );
  }

  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(selectedDate.getDate() + 1);
  const isTomorrowFuture = isFuture(tomorrow);

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={containerRef}>
      <div className="px-6 pt-12 pb-4 bg-white/40 backdrop-blur-3xl shadow-sm z-10 border-b border-white/50">
         <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Diary</h2>
            <div className="flex items-center gap-2">
                {!isToday(selectedDate) && (
                    <button 
                        onClick={jumpToToday}
                        className="bg-yellow-400 text-yellow-950 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-200 active:scale-90 transition-transform"
                    >
                        Today
                    </button>
                )}
                <div className="flex gap-1 bg-white/80 p-1 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => setShowVaccineGuide(true)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Syringe size={20} strokeWidth={3} />
                    </button>
                    <div 
                      className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={handleOpenPicker}
                    >
                        <Calendar size={20} strokeWidth={3} />
                        <input 
                            ref={dateInputRef}
                            type="date" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20 pointer-events-auto block"
                            onChange={handleDateSelect}
                            max={new Date().toISOString().split('T')[0]}
                            value={formatDateForInput(selectedDate)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            </div>
         </div>
         
         <div className="flex items-center justify-between mt-4 bg-white/80 backdrop-blur-md rounded-[2rem] p-1.5 shadow-sm border border-white">
             <button onClick={() => changeDate(-1)} className="p-4 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors">
                <ChevronLeft size={20} />
             </button>
             <div className="text-center flex-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                     {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
                 </p>
                 <p className="text-lg font-black text-slate-800 tracking-tight leading-none">
                    {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                 </p>
             </div>
             <button 
                onClick={() => changeDate(1)} 
                disabled={isTomorrowFuture}
                className={`p-4 rounded-2xl transition-colors ${isTomorrowFuture ? 'text-slate-100 cursor-not-allowed opacity-30' : 'text-slate-400 hover:bg-slate-50'}`}
             >
                <ChevronRight size={20} />
             </button>
         </div>
      </div>

      <div className="flex-1 px-6 pb-40 overflow-y-auto pt-6 space-y-4 no-scrollbar">
        {!showInput && (
           <Button3D variant="white" onClick={() => setShowInput(true)} className="py-4 border-dashed border-2">
             <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500">
               <StickyNote size={18} className="text-yellow-500" />
               <span>Add Note for {isToday(selectedDate) ? 'Today' : 'this date'}</span>
             </div>
           </Button3D>
        )}

        {showInput && (
          <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl border border-yellow-100 animate-in slide-in-from-top duration-300">
            <textarea
              className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-4 text-slate-700 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 font-bold placeholder:text-slate-300 transition-all"
              rows={3}
              placeholder="What happened today?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <Button3D variant="primary" onClick={handleSaveNote} className="flex-1 py-3 text-sm">Save</Button3D>
              <button onClick={() => setShowInput(false)} className="px-6 py-3 text-slate-400 font-bold text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3 relative min-h-[300px]">
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border-2 border-slate-50 animate-float">
                  <Calendar size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-800 font-black text-xl tracking-tight">Quiet day!</p>
              <p className="text-slate-400 font-bold text-sm">Tap the big + to add something.</p>
            </div>
          )}
          
          {filteredLogs.sort((a,b) => b.timestamp - a.timestamp).map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
                <div 
                    key={log.id} 
                    data-log-id={log.id}
                    onClick={() => toggleExpand(log.id)}
                    className={`activity-card group relative rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border-2 transition-all cursor-pointer ${isExpanded ? 'bg-white border-yellow-200 shadow-xl scale-[1.02]' : getBgColor(log.type) + ' border-white hover:border-slate-100'}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`${getColor(log.type)} w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5`}>
                                {getIcon(log.type)}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                    {log.type === ActivityType.OTHER && log.subType === 'Note' ? 'Milestone' : log.type}
                                </p>
                                <p className="text-slate-800 font-black text-lg leading-none tracking-tight">
                                    {log.details}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] font-black text-slate-400 bg-white/80 px-2 py-1 rounded-lg border border-black/5">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                            </span>
                            {!isExpanded && (
                                <button
                                    onClick={(e) => handleDelete(e, log.id)}
                                    className="opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200 border border-red-200 shadow-sm"
                                    title="Quick delete"
                                >
                                    <Trash2 size={12} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
                            {log.notes && (
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <StickyNote size={12} /> Detailed Notes
                                    </p>
                                    <p className="text-slate-700 font-bold text-sm leading-relaxed italic">"{log.notes}"</p>
                                </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                                {log.value && (
                                    <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-xs font-black text-slate-600">
                                        Value: <span className="text-orange-500">{log.value}</span>
                                    </div>
                                )}
                                {log.subType && (
                                    <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-xs font-black text-slate-600">
                                        Type: <span className="text-indigo-500">{log.subType}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onEditLog(log); }}
                                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 py-2 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-lg hover:from-yellow-500 hover:to-yellow-600 hover:-translate-y-0.5 border border-yellow-300"
                                >
                                    <Edit2 size={13} /> Edit
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => handleDelete(e, log.id)}
                                  className="flex-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-500 py-2 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 hover:from-red-50 hover:to-red-100 hover:text-red-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all border border-slate-300 hover:border-red-300 group"
                                >
                                    <Trash2 size={13} className="group-hover:animate-bounce" /> Delete
                                </button>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                                <span className="flex items-center gap-1 opacity-60"><MapPin size={10} /> Home</span>
                                <span className="text-slate-300">Tap to close</span>
                            </div>
                        </div>
                    )}
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};