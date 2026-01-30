import React, { useRef, useEffect } from 'react';
import { LogEntry, ActivityType } from '../types';

interface TimeBarProps {
  logs: LogEntry[];
}

export const TimeBar: React.FC<TimeBarProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 24 hours for the current day
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    // Scroll to current hour on mount so "Now" is centered
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      // Width of hour block (w-20 = 80px)
      // We want the current hour marker (middle of the block) to be in the center of the screen
      // Screen Width / 2  -  Block Width / 2
      const blockWidth = 80;
      const scrollPos = (currentHour * blockWidth) + (blockWidth / 2) - (window.innerWidth / 2) + 16; // 16 is approx padding adj
      scrollRef.current.scrollLeft = scrollPos;
    }
  }, []);

  const getIconColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.NURSING:
      case ActivityType.BOTTLE:
      case ActivityType.FOOD:
          return 'bg-yellow-400';
      case ActivityType.SLEEP: return 'bg-indigo-400';
      case ActivityType.DIAPER: return 'bg-orange-400';
      case ActivityType.HEALTH:
      case ActivityType.VACCINE: 
          return 'bg-pink-400';
      default: return 'bg-slate-300';
    }
  };

  const getLogsForHour = (hour: number) => {
    return logs.filter(log => {
      const date = new Date(log.timestamp);
      return date.getHours() === hour && date.getDate() === new Date().getDate();
    });
  };

  const formatHour = (hour: number) => {
      if (hour === 0) return '12 AM';
      if (hour === 12) return '12 PM';
      return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="w-full bg-white/40 backdrop-blur-sm py-4 overflow-hidden border-b border-white/50 relative">
      
      {/* Current Time Indicator (Red Line) - Absolute center of the current hour logic handled by scroll, but visually we place it in the scroll container or fixed?
          If we want it to move with scroll, it must be in the scroll container.
      */}
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto px-[50vw] hide-scrollbar snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {hours.map(hour => {
          const hourLogs = getLogsForHour(hour);
          const currentHour = new Date().getHours();
          const isCurrentHour = currentHour === hour;
          const isPast = hour < currentHour;

          return (
            <div key={hour} className="flex-shrink-0 w-20 flex flex-col items-center gap-3 snap-center relative">
              
              {/* Hour Label */}
              <span className={`text-[10px] font-bold tracking-wider uppercase ${isCurrentHour ? 'text-slate-800' : 'text-slate-400'}`}>
                {formatHour(hour)}
              </span>
              
              {/* Tick Mark */}
              <div className="relative flex justify-center w-full h-8">
                  {/* The Line */}
                  <div className={`w-0.5 h-full rounded-full ${isCurrentHour ? 'bg-slate-800 h-10 -mt-1' : 'bg-slate-200'}`}></div>
                  
                  {/* Current Time Indicator Dot (Only for current hour) */}
                  {isCurrentHour && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm z-20 animate-pulse"></div>
                  )}
              </div>

              {/* Log Indicators */}
              <div className="flex flex-wrap justify-center gap-1 w-16 h-8 content-start">
                 {hourLogs.slice(0, 6).map((log, idx) => (
                    <div 
                        key={log.id} 
                        className={`w-2 h-2 rounded-full border border-white/50 shadow-sm ${getIconColor(log.type)}`}
                        title={`${log.type} at ${new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                    />
                 ))}
                 {hourLogs.length > 6 && (
                     <div className="w-2 h-2 rounded-full bg-slate-200 flex items-center justify-center text-[4px] font-bold text-slate-500 border border-white/50">
                         +
                     </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Decorative gradient fade on sides */}
      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-white/30 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/30 to-transparent pointer-events-none"></div>
    </div>
  );
};
