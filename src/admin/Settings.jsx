import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

export const AdminSettings = () => {
  const { millSettings, updateMillSettings } = useProducts();
  const { currentUser, setCurrentUser } = useAuth();

  const [settings, setSettings] = useState(() => millSettings || {});
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync settings when millSettings loads or changes in ProductContext
  useEffect(() => {
    if (millSettings) {
      setSettings(millSettings);
    }
  }, [millSettings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateMillSettings(settings);

      // Keep AuthContext admin user synchronized (without clobbering personal name or individual address)
      if (currentUser && currentUser.role === 'admin') {
        const updatedUser = {
          ...currentUser,
          businessName: settings.name || currentUser.businessName,
          phone: settings.phone || currentUser.phone,
          gstin: settings.gstin || currentUser.gstin,
        };
        if (setCurrentUser) {
          setCurrentUser(updatedUser);
        }
        try {
          localStorage.setItem('gtex_user', JSON.stringify(updatedUser));
        } catch (e) { }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error('[Settings] Failed to save settings:', err);
      alert('Failed to save mill settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm font-bold text-primary">Mill Configurations &amp; Tax Settings</h1>
          <p className="text-body-sm text-on-surface-variant">Manage Erode Mill GSTIN, Address, Hotline, and Commercial Bank details for Tax Invoices.</p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-[#E6F5F0] text-secondary border border-secondary-fixed rounded-xl font-bold text-label-md flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>Mill operational parameters &amp; tax configurations saved successfully!</span>
        </div>
      )}

      {/* 2. COMPANY & WEAVING MILL IDENTITY */}
      <form onSubmit={handleSaveSettings} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
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
              placeholder=" 95666 47874"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary"
            />
          </div>
          <div>
            <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
              Official Orders Email
            </label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="orders@sstex.com"
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

        <h2 className="text-title-md font-bold text-primary border-b border-surface-container pb-2 pt-2 flex items-center gap-1.5">
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

        <div className="pt-2">
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
                <span>Save Mill Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
