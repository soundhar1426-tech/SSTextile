import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

export const AdminCustomers = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [stateFilter, setStateFilter] = useState('ALL');
  const [isEditingBuyer, setIsEditingBuyer] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingBuyer, setSavingBuyer] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Fetch live customer profiles from backend
  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/customers');
      if (response.data.success && Array.isArray(response.data.customers)) {
        setBuyers(response.data.customers);
      } else {
        setBuyers([]);
      }
    } catch (err) {
      console.warn('[AdminCustomers] Backend fetch failed:', err.message);
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  // Strict multi-key deduplication filter across all sources (by email, normalized phone, GSTIN, company name, or id)
  const deduplicatedBuyers = useMemo(() => {
    const normalizePhoneDigits = (ph) => {
      if (!ph) return '';
      let digits = String(ph).replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }
      return digits;
    };

    const seenIds = new Set();
    const seenEmails = new Set();
    const seenPhones = new Set();
    const seenGstins = new Set();
    const seenNames = new Set();
    const result = [];

    for (const b of buyers) {
      const email = (b.email || '').toLowerCase().trim();
      const phone = normalizePhoneDigits(b.phone);
      const gstin = (b.gstin || '').toUpperCase().trim();
      const name = (b.name || b.companyName || b.businessName || '').toLowerCase().trim();
      const bId = b.id || b._id ? String(b.id || b._id) : '';

      let isDuplicate = false;
      if (bId && seenIds.has(bId)) isDuplicate = true;
      if (!isDuplicate && email && email !== 'n/a' && seenEmails.has(email)) isDuplicate = true;
      if (!isDuplicate && phone && phone.length >= 10 && seenPhones.has(phone)) isDuplicate = true;
      if (!isDuplicate && gstin && gstin !== 'UNREGISTERED' && gstin.length >= 15 && seenGstins.has(gstin)) isDuplicate = true;
      if (!isDuplicate && name && name.length > 3 && seenNames.has(name)) isDuplicate = true;

      if (isDuplicate) {
        continue;
      }

      if (bId) seenIds.add(bId);
      if (email && email !== 'n/a') seenEmails.add(email);
      if (phone && phone.length >= 10) seenPhones.add(phone);
      if (gstin && gstin !== 'UNREGISTERED' && gstin.length >= 15) seenGstins.add(gstin);
      if (name && name.length > 3) seenNames.add(name);

      result.push(b);
    }
    return result;
  }, [buyers]);

  // Unique list of states for quick filtering
  const availableStates = useMemo(() => {
    const states = new Set(deduplicatedBuyers.map((b) => b.state).filter(Boolean));
    return ['ALL', ...Array.from(states)];
  }, [deduplicatedBuyers]);

  // Search and state filtering
  const filteredBuyers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return deduplicatedBuyers.filter((b) => {
      const matchesSearch =
        !term ||
        (b.name || '').toLowerCase().includes(term) ||
        (b.contactPerson || '').toLowerCase().includes(term) ||
        (b.phone || '').toLowerCase().includes(term) ||
        (b.email || '').toLowerCase().includes(term) ||
        (b.gstin || '').toLowerCase().includes(term) ||
        (b.pan || '').toLowerCase().includes(term) ||
        (b.city || '').toLowerCase().includes(term);

      const matchesState = stateFilter === 'ALL' || b.state === stateFilter;

      return matchesSearch && matchesState;
    });
  }, [deduplicatedBuyers, searchTerm, stateFilter]);

  // Aggregated summary metrics
  const totalTradeVolume = useMemo(() => {
    return deduplicatedBuyers.reduce((sum, b) => {
      const num = typeof b.lifetimeVolumeNum === 'number'
        ? b.lifetimeVolumeNum
        : Number(String(b.lifetimeVolume || '').replace(/[^0-9]/g, '')) || 0;
      return sum + num;
    }, 0);
  }, [deduplicatedBuyers]);

  const verifiedGstinCount = useMemo(() => {
    return deduplicatedBuyers.filter((b) => b.gstin && b.gstin !== 'Unregistered' && b.gstin.length >= 15).length;
  }, [deduplicatedBuyers]);

  const handleOpenEdit = (buyer) => {
    setSelectedBuyer(buyer);
    setEditForm({
      name: buyer.contactPerson || buyer.name || '',
      businessName: buyer.name || '',
      phone: buyer.phone === 'N/A' ? '' : (buyer.phone || ''),
      email: buyer.email === 'N/A' ? '' : (buyer.email || ''),
      gstin: buyer.gstin === 'Unregistered' ? '' : (buyer.gstin || ''),
      pan: buyer.pan === 'N/A' ? '' : (buyer.pan || ''),
      address: buyer.address || '',
      city: buyer.city || '',
      state: buyer.state || 'Tamil Nadu',
      pincode: buyer.pincode || '',
    });
    setIsEditingBuyer(true);
    setSaveSuccessMsg('');
  };

  const handleSaveBuyer = async (e) => {
    e.preventDefault();
    if (!selectedBuyer) return;
    setSavingBuyer(true);
    setSaveSuccessMsg('');
    try {
      const buyerId = selectedBuyer.id || selectedBuyer._id;
      const res = await api.put(`/admin/customers/${buyerId}`, editForm);
      if (res.data.success) {
        setSaveSuccessMsg('Buyer profile updated successfully!');
        // Update local list
        setBuyers((prev) =>
          prev.map((b) =>
            (b.id === buyerId || b._id === buyerId)
              ? {
                  ...b,
                  name: editForm.businessName || editForm.name,
                  contactPerson: editForm.name,
                  phone: editForm.phone,
                  email: editForm.email,
                  gstin: editForm.gstin || 'Unregistered',
                  pan: editForm.pan || (editForm.gstin?.length >= 12 ? editForm.gstin.substring(2, 12) : 'N/A'),
                  address: editForm.address,
                  city: editForm.city,
                  state: editForm.state,
                  pincode: editForm.pincode,
                }
              : b
          )
        );
        setTimeout(() => {
          setIsEditingBuyer(false);
          setSelectedBuyer(null);
          setSaveSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      console.error('[AdminCustomers] Save error:', err);
      alert(err.response?.data?.message || 'Failed to update buyer details.');
    } finally {
      setSavingBuyer(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-sm font-bold text-primary">Wholesale Buyer Directory</h1>
            <span className="bg-secondary-fixed text-on-secondary-fixed font-bold text-label-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Verified &amp; Editable
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Verified GSTIN institutions, hotels, hospitals, and high-volume textile distributors (All Buyer Details Editable)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBuyers}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-label-sm font-bold text-primary transition-colors border border-outline-variant w-fit"
          title="Refresh buyer directory"
        >
          <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">badge</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">Active Wholesale Buyers</p>
            <p className="text-headline-sm font-bold text-primary font-mono">{deduplicatedBuyers.length}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E6F5F0] flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">Verified GSTIN Accounts</p>
            <p className="text-headline-sm font-bold text-secondary font-mono">{verifiedGstinCount}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">Cumulative Trade Volume</p>
            <p className="text-headline-sm font-bold text-primary font-mono">
              ₹{totalTradeVolume.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, name, phone, GSTIN, city..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-4 py-2 text-body-sm text-primary placeholder:text-outline focus:border-primary focus:bg-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-label-xs text-outline font-bold uppercase whitespace-nowrap">State:</span>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-body-sm text-primary font-semibold outline-none w-full sm:w-auto"
          >
            {availableStates.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Indian States' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buyers Grid */}
      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm text-on-surface-variant">Loading wholesale buyer accounts...</p>
        </div>
      ) : filteredBuyers.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center space-y-3 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-outline">group_off</span>
          <p className="text-body-md font-bold text-primary">No wholesale buyers found</p>
          <p className="text-body-xs text-on-surface-variant">Try adjusting your search terms or state filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuyers.map((buyer) => {
            const rawPhone = (buyer.phone || '').replace(/[^0-9]/g, '');
            const cleanPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

            return (
              <div
                key={buyer.id || buyer._id || buyer.email}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-primary text-title-sm line-clamp-1">
                      {buyer.name || 'Wholesale Buyer'}
                    </h3>
                    <p className="text-body-xs text-on-surface-variant font-medium">
                      {buyer.contactPerson || 'Primary Contact'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide whitespace-nowrap ${
                      buyer.creditStatus?.includes('Tier 1') || buyer.creditStatus?.includes('Advance')
                        ? 'bg-[#E6F5F0] text-secondary border-secondary-fixed'
                        : 'bg-primary-container/20 text-primary border-primary/20'
                    }`}
                  >
                    {buyer.creditStatus || 'Active Buyer'}
                  </span>
                </div>

                {/* Hub and Trade Volume */}
                <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-3 text-body-xs">
                  <div>
                    <span className="text-outline block text-label-xs">Hub Location:</span>
                    <span className="font-bold text-primary flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-xs text-outline">location_on</span>
                      {buyer.city}, {buyer.state}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-outline block text-label-xs">Lifetime Volume:</span>
                    <span className="font-bold text-secondary font-mono text-body-sm block mt-0.5">
                      {buyer.lifetimeVolume || '₹0'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      ({buyer.totalOrdersCount || 0} Purchase Orders)
                    </span>
                  </div>
                </div>

                {/* Quick Connect & Action Toolbar */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(buyer)}
                    className="flex-1 py-2 bg-primary-container hover:bg-primary text-white rounded-xl text-label-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="Edit Buyer Details for Bill / Invoices"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Edit Buyer Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBuyer(buyer);
                      setIsEditingBuyer(false);
                    }}
                    className="p-2 border border-outline-variant hover:bg-surface-container rounded-xl text-label-xs font-bold text-primary flex items-center justify-center transition-colors"
                    title="View Profile Details"
                  >
                    <span className="material-symbols-outlined text-sm">info</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buyer Details / Edit Modal */}
      {selectedBuyer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-label-xs uppercase font-bold text-secondary tracking-wider">
                  {isEditingBuyer ? 'Edit Buyer Details (Used for Bills)' : 'Verified Buyer Profile'}
                </span>
                <h2 className="text-headline-xs font-bold text-primary mt-1">{selectedBuyer.name}</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedBuyer(null);
                  setIsEditingBuyer(false);
                }}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-[#E6F5F0] text-secondary border border-secondary-fixed rounded-xl text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {isEditingBuyer ? (
              <form onSubmit={handleSaveBuyer} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Company / Business Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.businessName || ''}
                      onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      GSTIN (15-Characters)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={editForm.gstin || ''}
                      onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono uppercase font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.state || ''}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="e.g. Tamil Nadu or Karnataka"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                    Street Address (Billing &amp; Delivery)
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      City / Hub
                    </label>
                    <input
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editForm.pincode || ''}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsEditingBuyer(false)}
                    className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBuyer}
                    className="px-5 py-2 bg-primary-container hover:bg-primary text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {savingBuyer ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        <span>Save Buyer Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-body-xs">
                  <div className="flex justify-between py-1 border-b border-border-subtle">
                    <span className="text-outline">GSTIN:</span>
                    <span className="font-bold text-primary font-mono">{selectedBuyer.gstin}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle">
                    <span className="text-outline">PAN:</span>
                    <span className="font-bold text-primary font-mono">{selectedBuyer.pan}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle">
                    <span className="text-outline">Location:</span>
                    <span className="font-bold text-primary">{selectedBuyer.city}, {selectedBuyer.state}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle">
                    <span className="text-outline">Phone:</span>
                    <span className="font-bold text-primary">{selectedBuyer.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle">
                    <span className="text-outline">Email:</span>
                    <span className="font-bold text-primary">{selectedBuyer.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle">
                    <span className="text-outline">Total Orders:</span>
                    <span className="font-bold text-primary">{selectedBuyer.totalOrdersCount} POs</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-outline">Lifetime Volume:</span>
                    <span className="font-bold text-secondary font-mono">{selectedBuyer.lifetimeVolume}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedBuyer)}
                    className="px-4 py-2.5 bg-primary-container text-white rounded-xl text-label-sm font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Edit Profile Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBuyer(null)}
                    className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary rounded-xl text-label-sm font-bold"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminCustomers;
