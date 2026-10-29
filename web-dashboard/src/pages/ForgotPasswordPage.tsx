import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { getErrorMessage } from '../lib/utils';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'We couldn’t process that request. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink mb-8">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>
      <div className="w-10 h-10 rounded-xl bg-sunken border border-line flex items-center justify-center text-ink mb-5">
        <Mail className="w-4 h-4" />
      </div>
      <h1 className="font-serif text-[40px] leading-tight text-ink">Reset your password</h1>
      <p className="text-sm text-ink-3 mt-2 leading-relaxed">Enter your campus email and we’ll send a secure reset link if the account exists.</p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-line bg-canvas px-4 py-4 text-[13px] text-ink-2 leading-relaxed">
          If that email is registered, a reset link is on its way. Check your inbox and spam folder; the link expires in one hour.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          {error && <div role="alert" className="px-3.5 py-3 rounded-lg bg-critical-soft text-critical text-[13px]">{error}</div>}
          <Input label="Campus email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@smartcampus.edu" required />
          <Button type="submit" size="lg" className="w-full mt-2" isLoading={loading}>Send reset link <ArrowRight className="w-4 h-4" /></Button>
        </form>
      )}
    </div>
  );
};
