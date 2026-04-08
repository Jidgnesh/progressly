import { Eye, EyeOff, MailCheck } from 'lucide-react';
import type { ToastState, ToastAction } from '@/types';
import GoogleSignInButton from '@/components/layout/GoogleSignInButton';
import Toast from '@/components/ui/Toast';
import { completeEmail } from '@/utils/auth';

interface AuthForm {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

interface ShowPassword {
  password: boolean;
  confirmPassword: boolean;
  newPassword: boolean;
  confirmNewPassword: boolean;
}

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

interface AuthPageProps {
  authPage: 'signin' | 'signup' | 'forgot';
  setAuthPage: (page: 'signin' | 'signup' | 'forgot') => void;
  authForm: AuthForm;
  setAuthForm: (form: AuthForm) => void;
  authError: string;
  setAuthError: (error: string) => void;
  showPassword: ShowPassword;
  setShowPassword: (sp: ShowPassword) => void;
  forgotEmail: string;
  setForgotEmail: (email: string) => void;
  resetPassword: ResetPasswordForm;
  setResetPassword: (form: ResetPasswordForm) => void;
  forgotStep: 'email' | 'reset';
  setForgotStep: (step: 'email' | 'reset') => void;
  resetEmailSent: boolean;
  setResetEmailSent: (sent: boolean) => void;
  authSubmitting: boolean;
  onSignUp: (e: React.FormEvent) => void;
  onSignIn: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onForgotPassword: (e: React.FormEvent) => void;
  onResetPassword: (e: React.FormEvent) => void;
  toast: ToastState;
  onDismissToast: () => void;
  toastAction?: ToastAction | null;
}

const AuthPage = ({
  authPage,
  setAuthPage,
  authForm,
  setAuthForm,
  authError,
  setAuthError,
  showPassword,
  setShowPassword,
  forgotEmail,
  setForgotEmail,
  resetPassword,
  setResetPassword,
  forgotStep,
  setForgotStep,
  resetEmailSent,
  setResetEmailSent,
  authSubmitting,
  onSignUp,
  onSignIn,
  onGoogleSignIn,
  onForgotPassword,
  onResetPassword,
  toast,
  onDismissToast,
  toastAction,
}: AuthPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={onDismissToast} action={toastAction} />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Progressly</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Keep moving forward!</p>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          {/* Tabs */}
          {authPage !== 'forgot' && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setAuthPage('signin'); setAuthError(''); }}
                className="pressable flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                style={authPage === 'signin' ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--divider)', color: 'var(--text-secondary)' }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthPage('signup'); setAuthError(''); }}
                className="pressable flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                style={authPage === 'signup' ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--divider)', color: 'var(--text-secondary)' }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Forgot Password Header */}
          {authPage === 'forgot' && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Reset Password</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enter your email to reset your password</p>
            </div>
          )}

          {/* Error Message */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--priority-high)' }}>
              {authError}
            </div>
          )}

          {/* Sign Up Form */}
          {authPage === 'signup' && (
            <form onSubmit={onSignUp} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Name</label>
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    onBlur={() => setAuthForm({ ...authForm, email: completeEmail(authForm.email) })}
                    className="w-full rounded-xl px-4 py-3 pr-28 outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    placeholder="Enter your email or username"
                    required
                  />
                  {!authForm.email.includes('@') && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                      @gmail.com
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword.password ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword.password ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword.confirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="pressable w-full text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {authSubmitting ? 'Signing Up...' : 'Sign Up'}
              </button>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
              </div>
              <GoogleSignInButton onClick={onGoogleSignIn} />
            </form>
          )}

          {/* Sign In Form */}
          {authPage === 'signin' && (
            <form onSubmit={onSignIn} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    onBlur={() => setAuthForm({ ...authForm, email: completeEmail(authForm.email) })}
                    className="w-full rounded-xl px-4 py-3 pr-28 outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    placeholder="Enter your email or username"
                    required
                  />
                  {!authForm.email.includes('@') && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                      @gmail.com
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword.password ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword.password ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setAuthPage('forgot');
                    setAuthError('');
                    setForgotEmail('');
                    setForgotStep('email');
                    setResetPassword({ newPassword: '', confirmPassword: '' });
                    setResetEmailSent(false);
                  }}
                  className="pressable text-sm"
                  style={{ color: 'var(--accent)' }}
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="pressable w-full text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {authSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
              </div>
              <GoogleSignInButton onClick={onGoogleSignIn} />
            </form>
          )}

          {/* Forgot Password Form */}
          {authPage === 'forgot' && (
            <>
              {resetEmailSent ? (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                    <MailCheck size={32} color="var(--priority-low)" />
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Check your inbox</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    We've sent a password reset link to <span className="font-medium" style={{ color: 'var(--accent)' }}>{forgotEmail}</span>. Follow the instructions in the email to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setAuthPage('signin'); setAuthError(''); setForgotEmail(''); setResetEmailSent(false); }}
                    className="pressable w-full text-white font-bold py-3 rounded-xl transition-all"
                    style={{ background: 'var(--accent)' }}
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResetEmailSent(false); }}
                    className="pressable w-full text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Didn't receive it? Try again
                  </button>
                </div>
              ) : forgotStep === 'email' ? (
                <form onSubmit={onForgotPassword} className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Enter your email address and we'll help you reset your password.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        onBlur={() => setForgotEmail(completeEmail(forgotEmail))}
                        className="w-full rounded-xl px-4 py-3 pr-28 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Enter your email or username"
                        required
                        autoFocus
                      />
                      {!forgotEmail.includes('@') && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                          @gmail.com
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="pressable w-full text-white font-bold py-3 rounded-xl transition-all"
                    style={{ background: 'var(--accent)' }}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthPage('signin'); setAuthError(''); setForgotEmail(''); setResetEmailSent(false); }}
                    className="pressable w-full text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={onResetPassword} className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Reset password for: <span className="font-medium" style={{ color: 'var(--accent)' }}>{forgotEmail}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.newPassword ? 'text' : 'password'}
                        value={resetPassword.newPassword}
                        onChange={(e) => setResetPassword({ ...resetPassword, newPassword: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {showPassword.newPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.confirmNewPassword ? 'text' : 'password'}
                        value={resetPassword.confirmPassword}
                        onChange={(e) => setResetPassword({ ...resetPassword, confirmPassword: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, confirmNewPassword: !showPassword.confirmNewPassword })}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {showPassword.confirmNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="pressable w-full text-white font-bold py-3 rounded-xl transition-all"
                    style={{ background: 'var(--accent)' }}
                  >
                    Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotStep('email'); setResetPassword({ newPassword: '', confirmPassword: '' }); }}
                    className="pressable w-full text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Back
                  </button>
                </form>
              )}
            </>
          )}

          {/* Footer Links */}
          {authPage !== 'forgot' && (
            <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              {authPage === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => { setAuthPage('signin'); setAuthError(''); }} className="pressable" style={{ color: 'var(--accent)' }}>
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => { setAuthPage('signup'); setAuthError(''); }} className="pressable" style={{ color: 'var(--accent)' }}>
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
