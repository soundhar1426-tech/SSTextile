import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginCustomer } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/products';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const result = await loginCustomer(email, password);
    setIsSubmitting(false);

    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setErrorMsg(result.error || 'Invalid email or password');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6 pb-24">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary-container text-white rounded-xl flex items-center justify-center mx-auto text-xl font-bold shadow-sm">
          G
        </div>
        <h1 className="text-headline-sm font-bold text-primary">
          B2B Wholesale Portal Login
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          Sign in with your registered email to access direct mill quotes and wholesale orders.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
        {errorMsg && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
            Registered Work Email *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="name@company.com"
          />
        </div>

        <div>
          <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
            Account Password *
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none font-mono"
            placeholder="••••••••"
          />
        </div>

        <div className="p-3 bg-surface-container-low rounded-lg border border-border-subtle flex items-center gap-2 text-label-sm text-secondary font-semibold">
          <span className="material-symbols-outlined text-base material-symbols-filled">verified</span>
          <span>Verified B2B Mill Quotes &amp; GST Invoicing</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary-container hover:bg-primary text-white font-label-lg font-bold rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Authenticating...</span>
            </div>
          ) : (
            <>
              <span>Access Mill Wholesale Desk</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </>
          )}
        </button>

        <div className="text-center pt-2 text-body-sm text-on-surface-variant">
          Don't have a wholesale account?{' '}
          <Link to="/register" className="text-secondary font-bold hover:underline">
            Register Wholesale Profile
          </Link>
        </div>

        <div className="pt-3 border-t border-outline-variant/60 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant"
          >
            <span className="material-symbols-outlined text-sm text-secondary">admin_panel_settings</span>
            <span>Mill Personnel? Go to Admin Portal</span>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
