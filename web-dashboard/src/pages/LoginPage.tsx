import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getDefaultRouteForRole } from '../routes/ProtectedRoute';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { cn, getErrorMessage } from '../lib/utils';

const demoAccounts = [
  { label: 'Administrator', email: 'admin@smartcampus.edu' },
  { label: 'Medical staff', email: 'medical@smartcampus.edu' },
  { label: 'Ambulance responder', email: 'responder@smartcampus.edu' },
  { label: 'Cafeteria staff', email: 'cafeteria@smartcampus.edu' },
  { label: 'Faculty', email: 'faculty@smartcampus.edu' },
];

const DEMO_PASSWORD = 'Password@123';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(getDefaultRouteForRole(useAuthStore.getState().user?.role));
    } catch (err) {
      setError(getErrorMessage(err, 'We couldn’t sign you in. Check your email and password.'));
    }
  };

  return (
    <div>
      <h1 className="font-serif text-[40px] leading-tight text-ink">Sign in</h1>
      <p className="text-sm text-ink-3 mt-2">Staff, faculty and responders use their campus account.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div role="alert" className="px-3.5 py-3 rounded-lg bg-critical-soft text-critical text-[13px]">
            {error}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@smartcampus.edu"
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your password"
          required
        />
        <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
          {!isLoading && (
            <>
              Continue <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-10">
        <p className="text-xs text-ink-3 mb-2">Demo accounts — select one to fill in the form</p>
        <ul className="border border-line rounded-xl divide-y divide-line overflow-hidden">
          {demoAccounts.map(account => {
            const active = email === account.email;
            return (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 h-10 text-left text-[13px] transition-colors',
                    active ? 'bg-sunken text-ink font-medium' : 'text-ink-2 hover:bg-canvas'
                  )}
                >
                  <span>{account.label}</span>
                  <span className="text-ink-4 text-xs">{account.email.split('@')[0]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
