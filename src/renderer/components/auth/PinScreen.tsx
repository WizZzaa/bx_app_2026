import React, { useState } from 'react';

interface Props {
  mode: 'set' | 'unlock';
  email?: string;
  onSetPin: (pin: string) => Promise<void>;
  onVerifyPin: (pin: string) => Promise<boolean>;
  onSuccess: () => void;
  onForgot: () => void; // выйти и войти заново по паролю
}

export default function PinScreen({ mode, email, onSetPin, onVerifyPin, onSuccess, onForgot }: Props) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);

  function press(d: string) {
    setError(null);
    const target = stage === 'confirm' ? confirm : pin;
    if (target.length >= 4) return;
    const val = target + d;
    if (stage === 'confirm') {
      setConfirm(val);
      if (val.length === 4) handleConfirm(val);
    } else {
      setPin(val);
      if (val.length === 4) handleEnter(val);
    }
  }

  function backspace() {
    setError(null);
    if (stage === 'confirm') setConfirm(c => c.slice(0, -1));
    else setPin(p => p.slice(0, -1));
  }

  async function handleEnter(val: string) {
    if (mode === 'set') {
      setStage('confirm');
    } else {
      const ok = await onVerifyPin(val);
      if (ok) onSuccess();
      else { setError('Неверный PIN'); setPin(''); }
    }
  }

  async function handleConfirm(val: string) {
    if (val !== pin) {
      setError('PIN не совпадает, попробуйте снова');
      setPin(''); setConfirm(''); setStage('enter');
      return;
    }
    await onSetPin(val);
    onSuccess();
  }

  const current = stage === 'confirm' ? confirm : pin;
  const title = mode === 'set'
    ? (stage === 'confirm' ? 'Повторите PIN' : 'Придумайте PIN-код')
    : 'Введите PIN-код';

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f1117]">
      <div className="w-[300px] flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl mb-3">BX</div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {email && mode === 'unlock' && <p className="text-xs text-slate-500 mt-1">{email}</p>}
        {mode === 'set' && stage === 'enter' && <p className="text-xs text-slate-500 mt-1">4 цифры для быстрого входа на этом ПК</p>}

        {/* dots */}
        <div className="flex gap-3 my-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 ${i < current.length ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`} />
          ))}
        </div>

        {error && <div className="text-xs text-red-400 mb-3">{error}</div>}

        {/* keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} onClick={() => press(d)} className="w-16 h-16 rounded-full bg-[#1e2535] hover:bg-[#2a3447] text-white text-xl transition-colors">{d}</button>
          ))}
          <div />
          <button onClick={() => press('0')} className="w-16 h-16 rounded-full bg-[#1e2535] hover:bg-[#2a3447] text-white text-xl transition-colors">0</button>
          <button onClick={backspace} className="w-16 h-16 rounded-full hover:bg-[#1e2535] text-slate-400 text-xl transition-colors">⌫</button>
        </div>

        <button onClick={onForgot} className="text-xs text-slate-500 hover:text-slate-300 mt-6">
          {mode === 'unlock' ? 'Забыли PIN? Войти по паролю' : 'Выйти'}
        </button>
      </div>
    </div>
  );
}
