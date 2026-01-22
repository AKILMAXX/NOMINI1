
export type EmployeeStatus = 'Activo' | 'Despedido' | 'Renunció' | 'Suspendido';
export type Department = 'Logística' | 'Operaciones' | 'Flota' | 'Administración' | 'Marketing' | 'Depositario' | 'Vendedor' | 'Seguridad' | 'Gerente' | 'Contabilidad';
export type DayStatus = 'worked' | 'absent' | 'holiday';

export interface NotificationSettings {
  loans: boolean;
  payroll: boolean;
  attendance: boolean;
  security: boolean;
  soundType: 'classic' | 'modern' | 'glass' | 'industrial' | 'cashier' | 'coins';
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: Department;
  baseWeeklySalary: number;
  weeklyBonus: number;
  hireDate: string;
  avatarUrl: string;
}

export interface Loan {
  id: string;
  employeeId: string;
  amount: number;
  totalWeeks: number;
  remainingWeeks: number;
  weeklyInstallment: number;
  dateRequested: string;
  status: 'active' | 'paid' | 'cancelled';
  notes?: string;
}

export interface Penalization {
  id: string;
  employeeId: string;
  category: 'Puntualidad' | 'Abandono' | 'Descuido Físico' | 'Consumo' | 'Disciplina';
  reason: string;
  amount: number;
  totalWeeks: number;
  remainingWeeks: number;
  weeklyInstallment: number;
  dateCreated: string;
  status: 'active' | 'cleared';
}

export interface AttendanceRecord {
  [employeeId: string]: DayStatus[]; 
}

export interface StatusRecord {
  [employeeId: string]: EmployeeStatus;
}

export interface SuspensionRecord {
  [employeeId: string]: string; // ISO Date of end
}

export interface LiquidationDetails {
  weeksOwed: number;
  severancePay: number;
  vacationPay: number;
  utilidadesPay: number;
  indemnityPay: number; // El "Doble" por despido (Art. 92 LOTTT)
  total: number;
}

export interface FinalSummary {
  employeeId: string;
  name: string;
  department: string;
  basePay: number;           
  theoreticalBase: number;   
  unpaidDaysAmount: number;  
  holidayExtraPay: number;   
  extraHoursCount: number;   
  extraHoursPay: number;     
  bonus: number;
  daysWorked: number;
  holidaysWorked: number;
  loanDeduction?: number;
  penalizationDeduction?: number;
  liquidation?: LiquidationDetails;
  total: number;
}

export interface PayrollWeek {
  id: string;
  date: string;
  label: string;
  summaries: FinalSummary[];
  totalDisbursement: number;
}
