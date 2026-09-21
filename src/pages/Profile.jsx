import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';

export const Profile = () => {
  const { currentUser, updateProfile, isAdmin } = useAuth();
  const { millSettings, updateMillSettings, fetchMillSettings } = useProducts();
  const { showToast } = useCart();

  const isUserAdmin = isAdmin || currentUser?.role === 'admin';

  const [formData, setFormData] = useState(() => ({
    name: currentUser?.name || '',
    businessName: currentUser?.businessName || (isUserAdmin ? millSettings?.name : '') || '',
    phone: currentUser?.phone || (isUserAdmin ? millSettings?.phone : '') || '',
    email: currentUser?.email || '',
    gstin: currentUser?.gstin || (isUserAdmin ? millSettings?.gstin : '') || '',
    address: currentUser?.address || '',
    city: currentUser?.city || '',
    state: currentUser?.state || (isUserAdmin ? (millSettings?.stateCode ? 'Tamil Nadu' : '') : '') || '',
    stateCode: currentUser?.stateCode || (isUserAdmin ? millSettings?.stateCode : '') || '',
    pincode: currentUser?.pincode || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const hasInitializedRef = React.useRef(false);

  // Hydrate formData only once on initial load
  useEffect(() => {
    if (!hasInitializedRef.current && (currentUser || millSettings)) {
      hasInitializedRef.current = true;
      setFormData({
        name: currentUser?.name || '',
        businessName: currentUser?.businessName || (isUserAdmin ? millSettings?.name : '') || '',
        phone: currentUser?.phone || (isUserAdmin ? millSettings?.phone : '') || '',
        email: currentUser?.email || '',
        gstin: currentUser?.gstin || (isUserAdmin ? millSettings?.gstin : '') || '',
        address: currentUser?.address || '',
        city: currentUser?.city || '',
        state: currentUser?.state || (isUserAdmin ? (millSettings?.stateCode ? 'Tamil Nadu' : '') : '') || '',
        stateCode: currentUser?.stateCode || (isUserAdmin ? millSettings?.stateCode : '') || '',
        pincode: currentUser?.pincode || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [currentUser, isUserAdmin, millSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    // Validate passwords if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setErrorMessage('Please enter your current password to set a new password.');
        return;
      }
      if (formData.newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters long.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMessage('New password and confirm password do not match.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        gstin: formData.gstin,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        stateCode: formData.stateCode,
        pincode: formData.pincode,
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await updateProfile(payload);
      if (res.success) {
        // If user is Admin, synchronize mill settings and re-fetch so all frontend components reflect changes
        if (isUserAdmin && updateMillSettings) {
          try {
            await updateMillSettings({
              ...millSettings,
              email: formData.email ? formData.email.trim() : millSettings?.email,
              adminEmail: formData.email ? formData.email.trim() : millSettings?.adminEmail,
              name: formData.businessName || millSettings?.name,
              phone: formData.phone || millSettings?.phone,
              gstin: formData.gstin || millSettings?.gstin,
              address: formData.address || millSettings?.address,
            });
          } catch (e) {}
        }
        if (isUserAdmin && fetchMillSettings) {
          await fetchMillSettings();
        }

        setSaveSuccess(true);
        if (showToast) {
          showToast(
            isUserAdmin
              ? 'Admin Profile & Sitewide Mill Settings updated successfully!'
              : 'Profile updated successfully!',
            'success'
          );
        }
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setShowPasswordSection(false);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(res.error || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header & Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-label-sm text-outline">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-primary font-bold">
            {isUserAdmin ? 'Admin Profile & Mill Settings' : 'Buyer Account & Profile'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-headline-lg-mobile sm:text-headline-lg font-bold text-primary tracking-tight">
              {isUserAdmin ? 'Mill Administrator Profile & GST Settings' : 'My Profile & Business Details'}
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              {isUserAdmin
                ? 'Manage official mill identity, GSTIN, phone, and dispatch address displayed sitewide across the website and commercial tax invoices.'
                : 'Manage your company contact details, dispatch address, and GSTIN for commercial tax invoices.'}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            {isUserAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-white hover:bg-primary font-label-md font-bold transition-all text-center shadow-sm"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                <span>Admin Mill Portal</span>
              </Link>
            )}
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high border border-outline-variant font-label-md font-bold transition-all text-center"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>View Orders</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Sitewide Sync Active Banner */}
      {isUserAdmin && (
        <div className="p-4 bg-[#E6F5F0] border border-secondary-fixed rounded-2xl flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">verified_user</span>
          <div className="space-y-0.5">
            <h3 className="font-bold text-primary text-body-md">Sitewide Real-time Synchronization Active</h3>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              As an Administrator, changes you make here to <strong>Mill/Business Name</strong>, <strong>GSTIN</strong>, <strong>Contact Phone</strong>, or <strong>Dispatch Address</strong> will automatically update the official website footer, navigation headers, invoice PDFs, and admin settings in real time.
            </p>
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-primary-container text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-primary">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-on-secondary-fixed font-bold text-2xl flex items-center justify-center shadow-inner uppercase">
            {formData.name ? formData.name.charAt(0) : (isUserAdmin ? 'A' : 'U')}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-title-md font-bold leading-tight">
                {formData.name || (isUserAdmin ? 'Mill Administrator' : 'Valued Buyer')}
              </h2>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isUserAdmin
                  ? 'bg-secondary text-white border border-secondary-fixed'
                  : 'bg-[#E6F5F0]/20 text-secondary-fixed border border-secondary-fixed/40'
              }`}>
                {isUserAdmin ? 'Mill Administrator & Owner' : 'Wholesale Buyer'}
              </span>
            </div>
            {formData.businessName && (
              <p className="text-body-sm text-primary-fixed font-semibold">
                {formData.businessName}
              </p>
            )}
            <p className="text-xs text-primary-fixed-dim">
              {formData.email} • {formData.phone || 'Phone not set'}
            </p>
          </div>
        </div>

        {formData.gstin ? (
          <div className="bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/20 text-right">
            <span className="text-[10px] uppercase tracking-wider text-primary-fixed block font-bold">
              {isUserAdmin ? 'Mill GSTIN Active' : 'GSTIN Registered'}
            </span>
            <span className="font-mono text-body-sm font-bold text-white">{formData.gstin}</span>
          </div>
        ) : (
          <div className="bg-amber-500/20 px-3.5 py-2 rounded-xl border border-amber-400/30 text-right">
            <span className="text-[10px] uppercase tracking-wider text-amber-200 block font-bold">GSTIN</span>
            <span className="text-xs text-amber-100 font-medium">Add GSTIN for tax invoices</span>
          </div>
        )}
      </div>

      {/* Notifications / Alerts */}
      {saveSuccess && (
        <div className="p-4 bg-[#E6F5F0] text-secondary border border-secondary-fixed rounded-xl font-bold text-body-sm flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span>Your profile and dispatch details have been updated successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-[#FFDAD6] text-[#BA1A1A] border border-red-300 rounded-xl font-bold text-body-sm flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-xl">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Personal & Business Identity */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-container pb-3">
            <span className="material-symbols-outlined text-secondary text-2xl">person</span>
            <div>
              <h2 className="text-title-md font-bold text-primary">Identity &amp; Contact Details</h2>
              <p className="text-xs text-on-surface-variant">Primary representative and business billing name</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Full Name / Contact Person *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Vignesh Kumar"
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl px-3.5 py-2.5 text-body-md text-primary font-medium outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Company / Business / Trade Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Green Park Hotels Pvt Ltd"
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl px-3.5 py-2.5 text-body-md text-primary font-medium outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98427 99999"
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl px-3.5 py-2.5 text-body-md text-primary font-medium outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Registered Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. admin@sstextiles.com"
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl px-3.5 py-2.5 text-body-md text-primary font-medium outline-none transition-all shadow-2xs"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">Used to sign in to your account</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: GST & Tax Identification */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-container pb-3">
            <span className="material-symbols-outlined text-secondary text-2xl">receipt</span>
            <div>
              <h2 className="text-title-md font-bold text-primary">GST &amp; Commercial Billing</h2>
              <p className="text-xs text-on-surface-variant">Used automatically on Tax Invoices for input tax credit (ITC)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                GSTIN (Goods and Services Tax Identification Number)
              </label>
              <input
                type="text"
                name="gstin"
                maxLength={15}
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 33AAACB1234F1Z5"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary font-mono uppercase font-bold focus:border-primary-container focus:bg-white outline-none transition-all"
              />
              <span className="text-[11px] text-outline mt-1 block">15-character alphanumeric GST format</span>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/70 text-body-sm space-y-1">
              <span className="font-bold text-primary text-xs uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
                B2B GST Benefit
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Adding your valid GSTIN ensures generated invoices itemize 2.5% CGST + 2.5% SGST (or 5% IGST) for smooth business expense filing.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: Default Shipping & Dispatch Destination */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-container pb-3">
            <span className="material-symbols-outlined text-secondary text-2xl">local_shipping</span>
            <div>
              <h2 className="text-title-md font-bold text-primary">Default Delivery / Lorry Destination</h2>
              <p className="text-xs text-on-surface-variant">Default transport delivery address used during checkout</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Street Address / Building / Area
              </label>
              <textarea
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 54 Bazaar Street, Near Old Bus Stand"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary font-medium focus:border-primary-container focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Erode"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary font-medium focus:border-primary-container focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary font-medium focus:border-primary-container focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  State Code (GST)
                </label>
                <input
                  type="text"
                  name="stateCode"
                  maxLength={2}
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                  placeholder="33"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary font-mono font-bold focus:border-primary-container focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 638001"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary font-mono focus:border-primary-container focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Password & Security (Collapsible) */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-2xl">lock</span>
              <div>
                <h2 className="text-title-md font-bold text-primary">Account Security &amp; Password</h2>
                <p className="text-xs text-on-surface-variant">Update your account login password</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-label-sm font-bold text-secondary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{showPasswordSection ? 'Hide' : 'Change Password'}</span>
              <span className="material-symbols-outlined text-sm">
                {showPasswordSection ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>

          {showPasswordSection && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-in fade-in duration-150">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary focus:border-primary-container focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary focus:border-primary-container focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm text-primary focus:border-primary-container focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          )}
        </section>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl text-label-md font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-primary-container hover:bg-primary text-white font-label-lg font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
