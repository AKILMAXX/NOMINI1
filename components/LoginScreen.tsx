import React, { useState, useEffect } from 'react';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'signup' | 'reset';

export const LoginScreen: React.FC = () => {
  const [mode, setMode]       = useState<AuthMode>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false); // signup confirmation
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('nomini_email');
    const savedPwd = localStorage.getItem('nomini_pwd');
    if (savedEmail && savedPwd) {
      setEmail(savedEmail);
      setPassword(savedPwd);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        if (rememberMe) {
          localStorage.setItem('nomini_email', email);
          localStorage.setItem('nomini_pwd', password);
        } else {
          localStorage.removeItem('nomini_email');
          localStorage.removeItem('nomini_pwd');
        }
      }
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setDone(true);
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) setError(error.message);
      else setResetSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-accent flex items-center justify-center mb-4 border border-accent/20">
            <Zap size={24} className="text-black" />
          </div>
          <p className="text-white text-3xl font-extrabold tracking-tight">NOMINI</p>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-2">SISTEMA CENTINELA</p>
        </div>

        {/* Card */}
        <div className="bg-base-surface border border-white/5 p-8">
          {done ? (
            <div className="text-center py-4">
              <p className="text-emerald font-semibold text-sm mb-2">¡Cuenta creada!</p>
              <p className="text-slate-400 text-xs">Revisa tu correo para confirmar, o inicia sesión si la confirmación está desactivada.</p>
              <button
                type="button"
                onClick={() => { setDone(false); setMode('login'); }}
                className="mt-5 w-full h-11 bg-electric text-white rounded-xl font-semibold text-sm hover:bg-electric-dark transition-all"
              >
                Iniciar sesión
              </button>
            </div>
          ) : resetSent ? (
            <div className="text-center py-4">
              <p className="text-emerald font-semibold text-sm mb-2">¡Correo enviado!</p>
              <p className="text-slate-400 text-xs">Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.</p>
              <button
                type="button"
                onClick={() => { setResetSent(false); setMode('login'); setError(null); }}
                className="mt-5 w-full h-11 bg-electric text-white rounded-xl font-semibold text-sm hover:bg-electric-dark transition-all"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <>
              {/* Mode toggle — solo login/signup */}
              {mode !== 'reset' && (
                <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                  {(['login', 'signup'] as ('login' | 'signup')[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError(null); }}
                      className={`flex-1 h-10 rounded-none text-[11px] font-bold tracking-widest uppercase transition-all ${
                        mode === m
                          ? 'bg-accent text-black'
                          : 'bg-black text-white/50 hover:text-white border border-white/5'
                      }`}
                    >
                      {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'reset' && (
                <div className="mb-5">
                  <p className="text-[var(--color-titanium)] text-sm font-semibold">Restablecer contraseña</p>
                  <p className="text-slate-500 text-xs mt-1">Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-[0.1em] mb-2">
                    Correo
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ACCESO@APENODE.COM"
                    className="w-full h-12 bg-black border border-white/10 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent transition-all font-mono"
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-[0.1em] mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 bg-black border border-white/10 px-4 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent transition-all font-mono"
                      />
                      <button
                        type="button"
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-accent transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-between items-center mt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-4 h-4 border border-white/20 bg-black group-hover:border-accent transition-colors">
                        <input
                          type="checkbox"
                          className="absolute opacity-0 w-full h-full cursor-pointer"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        {rememberMe && <div className="w-2.5 h-2.5 bg-accent" />}
                      </div>
                      <span className="text-[10px] text-white/50 group-hover:text-white transition-colors font-bold uppercase tracking-wider">
                        Guardar Autenticación
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(null); }}
                      className="text-[10px] text-white/30 hover:text-accent transition-colors uppercase font-bold tracking-wider"
                    >
                      RESTABLECER
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-crimson text-xs font-medium bg-crimson/10 border border-crimson/20 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-accent text-black font-extrabold text-[11px] tracking-[0.2em] uppercase hover:brightness-110 active:scale-95 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Cargando...'
                    : mode === 'login' ? 'Entrar'
                    : mode === 'signup' ? 'Crear cuenta'
                    : 'Enviar enlace de restablecimiento'}
                </button>

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="w-full text-center text-xs text-slate-500 hover:text-[var(--color-titanium)] transition-colors pt-1"
                  >
                    Volver al inicio de sesión
                  </button>
                )}
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          Sin conexión a Supabase la app corre en modo local sin autenticación.
        </p>
      </div>
    </div>
  );
};
