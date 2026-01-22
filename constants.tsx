
import { Employee, PayrollWeek, FinalSummary } from './types';
import { generateId } from './utils';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Marcus V. Chen',
    position: 'Líder de Logística',
    department: 'Logística',
    baseWeeklySalary: 50,
    weeklyBonus: 0,
    hireDate: '2021-03-15',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    name: 'Elena Rodríguez',
    position: 'Gerente de Operaciones',
    department: 'Operaciones',
    baseWeeklySalary: 50,
    weeklyBonus: 0,
    hireDate: '2019-11-22',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    name: 'David K. Wu',
    position: 'Supervisor de Flota',
    department: 'Flota',
    baseWeeklySalary: 50,
    weeklyBonus: 0,
    hireDate: '2023-01-10',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
  },
  {
    id: '4',
    name: 'Sofía Martínez',
    position: 'Administradora de RRHH',
    department: 'Administración',
    baseWeeklySalary: 50,
    weeklyBonus: 0,
    hireDate: '2022-06-05',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
  }
];

export const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Nuevas categorías integradas
export const DEPARTMENTS: string[] = [
  'Logística', 
  'Operaciones', 
  'Flota', 
  'Administración',
  'Marketing',
  'Depositario',
  'Vendedor',
  'Seguridad',
  'Gerente',
  'Contabilidad'
];

// Generación de 8 semanas de historial (2 meses)
const generateMockHistory = (): PayrollWeek[] => {
  const history: PayrollWeek[] = [];
  const baseDate = new Date();
  
  for (let i = 8; i > 0; i--) {
    const weekDate = new Date(baseDate);
    weekDate.setDate(baseDate.getDate() - (i * 7));
    
    const summaries: FinalSummary[] = INITIAL_EMPLOYEES.map(emp => {
      // Calculation of mock values to satisfy the FinalSummary interface
      const theoreticalBase = emp.baseWeeklySalary;
      const dailyRate = theoreticalBase / 6;
      let daysWorked = 6;
      let holidaysWorked = 0;
      let unpaidDaysAmount = 0;
      let holidayExtraPay = 0;
      
      const rand = Math.random();
      // Randomly simulate an absence
      if (rand > 0.8) {
        daysWorked = 5;
        unpaidDaysAmount = dailyRate;
      }
      // Randomly simulate a holiday worked
      if (rand < 0.1) {
        holidaysWorked = 1;
        holidayExtraPay = dailyRate;
      }

      const basePay = (theoreticalBase - unpaidDaysAmount) + holidayExtraPay;
      
      // Fix: Added missing properties extraHoursCount and extraHoursPay to comply with FinalSummary type at line 73
      const extraHoursCount = 0;
      const extraHoursPay = 0;

      return {
        employeeId: emp.id,
        name: emp.name,
        department: emp.department as any,
        basePay: basePay,
        theoreticalBase: theoreticalBase,
        unpaidDaysAmount: unpaidDaysAmount,
        holidayExtraPay: holidayExtraPay,
        extraHoursCount: extraHoursCount,
        extraHoursPay: extraHoursPay,
        bonus: emp.weeklyBonus,
        daysWorked: daysWorked,
        holidaysWorked: holidaysWorked,
        total: basePay + extraHoursPay + emp.weeklyBonus
      };
    });

    history.push({
      id: generateId(),
      date: weekDate.toISOString(),
      label: `Semana ${9 - i}`,
      summaries: summaries,
      totalDisbursement: summaries.reduce((acc, s) => acc + s.total, 0)
    });
  }
  return history;
};

export const MOCK_HISTORY = generateMockHistory();
