import React, { useState } from 'react';
import { LogEntry, ActivityType } from '../types';
import { Button3D } from './Button3D';
import { StickyNote, Syringe, Milk, Moon, Baby, Utensils, Ruler, Thermometer, MoreHorizontal, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DiaryProps {
  logs: LogEntry[];
  onAddLog: (entry: Partial<LogEntry>) => void;
}

export const ChildcareDiary: React.FC<DiaryProps> = ({ logs, onAddLog }) => {
  const [noteText, setNoteText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter logs for selected date
  const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === selectedDate.toDateString();
  });

  const changeDate = (days: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + days);
      setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
      return date.toDateString() === new Date().toDateString();
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    // Save note with current timestamp if today, otherwise noon of selected date
    let timestamp = Date.now();
    if (!isToday(selectedDate)) {
        const d = new Date(selectedDate);
        d.setHours(12, 0, 0, 0);
        timestamp = d.getTime();
    }

    onAddLog({
      type: ActivityType.OTHER,
      details: noteText,
      subType: 'Note',
      timestamp: timestamp
    });
    setNoteText('');
    setShowInput(false);
  };

  const getIcon = (type: ActivityType) => {
      switch (type) {
          case ActivityType.NURSING: return <Milk size={18} />;
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
          case ActivityType.FOOD:
            return 'bg-yellow-400 border-yellow-200 text-yellow-800';
          case ActivityType.SLEEP: return 'bg-indigo-400 border-indigo-200 text-indigo-800';
          case ActivityType.DIAPER: return 'bg-orange-400 border-orange-200 text-orange-800';
          case ActivityType.HEALTH: 
          case ActivityType.VACCINE:
            return 'bg-pink-400 border-pink-200 text-pink-800';
          case ActivityType.GROWTH: return 'bg-green-400 border-green-200 text-green-800';
          default: return 'bg-slate-400 border-slate-200 text-slate-800';
      }
  };

  const getBgColor = (type: ActivityType) => {
      switch (type) {
          case ActivityType.NURSING: 
          case ActivityType.BOTTLE:
          case ActivityType.FOOD:
            return 'bg-yellow-50';
          case ActivityType.SLEEP: return 'bg-indigo-50';
          case ActivityType.DIAPER: return 'bg-orange-50';
          case ActivityType.HEALTH: 
          case ActivityType.VACCINE:
            return 'bg-pink-50';
          default: return 'bg-white';
      }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Date Header */}
      <div className="px-6 pt-10 pb-4 bg-white/50 backdrop-blur-sm shadow-sm z-10">
         <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-800">Activity History</h2>
            <div className="p-2 bg-white rounded-full shadow-sm"><Calendar size={20} className="text-slate-500" /></div>
         </div>
         
         <div className="flex items-center justify-between mt-6 bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
             <button onClick={() => changeDate(-1)} className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                <ChevronLeft size={20} />
             </button>
             <div className="text-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                     {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
                 </p>
                 <p className="text-lg font-black text-slate-800">
                     {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                 </p>
             </div>
             <button 
                onClick={() => changeDate(1)} 
                disabled={isToday(selectedDate)}
                className={`p-3 rounded-xl transition-colors ${isToday(selectedDate) ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-50'}`}
             >
                <ChevronRight size={20} />
             </button>
         </div>
      </div>

      <div className="flex-1 px-6 pb-24 overflow-y-auto hide-scrollbar pt-6">
        {!showInput && (
           <Button3D variant="white" onClick={() => setShowInput(true)} className="mb-8 py-3">
             <div className="flex items-center gap-2 text-sm">
               <StickyNote size={18} className="text-slate-400" />
               <span>Add Note for {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString()}</span>
             </div>
           </Button3D>
        )}

        {showInput && (
          <div className="bg-white p-4 rounded-3xl shadow-xl mb-8 animate-in fade-in zoom-in duration-200 border border-slate-100">
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
              rows={3}
              placeholder="Write a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button3D variant="primary" onClick={handleSaveNote} className="flex-1 py-2 text-sm">Save</Button3D>
              <Button3D variant="white" onClick={() => setShowInput(false)} className="py-2 text-sm">Cancel</Button3D>
            </div>
          </div>
        )}

        <div className="space-y-0 relative">
          {/* Continuous Line */}
          <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-slate-200" />

          {filteredLogs.length === 0 && (
            <div className="text-center py-10 opacity-50 pl-8">
              <MoreHorizontal size={48} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-400">No activities on this date.</p>
            </div>
          )}
          
          {filteredLogs.map((log) => (
            <div key={log.id} className="relative pl-12 pb-6 group">
               {/* Timeline Dot */}
               <div className={`absolute left-[10px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${getColor(log.type).split(' ')[0]}`}>
               </div>
               
               <div className={`rounded-2xl p-4 shadow-sm border border-slate-100 transition-all active:scale-[0.98] ${getBgColor(log.type)}`}>
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full bg-white shadow-sm text-slate-600`}>
                           {getIcon(log.type)}
                        </div>
                        <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">
                          {log.type === ActivityType.OTHER && log.subType === 'Note' ? 'Note' : log.type}
                        </span>
                     </div>
                     <span className="text-xs font-bold text-slate-400 bg-white/50 px-2 py-1 rounded-full">
                       {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                     </span>
                  </div>
                  
                  <p className="text-slate-800 font-bold text-lg leading-tight">{log.details}</p>
                  
                  {log.notes && (
                     <div className="mt-2 p-2 bg-white/60 rounded-xl text-xs text-slate-500 font-medium italic border border-black/5 flex items-start gap-1">
                        <span className="not-italic">📝</span> {log.notes}
                     </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
