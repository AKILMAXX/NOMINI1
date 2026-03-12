import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Minus, CheckCircle, Ban, PauseCircle, History, Clock } from 'lucide-react';
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
  employee, attendance, extraHours, status, suspensionEndDate,
  onAttendanceChange, onExtraHoursChange, onStatusChange, onCardClick,
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
  const { years, months } = calculateSeniority(employee.hireDate);
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
      case 'worked':  return 'bg-electric text-white shadow-md shadow-electric/20';
      case 'holiday': return 'bg-crimson/80 text-white shadow-md shadow-crimson/20 ring-1 ring-crimson/30';
      default:        return 'bg-white/5 text-slate-600 border border-[var(--panel-border)] hover:text-slate-400';
    }
  };

  const isActive   = status === 'Activo';
  const isSuspended = status === 'Suspendido';

  return (
    <div
      className={`bento-card relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl group ${
        isSuspended ? '!border-gold/20' :
        (!isActive && !isSuspended) ? '!border-crimson/15 opacity-75' : ''
      }`}
      onClick={e => {
        if (contextMenuRef.current?.contains(e.target as Node)) return;
        onCardClick();
      }}
    >
      {/* Accent glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none transition-all ${
        isSuspended ? 'bg-gold/8' :
        (!isActive && !isSuspended) ? 'bg-crimson/6' :
        'bg-electric/5 group-hover:bg-electric/10'
      }`} />

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex gap-4">
          <div className="relative flex-shrink-0">
            <img src={employee.avatarUrl} alt={employee.name}
              className="w-14 h-14 rounded-2xl object-cover border border-[var(--panel-border)]" />
            {!isActive && (
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-charcoal)] ${isSuspended ? 'bg-gold' : 'bg-crimson'}`}>
                {isSuspended ? <PauseCircle size={10} className="text-white" /> : <Ban size={10} className="text-white" />}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-[var(--color-titanium)] text-base font-semibold tracking-tight leading-snug">{employee.name}</h3>
            <p className="text-slate-500 text-[10px] font-medium mt-0.5">{employee.position}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-electric/10 text-electric border border-electric/10">
                {employee.department}
              </span>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-[var(--panel-border)]">
                <History size={9} className="text-slate-500" />
                <span className="text-[9px] font-medium text-slate-400">{years}a {months}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Context menu */}
        <div className="relative" ref={contextMenuRef}>
          <button type="button" title="Gestionar estado"
            onClick={e => { e.stopPropagation(); setShowContextMenu(v => !v); }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              showContextMenu ? 'bg-electric text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MoreHorizontal size={16} />
          </button>

          {showContextMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[var(--color-charcoal-lighter)] border border-[var(--panel-border)] rounded-2xl shadow-2xl z-[100] overflow-hidden py-2 animate-slide-in pointer-events-auto"
              onClick={e => e.stopPropagation()}>
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-4 py-2">Estado del empleado</p>
              {(['Activo', 'Suspendido', 'Despedido', 'Renunció'] as EmployeeStatus[]).map(s => (
                <button type="button" key={s}
                  onClick={e => { e.stopPropagation(); onStatusChange(s); setShowContextMenu(false); }}
                  className={`w-full px-4 py-3 text-left text-xs font-medium flex items-center justify-between transition-all ${
                    status === s ? 'text-electric bg-electric/5' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      s === 'Activo' ? 'bg-emerald' : s === 'Suspendido' ? 'bg-gold' : 'bg-crimson'
                    }`} />
                    {s}
                  </div>
                  {status === s && <CheckCircle size={13} className="text-electric" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {(isActive || isSuspended) ? (
        <div className="mt-5 pt-5 border-t border-[var(--panel-border)] space-y-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {DAYS_SHORT.map((day, idx) => (
                <button type="button" key={idx}
                  onClick={e => { e.stopPropagation(); if (!isSuspended) onAttendanceChange(idx); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all active:scale-90 ${
                    isSuspended ? 'opacity-30 cursor-not-allowed grayscale' : getDayStyle(attendance[idx])
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {isSuspended ? (
              <div className="flex items-center gap-2 bg-gold/10 px-3 py-2 rounded-xl border border-gold/20">
                <PauseCircle size={13} className="text-gold" />
                <div>
                  <p className="text-[9px] font-bold text-gold uppercase tracking-wider">Sanción</p>
                  <p className="text-white text-[10px] font-medium font-mono">
                    {suspensionEndDate ? new Date(suspensionEndDate).toLocaleDateString() : 'Indefinido'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-xl border border-[var(--panel-border)]">
                <button type="button" title="Quitar hora extra"
                  onClick={e => { e.stopPropagation(); onExtraHoursChange(-1); }}
                  className="w-7 h-7 rounded-lg bg-[var(--color-charcoal-darker)] flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
                >
                  <Minus size={12} />
                </button>
                <div className="px-2 text-center min-w-[50px]">
                  <p className="text-[7px] font-semibold text-slate-500 uppercase leading-none mb-0.5">H. Extra</p>
                  <p className="text-[var(--color-titanium)] text-sm font-bold">{extraHours}h</p>
                </div>
                <button type="button" title="Agregar hora extra"
                  onClick={e => { e.stopPropagation(); onExtraHoursChange(1); }}
                  className="w-7 h-7 rounded-lg bg-electric flex items-center justify-center text-white active:scale-90 shadow-md shadow-electric/30 transition-all"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-medium text-slate-600 uppercase">Costo H. Extra</p>
              <p className="text-slate-400 text-xs font-mono">{formatCurrency(extraHourRate)}/h</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-none mb-1">Neto Semanal</p>
              <p className={`text-2xl font-bold tracking-tight ${isSuspended ? 'text-gold' : 'text-[var(--color-titanium)]'}`}>
                {formatCurrency(totalPayout)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 p-4 rounded-2xl bg-crimson/5 border border-crimson/15 flex justify-between items-center relative z-10">
          <div>
            <p className="text-[9px] font-semibold text-crimson uppercase tracking-wider mb-1">Liquidación Proyectada</p>
            <p className="text-crimson text-2xl font-bold tracking-tight">{formatCurrency(liquidation?.total || 0)}</p>
          </div>
          <div className="w-10 h-10 bg-crimson/10 rounded-xl flex items-center justify-center text-crimson">
            <Clock size={18} />
          </div>
        </div>
      )}
    </div>
  );
};
