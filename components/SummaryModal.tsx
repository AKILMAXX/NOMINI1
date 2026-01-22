
import React from 'react';
import { FinalSummary } from '../types';
import { formatCurrency } from '../utils';

interface SummaryModalProps {
  summaries: FinalSummary[];
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ summaries, onClose }) => {
  const grandTotal = summaries.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#121213]/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-[#1A1A1B] w-full max-w-lg rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-black text-white leading-tight">Nómina Finalizada</h2>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Resumen de Exportación Generado</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
          {summaries.map((s, idx) => (
            <div key={idx} className="bg-black/20 p-4 rounded-lg border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-black">{s.name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  Base: {formatCurrency(s.basePay)} | Bono: {formatCurrency(s.bonus)}
                  {s.liquidation && ` | Liquidación Incluida`}
                </p>
              </div>
              <p className="text-emerald font-black">{formatCurrency(s.total)}</p>
            </div>
          ))}
        </div>

        <div className="p-6 bg-electric/10 border-t border-white/10 flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Total General del Lote</p>
            <p className="text-3xl font-black text-white">{formatCurrency(grandTotal)}</p>
          </div>
          <button 
            onClick={onClose}
            className="bg-emerald hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95"
          >
            Confirmar y Registrar
          </button>
        </div>
      </div>
    </div>
  );
};
