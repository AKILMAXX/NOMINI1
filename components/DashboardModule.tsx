import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, CalendarCheck, BarChart3, Star, Gift, Clock, ChevronRight, Zap } from 'lucide-react';
import { Employee, PayrollWeek, Penalization, Loan, Task } from '../types';
import { formatCurrency } from '../utils';
import { HRAgent } from './HRAgent';

interface DashboardModuleProps {
  employees: Employee[];
  history: PayrollWeek[];
  loans: Loan[];
  penalizations: Penalization[];
  tasks: Task[];
  stats: {
    total: number;
    activeCount: number;
    attendanceRate: number;
    turnoverRate: number;
  };
  onTabChange: (tab: string) => void;
  onOpenDepartments: () => void;
  onGrantPerformanceBonus: (employeeId: string, amount: number) => void;
  onEditEmployee: (employee: Employee) => void;
}

function getUpcomingBirthdays(employees: Employee[]): { emp: Employee; daysUntil: number; dateStr: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: { emp: Employee; daysUntil: number; dateStr: string }[] = [];
  employees.forEach(emp => {
    if (!emp.birthdayDate) return;
    const [, mm, dd] = emp.birthdayDate.split('-').map(Number);
    const thisYear = new Date(today.getFullYear(), mm - 1, dd);
    let diff = Math.floor((thisYear.getTime() - today.getTime()) / 86400000);
    if (diff < 0) {
      const nextYear = new Date(today.getFullYear() + 1, mm - 1, dd);
      diff = Math.floor((nextYear.getTime() - today.getTime()) / 86400000);
    }
    if (diff <= 7) results.push({ emp, daysUntil: diff, dateStr: `${dd}/${mm}` });
  });
  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

function getTodayTasks(tasks: Task[]): Task[] {
  const today = new Date();
  return tasks.filter(t => {
    if (t.status === 'done') return false;
    if (t.frequency === 'única' && t.dueDate) return t.dueDate === today.toISOString().split('T')[0];
    if (t.frequency === 'semanal' && t.reviewDay !== undefined) {
      const jsDay = today.getDay();
      return t.reviewDay === (jsDay === 0 ? 6 : jsDay - 1);
    }
    if (t.frequency === 'mensual' && t.reviewDay !== undefined) return today.getDate() === t.reviewDay;
    return false;
  });
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  employees, history, loans, penalizations, tasks, stats,
  onTabChange, onGrantPerformanceBonus, onEditEmployee,
}) => {
  const [showBonusModal, setShowBonusModal] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState(25);

  const trendData = [
    { v: 3800 }, { v: 4100 }, { v: 3900 }, { v: 4400 },
    { v: stats.total }, { v: stats.total + 150 },
  ];

  const performanceRanking = useMemo(() => {
    return employees.map(emp => {
      const totalDaysPossible = Math.max(1, history.length * 6);
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
        ...emp, attendanceRate,
        meritScore: Math.min(100, meritScore),
        isClean: !hasPenalizations,
        status: meritScore >= 90 ? 'Elite' : meritScore >= 75 ? 'Destacado' : 'Regular',
      };
    }).sort((a, b) => b.meritScore - a.meritScore);
  }, [employees, history, penalizations, loans]);

  const employeeOfMonth = performanceRanking[0];
  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(employees), [employees]);
  const todayTasks = useMemo(() => getTodayTasks(tasks), [tasks]);

  return (
    <div className="animate-slide-in space-y-4 pb-10">

      {/* ── Row 1: Welcome + KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 bento-card flex items-center justify-between gap-4">
          <div>
            <p className="text-slate-500 text-xs font-medium mb-1">Bienvenido de vuelta</p>
            <h2 className="text-2xl font-bold text-[var(--color-titanium)] tracking-tight">PeopleCore</h2>
            <p className="text-slate-500 text-[11px] mt-1 capitalize">
              {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="w-12 h-12 bg-electric/10 rounded-2xl flex items-center justify-center text-electric flex-shrink-0">
            <Zap size={22} />
          </div>
        </div>

        <div onClick={() => onTabChange('PAGOS')}
          className="bento-card cursor-pointer hover:border-electric/30 active:scale-95 group transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Flujo Semanal</p>
            <TrendingUp size={14} className="text-electric opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xl font-bold text-[var(--color-titanium)] tracking-tight">{formatCurrency(stats.total)}</p>
          <div className="h-8 mt-3 opacity-40 group-hover:opacity-70 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <Area type="monotone" dataKey="v" stroke="#7678ED" fill="#7678ED" fillOpacity={0.3} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div onClick={() => onTabChange('PERSONAL')}
          className="bento-card cursor-pointer hover:border-emerald/30 active:scale-95 group transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Talento Activo</p>
            <Users size={14} className="text-emerald opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xl font-bold text-[var(--color-titanium)] tracking-tight">{stats.activeCount}</p>
          <p className="text-emerald text-[10px] font-semibold mt-1">colaboradores</p>
          <div className="flex -space-x-2 mt-3">
            {employees.slice(0, 4).map((e, i) => (
              <img key={i} src={e.avatarUrl} className="w-6 h-6 rounded-full border-2 border-[var(--color-charcoal)] object-cover" alt={e.name} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Employee of month + attendance/turnover ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {employeeOfMonth && (
          <div className="lg:col-span-2 bento-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-electric/6 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
            <div className="flex items-center gap-2 mb-5">
              <Star size={13} className="text-gold fill-gold" />
              <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Hall of Fame · Ciclo Actual</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0 cursor-pointer" onClick={() => onEditEmployee(employeeOfMonth)}>
                <img src={employeeOfMonth.avatarUrl}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-electric/30" alt={employeeOfMonth.name} />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gold rounded-xl flex items-center justify-center shadow-lg border-2 border-[var(--color-charcoal)]">
                  <Star size={13} className="text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-[var(--color-titanium)] tracking-tight truncate">{employeeOfMonth.name}</h3>
                <p className="text-electric text-xs font-medium mt-0.5">{employeeOfMonth.position} · {employeeOfMonth.department}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[9px] font-semibold bg-white/5 border border-[var(--panel-border)] px-2.5 py-1 rounded-lg text-slate-300">
                    {employeeOfMonth.attendanceRate.toFixed(1)}% asistencia
                  </span>
                  <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-lg ${employeeOfMonth.isClean ? 'bg-emerald/10 text-emerald' : 'bg-crimson/10 text-crimson'}`}>
                    {employeeOfMonth.isClean ? 'Conducta Impecable' : 'Con Faltas'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setShowBonusModal(s => s ? null : employeeOfMonth.id)}
                className="hidden md:flex h-9 px-4 bg-electric text-white rounded-xl font-semibold text-xs items-center gap-1.5 hover:bg-electric-light transition-all active:scale-95 shadow-lg shadow-electric/20 flex-shrink-0">
                <Zap size={12} />
                Bono
              </button>
            </div>
            {showBonusModal === employeeOfMonth.id && (
              <div className="mt-5 pt-4 border-t border-[var(--panel-border)] animate-fade-in">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Monto del Bono ($)</p>
                <div className="flex gap-2 flex-wrap">
                  {[10, 25, 50, 100].map(v => (
                    <button type="button" key={v} onClick={() => setBonusAmount(v)}
                      className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all ${bonusAmount === v ? 'bg-electric text-white' : 'bg-white/5 text-slate-400 border border-[var(--panel-border)] hover:text-white'}`}>
                      ${v}
                    </button>
                  ))}
                  <button type="button" onClick={() => { onGrantPerformanceBonus(employeeOfMonth.id, bonusAmount); setShowBonusModal(null); }}
                    className="h-8 px-4 bg-emerald text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all active:scale-95">
                    Otorgar ${bonusAmount}
                  </button>
                  <button type="button" onClick={() => setShowBonusModal(null)} className="h-8 px-2 text-slate-500 hover:text-white transition-colors text-xs">✕</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="bento-card flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Asistencia</p>
              <CalendarCheck size={13} className="text-gold opacity-60" />
            </div>
            <p className="text-xl font-bold text-[var(--color-titanium)]">{stats.attendanceRate.toFixed(1)}%</p>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-gold h-full rounded-full" style={{ width: `${stats.attendanceRate}%` }} />
            </div>
          </div>
          <div className="bento-card flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Rotación</p>
              <BarChart3 size={13} className="text-crimson opacity-60" />
            </div>
            <p className="text-xl font-bold text-[var(--color-titanium)]">{stats.turnoverRate.toFixed(1)}%</p>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-crimson h-full rounded-full" style={{ width: `${stats.turnoverRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Ranking + Birthdays + Today tasks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bento-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[var(--color-titanium)] text-sm font-semibold">Ranking de Desempeño</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Mérito y disciplina operativa</p>
            </div>
            <span className="text-[9px] font-bold text-emerald bg-emerald/10 px-2.5 py-1 rounded-xl border border-emerald/10">
              Elite: {performanceRanking.filter(r => r.status === 'Elite').length}
            </span>
          </div>
          <div className="space-y-1.5">
            {performanceRanking.map((item, idx) => (
              <div key={item.id} onClick={() => onEditEmployee(item)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${idx === 0 ? 'border-gold/20 bg-gold/5' : 'border-[var(--panel-border)] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <span className={`text-[11px] font-bold w-4 text-center ${idx === 0 ? 'text-gold' : 'text-slate-600'}`}>{idx + 1}</span>
                <img src={item.avatarUrl} className="w-8 h-8 rounded-xl object-cover" alt={item.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-titanium)] text-xs font-semibold truncate">{item.name}</p>
                  <p className="text-slate-500 text-[10px] truncate">{item.position}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[var(--color-titanium)] text-xs font-bold">{item.attendanceRate.toFixed(0)}%</p>
                  <p className={`text-[9px] font-semibold ${item.status === 'Elite' ? 'text-gold' : item.status === 'Destacado' ? 'text-electric' : 'text-slate-500'}`}>
                    {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Birthdays */}
          <div className="bento-card flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={14} className="text-electric" />
              <p className="text-[var(--color-titanium)] text-sm font-semibold">Próximos Cumpleaños</p>
            </div>
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-5 opacity-40">
                <Gift size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Sin cumpleaños esta semana</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBirthdays.map(({ emp, daysUntil, dateStr }) => (
                  <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-electric/5 border border-electric/10">
                    <img src={emp.avatarUrl} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" alt={emp.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--color-titanium)] text-[11px] font-semibold truncate">{emp.name.split(' ')[0]}</p>
                      <p className="text-slate-500 text-[9px]">{dateStr}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${daysUntil === 0 ? 'bg-gold/20 text-gold' : 'bg-electric/10 text-electric'}`}>
                      {daysUntil === 0 ? '¡Hoy!' : `en ${daysUntil}d`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today tasks */}
          <div className="bento-card flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gold" />
                <p className="text-[var(--color-titanium)] text-sm font-semibold">Revisiones Hoy</p>
              </div>
              {todayTasks.length > 0 && <span className="badge-today">{todayTasks.length}</span>}
            </div>
            {todayTasks.length === 0 ? (
              <div className="text-center py-5 opacity-40">
                <Clock size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Sin revisiones hoy</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 4).map(task => {
                  const emp = employees.find(e => e.id === task.employeeId);
                  return (
                    <div key={task.id} onClick={() => onTabChange('TASKS')}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-crimson/5 border border-crimson/10 cursor-pointer hover:bg-crimson/10 transition-all">
                      <div className="w-1.5 h-1.5 rounded-full bg-crimson flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--color-titanium)] text-[11px] font-semibold truncate">{task.title}</p>
                        <p className="text-slate-500 text-[9px]">{emp?.name}</p>
                      </div>
                      <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
                    </div>
                  );
                })}
                {todayTasks.length > 4 && (
                  <button type="button" onClick={() => onTabChange('TASKS')} className="w-full text-center text-[10px] text-electric font-semibold pt-1 hover:underline">
                    +{todayTasks.length - 4} más →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── HR Agent ── */}
      <HRAgent employees={employees} stats={stats} />
    </div>
  );
};
