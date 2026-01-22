
import { EmployeeStatus, LiquidationDetails } from './types';

export const calculateSeniority = (hireDate: string) => {
  const start = new Date(hireDate);
  const end = new Date();
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
};

export const calculateLiquidation = (
  baseWeeklySalary: number,
  hireDate: string,
  status: EmployeeStatus,
  unpaidWeekPay: number
): LiquidationDetails | null => {
  // Las suspensiones no generan liquidación ni deudas de prestaciones
  if (status === 'Activo' || status === 'Suspendido') return null;

  const { years, months } = calculateSeniority(hireDate);
  const dailySalary = baseWeeklySalary / 6;
  
  // 1. Prestaciones Sociales (Garantía): 30 días por año (Simplificado para el sistema)
  const daysPerYear = 30;
  const severancePay = (years * daysPerYear * dailySalary) + (months * (daysPerYear / 12) * dailySalary);
  
  // 2. Vacaciones Proporcionales: 15 días base + 1 por año
  const currentYearMonths = months % 12;
  const vacationDays = 15 + Math.min(years, 15); 
  const vacationPay = (currentYearMonths / 12) * vacationDays * dailySalary;

  // 3. Utilidades Proporcionales (Aguinaldos): Mínimo 15 días por año
  const utilidadesDays = 30; 
  const utilidadesPay = ((years * 12 + months) % 12 / 12) * utilidadesDays * dailySalary;

  // 4. INDEMNIZACIÓN (Art. 92 LOTTT)
  const indemnityPay = status === 'Despedido' ? severancePay : 0;

  return {
    weeksOwed: unpaidWeekPay,
    severancePay,
    vacationPay,
    utilidadesPay,
    indemnityPay,
    total: unpaidWeekPay + severancePay + vacationPay + utilidadesPay + indemnityPay
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const isVenezuelanHoliday = (date: Date): boolean => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fixedHolidays = [
    { m: 1, d: 1 }, { m: 4, d: 19 }, { m: 5, d: 1 }, { m: 6, d: 24 },
    { m: 7, d: 5 }, { m: 7, d: 24 }, { m: 10, d: 12 }, { m: 12, d: 24 },
    { m: 12, d: 25 }, { m: 12, d: 31 },
  ];
  return fixedHolidays.some(h => h.m === month && h.d === day);
};

export const getCurrentWeekDates = (): Date[] => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diffToMonday));
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};
