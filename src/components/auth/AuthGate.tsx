import React, { ReactNode, useEffect, useState } from 'react';
import { Scissors, Loader2, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AppData, EMPTY_DATA, isDataEmpty, loadAllFromCloud } from '../../lib/cloudStore';
import { CloudSession, loadLocalData } from '../../context/AppContext';

// Marque les données de ce navigateur comme déjà importées dans un compte (elles restent en copie locale).
const IMPORT_FLAG = 'atelier_custom_local_imported';

const wasLocalImported = (): boolean => {
  try {
    return localStorage.getItem(IMPORT_FLAG) === '1';
  } catch {
    return false;
  }
};

const markLocalImported = () => {
  try {
    localStorage.setItem(IMPORT_FLAG, '1');
  } catch {
    // ignore
  }
};

type Phase =
  | { name: 'checking' }
  | { name: 'signedOut' }
  | { name: 'loading'; userId: string; email: string }
  | { name: 'loadError'; userId: string; email: string; message: string }
  | { name: 'ready'; session: CloudSession };

const applyStoredTheme = () => {
  try {
    if (localStorage.getItem('atelier_theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // ignore
  }
};

const Shell: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 font-sans text-zinc-900 dark:text-zinc-100 antialiased">
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3 mb-6 justify-center">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
          <Scissors className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-tight">ATELIER CUSTOM</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Gestion & Stock</p>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        {children}
      </div>
    </div>
  </div>
);

const inputClass =
  'w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 dark:focus:ring-zinc-400';

const translateAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('email not confirmed'))
    return "Adresse e-mail non confirmée. Ouvre le lien reçu par e-mail, puis reconnecte-toi.";
  if (m.includes('already registered')) return 'Un compte existe déjà avec cet e-mail.';
  if (m.includes('password should be')) return 'Mot de passe trop court (6 caractères minimum).';
  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return 'La création de compte est désactivée.';
  if (m.includes('failed to fetch')) return 'Connexion impossible. Vérifie ta connexion internet.';
  return message;
};

const LoginForm: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) setError(translateAuthError(err.message));
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) setError(translateAuthError(err.message));
        else if (!data.session) {
          setInfo('Compte créé. Ouvre le lien de confirmation reçu par e-mail, puis connecte-toi.');
          setMode('signin');
        }
      }
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <h2 className="text-base font-semibold mb-1">
        {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        Tes données sont enregistrées en ligne et disponibles sur tous tes appareils.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="auth-email" className="block text-xs font-medium mb-1">
            E-mail
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="block text-xs font-medium mb-1">
            Mot de passe
          </label>
          <input
            id="auth-password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {info && <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{mode === 'signin' ? 'Se connecter' : 'Créer le compte'}</span>
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(null);
          setInfo(null);
        }}
        className="mt-4 w-full text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
      >
        {mode === 'signin' ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
      </button>
    </Shell>
  );
};

export const AuthGate: React.FC<{
  children: (cloud: CloudSession | undefined) => ReactNode;
}> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>({ name: 'checking' });
  const [reloadKey, setReloadKey] = useState(0);

  // Suivi de la session
  useEffect(() => {
    if (!supabase) return;
    applyStoredTheme();
    const client = supabase;

    const apply = (user: { id: string; email?: string } | null | undefined) => {
      setPhase(prev => {
        if (!user) return { name: 'signedOut' };
        const sameUser =
          (prev.name === 'ready' && prev.session.userId === user.id) ||
          ((prev.name === 'loading' || prev.name === 'loadError') && prev.userId === user.id);
        return sameUser ? prev : { name: 'loading', userId: user.id, email: user.email ?? '' };
      });
    };

    client.auth.getSession().then(({ data }) => apply(data.session?.user));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => apply(session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Chargement des données du compte
  const loadingUserId = phase.name === 'loading' ? phase.userId : null;
  useEffect(() => {
    if (phase.name !== 'loading' || !supabase) return;
    const client = supabase;
    const { userId, email } = phase;
    let cancelled = false;

    loadAllFromCloud(userId)
      .then((cloudData: AppData) => {
        if (cancelled) return;
        const signOut = () => {
          client.auth.signOut();
        };
        // Premier accès : si le compte est vide, on y importe les données de ce navigateur.
        const local = wasLocalImported() ? EMPTY_DATA : loadLocalData();
        if (isDataEmpty(cloudData) && !isDataEmpty(local)) {
          markLocalImported();
          setPhase({
            name: 'ready',
            session: { userId, email, initialData: local, syncedData: EMPTY_DATA, signOut },
          });
          return;
        }
        setPhase({
          name: 'ready',
          session: { userId, email, initialData: cloudData, syncedData: cloudData, signOut },
        });
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Chargement Supabase échoué :', err);
        setPhase({
          name: 'loadError',
          userId,
          email,
          message: err?.message ? String(err.message) : 'Erreur inconnue',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [loadingUserId, reloadKey]);

  if (!isSupabaseConfigured) return <>{children(undefined)}</>;

  if (phase.name === 'ready') return <>{children(phase.session)}</>;

  if (phase.name === 'signedOut') return <LoginForm />;

  if (phase.name === 'loadError') {
    return (
      <Shell>
        <div className="flex items-start gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold">Impossible de charger tes données</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 break-words">{phase.message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPhase({ name: 'loading', userId: phase.userId, email: phase.email });
              setReloadKey(k => k + 1);
            }}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm py-2 rounded-lg cursor-pointer"
          >
            Réessayer
          </button>
          <button
            onClick={() => supabase?.auth.signOut()}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm py-2 rounded-lg cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="ml-2 text-sm">Chargement…</span>
    </div>
  );
};
