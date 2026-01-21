import React from 'react';
import { Clock, Plus, X } from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';

const AvailabilityEditor = ({ availability = {}, onChange }) => {
    const addSlot = (day) => {
        const currentSlots = availability[day] || [];
        onChange({ ...availability, [day]: [...currentSlots, { start: "09:00", end: "13:00" }] });
    };
    const removeSlot = (day, index) => {
        const currentSlots = availability[day] || [];
        onChange({ ...availability, [day]: currentSlots.filter((_, i) => i !== index) });
    };
    const updateSlot = (day, index, field, value) => {
        const currentSlots = availability[day] || [];
        onChange({ ...availability, [day]: currentSlots.map((slot, i) => i === index ? { ...slot, [field]: value } : slot) });
    };

    return (
        <div className="space-y-4 border p-4 rounded-xl bg-slate-50/50 backdrop-blur-sm shadow-inner">
            <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-wider"><Clock size={16}/> Weekly Schedule</h4>
            {DAYS_OF_WEEK.map(day => {
                const slots = availability[day] || [];
                return (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-4 text-sm border-b border-slate-200 pb-2 last:border-0">
                        <div className="w-28 pt-2 font-semibold text-slate-800">{day}</div>
                        <div className="flex-1 space-y-2">
                            {slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input type="time" value={slot.start} onChange={(e) => updateSlot(day, idx, 'start', e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-2 ring-blue-500 outline-none" />
                                    <span className="text-slate-400 text-xs">to</span>
                                    <input type="time" value={slot.end} onChange={(e) => updateSlot(day, idx, 'end', e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-2 ring-blue-500 outline-none" />
                                    <button type="button" onClick={() => removeSlot(day, idx)} className="text-red-500 hover:text-red-700 p-1"><X size={14}/></button>
                                </div>
                            ))}
                            {slots.length === 0 && <span className="text-xs text-slate-400 italic pt-2 block">Unavailable</span>}
                            <button type="button" onClick={() => addSlot(day)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1"><Plus size={12}/> Add Slot</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AvailabilityEditor;
