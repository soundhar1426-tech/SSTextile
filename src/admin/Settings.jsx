import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

export const AdminSettings = () => {
  const { millSettings, updateMillSettings } = useProducts();
  const { currentUser, setCurrentUser, updateProfile } = useAuth();

  const [settings, setSettings] = useState(() => millSettings || {});
  const [adminEmail, setAdminEmail] = useState(() => currentUser?.email || millSettings?.email || 'admin@sstextiles.com');
  const [adminName, setAdminName] = useState(() => currentUser?.name || 'SSTextiles Admin');
  const [adminPhone, setAdminPhone] = useState(() => currentUser?.phone || millSettings?.phone || '');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasInitializedRef = React.useRef(false);

  // Sync initial settings only once on mount / initial load
  useEffect(() => {
    if (!hasInitializedRef.current) {
      if (millSettings || currentUser) {
        hasInitializedRef.current = true;
        if (millSettings) setSettings(millSettings);
        if (currentUser?.email) setAdminEmail(currentUser.email);
        else if (millSettings?.email) setAdminEmail(millSettings.email);
        if (currentUser?.name) setAdminName(currentUser.name);
        if (currentUser?.phone) setAdminPhone(currentUser.phone);
        else if (millSettings?.phone) setAdminPhone(millSettings.phone);
      }
    }
  }, [millSettings, currentUser]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaved(false);

    // Validate password change if attempted
    if (newPassword) {
      if (!currentPassword) {
        setErrorMessage('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirm password do not match.');
        return;
      }
    }

    setIsSaving(true);
    try {
      // 1. Update Mill Settings in Backend & Context
      const updatedMillSettings = {
        ...settings,
        adminEmail: adminEmail.trim(),
        adminName: adminName.trim(),
        email: settings.email ? settings.email.trim() : adminEmail.trim(),
      };
      const res = await updateMillSettings(updatedMillSettings);

      // 2. Update Admin User Profile in Backend & AuthContext
      const profilePayload = {
        name: adminName.trim(),
        email: adminEmail.toLowerCase().trim(),
        phone: adminPhone.trim() || settings.phone,
        businessName: settings.name || currentUser?.businessName,
        gstin: settings.gstin || currentUser?.gstin,
        address: settings.address || currentUser?.address,
      };

      if (newPassword) {
        profilePayload.currentPassword = currentPassword;
        profilePayload.newPassword = newPassword;
      }

      if (typeof updateProfile === 'function') {
        const profileRes = await updateProfile(profilePayload);
        if (profileRes && !profileRes.success && profileRes.error) {
          setErrorMessage(profileRes.error);
          setIsSaving(false);
          return;
        }
      } else if (currentUser && currentUser.role === 'admin') {
        const updatedUser = {
          ...currentUser,
          ...profilePayload,
        };
        if (setCurrentUser) {
          setCurrentUser(updatedUser);
        }
        try {
          localStorage.setItem('gtex_user', JSON.stringify(updatedUser));
        } catch (e) { }
      }

      // Reset password fields upon successful save
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);

      setSaved(true);
      setTimeout(() => setSaved(false), 4500);
    } catch (err) {
      console.error('[Settings] Failed to save settings:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save admin settings. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm font-bold text-primary">Administrator &amp; Mill Settings</h1>
          <p className="text-body-sm text-on-surface-variant">
            Manage your Admin account email, sign-in credentials, mill GSTIN, address, hotline, and commercial bank details.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-[#E6F5F0] text-secondary border border-secondary-fixed rounded-2xl font-bold text-label-md flex items-center gap-2.5 shadow-sm animate-fade-in">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <div>
            <p className="text-body-md font-bold">Admin email, account profile &amp; mill settings saved successfully!</p>
            <p className="text-xs font-normal text-secondary/80">
              Live administrator sign-in email updated to: <span className="font-mono font-bold">{adminEmail}</span>
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-error-container text-on-error-container border border-error rounded-2xl font-bold text-label-md flex items-center gap-2.5 shadow-sm">
          <span className="material-symbols-outlined text-xl">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. ADMINISTRATOR ACCOUNT & LOGIN CREDENTIALS */}
        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-3">
            <h2 className="text-title-md font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">admin_panel_settings</span>
              Administrator Account &amp; Login Email
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase tracking-wider">
              Admin Access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Admin Sign-in Email Address *
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@sstextiles.com"
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl px-3.5 py-2.5 text-body-md text-primary font-medium outline-none transition-all shadow-2xs"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                Used to log in to the SSTextiles Admin Portal and receive automated dispatch alerts.
              </span>
            </div>

            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Administrator Name / Representative *
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Soundhar / SSTextiles Admin"
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl px-3.5 py-2.5 text-body-md text-primary font-medium outline-none transition-all shadow-2xs"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                Primary name displayed on admin badges and dispatch approvals.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Admin Mobile / WhatsApp Hotline
              </label>
              <input
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl px-3.5 py-2.5 text-body-md text-primary font-medium outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-bold text-primary flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  {showPasswordFields ? 'expand_less' : 'lock_reset'}
                </span>
                <span>{showPasswordFields ? 'Hide Password Change' : 'Change Admin Password'}</span>
              </button>
            </div>
          </div>

          {/* Password Change Expandable Drawer */}
          {showPasswordFields && (
            <div className="p-4 bg-surface-container-low/70 rounded-xl border border-outline-variant space-y-3 mt-3 animate-fade-in">
              <h3 className="text-label-md font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-secondary">key</span>
                Update Administrator Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. COMPANY & WEAVING MILL IDENTITY */}
        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <h2 className="text-title-md font-bold text-primary border-b border-surface-container pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-lg">domain</span>
            Company &amp; Weaving Mill Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Mill Name
              </label>
              <input
                type="text"
                value={settings.name || ''}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-semibold"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Tagline / Subtext
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                GSTIN
              </label>
              <input
                type="text"
                value={settings.gstin || ''}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Default Towel HSN Code
              </label>
              <input
                type="text"
                value={settings.hsnCode || ''}
                onChange={(e) => setSettings({ ...settings, hsnCode: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Admin Mill State Code (GST)
              </label>
              <input
                type="text"
                maxLength={2}
                value={settings.stateCode || ''}
                onChange={(e) => setSettings({ ...settings, stateCode: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 33"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Mill Hotline / Contact Phone(s)
              </label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="98765 43210, 98765 43211"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Official Invoicing / Contact Email
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="admin@sstextiles.com"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Place of Supply (Invoice Default)
              </label>
              <input
                type="text"
                value={settings.placeOfSupply || ''}
                onChange={(e) => setSettings({ ...settings, placeOfSupply: e.target.value })}
                placeholder="e.g. Tamil Nadu (33)"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Default Vehicle / Dispatch No
              </label>
              <input
                type="text"
                value={settings.vehicleNo || ''}
                onChange={(e) => setSettings({ ...settings, vehicleNo: e.target.value.toUpperCase() })}
                placeholder="e.g. TN 33 AB 1234"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Authorized Signatory Title
              </label>
              <input
                type="text"
                value={settings.signatoryTitle || ''}
                onChange={(e) => setSettings({ ...settings, signatoryTitle: e.target.value })}
                placeholder="e.g. Proprietor"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Emblem / Deity Header Title (Top Left of Bill)
              </label>
              <input
                type="text"
                value={settings.deityText || ''}
                onChange={(e) => setSettings({ ...settings, deityText: e.target.value.toUpperCase() })}
                placeholder="e.g. SHIVAM"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Default Transportation Mode / Carrier
              </label>
              <input
                type="text"
                value={settings.transportMode || ''}
                onChange={(e) => setSettings({ ...settings, transportMode: e.target.value })}
                placeholder="e.g. Road Cargo / VRL Logistics"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
              Mill &amp; Warehouse Dispatch Address
            </label>
            <textarea
              rows={2}
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
            />
          </div>
        </div>

        {/* 3. BANK DETAILS FOR COMMERCIAL INVOICES */}
        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <h2 className="text-title-md font-bold text-primary border-b border-surface-container pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-lg">account_balance</span>
            Bank Details for Commercial Invoices
          </h2>

          <div>
            <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
              Beneficiary Account Name
            </label>
            <input
              type="text"
              value={settings.bankDetails?.accountName || ''}
              onChange={(e) => setSettings({
                ...settings,
                bankDetails: { ...settings.bankDetails, accountName: e.target.value }
              })}
              placeholder="e.g. SSTEXTILES COMMERCIAL ACCOUNT"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={settings.bankDetails?.bankName || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  bankDetails: { ...settings.bankDetails, bankName: e.target.value }
                })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={settings.bankDetails?.accountNumber || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  bankDetails: { ...settings.bankDetails, accountNumber: e.target.value }
                })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={settings.bankDetails?.ifsc || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  bankDetails: { ...settings.bankDetails, ifsc: e.target.value.toUpperCase() }
                })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Branch Name
              </label>
              <input
                type="text"
                value={settings.bankDetails?.branch || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  bankDetails: { ...settings.bankDetails, branch: e.target.value }
                })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-primary-container hover:bg-primary text-white font-label-lg font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                <span>Save All Settings &amp; Admin Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
