
import React, { useState, useEffect } from 'react';
import { NotificationSettings } from '../types';

interface SettingsMenuProps {
  departments: string[];
  setDepartments: React.Dispatch<React.SetStateAction<string[]>>;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onLogout: () => void;
  onExport: () => void;
  onClose: () => void;
  onTabSwitch?: (tab: string) => void;
  initialView?: 'main' | 'departments' | 'security' | 'notifications';
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
  departments, 
  setDepartments, 
  notificationSettings,
  setNotificationSettings,
  onLogout, 
  onExport, 
  onClose,
  onTabSwitch,
  initialView = 'main',
  theme,
  onThemeChange
}) => {
  const [view, setView] = useState<'main' | 'departments' | 'security' | 'notifications'>(initialView);
  const [newDept, setNewDept] = useState('');
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  useEffect(() => {
    if (initialView) setView(initialView);
  }, [initialView]);

  const addDepartment = () => {
    if (newDept && !departments.includes(newDept)) {
      setDepartments([...departments, newDept]);
      setNewDept('');
    }
  };

  const removeDepartment = (dept: string) => {
    setDepartments(departments.filter(d => d !== dept));
  };

  const toggleNotification = (key: keyof Omit<NotificationSettings, 'soundType'>) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSoundSelection = (sound: NotificationSettings['soundType']) => {
    setNotificationSettings(prev => ({ ...prev, soundType: sound }));
    setPlayingSound(sound);
    setTimeout(() => setPlayingSound(null), 1200);
  };

  const sounds: NotificationSettings['soundType'][] = ['classic', 'modern', 'glass', 'industrial', 'cashier', 'coins'];

  return (
    <div className="fixed inset-0 z-[200] flex justify-end p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
      
      <div className="relative w-full max-sm:max-w-none max-w-sm bg-charcoal-lighter border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-slide-in pointer-events-auto">
        
        {/* Profile Header */}
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" className="w-16 h-16 rounded-2xl object-cover grayscale" alt="CEO" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald rounded-full border-2 border-charcoal-lighter"></div>
            </div>
            <div>
              <h3 className="text-titanium text-xl font-black tracking-tight leading-none">Marcus Chen</h3>
              <p className="text-[9px] font-black text-electric uppercase tracking-[0.3em] mt-2">Chief Executive Officer</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {view === 'main' && (
            <div className="space-y-4">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Administración</p>
              
              <button onClick={() => setView('departments')} className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-electric group-hover:scale-110 transition-transform">corporate_fare</span>
                  <span className="text-sm font-bold text-titanium">Departamentos</span>
                </div>
                <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward_ios</span>
              </button>

              <button 
                onClick={() => onTabSwitch?.('PENALIZACION')}
                className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-crimson group-hover:rotate-12 transition-transform">gavel</span>
                  <span className="text-sm font-bold text-titanium">Control Disciplinario</span>
                </div>
                <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward_ios</span>
              </button>

              <button 
                onClick={() => onTabSwitch?.('LIQUIDACION')}
                className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-crimson group-hover:scale-110 transition-transform">request_quote</span>
                  <span className="text-sm font-bold text-titanium">Simulador de Liquidación</span>
                </div>
                <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward_ios</span>
              </button>

              <button onClick={() => setView('notifications')} className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-emerald group-hover:animate-bounce">notifications_active</span>
                  <span className="text-sm font-bold text-titanium">Notificaciones</span>
                </div>
                <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward_ios</span>
              </button>

              <div className="pt-6 border-t border-white/5 mt-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 mb-4">Interfaz Visual</p>
                <div className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <span className={`material-symbols-outlined ${theme === 'dark' ? 'text-amber-500' : 'text-slate-400'}`}>
                      {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    </span>
                    <span className="text-sm font-bold text-titanium">{theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                  </div>
                  <button 
                    onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                    className={`w-12 h-6 rounded-full transition-all relative ${theme === 'dark' ? 'bg-electric shadow-lg shadow-electric/20' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'notifications' && (
            <div className="space-y-6 animate-slide-in">
              <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase mb-6">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Regresar
              </button>
              
              <div>
                <h4 className="text-titanium text-lg font-black italic uppercase mb-2">Canales de Alerta</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">Recordatorios operativos activos</p>
                
                <div className="space-y-4">
                  {[
                    { id: 'payroll', label: 'Cierre de Nómina Semanal', icon: 'payments', color: 'text-emerald', desc: 'Aviso los Viernes 5:00 PM' },
                    { id: 'loans', label: 'Vencimiento de Cuotas', icon: 'account_balance', color: 'text-electric', desc: 'Préstamos y adelantos' },
                    { id: 'attendance', label: 'Reportes de Asistencia', icon: 'person_check', color: 'text-amber-500', desc: 'Inasistencias detectadas' },
                    { id: 'security', label: 'Alertas de Seguridad', icon: 'lock_person', color: 'text-crimson', desc: 'Accesos a la bóveda' }
                  ].map((item) => (
                    <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                         </div>
                         <div>
                            <p className="text-xs font-bold text-titanium">{item.label}</p>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{item.desc}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => toggleNotification(item.id as any)}
                        className={`w-10 h-5 rounded-full transition-all relative ${notificationSettings[item.id as keyof NotificationSettings] ? 'bg-emerald' : 'bg-slate-300'}`}
                      >
                         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${notificationSettings[item.id as keyof NotificationSettings] ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <div className="flex justify-between items-end mb-4">
                   <h4 className="text-titanium text-xs font-black uppercase tracking-[0.2em]">Firma Auditiva</h4>
                   {playingSound && <span className="text-[8px] font-black text-electric animate-pulse uppercase tracking-widest">Previsualizando...</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {sounds.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSoundSelection(s)}
                      className={`h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        notificationSettings.soundType === s 
                          ? 'bg-electric text-white border-electric shadow-lg' 
                          : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-6 bg-emerald/5 rounded-3xl border border-emerald/10">
                 <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-emerald text-lg">event_repeat</span>
                    <p className="text-[9px] font-black text-emerald uppercase tracking-widest">Protocolo de Recordatorio</p>
                 </div>
                 <p className="text-[10px] text-slate-500 italic leading-relaxed">
                   "Se ha configurado un aviso acústico tipo '{notificationSettings.soundType}' para cada Viernes. Esto garantiza que la flota reciba sus pagos sin retrasos."
                 </p>
              </div>
            </div>
          )}

          {view === 'departments' && (
            <div className="space-y-6 animate-slide-in">
              <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase mb-6">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Regresar
              </button>
              <h4 className="text-titanium text-lg font-black italic uppercase mb-2">Categorías Organizacionales</h4>
              <div className="space-y-3">
                {departments.map(dept => (
                  <div key={dept} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 group">
                    <span className="text-xs font-bold text-titanium">{dept}</span>
                    <button onClick={() => removeDepartment(dept)} className="text-slate-700 hover:text-crimson transition-all opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
                <div className="pt-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={newDept}
                      onChange={e => setNewDept(e.target.value)}
                      placeholder="Añadir nueva categoría..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-4 pr-12 text-xs text-titanium placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all"
                    />
                    <button onClick={addDepartment} className="absolute right-2 top-2 h-10 w-10 bg-electric text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-all">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-8 border-t border-white/5 bg-crimson/5">
          <button onClick={onLogout} className="w-full h-14 bg-crimson text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest shadow-xl shadow-crimson/20 transition-all active:scale-95">
            <span className="material-symbols-outlined">logout</span> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
