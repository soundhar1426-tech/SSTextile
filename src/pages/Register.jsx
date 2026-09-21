import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();

  const [formData, setFormData] = useState({
    businessName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gstin: '',
    address: '',
    city: 'Erode',
    state: 'Tamil Nadu',
    pincode: '638001',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (!formData.businessName?.trim()) {
      setErrorMsg('Please provide your Business / Legal Entity Name for billing');
      return;
    }

    if (!formData.name?.trim()) {
      setErrorMsg('Please provide your Contact Person / Authorized Name');
      return;
    }

    if (!formData.address?.trim()) {
      setErrorMsg('Please provide your Billing & Delivery Address');
      return;
    }

    setIsSubmitting(true);

    const result = await registerCustomer({
      businessName: formData.businessName.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
      gstin: formData.gstin.trim().toUpperCase(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      navigate('/products');
    } else {
      setErrorMsg(result.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 pb-24">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary-container text-white rounded-xl flex items-center justify-center mx-auto text-xl font-bold shadow-sm">
          G
        </div>
        <h1 className="text-headline-sm font-bold text-primary">
          Register Wholesale B2B Account
        </h1>
        <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
          Gain direct mill-to-buyer rates for hotels, resorts, commercial laundries, and textile distributors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline-variant shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Informative Notice for Billing Details */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/70 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-secondary text-lg mt-0.5 shrink-0">receipt_long</span>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            <strong>Official GST Bill Generation:</strong> All details entered below are automatically used to generate your official mill tax invoices. If any billing parameter needs adjustment after placing an order, it can be corrected exclusively via the <strong>Admin Portal</strong>.
          </p>
        </div>

        {/* Section 1: Business & Contact Information */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block border-b border-outline-variant/50 pb-1">
            1. Business &amp; Buyer Identity
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                Business / Legal Entity Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Royal Grand Suites / Ramesh Textiles"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary font-medium focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                Contact Person / Signatory Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. K. Vishal"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                Work Email Address (for Invoices) *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="buyer@company.com"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                Mobile Number (for SMS &amp; Cargo LR) *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98421 00000"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
              GSTIN Number (15-Chars for Tax Credit)
            </label>
            <input
              type="text"
              maxLength={15}
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              placeholder="33AAACG0184O1Z8 (Leave blank if Unregistered)"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary font-mono uppercase font-semibold focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Section 2: Billing & Delivery Address */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block border-b border-outline-variant/50 pb-1">
            2. Billing &amp; Dispatch Location (Printed on Bill)
          </span>

          <div>
            <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
              Billing &amp; Delivery Street Address *
            </label>
            <textarea
              rows={2}
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Plot / Door No, Industrial Estate, Street, Landmark..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                City / Hub *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Erode / Coimbatore"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Tamil Nadu"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                Pincode (6-Digits) *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                placeholder="638001"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary font-mono focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Account Security */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block border-b border-outline-variant/50 pb-1">
            3. Account Security
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                Password (min. 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-label-md font-semibold text-on-surface-variant mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-body-md text-primary focus:ring-1 focus:ring-primary outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary-container hover:bg-primary text-white font-label-lg font-bold rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Creating Wholesale Account...</span>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">domain_verification</span>
              <span>Complete Registration &amp; Access Wholesale Pricing</span>
            </>
          )}
        </button>

        <div className="text-center pt-1 text-body-sm text-on-surface-variant">
          Already registered?{' '}
          <Link to="/login" className="text-secondary font-bold hover:underline">
            Log In to Account
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
