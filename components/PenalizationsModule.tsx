
import React, { useState } from 'react';
import { Employee, Penalization } from '../types';
import { formatCurrency, generateId } from '../utils';

interface PenalizationsModuleProps {
  employees: Employee[];
  penalizations: Penalization[];
  onAddPenalization: (p: Penalization) => void;
}

const CATEGORIES = [
  { name: 'Puntualidad', reason: 'Llegar después de la 1:00 PM (Hora de preparación).', consequence: 'Descuento $2 a $5.' },
  { name: 'Abandono', reason: 'Irse antes del cierre (10 PM / 12 AM) sin permiso.', consequence: 'Multa inmediata por abandono.' },
  { name: 'Descuido Físico', reason: 'Dañar mobiliario o equipo por descuido.', consequence: 'Cobro de reparación o reemplazo.' },
  { name: 'Consumo', reason: 'Comer o jugar sin pagar/registrar (Autodescuento).', consequence: 'Falta Grave + Cobro de consumo.' },
  { name: 'Disciplina', reason: 'Uso de celular atendiendo clientes o mala higiene.', consequence: 'Escala progresiva ($2-$5).' },
];

export const PenalizationsModule: React.FC<PenalizationsModuleProps> = ({ employees, penalizations, onAddPenalization }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0].name);
  const [customReason, setCustomReason] = useState('');
  const [amount, setAmount] = useState(0);
  const [weeks, setWeeks] = useState(1);

  const activePenals = penalizations.filter(p => p.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || amount <= 0) return;

    const newPenal: Penalization = {
      id: generateId(),
      employeeId: selectedEmpId,
      category: selectedCat as any,
      reason: customReason || CATEGORIES.find(c => c.name === selectedCat)?.reason || '',
      amount: amount,
      totalWeeks: weeks,
      remainingWeeks: weeks,
      weeklyInstallment: amount / weeks,
      dateCreated: new Date().toISOString(),
      status: 'active'
    };

    onAddPenalization(newPenal);
    setIsAdding(false);
    setSelectedEmpId('');
    setAmount(0);
    setWeeks(1);
    setCustomReason('');
  };

  return (
    <div className="space-y-12 animate-slide-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Control Disciplinario</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2">Gestión de Penalizaciones y Cargos a Cuenta</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="h-14 px-8 bg-crimson text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl shadow-crimson/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">gavel</span>
          Aplicar Penalización
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Penalizaciones Vigentes</h4>
           {activePenals.length === 0 ? (
             <div className="bg-charcoal p-16 rounded-[3rem] border border-dashed border-white/10 text-center flex flex-col items-center opacity-40">
                <span className="material-symbols-outlined text-6xl mb-4">verified_user</span>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Sin cargos disciplinarios pendientes</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {activePenals.map(p => {
                 const emp = employees.find(e => e.id === p.employeeId);
                 return (
                   <div key={p.id} className="bg-charcoal p-7 rounded-[2rem] border border-crimson/10 relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={emp?.avatarUrl} className="w-12 h-12 rounded-xl object-cover grayscale border border-white/10" />
                        <div>
                          <p className="text-white text-sm font-black">{emp?.name}</p>
                          <div className="flex items-center gap-2">
                             <span className="bg-crimson/10 text-crimson text-[8px] font-black px-2 py-0.5 rounded uppercase">{p.category}</span>
                             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{p.remainingWeeks} Semanas rest.</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mb-6 italic leading-relaxed">"{p.reason}"</p>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Monto Pendiente</p>
                            <p className="text-white text-xl font-black italic">{formatCurrency(p.remainingWeeks * p.weeklyInstallment)}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Deducción Semanal</p>
                            <p className="text-crimson text-xl font-black italic">-{formatCurrency(p.weeklyInstallment)}</p>
                         </div>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        <div className="bg-charcoal-darker border border-white/5 p-10 rounded-[3rem] h-fit sticky top-32">
           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Tabla de Regulaciones</h4>
           <div className="space-y-6">
              {CATEGORIES.map(c => (
                <div key={c.name} className="group">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-crimson"></div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{c.name}</p>
                   </div>
                   <p className="text-[9px] text-slate-500 font-bold leading-tight group-hover:text-slate-300 transition-colors">{c.reason}</p>
                   <p className="text-[8px] font-black text-crimson uppercase mt-1 italic">{c.consequence}</p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAdding(false)}></div>
          <form 
            onSubmit={handleSubmit}
            className="relative bg-charcoal-lighter border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-in p-10 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-crimson/20 rounded-2xl flex items-center justify-center text-crimson">
                  <span className="material-symbols-outlined text-3xl">report_problem</span>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Nueva Penalización</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Procedimiento Disciplinario Estándar</p>
               </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sujeto a Penalizar</label>
                <select 
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-6 text-sm text-white focus:ring-1 focus:ring-crimson transition-all"
                  required
                >
                  <option value="" disabled className="bg-charcoal text-slate-500">Seleccionar empleado...</option>
                  {employees.map(e => <option key={e.id} value={e.id} className="bg-charcoal text-white">{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Categoría de la Falta</label>
                <div className="grid grid-cols-2 gap-2">
                   {CATEGORIES.map(c => (
                     <button
                       key={c.name}
                       type="button"
                       onClick={() => setSelectedCat(c.name)}
                       className={`p-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center ${
                         selectedCat === c.name ? 'bg-crimson text-white shadow-lg' : 'bg-white/5 text-slate-500 border border-white/5'
                       }`}
                     >
                       {c.name}
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Monto del Cargo ($)</label>
                <input 
                  type="number"
                  value={amount || ''}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-6 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-crimson transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fraccionar en Semanas</label>
                <div className="flex gap-2">
                   {[1, 2, 4, 8].map(w => (
                     <button
                       key={w}
                       type="button"
                       onClick={() => setWeeks(w)}
                       className={`flex-1 h-12 rounded-xl text-[10px] font-black transition-all ${
                         weeks === w ? 'bg-white text-black shadow-lg scale-105' : 'bg-white/5 text-slate-600 border border-white/5'
                       }`}
                     >
                       {w} SEM
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Justificación Específica</label>
                <textarea 
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder={CATEGORIES.find(c => c.name === selectedCat)?.reason}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-xs text-white placeholder:text-slate-700 focus:ring-1 focus:ring-crimson transition-all resize-none h-24"
                />
              </div>

              {amount > 0 && (
                <div className="bg-crimson/10 p-6 rounded-2xl border border-crimson/20 flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deducción Semanal</p>
                      <p className="text-crimson text-2xl font-black italic">-{formatCurrency(amount / weeks)}</p>
                   </div>
                   <span className="material-symbols-outlined text-crimson text-4xl">gavel</span>
                </div>
              )}
            </div>

            <div className="mt-10 flex gap-4">
               <button 
                 type="button"
                 onClick={() => setIsAdding(false)}
                 className="flex-1 h-14 rounded-2xl border border-white/10 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                 type="submit"
                 className="flex-1 h-14 rounded-2xl bg-crimson text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-crimson/20 active:scale-95 transition-all"
               >
                 Aplicar Cargo
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
