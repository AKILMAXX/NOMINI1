
import React, { useState, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { LayoutDashboard, Users, Wallet, CreditCard, Gavel, FileText, CheckSquare, Settings, Menu, X, Zap, Bell, Monitor, Tablet, Smartphone } from 'lucide-react';
import { INITIAL_EMPLOYEES, DEPARTMENTS as INITIAL_DEPARTMENTS, MOCK_HISTORY } from './constants';
import { Employee, EmployeeStatus, AttendanceRecord, StatusRecord, FinalSummary, PayrollWeek, DayStatus, Loan, NotificationSettings, Penalization, SuspensionRecord, Task } from './types';
import { EmployeeCard } from './components/EmployeeCard';
import { DashboardModule } from './components/DashboardModule';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { SettingsMenu } from './components/SettingsMenu';
import { LoansModule } from './components/LoansModule';
import { PenalizationsModule } from './components/PenalizationsModule';
import { WeekDetailModal } from './components/WeekDetailModal';
import { LiquidationModule } from './components/LiquidationModule';
import { TasksModule } from './components/TasksModule';
import { calculateLiquidation, formatCurrency, generateId, isVenezuelanHoliday, getCurrentWeekDates } from './utils';
import { isSupabaseConfigured } from './lib/supabase';
import { fetchEmployees, fetchLoans, fetchPenalizations, fetchPayrollHistory, fetchTasks, upsertEmployee, upsertLoan, upsertPenalization, savePayrollWeek, upsertTask, deleteTask } from './lib/db';

type Tab = 'TABLERO' | 'PERSONAL' | 'PAGOS' | 'PRESTAMOS' | 'PENALIZACION' | 'LIQUIDACION' | 'TASKS';

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  { tab: 'TABLERO',     label: 'Tablero',      icon: <LayoutDashboard size={18} /> },
  { tab: 'PERSONAL',   label: 'Personal',     icon: <Users size={18} /> },
  { tab: 'PAGOS',      label: 'Pagos',        icon: <Wallet size={18} /> },
  { tab: 'PRESTAMOS',  label: 'Préstamos',    icon: <CreditCard size={18} /> },
  { tab: 'PENALIZACION', label: 'Penalización', icon: <Gavel size={18} /> },
  { tab: 'LIQUIDACION', label: 'Liquidación', icon: <FileText size={18} /> },
  { tab: 'TASKS',      label: 'Tareas',       icon: <CheckSquare size={18} /> },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('TABLERO');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [departments, setDepartments] = useState<string[]>(INITIAL_DEPARTMENTS);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [penalizations, setPenalizations] = useState<Penalization[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [suspendingEmployeeId, setSuspendingEmployeeId] = useState<string | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialView] = useState<'main' | 'departments' | 'security' | 'notifications'>('main');
  const [selectedWeekForDetail, setSelectedWeekForDetail] = useState<PayrollWeek | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isExporting, setIsExporting] = useState(false);

  const [extraHours, setExtraHours] = useState<Record<string, number>>({});
  const [suspensions, setSuspensions] = useState<SuspensionRecord>({});

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    loans: true,
    payroll: true,
    attendance: true,
    security: true,
    soundType: 'modern'
  });

  // Carga inicial desde Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      const [remoteEmployees, remoteLoans, remotePenalizations, remoteHistory, remoteTasks] = await Promise.all([
        fetchEmployees(),
        fetchLoans(),
        fetchPenalizations(),
        fetchPayrollHistory(),
        fetchTasks(),
      ]);
      if (remoteEmployees.length > 0) setEmployees(remoteEmployees);
      setLoans(remoteLoans);
      setPenalizations(remotePenalizations);
      if (remoteHistory.length > 0) setHistory(remoteHistory);
      setTasks(remoteTasks);
    })();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }, [theme]);

  // Reactivación automática de suspendidos
  useEffect(() => {
    const checkSuspensions = () => {
      const now = new Date();
      let changed = false;
      const newSuspensions = { ...suspensions };

      setStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses };
        Object.keys(suspensions).forEach(empId => {
          if (prevStatuses[empId] === 'Suspendido') {
            const endDate = new Date(suspensions[empId]);
            if (now >= endDate) {
              newStatuses[empId] = 'Activo';
              delete newSuspensions[empId];
              changed = true;
            }
          }
        });
        if (changed) {
          setSuspensions(newSuspensions);
          return newStatuses;
        }
        return prevStatuses;
      });
    };
    const interval = setInterval(checkSuspensions, 5000);
    return () => clearInterval(interval);
  }, [suspensions]);

  const [attendance, setAttendance] = useState<AttendanceRecord>(() => {
    const weekDates = getCurrentWeekDates();
    const records: AttendanceRecord = {};
    INITIAL_EMPLOYEES.forEach(emp => {
      const defaultWeek: DayStatus[] = weekDates.map((date, idx) => {
        if (idx === 6) return 'absent';
        if (isVenezuelanHoliday(date)) return 'holiday';
        return 'worked';
      });
      records[emp.id] = defaultWeek;
    });
    return records;
  });

  const [statuses, setStatuses] = useState<StatusRecord>(() => {
    const records: StatusRecord = {};
    INITIAL_EMPLOYEES.forEach(emp => { records[emp.id] = 'Activo'; });
    return records;
  });

  const [history, setHistory] = useState<PayrollWeek[]>(MOCK_HISTORY);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const stats = useMemo(() => {
    let total = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    let totalDaysWorked = 0;
    let totalPotentialDays = 0;

    employees.forEach(emp => {
      const status = statuses[emp.id] || 'Activo';
      const dailyRate = emp.baseWeeklySalary / 6;
      const hourlyRate = dailyRate / 8;
      const extraHourRate = hourlyRate * 1.5;
      const empAttendance = attendance[emp.id] || Array(7).fill('absent');
      const empExtraHours = extraHours[emp.id] || 0;

      const basePay = empAttendance.reduce((acc, day) => {
        if (day === 'worked') { totalDaysWorked++; return acc + dailyRate; }
        if (day === 'holiday') { totalDaysWorked++; return acc + (dailyRate * 2); }
        return acc;
      }, 0);

      const extraPay = empExtraHours * extraHourRate;
      totalPotentialDays += 6;

      if (status === 'Activo') {
        activeCount++;
        const activeLoan = loans.find(l => l.employeeId === emp.id && l.status === 'active' && l.remainingWeeks > 0);
        const activePenalization = penalizations.filter(p => p.employeeId === emp.id && p.status === 'active' && p.remainingWeeks > 0);
        const loanDeduction = activeLoan ? activeLoan.weeklyInstallment : 0;
        const penalDeduction = activePenalization.reduce((acc, p) => acc + p.weeklyInstallment, 0);
        total += (basePay + extraPay + emp.weeklyBonus - loanDeduction - penalDeduction);
      } else if (status === 'Suspendido') {
        total += 0;
      } else {
        inactiveCount++;
        const liq = calculateLiquidation(emp.baseWeeklySalary, emp.hireDate, status, basePay);
        total += liq?.total || 0;
      }
    });

    const turnoverRate = (inactiveCount / (employees.length || 1)) * 100;
    return {
      total,
      activeCount,
      attendanceRate: totalPotentialDays > 0 ? (totalDaysWorked / totalPotentialDays) * 100 : 0,
      turnoverRate
    };
  }, [employees, attendance, statuses, loans, penalizations, extraHours]);

  // Tasks with today badge count
  const todayTasksCount = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon=0
    const todayDate = today.toISOString().split('T')[0];
    return tasks.filter(t => {
      if (t.status === 'done') return false;
      if (t.frequency === 'semanal' && t.reviewDay === todayDay) return true;
      if (t.frequency === 'mensual' && t.reviewDay === today.getDate()) return true;
      if (t.frequency === 'única' && t.dueDate === todayDate) return true;
      return false;
    }).length;
  }, [tasks]);

  const handleAttendanceCycle = (empId: string, dayIdx: number) => {
    setAttendance(prev => {
      const current = [...(prev[empId] || Array(7).fill('absent'))];
      const status = current[dayIdx];
      const nextStatus: DayStatus = status === 'absent' ? 'worked' : status === 'worked' ? 'holiday' : 'absent';
      current[dayIdx] = nextStatus;
      return { ...prev, [empId]: current };
    });
  };

  const handleUpdateExtraHours = (empId: string, delta: number) => {
    setExtraHours(prev => ({ ...prev, [empId]: Math.max(0, (prev[empId] || 0) + delta) }));
  };

  const handleStatusChange = (empId: string, newStatus: EmployeeStatus) => {
    if (newStatus === 'Suspendido') {
      setSuspendingEmployeeId(empId);
    } else {
      if (suspensions[empId]) {
        const newSuspensions = { ...suspensions };
        delete newSuspensions[empId];
        setSuspensions(newSuspensions);
      }
      setStatuses(prev => ({ ...prev, [empId]: newStatus }));
    }
  };

  const confirmSuspension = (days: number) => {
    if (!suspendingEmployeeId) return;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    setSuspensions(prev => ({ ...prev, [suspendingEmployeeId]: endDate.toISOString() }));
    setStatuses(prev => ({ ...prev, [suspendingEmployeeId]: 'Suspendido' }));
    setNotification(`Sanción aplicada. Retorno el ${endDate.toLocaleDateString()}.`);
    setSuspendingEmployeeId(null);
  };

  const finalizeWeek = () => {
    const updatedLoans = [...loans];
    const updatedPenalizations = [...penalizations];

    const finalSummaries: FinalSummary[] = employees.map(emp => {
      const status = statuses[emp.id] || 'Activo';
      const theoreticalBase = emp.baseWeeklySalary;
      const dailyRate = theoreticalBase / 6;
      const hourlyRate = dailyRate / 8;
      const extraHourRate = hourlyRate * 1.5;
      const empAttendance = attendance[emp.id] || Array(7).fill('absent');
      const empExtraHours = extraHours[emp.id] || 0;

      const daysWorked = empAttendance.filter(d => d === 'worked').length;
      const holidaysWorked = empAttendance.filter(d => d === 'holiday').length;
      const daysAbsent = 6 - (daysWorked + holidaysWorked);
      const unpaidDaysAmount = Math.max(0, daysAbsent * dailyRate);
      const holidayExtraPay = holidaysWorked * dailyRate;
      const extraHoursPay = empExtraHours * extraHourRate;
      const basePay = status === 'Suspendido' ? 0 : (theoreticalBase - unpaidDaysAmount) + holidayExtraPay;
      const liq = (status === 'Despedido' || status === 'Renunció') ? calculateLiquidation(emp.baseWeeklySalary, emp.hireDate, status, basePay) : null;

      let loanDeduction = 0;
      let penalDeduction = 0;

      if (status === 'Activo') {
        const loanIdx = updatedLoans.findIndex(l => l.employeeId === emp.id && l.status === 'active' && l.remainingWeeks > 0);
        if (loanIdx !== -1) {
          loanDeduction = updatedLoans[loanIdx].weeklyInstallment;
          updatedLoans[loanIdx].remainingWeeks -= 1;
          if (updatedLoans[loanIdx].remainingWeeks === 0) updatedLoans[loanIdx].status = 'paid';
        }
        updatedPenalizations.forEach((p, idx) => {
          if (p.employeeId === emp.id && p.status === 'active' && p.remainingWeeks > 0) {
            penalDeduction += p.weeklyInstallment;
            updatedPenalizations[idx].remainingWeeks -= 1;
            if (updatedPenalizations[idx].remainingWeeks === 0) updatedPenalizations[idx].status = 'cleared';
          }
        });
      }

      const total = liq ? liq.total : (status === 'Suspendido' ? 0 : (basePay + extraHoursPay + emp.weeklyBonus - loanDeduction - penalDeduction));

      return {
        employeeId: emp.id,
        name: emp.name,
        department: emp.department,
        basePay,
        theoreticalBase,
        unpaidDaysAmount,
        holidayExtraPay,
        extraHoursCount: empExtraHours,
        extraHoursPay,
        bonus: status === 'Suspendido' ? 0 : emp.weeklyBonus,
        daysWorked,
        holidaysWorked,
        loanDeduction: loanDeduction > 0 ? loanDeduction : undefined,
        penalizationDeduction: penalDeduction > 0 ? penalDeduction : undefined,
        liquidation: liq || undefined,
        total: Math.max(0, total)
      };
    });

    const newWeek: PayrollWeek = {
      id: generateId(),
      date: new Date().toISOString(),
      label: `Semana ${history.length + 1}`,
      summaries: finalSummaries,
      totalDisbursement: finalSummaries.reduce((acc, s) => acc + s.total, 0)
    };

    setLoans(updatedLoans);
    setPenalizations(updatedPenalizations);
    setHistory(prev => [...prev, newWeek]);
    setExtraHours({});
    setEmployees(prev => prev.map(emp => ({ ...emp, weeklyBonus: INITIAL_EMPLOYEES.find(ie => ie.id === emp.id)?.weeklyBonus || 0 })));

    if (isSupabaseConfigured) {
      savePayrollWeek(newWeek);
      updatedLoans.forEach(l => upsertLoan(l));
      updatedPenalizations.forEach(p => upsertPenalization(p));
    }
    if (notificationSettings.payroll) setNotification('Ciclo cerrado exitosamente.');
    setActiveTab('PAGOS');
  };

  const handleExportPNG = async (week: PayrollWeek) => {
    const element = document.getElementById('week-report-content');
    if (!element) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2, cacheBust: true, backgroundColor: theme === 'dark' ? '#0F1110' : '#F5F5F7' });
      const link = document.createElement('a');
      link.download = `PEOPLECORE-REPORT-${week.label}.png`;
      link.href = dataUrl;
      link.click();
      setNotification('Reporte generado.');
    } catch {
      setNotification('Error de exportación.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddTask = (t: Task) => {
    setTasks(prev => [...prev, t]);
    if (isSupabaseConfigured) upsertTask(t);
  };

  const handleUpdateTask = (t: Task) => {
    setTasks(prev => prev.map(x => x.id === t.id ? t : x));
    if (isSupabaseConfigured) upsertTask(t);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(x => x.id !== id));
    if (isSupabaseConfigured) deleteTask(id);
  };

  const navTo = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-charcoal-darker)]">
      {/* Sidebar overlay (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-[210] flex flex-col bg-[var(--color-charcoal)] border-r border-[var(--panel-border)] transition-transform duration-300 w-56
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:flex`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-[var(--panel-border)]">
          <div className="w-9 h-9 bg-electric rounded-xl flex items-center justify-center shadow-lg shadow-electric/30 flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[var(--color-titanium)] text-sm font-bold tracking-tight leading-none">PeopleCore</p>
            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Talent & Payroll OS</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ tab, label, icon }) => {
            const isActive = activeTab === tab;
            const hasBadge = tab === 'TASKS' && todayTasksCount > 0;
            return (
              <button
                type="button"
                key={tab}
                onClick={() => navTo(tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-medium group relative ${
                  isActive
                    ? 'bg-electric/10 text-electric'
                    : 'text-slate-500 hover:bg-white/5 hover:text-[var(--color-titanium)]'
                }`}
              >
                <span className={`transition-colors ${isActive ? 'text-electric' : 'text-slate-600 group-hover:text-slate-300'}`}>
                  {icon}
                </span>
                <span className="flex-1">{label}</span>
                {hasBadge && (
                  <span className="w-5 h-5 bg-crimson rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {todayTasksCount}
                  </span>
                )}
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-electric rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-[var(--panel-border)] space-y-1">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-white/5 hover:text-[var(--color-titanium)] transition-all text-sm font-medium"
          >
            <Settings size={18} />
            <span>Configuración</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-[150] bg-[var(--color-charcoal-darker)]/80 backdrop-blur-2xl border-b border-[var(--panel-border)] flex items-center gap-4 px-5 py-4">
          {/* Hamburger (mobile) */}
          <button
            type="button"
            title="Abrir menú"
            onClick={() => setIsSidebarOpen(v => !v)}
            className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-[var(--panel-border)] flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="text-[var(--color-titanium)] text-base font-semibold tracking-tight leading-none">
              {NAV_ITEMS.find(n => n.tab === activeTab)?.label ?? activeTab}
            </h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Device preview toggle */}
            <div className="hidden sm:flex items-center gap-0.5 bg-white/5 border border-[var(--panel-border)] rounded-xl p-1">
              {([
                { id: 'desktop' as const, icon: <Monitor size={13} />, title: 'Vista Escritorio' },
                { id: 'tablet'  as const, icon: <Tablet   size={13} />, title: 'Vista Tablet' },
                { id: 'mobile'  as const, icon: <Smartphone size={12} />, title: 'Vista Móvil' },
              ]).map(({ id, icon, title }) => (
                <button
                  key={id}
                  type="button"
                  title={title}
                  onClick={() => setDevicePreview(id)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    devicePreview === id
                      ? 'bg-electric text-white shadow-sm shadow-electric/30'
                      : 'text-slate-500 hover:text-[var(--color-titanium)]'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {todayTasksCount > 0 && (
              <button
                type="button"
                title={`${todayTasksCount} tarea(s) para hoy`}
                onClick={() => navTo('TASKS')}
                className="relative w-9 h-9 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center text-crimson transition-all hover:bg-crimson/20"
              >
                <Bell size={15} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-crimson rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                  {todayTasksCount}
                </span>
              </button>
            )}
            <button
              type="button"
              title="Configuración"
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl overflow-hidden border border-[var(--panel-border)] active:scale-90 transition-all"
            >
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                alt="Usuario"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
              />
            </button>
          </div>
        </header>

        {/* Notification toast */}
        {notification && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-[var(--color-charcoal)] border border-electric/20 text-[var(--color-titanium)] px-6 py-3 rounded-2xl font-semibold text-xs tracking-wide shadow-2xl animate-slide-in text-center backdrop-blur-xl">
            {notification}
          </div>
        )}

        {/* Suspension modal */}
        {suspendingEmployeeId && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setSuspendingEmployeeId(null)} />
            <div className="relative bg-[var(--color-charcoal)] border border-gold/20 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-slide-in">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 bg-gold/15 rounded-2xl flex items-center justify-center">
                  <span className="text-gold text-lg font-bold">⏸</span>
                </div>
                <div>
                  <h3 className="text-[var(--color-titanium)] text-lg font-bold tracking-tight">Suspensión</h3>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Define el período de sanción</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {[1, 3, 5, 7, 15, 30].map(d => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => confirmSuspension(d)}
                    className="h-12 bg-white/5 border border-[var(--panel-border)] rounded-2xl text-[var(--color-titanium)] font-semibold text-xs hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-all active:scale-95"
                  >
                    {d} {d === 1 ? 'día' : 'días'}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSuspendingEmployeeId(null)}
                  className="flex-1 h-11 rounded-2xl text-slate-500 font-medium text-xs hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const val = prompt('Ingrese días personalizados:', '3');
                    if (val) confirmSuspension(parseInt(val) || 3);
                  }}
                  className="flex-1 h-11 bg-gold/10 border border-gold/20 text-gold rounded-2xl font-semibold text-xs hover:bg-gold/20 transition-all"
                >
                  Personalizado
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto">
        <div className={`transition-all duration-300 p-5 sm:p-8 mx-auto w-full ${
          devicePreview === 'mobile' ? 'max-w-[390px]' :
          devicePreview === 'tablet' ? 'max-w-[768px]' : ''
        }`}>
          {activeTab === 'TABLERO' && (
            <DashboardModule
              employees={employees}
              stats={stats as any}
              history={history}
              loans={loans}
              penalizations={penalizations}
              tasks={tasks}
              onTabChange={(t) => setActiveTab(t as Tab)}
              onOpenDepartments={() => setIsSettingsOpen(true)}
              onGrantPerformanceBonus={(id, amt) => setEmployees(prev => prev.map(e => e.id === id ? { ...e, weeklyBonus: e.weeklyBonus + amt } : e))}
              onEditEmployee={(emp) => setEditingEmployee(emp)}
            />
          )}

          {activeTab === 'PERSONAL' && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[var(--color-titanium)] tracking-tight">Bóveda de Talento</h2>
                <button
                  type="button"
                  onClick={() => setIsAddingEmployee(true)}
                  className="h-10 px-5 bg-electric text-white rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-electric-dark transition-all shadow-md shadow-electric/20"
                >
                  <Users size={14} />
                  Nuevo
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {employees.map(emp => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    attendance={attendance[emp.id] || Array(7).fill('absent')}
                    extraHours={extraHours[emp.id] || 0}
                    status={statuses[emp.id] || 'Activo'}
                    suspensionEndDate={suspensions[emp.id]}
                    onAttendanceChange={(idx) => handleAttendanceCycle(emp.id, idx)}
                    onExtraHoursChange={(delta) => handleUpdateExtraHours(emp.id, delta)}
                    onStatusChange={(s) => handleStatusChange(emp.id, s)}
                    onCardClick={() => setEditingEmployee(emp)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={finalizeWeek}
                className="fixed bottom-8 right-8 bg-emerald text-white px-7 py-4 rounded-2xl font-bold text-xs tracking-wide shadow-2xl shadow-emerald/30 z-[100] hover:bg-emerald/90 transition-all active:scale-95"
              >
                Cerrar Ciclo Semanal
              </button>
            </div>
          )}

          {activeTab === 'PAGOS' && (
            <div className="space-y-5 animate-slide-in">
              <h2 className="text-2xl font-bold text-[var(--color-titanium)] tracking-tight">Archivo de Pagos</h2>
              {history.slice().reverse().map(week => (
                <div
                  key={week.id}
                  onClick={() => setSelectedWeekForDetail(week)}
                  className="bento-card flex justify-between items-center cursor-pointer hover:border-electric/20 transition-all group"
                >
                  <div>
                    <p className="text-[var(--color-titanium)] font-semibold">{week.label}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{new Date(week.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-emerald text-xl font-bold font-mono">{formatCurrency(week.totalDisbursement)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PRESTAMOS' && (
            <LoansModule employees={employees} loans={loans} onAddLoan={(l) => setLoans(p => [...p, l])} />
          )}

          {activeTab === 'PENALIZACION' && (
            <PenalizationsModule employees={employees} penalizations={penalizations} onAddPenalization={(p) => setPenalizations(prev => [...prev, p])} />
          )}

          {activeTab === 'LIQUIDACION' && (
            <LiquidationModule employees={employees} />
          )}

          {activeTab === 'TASKS' && (
            <TasksModule
              employees={employees}
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </div>
        </main>
      </div>

      {/* Modals */}
      {selectedWeekForDetail && (
        <WeekDetailModal
          week={selectedWeekForDetail}
          employees={employees}
          isExporting={isExporting}
          onClose={() => setSelectedWeekForDetail(null)}
          onDownload={() => handleExportPNG(selectedWeekForDetail)}
        />
      )}

      {isSettingsOpen && (
        <SettingsMenu
          departments={departments}
          setDepartments={setDepartments}
          notificationSettings={notificationSettings}
          setNotificationSettings={setNotificationSettings}
          onLogout={() => window.location.reload()}
          onExport={() => {}}
          onClose={() => setIsSettingsOpen(false)}
          initialView={settingsInitialView}
          onTabSwitch={(tab) => { setActiveTab(tab as Tab); setIsSettingsOpen(false); }}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      {(editingEmployee || isAddingEmployee) && (
        <EditEmployeeModal
          employee={editingEmployee || { id: '', name: '', position: '', department: 'Logística', baseWeeklySalary: 0, weeklyBonus: 0, hireDate: new Date().toISOString().split('T')[0], avatarUrl: '' }}
          departments={departments}
          loans={loans}
          penalizations={penalizations}
          isNew={isAddingEmployee}
          onSave={(e) => {
            setEmployees(p => isAddingEmployee ? [...p, e] : p.map(x => x.id === e.id ? e : x));
            if (isSupabaseConfigured) upsertEmployee(e);
            setIsAddingEmployee(false);
            setEditingEmployee(null);
          }}
          onClose={() => { setIsAddingEmployee(false); setEditingEmployee(null); }}
        />
      )}
    </div>
  );
};

export default App;
