import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { getErrorMessage } from '../lib/utils';

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : 'This reset link is missing its token. Request a new one.');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setComplete(true);
    } catch (err) {
      setError(getErrorMessage(err, 'This reset link is invalid or expired. Request a new one.'));
    } finally {
      setLoading(false);
    }
  };

  if (complete) {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-10 h-10 text-ok mx-auto mb-5" />
        <h1 className="font-serif text-[40px] leading-tight text-ink">Password updated</h1>
        <p className="text-sm text-ink-3 mt-2 leading-relaxed">All previous sessions were signed out. Sign in again with your new password.</p>
        <Button className="w-full mt-8" size="lg" onClick={() => navigate('/login')}>Return to sign in</Button>
      </div>
    );
  }

  return (
    <div>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink mb-8"><ArrowLeft className="w-3.5 h-3.5" /> Back to sign in</Link>
      <h1 className="font-serif text-[40px] leading-tight text-ink">Choose a new password</h1>
      <p className="text-sm text-ink-3 mt-2">Use at least 8 characters, including a letter and a number.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {error && <div role="alert" className="px-3.5 py-3 rounded-lg bg-critical-soft text-critical text-[13px]">{error}</div>}
        <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
        <Button type="submit" size="lg" className="w-full mt-2" isLoading={loading} disabled={!token}>Update password</Button>
      </form>
    </div>
  );
};
