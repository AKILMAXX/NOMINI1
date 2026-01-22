
import React, { useState } from 'react';
import { Employee, Loan } from '../types';
import { formatCurrency, generateId } from '../utils';

interface LoansModuleProps {
  employees: Employee[];
  loans: Loan[];
  onAddLoan: (loan: Loan) => void;
}

export const LoansModule: React.FC<LoansModuleProps> = ({ employees, loans, onAddLoan }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [weeks, setWeeks] = useState<number>(4);
  const [notes, setNotes] = useState('');

  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || amount <= 0) return;

    const newLoan: Loan = {
      id: generateId(),
      employeeId: selectedEmpId,
      amount: amount,
      totalWeeks: weeks,
      remainingWeeks: weeks,
      weeklyInstallment: amount / weeks,
      dateRequested: new Date().toISOString(),
      status: 'active',
      notes: notes.trim() || undefined
    };

    onAddLoan(newLoan);
    setIsRequesting(false);
    setSelectedEmpId('');
    setAmount(0);
    setWeeks(4);
    setNotes('');
  };

  return (
    <div className="space-y-12 animate-slide-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Centro Financiero</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2">Gestión de Préstamos y Créditos Internos</p>
        </div>
        <button 
          onClick={() => setIsRequesting(true)}
          className="h-14 px-8 bg-electric text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl shadow-electric/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">add_card</span>
          Solicitar Préstamo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Créditos en Curso</h4>
            {activeLoans.length === 0 ? (
              <div className="bg-charcoal p-12 rounded-[3rem] border border-dashed border-white/10 text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-slate-700 text-5xl mb-4">money_off</span>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">No hay préstamos activos detectados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLoans.map(loan => {
                  const emp = employees.find(e => e.id === loan.employeeId);
                  return (
                    <div key={loan.id} className="bg-charcoal p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={emp?.avatarUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                        <div>
                          <p className="text-white text-sm font-black">{emp?.name}</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{emp?.position}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Monto Total</p>
                            <p className="text-white text-lg font-black">{formatCurrency(loan.amount)}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Cuota Semanal</p>
                            <p className="text-emerald text-lg font-black">{formatCurrency(loan.weeklyInstallment)}</p>
                         </div>
                      </div>
                      
                      {loan.notes && (
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-4">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Observaciones</p>
                          <p className="text-[10px] text-slate-300 italic line-clamp-2">{loan.notes}</p>
                        </div>
                      )}

                      <div className="mt-2">
                         <div className="flex justify-between items-center mb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progreso de Pago</p>
                            <p className="text-[9px] font-black text-white uppercase">{loan.totalWeeks - loan.remainingWeeks} / {loan.totalWeeks} Semanas</p>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-electric rounded-full transition-all duration-1000"
                              style={{ width: `${((loan.totalWeeks - loan.remainingWeeks) / loan.totalWeeks) * 100}%` }}
                            ></div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {paidLoans.length > 0 && (
             <div>
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Archivo de Liquidados</h4>
                <div className="space-y-3">
                  {paidLoans.map(loan => {
                    const emp = employees.find(e => e.id === loan.employeeId);
                    return (
                      <div key={loan.id} className="bg-charcoal-lighter/30 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <span className="material-symbols-outlined text-emerald bg-emerald/10 p-2 rounded-lg">verified</span>
                           <div>
                             <p className="text-slate-300 text-xs font-bold">{emp?.name}</p>
                             <p className="text-[9px] text-slate-600 font-black uppercase">{formatCurrency(loan.amount)} • Pagado en {loan.totalWeeks} Semanas</p>
                           </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald uppercase tracking-widest italic opacity-0 group-hover:opacity-100 transition-opacity">CLEARANCE OK</span>
                      </div>
                    );
                  })}
                </div>
             </div>
          )}
        </div>

        <div className="bg-charcoal-darker border border-white/5 p-10 rounded-[3rem] h-fit">
           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Estructura de Riesgo</h4>
           <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                 <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Capital Expuesto</p>
                    <p className="text-white text-3xl font-black tracking-tighter italic">
                       {formatCurrency(activeLoans.reduce((acc, l) => acc + (l.remainingWeeks * l.weeklyInstallment), 0))}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Tasa de Mora</p>
                    <p className="text-emerald text-xl font-black italic">0.00%</p>
                 </div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 leading-relaxed">
                   Las deducciones se aplican automáticamente cada cierre de ciclo semanal.
                 </p>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-electric rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-electric uppercase tracking-widest">Protocolo de Bóveda Activo</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {isRequesting && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsRequesting(false)}></div>
          <form 
            onSubmit={handleSubmit}
            className="relative bg-charcoal-lighter border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-in p-10 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-8">Nuevo Crédito Interno</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Seleccionar Beneficiario</label>
                <select 
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-6 text-sm text-white focus:ring-1 focus:ring-electric transition-all"
                  required
                >
                  <option value="" disabled className="bg-charcoal text-slate-500">Seleccionar empleado...</option>
                  {employees.map(e => <option key={e.id} value={e.id} className="bg-charcoal text-white">{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Monto Solicitado ($)</label>
                <input 
                  type="number"
                  value={amount || ''}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-6 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Plazo de Pago (Máx 8 Semanas)</label>
                <div className="flex gap-2 flex-wrap">
                   {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                     <button
                       key={w}
                       type="button"
                       onClick={() => setWeeks(w)}
                       className={`flex-1 min-w-[50px] h-12 rounded-xl text-[10px] font-black transition-all ${
                         weeks === w ? 'bg-electric text-white shadow-lg shadow-electric/20 scale-105' : 'bg-white/5 text-slate-600 border border-white/5'
                       }`}
                     >
                       {w} SEM
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Notas / Justificación</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Escriba el motivo del préstamo o condiciones especiales..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-xs text-white placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all resize-none h-24"
                />
              </div>

              {amount > 0 && (
                <div className="bg-electric/10 p-6 rounded-2xl border border-electric/20 flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deducción Semanal Proyectada</p>
                      <p className="text-white text-2xl font-black italic">{formatCurrency(amount / weeks)}</p>
                   </div>
                   <span className="material-symbols-outlined text-electric text-4xl">payments</span>
                </div>
              )}
            </div>

            <div className="mt-10 flex gap-4">
               <button 
                 type="button"
                 onClick={() => setIsRequesting(false)}
                 className="flex-1 h-14 rounded-2xl border border-white/10 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                 type="submit"
                 className="flex-1 h-14 rounded-2xl bg-emerald text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald/20 active:scale-95 transition-all"
               >
                 Aprobar Crédito
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
