import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getDefaultRouteForRole } from '../routes/ProtectedRoute';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

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
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="name@smartcampus.edu"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Sign in to Dashboard
        </Button>
      </form>

      {/* Quick Demo Logins Helper */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
          Demo Quick Credentials
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@smartcampus.edu')}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('medical@smartcampus.edu')}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
          >
            Medical Staff
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('cafeteria@smartcampus.edu')}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
          >
            Cafeteria Staff
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('responder@smartcampus.edu')}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
          >
            Responder
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('faculty@smartcampus.edu')}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
          >
            Faculty
          </button>
        </div>
      </div>
    </div>
  );
};
