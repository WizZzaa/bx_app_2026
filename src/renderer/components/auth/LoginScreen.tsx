import React, { useState } from 'react';

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (email: string, password: string) => Promise<string | null>;
}

export default function LoginScreen({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    const err = mode === 'in' ? await onSignIn(email, password) : await onSignUp(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    if (mode === 'up') setInfo('Аккаунт создан. Если включено подтверждение — проверьте почту, затем войдите.');
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f1117]">
      <div className="w-[380px]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl mb-3">BX</div>
          <h1 className="text-lg font-semibold text-white">Помощник Бухгалтера</h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'in' ? 'Вход в аккаунт' : 'Создание аккаунта'}
          </p>
        </div>

        <form onSubmit={submit} className="bg-[#141820] border border-[#1e2535] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0f1117] text-slate-200 text-sm px-3 py-2.5 rounded-lg border border-[#1e2535] focus:outline-none focus:border-blue-500/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Пароль</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0f1117] text-slate-200 text-sm px-3 py-2.5 rounded-lg border border-[#1e2535] focus:outline-none focus:border-blue-500/50"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}
          {info && <div className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2">{info}</div>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {mode === 'in' ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <div className="text-center text-xs text-slate-500">
            {mode === 'in' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button type="button" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(null); setInfo(null); }} className="text-blue-400 hover:text-blue-300">
              {mode === 'in' ? 'Создать' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
