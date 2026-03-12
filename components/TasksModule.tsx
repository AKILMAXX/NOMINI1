import React, { useState, useMemo } from 'react';
import { CheckSquare, Plus, Trash2, Clock, Calendar, RefreshCw, Circle, CircleDot, CheckCircle2, ChevronRight } from 'lucide-react';
import { Task, Employee } from '../types';
import { generateId } from '../utils';

interface TasksModuleProps {
  employees: Employee[];
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const FREQ_LABELS: Record<Task['frequency'], string> = {
  'única': 'Única vez',
  'semanal': 'Semanal',
  'mensual': 'Mensual',
};

function isTaskDueToday(task: Task): boolean {
  const today = new Date();
  if (task.frequency === 'única' && task.dueDate) {
    return task.dueDate === today.toISOString().split('T')[0];
  }
  if (task.frequency === 'semanal' && task.reviewDay !== undefined) {
    // getDay() returns 0=Sun…6=Sat; we use 0=Mon…6=Sun
    const jsDay = today.getDay();
    const appDay = jsDay === 0 ? 6 : jsDay - 1;
    return task.reviewDay === appDay;
  }
  if (task.frequency === 'mensual' && task.reviewDay !== undefined) {
    return today.getDate() === task.reviewDay;
  }
  return false;
}

const STATUS_CYCLE: Record<Task['status'], Task['status']> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
};

const StatusIcon: React.FC<{ status: Task['status'] }> = ({ status }) => {
  if (status === 'done') return <CheckCircle2 size={16} className="text-emerald" />;
  if (status === 'in_progress') return <CircleDot size={16} className="text-gold" />;
  return <Circle size={16} className="text-slate-500" />;
};

export const TasksModule: React.FC<TasksModuleProps> = ({
  employees,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [freqFilter, setFreqFilter] = useState<'all' | Task['frequency']>('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [empId, setEmpId] = useState('');
  const [frequency, setFrequency] = useState<Task['frequency']>('única');
  const [reviewDay, setReviewDay] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');

  const filtered = useMemo(() => {
    const list = freqFilter === 'all' ? tasks : tasks.filter(t => t.frequency === freqFilter);
    return list.filter(t => t.status !== 'done' || isTaskDueToday(t));
  }, [tasks, freqFilter]);

  // Group by employee
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    filtered.forEach(t => {
      const arr = map.get(t.employeeId) ?? [];
      arr.push(t);
      map.set(t.employeeId, arr);
    });
    return map;
  }, [filtered]);

  const todayCount = useMemo(() => tasks.filter(t => isTaskDueToday(t) && t.status !== 'done').length, [tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !empId) return;
    const newTask: Task = {
      id: generateId(),
      employeeId: empId,
      title: title.trim(),
      description: description.trim() || undefined,
      frequency,
      reviewDay: frequency !== 'única' ? reviewDay : undefined,
      dueDate: frequency === 'única' ? dueDate || undefined : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    onAddTask(newTask);
    setTitle(''); setDescription(''); setEmpId(''); setDueDate('');
    setFrequency('única'); setReviewDay(0); setShowForm(false);
  };

  return (
    <div className="animate-slide-in space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-titanium)] tracking-tight">Tareas & Proyectos</h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">Asignación, frecuencia y supervisión de equipo</p>
        </div>
        <div className="flex items-center gap-3">
          {todayCount > 0 && (
            <div className="badge-today flex items-center gap-1.5">
              <Clock size={10} />
              {todayCount} para hoy
            </div>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="h-10 px-5 bg-electric text-white rounded-2xl font-semibold text-xs flex items-center gap-2 hover:bg-electric-light transition-all active:scale-95 shadow-lg shadow-electric/20"
          >
            <Plus size={14} />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Freq filter */}
      <div className="flex gap-2">
        {(['all', 'única', 'semanal', 'mensual'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFreqFilter(f)}
            className={`h-8 px-4 rounded-xl text-[11px] font-semibold transition-all ${
              freqFilter === f
                ? 'bg-electric text-white'
                : 'bg-[var(--color-charcoal)] text-slate-400 border border-[var(--panel-border)] hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todas' : FREQ_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Task List ── */}
        <div className="lg:col-span-3 space-y-4">
          {grouped.size === 0 && (
            <div className="bento-card flex flex-col items-center justify-center py-16 text-center opacity-40">
              <CheckSquare size={40} className="text-slate-600 mb-4" />
              <p className="text-sm font-semibold text-slate-500">No hay tareas activas</p>
              <p className="text-xs text-slate-600 mt-1">Crea una nueva tarea con el botón de arriba</p>
            </div>
          )}

          {Array.from(grouped.entries()).map(([empId, empTasks]) => {
            const emp = employees.find(e => e.id === empId);
            return (
              <div key={empId} className="bento-card space-y-3">
                {/* Employee header */}
                <div className="flex items-center gap-3 mb-4">
                  {emp?.avatarUrl && (
                    <img src={emp.avatarUrl} className="w-8 h-8 rounded-xl object-cover" alt={emp.name} />
                  )}
                  <div>
                    <p className="text-[var(--color-titanium)] text-sm font-semibold">{emp?.name ?? 'Empleado'}</p>
                    <p className="text-slate-500 text-[10px]">{emp?.position}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded-lg border border-[var(--panel-border)]">
                    {empTasks.length} tarea{empTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {empTasks.map(task => {
                  const dueToday = isTaskDueToday(task);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all group ${
                        dueToday
                          ? 'bg-crimson/5 border-crimson/20'
                          : 'bg-white/[0.02] border-[var(--panel-border)] hover:bg-white/[0.04]'
                      }`}
                    >
                      <button
                        onClick={() => onUpdateTask({ ...task, status: STATUS_CYCLE[task.status] })}
                        className="flex-shrink-0 transition-transform active:scale-90"
                      >
                        <StatusIcon status={task.status} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-[var(--color-titanium)]'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            task.frequency === 'semanal' ? 'bg-electric/10 text-electric' :
                            task.frequency === 'mensual' ? 'bg-gold/10 text-gold' :
                            'bg-white/5 text-slate-400'
                          }`}>
                            {FREQ_LABELS[task.frequency]}
                          </span>
                          {task.frequency === 'semanal' && task.reviewDay !== undefined && (
                            <span className="text-[9px] text-slate-500">· {DAYS[task.reviewDay]}</span>
                          )}
                          {task.frequency === 'mensual' && task.reviewDay !== undefined && (
                            <span className="text-[9px] text-slate-500">· Día {task.reviewDay}</span>
                          )}
                          {task.frequency === 'única' && task.dueDate && (
                            <span className="text-[9px] text-slate-500">· {new Date(task.dueDate + 'T12:00:00').toLocaleDateString()}</span>
                          )}
                          {dueToday && <span className="badge-today">HOY</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-crimson transition-all flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── New Task Form ── */}
        <div className="lg:col-span-2">
          <div className="bento-card sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-electric/10 rounded-xl flex items-center justify-center text-electric">
                <Plus size={18} />
              </div>
              <div>
                <h3 className="text-[var(--color-titanium)] text-sm font-semibold">Nueva Tarea</h3>
                <p className="text-slate-500 text-[10px]">Asigna y define la frecuencia</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Reporte semanal de ventas"
                  required
                  className="w-full bg-white/5 border border-[var(--panel-border)] rounded-xl h-10 px-3 text-sm text-[var(--color-titanium)] placeholder:text-slate-600 focus:ring-1 focus:ring-electric transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Empleado</label>
                <select
                  value={empId}
                  onChange={e => setEmpId(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-[var(--panel-border)] rounded-xl h-10 px-3 text-sm text-[var(--color-titanium)] focus:ring-1 focus:ring-electric transition-all appearance-none"
                >
                  <option value="" className="bg-[#1A1A1E]">Seleccionar empleado…</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id} className="bg-[#1A1A1E]">{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalles de la tarea…"
                  rows={2}
                  className="w-full bg-white/5 border border-[var(--panel-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-titanium)] placeholder:text-slate-600 focus:ring-1 focus:ring-electric transition-all resize-none"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Frecuencia</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['única', 'semanal', 'mensual'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`h-9 rounded-xl text-[11px] font-semibold transition-all border ${
                        frequency === f
                          ? 'bg-electric/15 border-electric/30 text-electric'
                          : 'bg-white/5 border-[var(--panel-border)] text-slate-400 hover:text-white'
                      }`}
                    >
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional fields */}
              {frequency === 'semanal' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Día de Revisión</label>
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewDay(i)}
                        className={`h-8 rounded-lg text-[9px] font-bold transition-all ${
                          reviewDay === i ? 'bg-electric text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {d.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === 'mensual' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Día del Mes (1-28)</label>
                  <input
                    type="number"
                    min={1} max={28}
                    value={reviewDay || 1}
                    onChange={e => setReviewDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full bg-white/5 border border-[var(--panel-border)] rounded-xl h-10 px-3 text-sm text-[var(--color-titanium)] focus:ring-1 focus:ring-electric transition-all"
                  />
                </div>
              )}

              {frequency === 'única' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Fecha Límite</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-white/5 border border-[var(--panel-border)] rounded-xl h-10 px-3 text-sm text-[var(--color-titanium)] focus:ring-1 focus:ring-electric transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 bg-electric text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-electric-light transition-all active:scale-95 shadow-lg shadow-electric/20 mt-2"
              >
                <CheckSquare size={16} />
                Agregar Tarea
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
