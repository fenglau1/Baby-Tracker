import React, { useState, useEffect } from 'react';
import { ActivityType, LogEntry } from '../types';
import { Button3D } from './Button3D';
import { Milk, Moon, Baby, Utensils, Syringe, Ruler, Thermometer, MoreHorizontal, X, Clock, FileText, ChevronLeft, Save, Edit3, Pill, AlertCircle } from 'lucide-react';

interface AddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<LogEntry>) => void;
  initialType?: ActivityType | null;
  editEntry?: LogEntry | null;
}

export const AddLogModal: React.FC<AddLogModalProps> = ({ isOpen, onClose, onSave, initialType, editEntry }) => {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [date, setDate] = useState('');
  
  // Generic Value (Duration, Amount, Temp, Weight)
  const [value, setValue] = useState('');
  
  // Specific States
  const [subType, setSubType] = useState(''); // Used for Diaper (Wet/Dirty)
  const [notes, setNotes] = useState('');
  
  // Enhanced Fields
  const [customName, setCustomName] = useState(''); // For Custom/Other
  const [nursingSide, setNursingSide] = useState<'left' | 'right' | 'both'>('left');
  const [bottleContent, setBottleContent] = useState<'formula' | 'breastmilk' | 'cow'>('formula');
  const [foodItem, setFoodItem] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [symptom, setSymptom] = useState('');

  // Preference State
  const [isMetric, setIsMetric] = useState(true);

  // Reset or fill form when opening
  useEffect(() => {
    if (isOpen) {
      // Load Preference
      const pref = localStorage.getItem('sunny_pref_metric');
      setIsMetric(pref !== 'false'); // Default to true if not set

      const targetDate = editEntry ? new Date(editEntry.timestamp) : new Date();
      targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
      setDate(targetDate.toISOString().slice(0, 16));
      
      if (editEntry) {
        setSelectedType(editEntry.type);
        setValue(editEntry.value?.toString() || '');
        setSubType(editEntry.subType || '');
        setNotes(editEntry.notes || '');
        
        // Fill inferred fields
        if (editEntry.type === ActivityType.OTHER) setCustomName(editEntry.details.split(' • ')[0]);
        if (editEntry.type === ActivityType.NURSING) setNursingSide(editEntry.subType as any || 'left');
        if (editEntry.type === ActivityType.BOTTLE) setBottleContent(editEntry.subType as any || 'formula');
        if (editEntry.type === ActivityType.FOOD) setFoodItem(editEntry.details.split(' (')[0]);
        if (editEntry.type === ActivityType.HEALTH) setSymptom(editEntry.details.split(' • ')[0]);
        if (editEntry.type === ActivityType.VACCINE) setVaccineName(editEntry.details);
      } else {
        resetForm();
        if (initialType) {
          setSelectedType(initialType);
        }
      }
    }
  }, [isOpen, initialType, editEntry]);

  const resetForm = () => {
    setSelectedType(null);
    setValue('');
    setSubType('');
    setNotes('');
    setCustomName('');
    setNursingSide('left');
    setBottleContent('formula');
    setFoodItem('');
    setHeight('');
    setHead('');
    setVaccineName('');
    setSymptom('');
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedType) return;
    
    let details = '';
    let finalSubType = subType;

    // Construct readable details based on type and units
    switch (selectedType) {
        case ActivityType.NURSING:
            details = `${nursingSide === 'both' ? 'Both sides' : nursingSide.charAt(0).toUpperCase() + nursingSide.slice(1) + ' side'}`;
            if (value) details += ` • ${value} min`;
            finalSubType = nursingSide;
            break;
        case ActivityType.BOTTLE:
            if (value) details = `${value} ${isMetric ? 'ml' : 'oz'}`;
            details += ` ${bottleContent}`;
            finalSubType = bottleContent;
            break;
        case ActivityType.FOOD:
            details = foodItem || 'Meal';
            if (value) details += ` (${value}${isMetric ? 'g/ml' : 'oz'})`;
            break;
        case ActivityType.DIAPER:
            details = subType || 'Diaper change';
            break;
        case ActivityType.SLEEP:
            details = value ? `${value} min sleep` : 'Sleep';
            break;
        case ActivityType.GROWTH:
            const parts = [];
            if (value) parts.push(`${value} ${isMetric ? 'kg' : 'lb'}`);
            if (height) parts.push(`${height} ${isMetric ? 'cm' : 'in'}`);
            if (head) parts.push(`HC: ${head} ${isMetric ? 'cm' : 'in'}`);
            details = parts.join(' • ') || 'Growth check';
            break;
        case ActivityType.HEALTH:
            details = symptom || 'Health Check';
            if (value) details += ` • ${value}${isMetric ? '°C' : '°F'}`;
            break;
        case ActivityType.VACCINE:
            details = vaccineName || 'Vaccination';
            break;
        case ActivityType.OTHER:
            details = customName || 'Activity';
            if (value) details += ` • ${value}`;
            break;
        default:
            details = notes.slice(0, 20) || 'Activity';
    }

    onSave({
      type: selectedType,
      timestamp: new Date(date).getTime(),
      value: value ? parseFloat(value) : undefined,
      subType: finalSubType,
      details: details,
      notes: notes
    });
    onClose();
  };

  const switchToCustom = () => {
      setSelectedType(ActivityType.OTHER);
      setCustomName('');
  };

  const categories = [
    { type: ActivityType.NURSING, icon: Milk, label: 'Nursing', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    { type: ActivityType.BOTTLE, icon: Milk, label: 'Bottle', color: 'bg-cyan-100 text-cyan-600 border-cyan-200' },
    { type: ActivityType.FOOD, icon: Utensils, label: 'Food', color: 'bg-green-100 text-green-600 border-green-200' },
    { type: ActivityType.DIAPER, icon: Baby, label: 'Diaper', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    { type: ActivityType.SLEEP, icon: Moon, label: 'Sleep', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
    { type: ActivityType.HEALTH, icon: Thermometer, label: 'Health', color: 'bg-pink-100 text-pink-600 border-pink-200' },
    { type: ActivityType.GROWTH, icon: Ruler, label: 'Growth', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    { type: ActivityType.VACCINE, icon: Syringe, label: 'Vaccine', color: 'bg-red-100 text-red-600 border-red-200' },
    { type: ActivityType.OTHER, icon: MoreHorizontal, label: 'Other', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  ];

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-xl font-black text-slate-800">{editEntry ? 'Edit Entry' : 'What do you want to log?'}</h3>
         <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.type}
            onClick={() => setSelectedType(cat.type)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95 shadow-sm ${cat.color}`}
          >
            <cat.icon size={28} className="mb-2" />
            <span className="text-xs font-bold uppercase">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderForm = () => {
    const activeCategory = categories.find(c => c.type === selectedType);
    const isCustom = selectedType === ActivityType.OTHER;
    
    return (
      <div className="space-y-4">
         <div className="flex items-center gap-3 mb-4">
            <button onClick={() => editEntry ? onClose() : setSelectedType(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
               <ChevronLeft size={20} />
            </button>
            <div className={`p-2 rounded-xl ${activeCategory?.color || 'bg-slate-100'}`}>
               {activeCategory ? <activeCategory.icon size={20} /> : <Edit3 size={20} />}
            </div>
            <h3 className="text-xl font-black text-slate-800">{isCustom ? (customName || 'Custom Activity') : activeCategory?.label}</h3>
         </div>

         <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-3 focus-within:ring-2 focus-within:ring-yellow-400">
               <Clock size={20} className="text-slate-400" />
               <input 
                 type="datetime-local" 
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className="bg-transparent w-full text-slate-700 font-bold focus:outline-none"
               />
            </div>

            {isCustom && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-slate-400">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Activity Name</label>
                    <input 
                        type="text" 
                        value={customName} 
                        onChange={e => setCustomName(e.target.value)} 
                        className="w-full bg-transparent text-lg font-bold text-slate-800 focus:outline-none" 
                        placeholder="e.g. Tummy Time" 
                        autoFocus
                    />
                </div>
            )}

            {selectedType === ActivityType.NURSING && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        {(['left', 'right', 'both'] as const).map(side => (
                            <button
                                key={side}
                                onClick={() => setNursingSide(side)}
                                className={`flex-1 py-3 rounded-xl font-bold border-2 capitalize ${nursingSide === side ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                {side}
                            </button>
                        ))}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-yellow-400">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Time (min)</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-transparent text-xl font-black text-slate-800 focus:outline-none" placeholder="0" />
                    </div>
                </div>
            )}

            {selectedType === ActivityType.BOTTLE && (
                 <div className="space-y-3">
                     <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-cyan-400">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Amount ({isMetric ? 'ml' : 'oz'})</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-transparent text-xl font-black text-slate-800 focus:outline-none" placeholder="0" />
                     </div>
                     <div className="flex gap-2">
                        {(['formula', 'breastmilk', 'cow'] as const).map(c => (
                            <button
                                key={c}
                                onClick={() => setBottleContent(c)}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 capitalize ${bottleContent === c ? 'bg-cyan-100 border-cyan-400 text-cyan-800' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                 </div>
            )}

            {selectedType === ActivityType.FOOD && (
                <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-green-400">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">What did baby eat?</label>
                        <input type="text" value={foodItem} onChange={e => setFoodItem(e.target.value)} className="w-full bg-transparent text-lg font-bold text-slate-800 focus:outline-none" placeholder="e.g. Avocado" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-green-400">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Amount ({isMetric ? 'g/ml' : 'oz'}) - Optional</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-transparent text-xl font-black text-slate-800 focus:outline-none" placeholder="0" />
                    </div>
                </div>
            )}

            {selectedType === ActivityType.SLEEP && (
               <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-400">
                 <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Duration (minutes)</label>
                 <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-transparent text-xl font-black text-slate-800 focus:outline-none" placeholder="0" />
               </div>
            )}

             {selectedType === ActivityType.DIAPER && (
               <div className="flex gap-2">
                 {['Wet', 'Dirty', 'Mixed'].map(type => (
                   <button 
                     key={type}
                     onClick={() => setSubType(type)}
                     className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${subType === type ? 'bg-orange-100 border-orange-400 text-orange-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
                   >
                     {type}
                   </button>
                 ))}
               </div>
            )}

            {selectedType === ActivityType.GROWTH && (
                <div className="grid grid-cols-3 gap-3">
                     <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight ({isMetric ? 'kg' : 'lb'})</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-transparent text-lg font-black text-slate-800 focus:outline-none" placeholder="0.0" />
                     </div>
                     <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Height ({isMetric ? 'cm' : 'in'})</label>
                        <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-transparent text-lg font-black text-slate-800 focus:outline-none" placeholder="0.0" />
                     </div>
                     <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Head ({isMetric ? 'cm' : 'in'})</label>
                        <input type="number" value={head} onChange={e => setHead(e.target.value)} className="w-full bg-transparent text-lg font-black text-slate-800 focus:outline-none" placeholder="0.0" />
                     </div>
                </div>
            )}

            {selectedType === ActivityType.HEALTH && (
                <div className="space-y-3">
                     <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-pink-400">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Symptom / Medicine</label>
                        <input type="text" value={symptom} onChange={e => setSymptom(e.target.value)} className="w-full bg-transparent text-lg font-bold text-slate-800 focus:outline-none" placeholder="e.g. Cough or Tylenol" />
                     </div>
                     <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-pink-400">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Temperature ({isMetric ? '°C' : '°F'})</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-transparent text-xl font-black text-slate-800 focus:outline-none" placeholder="--.-" />
                     </div>
                </div>
            )}

            {selectedType === ActivityType.VACCINE && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-red-400">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Vaccine Name</label>
                    <input type="text" value={vaccineName} onChange={e => setVaccineName(e.target.value)} className="w-full bg-transparent text-lg font-bold text-slate-800 focus:outline-none" placeholder="e.g. Rotavirus" />
                </div>
            )}
            
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-start gap-3 focus-within:ring-2 focus-within:ring-yellow-400">
               <FileText size={20} className="text-slate-400 mt-1" />
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 className="bg-transparent w-full text-slate-700 focus:outline-none resize-none"
                 placeholder="Add extra notes..."
                 rows={2}
               />
            </div>

            <div className="flex gap-2 pt-2">
                 <Button3D onClick={handleSave} className="flex-[2] py-4">
                    <div className="flex items-center gap-2">
                        <Save size={20} />
                        <span>{editEntry ? 'Update Entry' : 'Save Record'}</span>
                    </div>
                </Button3D>
                {!isCustom && !editEntry && (
                    <Button3D variant="white" onClick={switchToCustom} className="flex-1 py-4">
                        <div className="flex flex-col items-center leading-none">
                            <Edit3 size={16} className="mb-1" />
                            <span className="text-[10px]">Custom</span>
                        </div>
                    </Button3D>
                )}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />
       <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative transform transition-transform animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto ring-1 ring-black/5">
          {selectedType ? renderForm() : renderTypeSelection()}
       </div>
    </div>
  );
};