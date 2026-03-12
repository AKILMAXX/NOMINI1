/**
 * NOMINI - Capa de acceso a datos
 *
 * Si Supabase está configurado → persiste en la nube.
 * Si no → trabaja completamente en memoria (comportamiento actual).
 *
 * Algoritmo de Corte Semanal (Anti-Favoritismo):
 *   Pago Neto = (Salario Base + Horas Extra) - (Cuota Préstamo + Penalizaciones)
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Employee, Loan, Penalization, PayrollWeek, Task } from '../types';

// ─── EMPLEADOS ────────────────────────────────────────────────────────────────

export async function fetchEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('empleados')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('[NOMINI] fetchEmployees:', error.message); return []; }
  return data.map(mapEmployee);
}

export async function upsertEmployee(emp: Employee): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('empleados').upsert({
    id: emp.id,
    name: emp.name,
    position: emp.position,
    department: emp.department,
    base_weekly_salary: emp.baseWeeklySalary,
    weekly_bonus: emp.weeklyBonus,
    hire_date: emp.hireDate,
    avatar_url: emp.avatarUrl,
    fecha_nacimiento: emp.birthdayDate ?? null,
  }, { onConflict: 'id' });
  if (error) console.error('[NOMINI] upsertEmployee:', error.message);
}

export async function deleteEmployee(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('empleados').delete().eq('id', id);
  if (error) console.error('[NOMINI] deleteEmployee:', error.message);
}

// ─── PRÉSTAMOS ────────────────────────────────────────────────────────────────

export async function fetchLoans(): Promise<Loan[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('[NOMINI] fetchLoans:', error.message); return []; }
  return data.map(mapLoan);
}

export async function upsertLoan(loan: Loan): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('prestamos').upsert({
    id: loan.id,
    employee_id: loan.employeeId,
    amount: loan.amount,
    total_weeks: loan.totalWeeks,
    remaining_weeks: loan.remainingWeeks,
    weekly_installment: loan.weeklyInstallment,
    date_requested: loan.dateRequested,
    status: loan.status,
    notes: loan.notes ?? null,
  }, { onConflict: 'id' });
  if (error) console.error('[NOMINI] upsertLoan:', error.message);
}

// ─── PENALIZACIONES ──────────────────────────────────────────────────────────

export async function fetchPenalizations(): Promise<Penalization[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('penalizaciones')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('[NOMINI] fetchPenalizations:', error.message); return []; }
  return data.map(mapPenalization);
}

export async function upsertPenalization(pen: Penalization): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('penalizaciones').upsert({
    id: pen.id,
    employee_id: pen.employeeId,
    category: pen.category,
    reason: pen.reason,
    amount: pen.amount,
    total_weeks: pen.totalWeeks,
    remaining_weeks: pen.remainingWeeks,
    weekly_installment: pen.weeklyInstallment,
    date_created: pen.dateCreated,
    status: pen.status,
  }, { onConflict: 'id' });
  if (error) console.error('[NOMINI] upsertPenalization:', error.message);
}

// ─── NÓMINAS SEMANALES ────────────────────────────────────────────────────────

export async function fetchPayrollHistory(): Promise<PayrollWeek[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('nominas_semanales')
    .select('*')
    .order('date', { ascending: true });
  if (error) { console.error('[NOMINI] fetchPayrollHistory:', error.message); return []; }
  return data.map(mapPayrollWeek);
}

export async function savePayrollWeek(week: PayrollWeek): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('nominas_semanales').upsert({
    id: week.id,
    date: week.date,
    label: week.label,
    summaries: week.summaries,
    total_disbursement: week.totalDisbursement,
  }, { onConflict: 'id' });
  if (error) console.error('[NOMINI] savePayrollWeek:', error.message);
}

// ─── MAPPERS (snake_case → camelCase) ────────────────────────────────────────

function mapEmployee(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    department: row.department,
    baseWeeklySalary: Number(row.base_weekly_salary),
    weeklyBonus: Number(row.weekly_bonus),
    hireDate: row.hire_date,
    avatarUrl: row.avatar_url ?? '',
    birthdayDate: row.fecha_nacimiento ?? undefined,
  };
}

// ─── TAREAS ───────────────────────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('tareas')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('[NOMINI] fetchTasks:', error.message); return []; }
  return data.map(mapTask);
}

export async function upsertTask(task: Task): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('tareas').upsert({
    id: task.id,
    employee_id: task.employeeId,
    title: task.title,
    description: task.description ?? null,
    frequency: task.frequency,
    review_day: task.reviewDay ?? null,
    due_date: task.dueDate ?? null,
    status: task.status,
    created_at: task.createdAt,
  }, { onConflict: 'id' });
  if (error) console.error('[NOMINI] upsertTask:', error.message);
}

export async function deleteTask(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) console.error('[NOMINI] deleteTask:', error.message);
}

function mapTask(row: any): Task {
  return {
    id: row.id,
    employeeId: row.employee_id,
    title: row.title,
    description: row.description ?? undefined,
    frequency: row.frequency,
    reviewDay: row.review_day ?? undefined,
    dueDate: row.due_date ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapLoan(row: any): Loan {
  return {
    id: row.id,
    employeeId: row.employee_id,
    amount: Number(row.amount),
    totalWeeks: row.total_weeks,
    remainingWeeks: row.remaining_weeks,
    weeklyInstallment: Number(row.weekly_installment),
    dateRequested: row.date_requested,
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

function mapPenalization(row: any): Penalization {
  return {
    id: row.id,
    employeeId: row.employee_id,
    category: row.category,
    reason: row.reason,
    amount: Number(row.amount),
    totalWeeks: row.total_weeks,
    remainingWeeks: row.remaining_weeks,
    weeklyInstallment: Number(row.weekly_installment),
    dateCreated: row.date_created,
    status: row.status,
  };
}

function mapPayrollWeek(row: any): PayrollWeek {
  return {
    id: row.id,
    date: row.date,
    label: row.label,
    summaries: row.summaries,
    totalDisbursement: Number(row.total_disbursement),
  };
}
