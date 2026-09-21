import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';

export const AdminInvoices = () => {
  const { fetchAdminInvoices } = useOrders();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      const res = await fetchAdminInvoices();
      if (res.success) {
        setInvoices(res.invoices || []);
      }
      setLoading(false);
    };

    loadInvoices();
  }, [fetchAdminInvoices]);

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const custName = (inv.customerDetails?.name || inv.customer?.name || '').toLowerCase();
    const company = (inv.customerDetails?.businessName || '').toLowerCase();
    return invNum.includes(term) || custName.includes(term) || company.includes(term);
  });

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-sm font-bold text-primary">GST Tax Invoices &amp; Bilties</h1>
          <p className="text-body-sm text-on-surface-variant">
            Official tax invoices generated upon manual payment confirmation
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg pl-9 pr-4 py-1.5 text-body-sm text-primary outline-none focus:ring-1 focus:ring-primary w-64"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-lg">
            search
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-on-surface-variant">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-body-sm">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-outline">receipt</span>
          <h3 className="text-title-md font-bold text-primary">No invoices found</h3>
          <p className="text-body-sm text-on-surface-variant">
            {searchTerm
              ? 'No invoices match your search query.'
              : 'Invoices will be listed here after admin confirms payment on wholesale orders.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant text-label-sm font-bold uppercase text-on-surface-variant">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Customer &amp; Firm</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Taxable Value</th>
                  <th className="p-3.5">Total (5% GST)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {filteredInvoices.map((inv) => {
                  const orderId = inv.order?._id || inv.order || inv._id;
                  const taxable = Number(inv.subtotal || 0) - Number(inv.discount || 0);
                  const total = Number(inv.totalAmount || inv.total || taxable + Number(inv.tax || 0));

                  return (
                    <tr key={inv._id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-3.5 font-bold text-primary">
                        {inv.invoiceNumber}
                        <span className="block text-[10px] text-outline font-sans">
                          Order #{inv.order?.orderNumber || (typeof inv.order === 'string' ? inv.order : 'GTX')}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans">
                        <p className="font-semibold text-primary">
                          {inv.customerDetails?.name || inv.customer?.name || 'Customer'}
                        </p>
                        {inv.customerDetails?.businessName && (
                          <p className="text-xs text-on-surface-variant">{inv.customerDetails.businessName}</p>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-on-surface-variant">
                        {inv.customerDetails?.gstin || 'N/A'}
                      </td>
                      <td className="p-3.5 text-xs font-sans text-on-surface-variant">
                        {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 font-semibold text-primary">
                        ₹{taxable.toLocaleString('en-IN')}.00
                      </td>
                      <td className="p-3.5 font-bold text-secondary text-body-md">
                        ₹{total.toLocaleString('en-IN')}.00
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary bg-[#E6F5F0] border border-secondary-fixed px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          PAID
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        <Link
                          to={`/invoice/${orderId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">print</span>
                          <span>Print / View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;
