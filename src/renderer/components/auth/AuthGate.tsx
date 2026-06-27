import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import { hasPin, setPin, verifyPin, clearPin } from '../../lib/auth/pin';
import LoginScreen from './LoginScreen';
import PinScreen from './PinScreen';

/**
 * Поток входа:
 * 1. Нет сессии → экран входа (email+пароль). Первый запуск на машине.
 * 2. Есть сессия, нет PIN → установка PIN.
 * 3. Есть сессия и PIN, не разблокировано в этом запуске → ввод PIN.
 * 4. Разблокировано → приложение.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, session, signIn, signUp, signOut } = useAuth();
  const [unlocked, setUnlocked] = useState(false);

  async function forgot() {
    clearPin();
    setUnlocked(false);
    await signOut();
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f1117]">
        <span className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Нет сессии → вход по паролю
  if (!session) {
    return <LoginScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  // Есть сессия, но PIN не задан → установить
  if (!hasPin()) {
    return (
      <PinScreen
        mode="set"
        onSetPin={setPin}
        onVerifyPin={verifyPin}
        onSuccess={() => setUnlocked(true)}
        onForgot={forgot}
      />
    );
  }

  // Есть сессия и PIN, но в этом запуске ещё не разблокировано → ввести PIN
  if (!unlocked) {
    return (
      <PinScreen
        mode="unlock"
        email={session.user.email ?? undefined}
        onSetPin={setPin}
        onVerifyPin={verifyPin}
        onSuccess={() => setUnlocked(true)}
        onForgot={forgot}
      />
    );
  }

  return <>{children}</>;
}
