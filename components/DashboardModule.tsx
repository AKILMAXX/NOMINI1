
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Employee, PayrollWeek, Penalization, Loan } from '../types';
import { formatCurrency, calculateSeniority } from '../utils';
import { HRAgent } from './HRAgent';

interface DashboardModuleProps {
  employees: Employee[];
  history: PayrollWeek[];
  loans: Loan[];
  penalizations: Penalization[];
  stats: {
    total: number;
    activeCount: number;
    attendanceRate: number;
    turnoverRate: number;
  };
  onTabChange: (tab: 'TABLERO' | 'PERSONAL' | 'PAGOS' | 'PRESTAMOS') => void;
  onOpenDepartments: () => void;
  onGrantPerformanceBonus: (employeeId: string, amount: number) => void;
  onEditEmployee: (employee: Employee) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ 
  employees, 
  history, 
  loans, 
  penalizations, 
  stats, 
  onTabChange, 
  onOpenDepartments,
  onGrantPerformanceBonus,
  onEditEmployee
}) => {
  const [showBonusModal, setShowBonusModal] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState(25);

  const trendData = [
    { value: 4000 }, { value: 4200 }, { value: 3900 }, { value: 4500 }, 
    { value: stats.total }, { value: stats.total + 200 }
  ];

  const performanceRanking = useMemo(() => {
    return employees.map(emp => {
      let totalDaysPossible = Math.max(1, history.length * 6);
      let totalDaysWorked = 0;
      history.forEach(week => {
        const summary = week.summaries.find(s => s.employeeId === emp.id);
        if (summary) {
          const dailyRate = emp.baseWeeklySalary / 6;
          totalDaysWorked += Math.min(6, summary.basePay / (dailyRate || 1));
        }
      });
      const attendanceRate = (totalDaysWorked / totalDaysPossible) * 100;
      const hasPenalizations = penalizations.some(p => p.employeeId === emp.id && p.status === 'active');
      const hasActiveLoans = loans.some(l => l.employeeId === emp.id && l.status === 'active');

      let meritScore = attendanceRate * 0.7;
      if (!hasPenalizations) meritScore += 20;
      if (!hasActiveLoans) meritScore += 10;

      return {
        ...emp,
        attendanceRate,
        meritScore: Math.min(100, meritScore),
        isClean: !hasPenalizations,
        isFinanciallyHealthy: !hasActiveLoans,
        status: meritScore >= 90 ? 'Elite' : meritScore >= 75 ? 'Destacado' : 'Regular'
      };
    }).sort((a, b) => b.meritScore - a.meritScore);
  }, [employees, history, penalizations, loans]);

  const employeeOfMonth = performanceRanking[0];

  return (
    <div className="space-y-8 animate-slide-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Centro de Control</h2>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">Strategic Human Capital Analytics</p>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
           <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse"></div>
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vault Sync: OK</span>
        </div>
      </div>

      <HRAgent employees={employees} stats={stats} />

      {employeeOfMonth && (
        <div className="bg-[#051126] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-electric/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-all"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="relative flex-shrink-0 cursor-pointer" onClick={() => onEditEmployee(employeeOfMonth)}>
                 <div className="w-32 h-32 rounded-[2rem] border-[3px] border-electric p-1 bg-charcoal">
                    <img 
                        src={employeeOfMonth.avatarUrl} 
                        className="w-full h-full object-cover rounded-[1.6rem] grayscale group-hover:grayscale-0 transition-all duration-700" 
                        alt="Employee of the month"
                    />
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-[#F2A007] w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 border-2 border-[#051126]">
                    <span className="material-symbols-outlined text-white text-2xl font-bold">star</span>
                 </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-3">
                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                    <span className="bg-[#F2A007]/20 text-[#F2A007] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-[#F2A007]/10">Hall of Fame</span>
                    <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Ciclo Actual</span>
                 </div>
                 
                 <div className="space-y-0.5">
                    <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">{employeeOfMonth.name.split(' ')[0]}</h3>
                    <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">{employeeOfMonth.name.split(' ').slice(1).join(' ')}</h3>
                 </div>

                 <p className="text-electric font-black text-[9px] sm:text-xs uppercase tracking-[0.2em]">
                    {employeeOfMonth.position} <span className="text-slate-700 mx-1">•</span> {employeeOfMonth.department}
                 </p>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                    <div className="bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl min-w-[80px]">
                       <p className="text-[7px] font-black text-slate-500 uppercase mb-0.5">Puntualidad</p>
                       <p className="text-white text-sm font-black italic leading-none">{employeeOfMonth.attendanceRate.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl min-w-[80px]">
                       <p className="text-[7px] font-black text-slate-500 uppercase mb-0.5">Conducta</p>
                       <p className="text-emerald text-[9px] font-black uppercase italic leading-none">Impecable</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl min-w-[80px]">
                       <p className="text-[7px] font-black text-slate-500 uppercase mb-0.5">Créditos</p>
                       <p className="text-emerald text-[9px] font-black uppercase italic leading-none">Al Día</p>
                    </div>
                 </div>
              </div>

              <div className="w-full md:w-auto mt-2 md:mt-0">
                 <button 
                   onClick={() => setShowBonusModal(employeeOfMonth.id)}
                   className="w-full md:w-auto bg-white text-black h-14 px-8 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl hover:bg-emerald hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <span className="material-symbols-outlined text-lg">payments</span>
                    Otorgar Bono de Incentivo
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* RANKING DE DESEMPEÑO */}
      <div className="bg-charcoal p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-3">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ranking Corporativo</h4>
            <p className="text-slate-600 text-[9px] mt-0.5 italic">Basado en mérito y disciplina operativa</p>
          </div>
          <div className="bg-emerald/10 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald/5">
             <div className="w-1 h-1 bg-emerald rounded-full"></div>
             <span className="text-emerald text-[8px] font-black uppercase tracking-widest">Nivel Élite: {performanceRanking.filter(r => r.status === 'Elite').length}</span>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-4 py-2">Candidato</th>
                <th className="px-4 py-2">Puntualidad</th>
                <th className="px-4 py-2">Conducta</th>
                <th className="px-4 py-2 text-right">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {performanceRanking.map((item, idx) => (
                <tr 
                  key={item.id} 
                  onClick={() => onEditEmployee(item)}
                  className={`bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer group/row ${idx === 0 ? 'ring-1 ring-amber-500/20' : ''}`}
                >
                  <td className="px-4 py-3 rounded-l-xl border-l border-t border-b border-white/5">
                    <div className="flex items-center gap-3">
                       <img src={item.avatarUrl} className="w-7 h-7 rounded-lg object-cover grayscale group-hover/row:grayscale-0 transition-all" />
                       <p className="text-white text-[10px] font-black">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-t border-b border-white/5">
                    <p className="text-white text-[10px] font-black font-mono">{item.attendanceRate.toFixed(1)}%</p>
                  </td>
                  <td className="px-4 py-3 border-t border-b border-white/5">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${item.isClean ? 'bg-emerald' : 'bg-crimson'}`}></span>
                       <span className={`text-[8px] font-black uppercase ${item.isClean ? 'text-emerald' : 'text-crimson'}`}>
                          {item.isClean ? 'Limpio' : 'Faltas'}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 rounded-r-xl border-r border-t border-b border-white/5 text-right">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${item.status === 'Elite' ? 'text-amber-500' : 'text-slate-600'}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESUMEN DE MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onTabChange('PAGOS')} className="bg-charcoal p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group cursor-pointer hover:border-electric/30 transition-all active:scale-95">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Flujo Semanal</p>
          <p className="text-xl font-black text-white tracking-tighter mb-4">{formatCurrency(stats.total)}</p>
          <div className="h-6 w-full opacity-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <Area type="monotone" dataKey="value" stroke="#0056D2" fill="#0056D2" fillOpacity={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div onClick={() => onTabChange('PERSONAL')} className="bg-charcoal p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group cursor-pointer hover:border-emerald/30 transition-all active:scale-95">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Talento Activo</p>
          <p className="text-xl font-black text-white tracking-tighter mb-0.5">{stats.activeCount}</p>
          <p className="text-[8px] font-bold text-emerald uppercase tracking-tighter">Colaboradores</p>
          <div className="mt-4 flex -space-x-2">
             {employees.slice(0, 3).map((e, i) => (
               <img key={i} src={e.avatarUrl} className="w-6 h-6 rounded-full border border-charcoal object-cover" />
             ))}
          </div>
        </div>

        <div className="bg-charcoal p-6 rounded-[2rem] border border-white/5">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Asistencia</p>
          <p className="text-xl font-black text-white tracking-tighter mb-2">{stats.attendanceRate.toFixed(1)}%</p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
             <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
          </div>
        </div>

        <div className="bg-charcoal p-6 rounded-[2rem] border border-white/5">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Nivel de Rotación</p>
          <p className="text-xl font-black text-white tracking-tighter mb-2">{stats.turnoverRate.toFixed(1)}%</p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
             <div className="bg-crimson h-full rounded-full" style={{ width: `${stats.turnoverRate}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
