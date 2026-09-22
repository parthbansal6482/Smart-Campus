import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getDefaultRouteForRole } from '../routes/ProtectedRoute';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('admin@smartcampus.edu');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      const currentUser = useAuthStore.getState().user;
      const targetRoute = getDefaultRouteForRole(currentUser?.role);
      navigate(targetRoute);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password@123');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Staff Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@smartcampus.edu"
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Authorized Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-3 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-500/20"
          isLoading={isLoading}
        >
          <span>Sign In to Command Center</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </form>

      {/* Quick Demo Credentials Helper */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
          Select Role Demo Credentials
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@smartcampus.edu')}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
              email === 'admin@smartcampus.edu'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('medical@smartcampus.edu')}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
              email === 'medical@smartcampus.edu'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
          >
            Medical Staff
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('cafeteria@smartcampus.edu')}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
              email === 'cafeteria@smartcampus.edu'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
          >
            Cafeteria
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('responder@smartcampus.edu')}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
              email === 'responder@smartcampus.edu'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
          >
            Responder
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('faculty@smartcampus.edu')}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
              email === 'faculty@smartcampus.edu'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
          >
            Faculty
          </button>
        </div>
      </div>
    </div>
  );
};
