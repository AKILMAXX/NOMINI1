
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Employee } from '../types';

interface HRAgentProps {
  employees: Employee[];
  stats: any;
}

export const HRAgent: React.FC<HRAgentProps> = ({ employees, stats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userMessage = query;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setQuery('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `CONTEXTO DEL SISTEMA NOMINI:
      - Empleados: ${JSON.stringify(employees.map(e => ({ n: e.name, p: e.position, d: e.department, s: e.baseWeeklySalary })))}
      - Métricas actuales: Nómina total ${stats.total}, Ratio bonos ${((stats.totalBonus / stats.total) * 100).toFixed(1)}%, Asistencia ${stats.attendanceRate.toFixed(1)}%.
      
      PREGUNTA DEL USUARIO: ${userMessage}
      
      INSTRUCCIÓN: Responde como Marcus Chen (AI Version), un Chief People Officer de alto nivel. Sé estratégico, directo, utiliza términos de negocios y aporta valor basado en los datos proporcionados. Si te piden un consejo, sé audaz y profesional. Responde en español.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "Eres el cerebro estratégico de NOMINI. Tu objetivo es optimizar el capital humano y la rentabilidad financiera. Eres analítico, ejecutivo y visionario."
        }
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "No logré procesar el análisis. Intente de nuevo." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "Error de conexión con el núcleo de inteligencia." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative z-[100]">
      {/* Botón de Entrada Táctica */}
      {!isOpen && (
        <div 
          onClick={() => setIsOpen(true)}
          className="bg-charcoal-lighter/80 border border-electric/30 p-6 rounded-[2.5rem] flex items-center justify-between cursor-pointer hover:border-electric hover:bg-electric/5 transition-all group shadow-2xl backdrop-blur-xl animate-slide-in"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 bg-electric/20 rounded-2xl flex items-center justify-center text-electric group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-3xl">smart_toy</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald rounded-full border-2 border-charcoal animate-pulse"></div>
            </div>
            <div>
              <h4 className="text-white text-lg font-black tracking-tighter uppercase italic">Strategic Advisor AI</h4>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Online & Synchronized with Vault</p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] font-black text-electric uppercase tracking-widest mb-1">Análisis Proactivo</span>
            <p className="text-slate-300 text-[10px] font-bold italic">"He detectado 2 áreas de mejora en la distribución de bonos..."</p>
          </div>
          <span className="material-symbols-outlined text-slate-600 group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
        </div>
      )}

      {/* Interfaz de Comando Expandida */}
      {isOpen && (
        <div className="bg-charcoal-darker border border-white/10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col h-[500px] animate-slide-in overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-electric/20 rounded-xl flex items-center justify-center text-electric">
                  <span className="material-symbols-outlined">terminal</span>
               </div>
               <div>
                  <h4 className="text-white text-sm font-black uppercase tracking-widest">Command Interface</h4>
                  <p className="text-[8px] font-black text-emerald uppercase tracking-[0.4em]">Active Real-time Processing</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-white transition-colors">
               <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                 <div className="w-20 h-20 bg-electric/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="material-symbols-outlined text-5xl">cognition</span>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] max-w-[200px]">
                   Listo para auditar la nómina y sugerir estrategias de crecimiento.
                 </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                <div className={`max-w-[80%] p-5 rounded-3xl text-xs font-bold leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-electric text-white rounded-tr-none shadow-xl shadow-electric/20' 
                    : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none italic'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex gap-2">
                   <div className="w-1.5 h-1.5 bg-electric rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-electric rounded-full animate-bounce delay-100"></div>
                   <div className="w-1.5 h-1.5 bg-electric rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/[0.01] border-t border-white/5">
             <form onSubmit={handleAsk} className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask for strategic advice (e.g. 'Optimize payroll cost')"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-6 pr-20 text-xs text-white placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all"
                />
                <button 
                  type="submit"
                  disabled={isTyping}
                  className="absolute right-2 top-2 h-10 px-6 bg-electric text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  SEND
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
