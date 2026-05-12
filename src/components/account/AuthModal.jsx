import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Sparkles, LogIn, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authClient } from '../../utils/accountClient.js';

// mode: 'login' | 'register' | 'forgot' | 'reset'
export function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '', newPassword: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetCode, setResetCode] = useState(''); // shown in dev mode

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const switchMode = (m) => { setMode(m); setError(''); setInfo(''); setResetCode(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await authClient.login(form.email, form.password);
        localStorage.setItem('future-you-token', data.token);
        onSuccess(data.user);
      } else if (mode === 'register') {
        const data = await authClient.register(form.email, form.password, form.name);
        localStorage.setItem('future-you-token', data.token);
        onSuccess(data.user);
      } else if (mode === 'forgot') {
        const data = await authClient.forgotPassword(form.email);
        setResetCode(data.resetCode);
        setInfo('A 6-digit reset code has been generated. Enter it below with your new password.');
        switchMode('reset');
        setForm(f => ({ ...f }));
      } else if (mode === 'reset') {
        const data = await authClient.resetPassword(form.email, form.code, form.newPassword);
        localStorage.setItem('future-you-token', data.token);
        onSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14,
    color: '#f1f5f9', fontFamily: 'DM Sans', fontSize: 15,
    padding: '14px 16px 14px 44px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', padding: 24 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(160deg, #0d0d1a 0%, #09090f 100%)',
          border: '1.5px solid rgba(0,212,177,0.25)',
          borderRadius: 24,
          boxShadow: '0 0 60px rgba(0,212,177,0.12), 0 32px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,212,177,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,rgba(0,212,177,0.25),rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔮</div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>
                  {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Forgot password' : 'Reset password'}
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {mode === 'login' ? 'Sign in to your Future You account'
                    : mode === 'register' ? 'Save your simulations & track progress'
                    : mode === 'forgot' ? 'Enter your email to get a reset code'
                    : 'Enter your reset code and new password'}
                </p>
              </div>
            </div>
            <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <X size={15} />
            </motion.button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>

          {/* Back link for forgot/reset */}
          {(mode === 'forgot' || mode === 'reset') && (
            <button type="button" onClick={() => switchMode('login')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans', width: 'fit-content', padding: 0 }}>
              <ArrowLeft size={12} /> Back to sign in
            </button>
          )}

          {/* Name field (register only) */}
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input type="text" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,212,177,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,177,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
            </div>
          )}

          {/* Email field */}
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} required style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,212,177,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,177,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Password field (login/register only) */}
          {(mode === 'login' || mode === 'register') && (
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input type="password" placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,212,177,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,177,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
            </div>
          )}

          {/* Reset-specific fields */}
          {mode === 'reset' && (
            <>
              {resetCode && (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(0,212,177,0.1)', border: '1px solid rgba(0,212,177,0.3)' }}>
                  <p style={{ fontSize: 11, color: '#00d4b1', fontWeight: 700, fontFamily: 'Space Grotesk', marginBottom: 4 }}>🔑 Your Reset Code</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em' }}>{resetCode}</p>
                  <p style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Valid for 15 minutes. In production this would be emailed to you.</p>
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <KeyRound size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input type="text" placeholder="6-digit reset code" value={form.code} onChange={e => set('code', e.target.value)} required maxLength={6}
                  style={{ ...inputStyle, fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', fontSize: 16 }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,212,177,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,177,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input type="password" placeholder="New password (min 6 chars)" value={form.newPassword} onChange={e => set('newPassword', e.target.value)} required minLength={6} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,212,177,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,177,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </>
          )}

          {/* Error / info */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5', fontSize: 13, fontFamily: 'DM Sans' }}>
              {error}
            </motion.div>
          )}
          {info && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,212,177,0.1)', border: '1px solid rgba(0,212,177,0.3)', color: '#00d4b1', fontSize: 12, fontFamily: 'DM Sans', lineHeight: 1.5 }}>
              {info}
            </motion.div>
          )}

          {/* Submit button */}
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(0,212,177,0.4)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '14px', borderRadius: 14, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, #00d4b1, #00c4a3)',
              boxShadow: '0 0 20px rgba(0,212,177,0.3)',
              color: '#000', fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1, marginTop: 2,
            }}>
            {loading ? 'Please wait...'
              : mode === 'login'    ? <><LogIn size={16} /> Sign In</>
              : mode === 'register' ? <><Sparkles size={16} /> Create Account</>
              : mode === 'forgot'   ? <><KeyRound size={16} /> Send Reset Code</>
              :                       <><ShieldCheck size={16} /> Set New Password</>}
          </motion.button>

          {/* Footer links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', paddingTop: 2 }}>
            {mode === 'login' && (
              <>
                <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'DM Sans' }}>
                  <button type="button" onClick={() => switchMode('forgot')}
                    style={{ color: '#94a3b8', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit' }}>
                    Forgot your password?
                  </button>
                </p>
                <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'DM Sans' }}>
                  No account?{' '}
                  <button type="button" onClick={() => switchMode('register')}
                    style={{ color: '#00d4b1', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit' }}>
                    Sign up free
                  </button>
                </p>
              </>
            )}
            {mode === 'register' && (
              <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'DM Sans' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')}
                  style={{ color: '#00d4b1', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit' }}>
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p style={{ fontSize: 12, color: '#475569', fontFamily: 'DM Sans', textAlign: 'center', lineHeight: 1.5 }}>
                Already have a reset code?{' '}
                <button type="button" onClick={() => switchMode('reset')}
                  style={{ color: '#00d4b1', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit' }}>
                  Enter it here
                </button>
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
