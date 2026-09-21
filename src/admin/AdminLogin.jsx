import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const result = await loginAdmin(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(result.error || 'Invalid admin credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary-container text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
            S
          </div>
          <h1 className="text-headline-sm font-bold text-primary">
            SSTextiles Admin Portal
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Authorized Loom Management &amp; Dispatch Terminal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-md space-y-4">
          {errorMsg && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
              Admin Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="admin@sstextiles.com"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
              Admin Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Enter admin password"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none font-mono"
            />
            <span className="text-[11px] text-outline mt-1 block">Authorized Mill Personnel Only</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary-container hover:bg-primary text-white font-label-lg font-bold rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating Admin...</span>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">lock_open</span>
                <span>Enter Mill Control Hub</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link to="/" className="text-body-sm text-on-surface-variant hover:text-primary font-semibold">
              ← Return to Buyer Storefront
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
