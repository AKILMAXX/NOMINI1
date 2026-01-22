
import React, { useRef, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { toPng } from 'html-to-image';
import { PayrollWeek, FinalSummary, Employee } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ReportsModuleProps {
  history: PayrollWeek[];
  employees: Employee[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ history, employees }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
        <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
        <p className="text-sm font-bold uppercase tracking-widest">No hay datos históricos disponibles aún</p>
      </div>
    );
  }

  // Análisis de Asistencia para la IA (mantener la lógica para el prompt)
  const attendanceStats = useMemo(() => {
    return employees.map(emp => {
      let totalDaysPossible = history.length * 6;
      let totalDaysWorked = 0;
      history.forEach(week => {
        const summary = week.summaries.find(s => s.employeeId === emp.id);
        if (summary) {
          const dailyRate = emp.baseWeeklySalary / 6;
          const daysInWeek = Math.min(6, summary.basePay / (dailyRate || 1));
          totalDaysWorked += daysInWeek;
        }
      });
      const rate = (totalDaysWorked / (totalDaysPossible || 1)) * 100;
      return { name: emp.name, rate: rate.toFixed(1), status: rate >= 95 ? 'Excelencia' : rate >= 85 ? 'Estable' : 'Crítico' };
    });
  }, [history, employees]);

  const latestWeek = history[history.length - 1];
  const deptData = latestWeek.summaries.reduce((acc: any, curr: FinalSummary) => {
    const dept = curr.department;
    if (!acc[dept]) acc[dept] = 0;
    acc[dept] += curr.total;
    return acc;
  }, {});

  const pieData = Object.keys(deptData).map(name => ({
    name,
    value: deptData[name]
  }));

  const barData = history.map(week => ({
    name: week.label,
    Total: week.totalDisbursement,
    Bonos: week.summaries.reduce((acc, s) => acc + s.bonus, 0),
    Base: week.summaries.reduce((acc, s) => acc + s.basePay, 0)
  }));

  const avgSalaryData = Object.keys(deptData).map(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    const totalSalary = deptEmployees.reduce((acc, e) => acc + e.baseWeeklySalary, 0);
    return {
      name: dept,
      Promedio: totalSalary / (deptEmployees.length || 1)
    };
  });

  const COLORS = ['#0056D2', '#10B981', '#FFC107', '#D90429', '#8B5CF6'];

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Actúa como un Consultor Senior de RRHH. Analiza los datos de nómina y asistencia. 
      DATOS ASISTENCIA: ${JSON.stringify(attendanceStats)}
      DATOS FINANCIEROS: ${JSON.stringify(history.map(h => ({ l: h.label, t: h.totalDisbursement })))}
      Proporciona un análisis ejecutivo sobre la relación entre asistencia y costos. Responde en español de forma directa.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { systemInstruction: "Eres un experto en optimización de capital humano y disciplina operativa." }
      });
      setAiResponse(response.text || "Análisis no disponible.");
    } catch (err) {
      setAiResponse("Error en la conexión con el motor de IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPng = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(reportRef.current, { cacheBust: true, backgroundColor: '#121213', style: { padding: '20px' } });
      const link = document.createElement('a');
      link.download = `NOMINI-Report-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-12 animate-slide-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Inteligencia de Negocio</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2">Reportes Institucionales y Auditoría de Cumplimiento</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={handleAIAnalysis} disabled={isAnalyzing} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl bg-gradient-to-r from-electric to-purple-600 text-white">
            <span className="material-symbols-outlined text-sm">{isAnalyzing ? 'cycle' : 'bolt'}</span>
            {isAnalyzing ? 'Analizando...' : 'Análisis Estratégico AI'}
          </button>
          <button onClick={handleExportPng} disabled={isExporting} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl bg-charcoal-lighter text-white border border-white/10">
            <span className="material-symbols-outlined text-sm">ios_share</span>
            Exportar
          </button>
        </div>
      </div>

      {aiResponse && (
        <div className="bg-gradient-to-br from-electric/10 to-purple-900/10 border border-electric/20 p-8 rounded-[2.5rem] backdrop-blur-xl animate-slide-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <button onClick={() => setAiResponse(null)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
          </div>
          <div className="flex items-start gap-6">
            <div className="bg-electric/20 w-14 h-14 rounded-2xl flex items-center justify-center text-electric flex-shrink-0">
               <span className="material-symbols-outlined text-3xl">psychology</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-electric uppercase tracking-widest mb-4">Executive Insights Core</p>
              <div className="text-slate-200 text-sm leading-relaxed font-medium whitespace-pre-line prose prose-invert max-w-none">
                {aiResponse}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={reportRef} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-charcoal p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10">Estructura de Gastos Semanales</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252526" vertical={false} />
                  <XAxis dataKey="name" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 800 }} />
                  <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} tick={{ fontWeight: 800 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1B', border: '1px solid #333', borderRadius: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} />
                  <Bar dataKey="Base" fill="#0056D2" stackId="a" />
                  <Bar dataKey="Bonos" fill="#10B981" stackId="a" radius={[6, 6, 0, 0]} />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-charcoal p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10">Inversión por Departamento</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1B', border: '1px solid #333', borderRadius: '12px' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-inner">
           <div className="flex justify-between items-center mb-10">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Referencial Salarial Promedio</h4>
                <p className="text-slate-600 text-[10px] mt-1 italic">Basado en salario base semanal vigente</p>
              </div>
              <div className="bg-emerald/10 px-4 py-2 rounded-xl">
                 <span className="text-emerald text-[10px] font-black uppercase tracking-widest">Benchmarking Interno</span>
              </div>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgSalaryData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#525252" fontSize={10} width={100} axisLine={false} tickLine={false} tick={{ fontWeight: 800 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#1A1A1B', border: '1px solid #333', borderRadius: '12px' }} />
                  <Bar dataKey="Promedio" fill="#337FE2" radius={[0, 10, 10, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};
