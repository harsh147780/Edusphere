import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, GraduationCap, KeyRound, MailSearch } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const toast = useToast();
  const [step, setStep] = useState(1); // 1 = request code, 2 = reset, 3 = done
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const request = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: identifier });
      if (data.resetToken) {
        setCode(data.resetToken); // dev convenience: pre-fill the returned code
        toast.success('Reset code generated');
      } else {
        toast.success('If that account exists, a reset code has been sent');
      }
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token: code, newPassword: form.newPassword });
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0b1220] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-mesh" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500">
            <GraduationCap />
          </div>
          <span className="text-xl font-semibold tracking-tight">EduSphere</span>
        </div>
        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">Account recovery</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.1] tracking-tight">Locked out? Let's get you back in.</h1>
          <p className="mt-5 text-indigo-200">
            Verify your email or ID, confirm with the reset code, and choose a new password. Codes expire after 30 minutes.
          </p>
        </div>
        <Link to="/login" className="relative inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>

      <div className="flex items-center justify-center bg-[#f4f6fb] p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold">EduSphere</span>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {step === 3 ? <CheckCircle2 className="h-5 w-5" /> : step === 2 ? <KeyRound className="h-5 w-5" /> : <MailSearch className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {step === 1 ? 'Find your account' : step === 2 ? 'Set a new password' : 'All done'}
              </h2>
              <p className="text-sm text-slate-500">Step {Math.min(step, 3)} of 3</p>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={request} className="space-y-4">
              <div>
                <label className="label">Email or ID</label>
                <input
                  className="input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@university.edu or your ID"
                  required
                />
              </div>
              <button className="btn-primary w-full py-3" disabled={busy}>
                {busy ? 'Sending...' : 'Send reset code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={reset} className="space-y-4">
              {code && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Your reset code</p>
                  <p className="mt-1 break-all font-mono text-sm text-indigo-900">{code}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    In production this code is emailed to you. It is shown here because no mail service is configured.
                  </p>
                </div>
              )}
              <div>
                <label className="label">Reset code</label>
                <input className="input" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code" required />
              </div>
              <div>
                <label className="label">New password</label>
                <input
                  className="input"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input
                  className="input"
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button className="btn-primary flex-1 py-3" disabled={busy}>
                  {busy ? 'Updating...' : 'Reset password'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-5 text-center">
              <p className="text-sm text-slate-600">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn-primary w-full py-3">
                Go to sign in
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered it?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
