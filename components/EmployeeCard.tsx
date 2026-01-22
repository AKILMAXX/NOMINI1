
import React, { useState, useRef, useEffect } from 'react';
import { Employee, EmployeeStatus, DayStatus } from '../types';
import { DAYS_SHORT } from '../constants';
import { calculateLiquidation, formatCurrency, calculateSeniority } from '../utils';

interface EmployeeCardProps {
  employee: Employee;
  attendance: DayStatus[];
  extraHours: number;
  status: EmployeeStatus;
  suspensionEndDate?: string;
  onAttendanceChange: (index: number) => void;
  onExtraHoursChange: (delta: number) => void;
  onStatusChange: (status: EmployeeStatus) => void;
  onCardClick: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  attendance,
  extraHours,
  status,
  suspensionEndDate,
  onAttendanceChange,
  onExtraHoursChange,
  onStatusChange,
  onCardClick
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const dailyRate = employee.baseWeeklySalary / 6;
  const hourlyRate = dailyRate / 8;
  const extraHourRate = hourlyRate * 1.5;
  
  const basePay = attendance.reduce((acc, day) => {
    if (day === 'worked') return acc + dailyRate;
    if (day === 'holiday') return acc + (dailyRate * 2);
    return acc;
  }, 0);

  const extraPay = extraHours * extraHourRate;
  const totalPayout = status === 'Suspendido' ? 0 : (basePay + extraPay + employee.weeklyBonus);

  const { years, months, days } = calculateSeniority(employee.hireDate);
  const liquidation = calculateLiquidation(employee.baseWeeklySalary, employee.hireDate, status, basePay);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDayStyle = (dayStatus: DayStatus) => {
    switch (dayStatus) {
      case 'worked':
        return 'bg-electric text-white shadow-lg shadow-electric/20';
      case 'holiday':
        return 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/50';
      case 'absent':
      default:
        return 'bg-white/5 text-slate-600 border border-white/5 hover:text-slate-400';
    }
  };

  return (
    <div 
      className={`transition-all duration-500 rounded-[2.5rem] p-7 group relative shadow-lg hover:shadow-2xl cursor-pointer overflow-hidden border ${
        status === 'Activo' ? 'bg-charcoal border-white/5' : 
        status === 'Suspendido' ? 'bg-charcoal border-amber-500/20' : 
        'bg-charcoal/40 border-crimson/20 grayscale'
      }`} 
      onClick={(e) => {
        if (contextMenuRef.current?.contains(e.target as Node)) return;
        onCardClick();
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-electric/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-electric/10 transition-all"></div>

      <div className="flex justify-between items-start relative z-30">
        <div className="flex gap-5">
          <div className="relative">
            <img 
              src={employee.avatarUrl} 
              alt={employee.name} 
              className={`w-16 h-16 rounded-[1.25rem] border border-white/10 object-cover shadow-inner ${status === 'Suspendido' ? 'grayscale-0' : ''}`}
            />
            {status !== 'Activo' && (
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-charcoal ${status === 'Suspendido' ? 'bg-amber-500' : 'bg-crimson'}`}>
                <span className="material-symbols-outlined text-[12px] text-white">
                  {status === 'Suspendido' ? 'pause' : 'block'}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-white text-xl font-black tracking-tighter leading-none mb-1">{employee.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{employee.position}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-electric text-[10px] font-black uppercase tracking-widest">{employee.department}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full w-fit border border-white/5">
               <span className="material-symbols-outlined text-[14px] text-electric">history</span>
               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                  {years}a {months}m {days}d
               </span>
            </div>
          </div>
        </div>
        
        <div className="relative" ref={contextMenuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowContextMenu(!showContextMenu);
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              showContextMenu ? 'bg-electric text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">more_horiz</span>
          </button>
          
          {showContextMenu && (
            <div 
              className="absolute right-0 mt-3 w-60 bg-charcoal-lighter/95 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden py-3 backdrop-blur-2xl animate-slide-in pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-2 mb-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Gestión de Estado</p>
              </div>
              {(['Activo', 'Suspendido', 'Despedido', 'Renunció'] as EmployeeStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(s);
                    setShowContextMenu(false);
                  }}
                  className={`w-full px-5 py-4 text-left text-sm font-bold flex items-center justify-between group/item transition-all ${
                    status === s ? 'text-electric bg-electric/5' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                      s === 'Activo' ? 'bg-emerald shadow-emerald/50' : 
                      s === 'Suspendido' ? 'bg-amber-500 shadow-amber-500/50' : 
                      'bg-crimson shadow-crimson/50'
                    }`}></div>
                    {s}
                  </div>
                  {status === s && <span className="material-symbols-outlined text-sm">check_circle</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {status === 'Activo' || status === 'Suspendido' ? (
        <div className="mt-8 relative z-10 pt-6 border-t border-white/5 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {DAYS_SHORT.map((day, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (status !== 'Suspendido') onAttendanceChange(idx);
                  }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all active:scale-90 ${status === 'Suspendido' ? 'opacity-30 cursor-not-allowed grayscale' : getDayStyle(attendance[idx])}`}
                >
                  {day}
                </button>
              ))}
            </div>
            
            {status === 'Suspendido' ? (
              <div className="flex flex-col items-center bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                   <span className="material-symbols-outlined text-sm animate-spin-slow">history</span>
                   <p className="text-[10px] font-black uppercase tracking-widest">Sanción Vigente</p>
                </div>
                <p className="text-white text-xs font-bold font-mono">
                  Hasta: {suspensionEndDate ? new Date(suspensionEndDate).toLocaleDateString() : 'Indefinido'}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                 <button 
                   onClick={(e) => { e.stopPropagation(); onExtraHoursChange(-1); }}
                   className="w-8 h-8 rounded-xl bg-charcoal flex items-center justify-center text-slate-400 hover:text-white active:scale-90"
                 >
                   <span className="material-symbols-outlined text-sm">remove</span>
                 </button>
                 <div className="px-2 text-center min-w-[60px]">
                    <p className="text-[7px] font-black text-slate-500 uppercase leading-none mb-1">H. Extras</p>
                    <p className="text-white text-sm font-black italic">{extraHours}h</p>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onExtraHoursChange(1); }}
                   className="w-8 h-8 rounded-xl bg-electric flex items-center justify-center text-white active:scale-90 shadow-lg shadow-electric/20"
                 >
                   <span className="material-symbols-outlined text-sm">add</span>
                 </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end">
             <div className="text-left">
                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Costo H. Extra</p>
                <p className="text-slate-400 text-xs font-mono font-bold">{formatCurrency(extraHourRate)}/h</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Neto Semanal</p>
                <p className={`text-3xl font-black tracking-tighter italic ${status === 'Suspendido' ? 'text-amber-500 animate-pulse' : 'text-white'}`}>
                  {formatCurrency(totalPayout)}
                </p>
             </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 p-6 rounded-[2rem] bg-crimson/5 border border-crimson/20 flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] font-black text-crimson uppercase tracking-widest leading-none mb-1">Liquidación Proyectada</p>
            <p className="text-crimson text-3xl font-black tracking-tighter italic">{formatCurrency(liquidation?.total || 0)}</p>
          </div>
          <div className="bg-crimson/20 w-12 h-12 rounded-2xl flex items-center justify-center text-crimson shadow-lg shadow-crimson/10">
             <span className="material-symbols-outlined text-2xl font-bold">receipt_long</span>
          </div>
        </div>
      )}
    </div>
  );
};
