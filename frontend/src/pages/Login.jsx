import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, registerBootstrap, authRequired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerBootstrap(email, password, displayName || email);
        toast.success('Conta criada com sucesso');
      } else {
        await login(email, password);
        toast.success('Sessão iniciada');
      }
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Erro de autenticação');
    } finally {
      setLoading(false);
    }
  };

  if (!authRequired && mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c0e] text-white p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Modo desenvolvimento</h1>
          <p className="text-sm text-white/50 mb-6">
            A autenticação JWT está desativada. Defina <code className="text-orange-400">VITE_REQUIRE_AUTH=true</code> em produção.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-lg bg-[hsl(18,100%,52%)] text-black font-semibold"
          >
            Entrar na aplicação
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className="mt-3 text-xs text-white/40 hover:text-white/70"
          >
            Mesmo assim, criar utilizador admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0e] text-white p-6">
      <form
        onSubmit={submit}
        className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-8 h-8 text-[hsl(18,100%,62%)]" />
          <div>
            <h1 className="text-lg font-bold">Alygen CRM</h1>
            <p className="text-xs text-white/50">Acesso empresarial seguro</p>
          </div>
        </div>

        {mode === 'register' && (
          <input
            type="text"
            placeholder="Nome (opcional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm"
          />
        )}

        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[hsl(18,100%,52%)] text-black font-semibold disabled:opacity-50"
        >
          {loading ? 'A processar…' : mode === 'login' ? 'Iniciar sessão' : 'Criar conta admin'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full text-xs text-white/40 hover:text-white/70"
        >
          {mode === 'login' ? 'Primeira vez? Criar conta administrador' : 'Já tem conta? Iniciar sessão'}
        </button>
      </form>
    </div>
  );
}
