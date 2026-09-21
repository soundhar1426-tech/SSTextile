import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { millInfo } from '../data/mockData';

// Comprehensive Indian State GST Code Dictionary
const INDIAN_STATE_GST_CODES = {
  'jammu and kashmir': '01',
  'himachal pradesh': '02',
  'punjab': '03',
  'chandigarh': '04',
  'uttarakhand': '05',
  'haryana': '06',
  'delhi': '07',
  'rajasthan': '08',
  'uttar pradesh': '09',
  'bihar': '10',
  'sikkim': '11',
  'arunachal pradesh': '12',
  'nagaland': '13',
  'manipur': '14',
  'mizoram': '15',
  'tripura': '16',
  'meghalaya': '17',
  'assam': '18',
  'west bengal': '19',
  'jharkhand': '20',
  'odisha': '21',
  'orissa': '21',
  'chhattisgarh': '22',
  'madhya pradesh': '23',
  'gujarat': '24',
  'daman and diu': '26',
  'dadra and nagar haveli': '26',
  'maharashtra': '27',
  'andhra pradesh': '37',
  'karnataka': '29',
  'goa': '30',
  'lakshadweep': '31',
  'kerala': '32',
  'tamil nadu': '33',
  'tamilnadu': '33',
  'puducherry': '34',
  'pondicherry': '34',
  'andaman and nicobar islands': '35',
  'telangana': '36',
  'andhra pradesh (new)': '37',
  'ladakh': '38',
  // Short abbreviations
  'tn': '33',
  'ka': '29',
  'kl': '32',
  'mh': '27',
  'ap': '37',
  'ts': '36',
  'tg': '36',
  'dl': '07',
  'gj': '24',
  'rj': '08',
  'up': '09',
  'wb': '19',
  'pb': '03',
  'hr': '06',
  'mp': '23',
  'py': '34',
};

// Helper to reliably resolve 2-digit GST state code
function resolveStateCode(stateName, gstin) {
  // 1. If buyer has GSTIN, the first two characters define the official GST state code
  if (gstin && gstin.trim().length >= 2) {
    const firstTwo = gstin.trim().slice(0, 2);
    if (!isNaN(firstTwo) && Number(firstTwo) >= 1 && Number(firstTwo) <= 38) {
      return firstTwo.padStart(2, '0');
    }
  }

  // 2. Check if stateName is provided
  if (!stateName) return '33';
  const str = String(stateName).trim();

  // 3. If stateName itself contains a 2-digit number (e.g. '33' or '29' or 'Tamil Nadu (33)')
  const digitsMatch = str.match(/\b([0-3][0-9])\b/);
  if (digitsMatch) {
    const num = Number(digitsMatch[1]);
    if (num >= 1 && num <= 38) {
      return digitsMatch[1].padStart(2, '0');
    }
  }

  // 4. Match state name against dictionary
  const clean = str.toLowerCase().replace(/[^a-z]/g, '');
  if (INDIAN_STATE_GST_CODES[clean]) {
    return INDIAN_STATE_GST_CODES[clean];
  }

  for (const [key, code] of Object.entries(INDIAN_STATE_GST_CODES)) {
    const cleanKey = key.replace(/[^a-z]/g, '');
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return code;
    }
  }

  return '33';
}

// Helper: Convert number to Indian Currency in Words
function numberToWordsINR(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tensDigits = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const convertTwoDigits = (n) => {
    if (n === 0) return '';
    if (n < 20) return singleDigits[n];
    return tensDigits[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + singleDigits[n % 10] : '');
  };

  const convertThreeDigits = (n) => {
    if (n === 0) return '';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += singleDigits[hundred] + ' Hundred';
    if (rest > 0) res += (res ? ' ' : '') + convertTwoDigits(rest);
    return res;
  };

  const integerPart = Math.floor(amount);
  const paisePart = Math.round((amount - integerPart) * 100);

  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const hundredAndRest = integerPart % 1000;

  let words = '';
  if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundredAndRest > 0) words += convertThreeDigits(hundredAndRest);

  let result = `Rupees ${words.trim()}`;
  if (paisePart > 0) {
    result += ` and ${convertTwoDigits(paisePart)} Paise`;
  }
  result += ' Only';

  return result;
}

// 15-Box Character Grid for GSTIN
const GstinBoxGrid = ({ gstin }) => {
  const cleanGstin = (gstin || '').toUpperCase().trim();
  const chars = Array.from({ length: 15 }, (_, i) => cleanGstin[i] || '');

  if (!cleanGstin) {
    return (
      <span className="font-mono font-bold text-gray-700 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-[11px] inline-block">
        UNREGISTERED / COMPOSITE
      </span>
    );
  }

  return (
    <div className="inline-flex border border-black rounded-xs overflow-hidden bg-white text-[11px] font-mono font-bold">
      {chars.map((char, i) => (
        <span
          key={i}
          className="w-4 h-4 flex items-center justify-center text-center border-r border-gray-400 last:border-r-0 bg-gray-50/50"
        >
          {char || ''}
        </span>
      ))}
    </div>
  );
};

// 2-Box State Code (Numerical 2 digits)
const StateCodeBox = ({ code }) => {
  const digits = (code || '').toString().replace(/\D/g, '');
  const cleanCode = digits.length >= 2 ? digits.slice(0, 2) : (digits.length === 1 ? `0${digits}` : '33');
  return (
    <div className="inline-flex border border-black rounded-xs overflow-hidden bg-white text-[11px] font-mono font-bold">
      <span className="w-4 h-4 flex items-center justify-center text-center border-r border-gray-400 bg-gray-50/50">
        {cleanCode[0]}
      </span>
      <span className="w-4 h-4 flex items-center justify-center text-center bg-gray-50/50">
        {cleanCode[1]}
      </span>
    </div>
  );
};

export const Invoice = () => {
  const { id } = useParams();
  const { getOrderInvoice, getOrderById, updateInvoice, confirmPayment } = useOrders();
  const { millSettings, updateMillSettings, products } = useProducts();
  const { currentUser, isAdmin } = useAuth();
  const isUserAdmin = isAdmin || currentUser?.role === 'admin';

  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Live Bill Customization / Editing State
  const [isEditingBill, setIsEditingBill] = useState(false);
  const [editTab, setEditTab] = useState('mill'); // 'mill' | 'buyer' | 'items' | 'meta'
  const [billOverrides, setBillOverrides] = useState(null);
  const [saveAsDefaults, setSaveAsDefaults] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Payment Confirmation State (Admin)
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [confirmPaymentOnSave, setConfirmPaymentOnSave] = useState(false);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) return;
      setLoading(true);

      const invRes = await getOrderInvoice(id);
      if (invRes.success && invRes.invoice) {
        setInvoice(invRes.invoice);
      } else {
        setErrorMessage(invRes.error || 'Invoice is not available for this order.');
        const ordData = await getOrderById(id);
        if (ordData) {
          setOrder(ordData);
        }
      }

      setLoading(false);
    };

    fetchInvoiceData();
  }, [id, getOrderInvoice, getOrderById]);

  // Invoice Number & Active Mill Snapshot (Prioritizes live millSettings for non-customized bills)
  const isInvoiceCustomized = invoice?.isCustomized === true;

  const activeMill = {
    name: (isInvoiceCustomized && invoice?.millDetails?.name) ? invoice.millDetails.name : (invoice?.millDetails?.name || millSettings?.name || millInfo.name),
    tagline: (isInvoiceCustomized && invoice?.millDetails?.tagline !== undefined) ? invoice.millDetails.tagline : (invoice?.millDetails?.tagline || millSettings?.tagline || millInfo.tagline),
    deityText: (isInvoiceCustomized && invoice?.millDetails?.deityText) ? invoice.millDetails.deityText : (invoice?.millDetails?.deityText || millSettings?.deityText || 'SHIVAM'),
    address: (isInvoiceCustomized && invoice?.millDetails?.address) ? invoice.millDetails.address : (invoice?.millDetails?.address || millSettings?.address || millInfo.address),
    gstin: (isInvoiceCustomized && (invoice?.millGstin || invoice?.millDetails?.gstin)) ? (invoice.millGstin || invoice.millDetails.gstin) : (invoice?.millGstin || invoice?.millDetails?.gstin || millSettings?.gstin || millInfo.gstin),
    stateCode: (isInvoiceCustomized && invoice?.millDetails?.stateCode) ? invoice.millDetails.stateCode : (invoice?.millDetails?.stateCode || millSettings?.stateCode || millInfo.stateCode || '33'),
    phone: (isInvoiceCustomized && invoice?.millDetails?.phone) ? invoice.millDetails.phone : (invoice?.millDetails?.phone || millSettings?.phone || millInfo.phone),
    email: (isInvoiceCustomized && invoice?.millDetails?.email) ? invoice.millDetails.email : (invoice?.millDetails?.email || millSettings?.email || millInfo.email),
    placeOfSupply: (isInvoiceCustomized && invoice?.placeOfSupply) ? invoice.placeOfSupply : (invoice?.placeOfSupply || millSettings?.placeOfSupply || 'Tamil Nadu (33)'),
    vehicleNo: (isInvoiceCustomized && invoice?.vehicleNo) ? invoice.vehicleNo : (invoice?.vehicleNo || millSettings?.vehicleNo || 'TN 33 AB 1234'),
    transportMode: (isInvoiceCustomized && invoice?.transportMode) ? invoice.transportMode : (invoice?.transportMode || millSettings?.transportMode || 'Road Cargo / VRL Logistics'),
    signatoryTitle: (isInvoiceCustomized && (invoice?.signatoryTitle || invoice?.millDetails?.signatoryTitle)) ? (invoice.signatoryTitle || invoice.millDetails.signatoryTitle) : (invoice?.signatoryTitle || invoice?.millDetails?.signatoryTitle || millSettings?.signatoryTitle || 'Proprietor'),
    bankDetails: {
      accountName: (isInvoiceCustomized && invoice?.millDetails?.bankDetails?.accountName) ? invoice.millDetails.bankDetails.accountName : (invoice?.millDetails?.bankDetails?.accountName || millSettings?.bankDetails?.accountName || millInfo?.bankDetails?.accountName || 'SS TEX'),
      bankName: (isInvoiceCustomized && invoice?.millDetails?.bankDetails?.bankName) ? invoice.millDetails.bankDetails.bankName : (invoice?.millDetails?.bankDetails?.bankName || millSettings?.bankDetails?.bankName || millInfo?.bankDetails?.bankName || 'Tamilnadu Mercantile Bank'),
      branch: (isInvoiceCustomized && invoice?.millDetails?.bankDetails?.branch) ? invoice.millDetails.bankDetails.branch : (invoice?.millDetails?.bankDetails?.branch || millSettings?.bankDetails?.branch || millInfo?.bankDetails?.branch || 'Pallagoundanpalayam'),
      accountNumber: (isInvoiceCustomized && invoice?.millDetails?.bankDetails?.accountNumber) ? invoice.millDetails.bankDetails.accountNumber : (invoice?.millDetails?.bankDetails?.accountNumber || millSettings?.bankDetails?.accountNumber || millInfo?.bankDetails?.accountNumber || '39815005080789'),
      ifsc: (isInvoiceCustomized && invoice?.millDetails?.bankDetails?.ifsc) ? invoice.millDetails.bankDetails.ifsc : (invoice?.millDetails?.bankDetails?.ifsc || millSettings?.bankDetails?.ifsc || millInfo?.bankDetails?.ifsc || 'TMBL0900789'),
    },
  };

  const defaultInvoiceNumber = invoice?.invoiceNumber || `SST-INV-${id}`;
  const orderNumber = invoice?.order?.orderNumber || (typeof invoice?.order === 'string' ? invoice.order : id);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = currentInvoiceNumber || `Bill-${orderNumber}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  // Helper to extract product HSN code dynamically from product catalog, order item, or bill overrides
  const getProductHsn = (item, index) => {
    const key = item._id || item.id || (index !== undefined ? `item-${index}` : null);
    if (key && billOverrides?.itemHsnOverrides?.[key]) {
      return billOverrides.itemHsnOverrides[key];
    }
    if (item.hsnCode && String(item.hsnCode).trim() !== '') return item.hsnCode;
    if (item.hsn && String(item.hsn).trim() !== '') return item.hsn;
    if (item.product && typeof item.product === 'object' && item.product.hsnCode) return item.product.hsnCode;
    const found = products?.find(
      (p) =>
        p._id === item.product ||
        p.id === item.product ||
        p._id === item.productId ||
        p.id === item.productId ||
        p.name === item.productName ||
        p.title === item.productName
    );
    if (found && found.hsnCode) return found.hsnCode;
    return invoice?.hsnCode || millSettings?.hsnCode || '6302.60';
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-body-sm text-on-surface-variant font-medium">Loading official mill invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    const isPending = (order?.paymentStatus || '').toLowerCase() === 'pending';

    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-[#FFF4E5] text-[#B76E00] rounded-full flex items-center justify-center mx-auto border-2 border-[#FFE2B3]">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>

        <div className="space-y-1">
          <span className="inline-block bg-[#FFF4E5] text-[#B76E00] text-label-sm font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border border-[#FFE2B3]">
            {isPending ? 'PAYMENT VERIFICATION PENDING' : 'INVOICE NOT GENERATED'}
          </span>
          <h2 className="text-headline-sm font-bold text-primary">
            Invoice Not Available
          </h2>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            {errorMessage || 'Final GST Tax Invoices are issued only after manual remittance verification by SSTextiles.'}
          </p>
        </div>

        <div className="pt-3 flex flex-wrap justify-center gap-3">
          <Link
            to={order ? `/orders/${order._id || order.orderNumber}` : '/orders'}
            className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-label-md shadow hover:bg-primary/90 transition-all"
          >
            View Order Status
          </Link>
          <Link
            to="/orders"
            className="px-5 py-2.5 bg-surface-container text-primary border border-outline-variant rounded-lg font-bold text-label-md hover:bg-surface-container-high transition-all"
          >
            My Orders
          </Link>
        </div>
      </div>
    );
  }

  // Monetary & Consignment Piece Calculations
  const displayItems = billOverrides?.items || invoice.items || [];
  const discount = Number(invoice.discount || 0);
  const subtotal = displayItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = Number(invoice.tax !== undefined && !billOverrides?.items ? invoice.tax : Math.round(taxable * 0.05));
  const cgst = Number((tax / 2).toFixed(2));
  const sgst = cgst;
  const totalAmount = taxable + tax;
  const totalPieces = displayItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || Number(invoice.totalPieces || order?.totalPieces || 0);

  const isPaymentPending =
    (invoice?.paymentStatus || order?.paymentStatus || '').toLowerCase() !== 'paid' &&
    (invoice?.paymentStatus || order?.paymentStatus || '').toLowerCase() !== 'confirmed' ||
    Boolean(invoice?.isDraft);

  const formatRsPs = (val) => {
    const num = Number(val || 0);
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    return {
      rs: rupees.toLocaleString('en-IN'),
      ps: paise === 0 ? '00' : paise < 10 ? `0${paise}` : `${paise}`,
    };
  };

  // Receiver Dynamic Details from Invoice, Order & Buyer Profile
  const customerProfile = (invoice?.customer && typeof invoice.customer === 'object')
    ? invoice.customer
    : ((order?.customer && typeof order.customer === 'object') ? order.customer : (currentUser?.role === 'customer' ? currentUser : null));

  const defaultCustomerName = isInvoiceCustomized
    ? (invoice?.customerDetails?.businessName || invoice?.customerDetails?.name || 'Customer')
    : (
      invoice?.customerDetails?.businessName ||
      invoice?.customerDetails?.name ||
      order?.customerDetails?.businessName ||
      order?.customerDetails?.name ||
      order?.shippingAddress?.name ||
      customerProfile?.businessName ||
      customerProfile?.companyName ||
      customerProfile?.name ||
      'Customer'
    );

  const defaultCustomerContact = isInvoiceCustomized
    ? (invoice?.customerDetails?.phone !== undefined ? invoice.customerDetails.phone : '')
    : (
      invoice?.customerDetails?.phone ||
      order?.customerDetails?.phone ||
      order?.shippingAddress?.phone ||
      customerProfile?.phone ||
      ''
    );

  const defaultCustomerEmail = isInvoiceCustomized
    ? (invoice?.customerDetails?.email !== undefined ? invoice.customerDetails.email : '')
    : (
      invoice?.customerDetails?.email ||
      order?.customerDetails?.email ||
      customerProfile?.email ||
      ''
    );

  const defaultBuyerGstinRaw = (isInvoiceCustomized
    ? (invoice?.customerDetails?.gstin !== undefined ? invoice.customerDetails.gstin : '')
    : (
      invoice?.customerDetails?.gstin ||
      order?.customerDetails?.gstin ||
      order?.shippingAddress?.gstin ||
      customerProfile?.gstin ||
      order?.customer?.gstin ||
      ''
    )
  ).toUpperCase().trim();

  const defaultBillingAddress = isInvoiceCustomized
    ? (invoice?.deliveryAddress?.addressLine1 || 'Direct Buyer Registered Address')
    : (
      invoice?.deliveryAddress?.addressLine1 ||
      order?.deliveryDetails?.addressLine1 ||
      order?.shippingAddress?.address ||
      customerProfile?.address ||
      'Direct Buyer Registered Address'
    );

  const defaultBuyerStateRaw = isInvoiceCustomized
    ? (invoice?.buyerState || invoice?.deliveryAddress?.state || invoice?.customerDetails?.state || '')
    : (
      invoice?.buyerState ||
      invoice?.deliveryAddress?.state ||
      order?.deliveryDetails?.state ||
      order?.shippingAddress?.state ||
      customerProfile?.state ||
      order?.customerDetails?.state ||
      invoice?.customerDetails?.state ||
      ''
    );

  const rawBuyerStateCode = isInvoiceCustomized
    ? (invoice?.buyerStateCode || invoice?.deliveryAddress?.stateCode || invoice?.customerDetails?.stateCode || '')
    : (
      invoice?.buyerStateCode ||
      invoice?.deliveryAddress?.stateCode ||
      invoice?.customerDetails?.stateCode ||
      order?.buyerStateCode ||
      order?.deliveryDetails?.stateCode ||
      order?.customerDetails?.stateCode ||
      order?.shippingAddress?.stateCode ||
      customerProfile?.stateCode ||
      ''
    );

  const defaultBuyerStateCode = rawBuyerStateCode && String(rawBuyerStateCode).trim() !== ''
    ? String(rawBuyerStateCode).replace(/\D/g, '').slice(0, 2).padStart(2, '0')
    : resolveStateCode(defaultBuyerStateRaw, defaultBuyerGstinRaw);

  const getStateNameFromCode = (code) => {
    const entry = Object.entries(INDIAN_STATE_GST_CODES).find(([_, c]) => c === code);
    if (entry) {
      return entry[0].split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return 'Tamil Nadu';
  };

  const defaultBuyerState = defaultBuyerStateRaw || getStateNameFromCode(defaultBuyerStateCode);

  // Admin Mill State Code (Editable by Admin)
  const adminStateCodeDigits = ((isInvoiceCustomized ? invoice?.millDetails?.stateCode : null) || activeMill.stateCode || millSettings?.stateCode || '33').toString().replace(/\D/g, '');
  const defaultAdminStateCode = adminStateCodeDigits.length >= 2 ? adminStateCodeDigits.slice(0, 2) : (adminStateCodeDigits.length === 1 ? `0${adminStateCodeDigits}` : '33');

  // Metadata Logistics (Editable by Admin)
  const defaultTransportMode = (isInvoiceCustomized ? (invoice.transportMode || invoice.deliveryAddress?.transporter) : null) || invoice.deliveryAddress?.transporter || order?.deliveryDetails?.transporter || activeMill.transportMode || 'Road Cargo / VRL Logistics';
  const defaultVehicleNo = (isInvoiceCustomized ? (invoice.vehicleNo || invoice.deliveryAddress?.vehicleNo) : null) || order?.deliveryDetails?.vehicleNo || order?.deliveryDetails?.lrNumber || invoice.deliveryAddress?.vehicleNo || activeMill.vehicleNo || 'TN 33 AB 1234';
  const defaultPlaceOfSupply = (isInvoiceCustomized ? invoice.placeOfSupply : null) || order?.placeOfSupply || invoice?.placeOfSupply || activeMill.placeOfSupply || `${defaultBuyerState} (${defaultBuyerStateCode})`;

  const invoiceDateObj = new Date(invoice.invoiceDate || invoice.createdAt || Date.now());
  const defaultInvoiceDateStr = invoiceDateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const defaultEwbNo = invoice?.ewbNo || (order?.deliveryDetails?.lrNumber ? `EWB-${order.deliveryDetails.lrNumber}` : `GTX-EWB-${id?.slice(-6).toUpperCase()}`);

  // ACTIVE LIVE BINDINGS (Reflects live edits immediately)
  const currentMillName = billOverrides?.millName || activeMill.name;
  const currentMillTagline = billOverrides?.millTagline || activeMill.tagline;
  const currentDeityText = billOverrides?.deityText || activeMill.deityText || 'SHIVAM';
  const currentMillPhone = billOverrides?.millPhone || activeMill.phone;
  const currentMillAddress = billOverrides?.millAddress || activeMill.address;
  const currentMillGstin = billOverrides?.millGstin || activeMill.gstin;
  const currentAdminStateCode = billOverrides?.millStateCode || defaultAdminStateCode;
  const currentPlaceOfSupply = billOverrides?.placeOfSupply || defaultPlaceOfSupply;
  const currentVehicleNo = billOverrides?.vehicleNo || defaultVehicleNo;
  const currentTransportMode = billOverrides?.transportMode || defaultTransportMode;
  const currentSignatoryTitle = billOverrides?.signatoryTitle || activeMill.signatoryTitle;
  const currentBankName = billOverrides?.bankName || activeMill.bankDetails?.bankName;
  const currentBranch = billOverrides?.branch || activeMill.bankDetails?.branch;
  const currentAccountName = billOverrides?.accountName || activeMill.bankDetails?.accountName;
  const currentAccountNumber = billOverrides?.accountNumber || activeMill.bankDetails?.accountNumber;
  const currentIfsc = billOverrides?.ifsc || activeMill.bankDetails?.ifsc;

  const currentCustomerName = billOverrides?.customerName || defaultCustomerName;
  const currentBillingAddress = billOverrides?.billingAddress || defaultBillingAddress;
  const currentBuyerGstin = billOverrides?.buyerGstin !== undefined ? billOverrides.buyerGstin : defaultBuyerGstinRaw;
  const currentBuyerState = billOverrides?.buyerState || defaultBuyerState;
  const currentBuyerStateCode = billOverrides?.buyerStateCode || defaultBuyerStateCode;
  const currentCustomerContact = billOverrides?.customerContact !== undefined ? billOverrides.customerContact : defaultCustomerContact;
  const currentCustomerEmail = billOverrides?.customerEmail !== undefined ? billOverrides.customerEmail : defaultCustomerEmail;
  const currentEwbNo = billOverrides?.ewbNo || defaultEwbNo;
  const currentInvoiceNumber = billOverrides?.invoiceNumber || defaultInvoiceNumber;
  const currentInvoiceDateStr = billOverrides?.invoiceDateStr || defaultInvoiceDateStr;

  // Open Live Bill Edit Modal
  const handleOpenEditModal = () => {
    const initialHsnMap = {};
    const currentItemsList = (billOverrides?.items && billOverrides.items.length > 0)
      ? billOverrides.items
      : (invoice?.items && invoice.items.length > 0 ? invoice.items : []);

    const initialItems = currentItemsList.map((item, index) => {
      const key = item._id || item.id || `item-${index}`;
      const hsn = billOverrides?.itemHsnOverrides?.[key] || item.hsnCode || getProductHsn(item, index);
      initialHsnMap[key] = hsn;
      return {
        key,
        _id: item._id,
        id: item.id,
        product: item.product?._id || item.product,
        productName: item.productName || 'White Towel Product',
        size: item.size || '30x60',
        sizeRef: item.sizeRef,
        hsnCode: hsn,
        quantity: Math.max(0, parseInt(item.quantity, 10) || 0),
        price: Math.max(0, Number(item.price) || 0),
        subtotal: (Math.max(0, parseInt(item.quantity, 10) || 0)) * (Math.max(0, Number(item.price) || 0)),
      };
    });

    setEditForm({
      // Mill / Admin Fields
      millName: currentMillName,
      millTagline: currentMillTagline,
      deityText: currentDeityText,
      millPhone: currentMillPhone,
      millEmail: activeMill.email || '',
      millGstin: currentMillGstin,
      millStateCode: currentAdminStateCode,
      millAddress: currentMillAddress,
      placeOfSupply: currentPlaceOfSupply,
      vehicleNo: currentVehicleNo,
      transportMode: currentTransportMode,
      signatoryTitle: currentSignatoryTitle,
      bankName: currentBankName,
      branch: currentBranch,
      accountName: currentAccountName,
      accountNumber: currentAccountNumber,
      ifsc: currentIfsc,

      // Buyer / Receiver Fields
      customerName: currentCustomerName,
      billingAddress: currentBillingAddress,
      buyerGstin: currentBuyerGstin,
      buyerState: currentBuyerState,
      buyerStateCode: currentBuyerStateCode,
      customerContact: currentCustomerContact,
      customerEmail: currentCustomerEmail,
      ewbNo: currentEwbNo,

      // Product Items & Pieces (Fully Editable per product)
      items: initialItems.length > 0 ? initialItems : [
        {
          key: 'item-0',
          productName: 'White Terry Towel',
          size: '30x60',
          hsnCode: '6302.60',
          quantity: 50,
          price: 150,
          subtotal: 7500,
        },
      ],
      itemHsnOverrides: initialHsnMap,

      // Invoice Metadata
      invoiceNumber: currentInvoiceNumber,
      invoiceDateStr: currentInvoiceDateStr,
    });
    setIsEditingBill(true);
  };

  const handleItemFieldChange = (index, field, value) => {
    setEditForm((prev) => {
      const items = [...(prev.items || [])];
      const target = { ...items[index] };
      if (field === 'quantity') {
        target.quantity = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
      } else if (field === 'price') {
        target.price = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      } else {
        target[field] = value;
      }
      const q = parseInt(target.quantity, 10) || 0;
      const p = parseFloat(target.price) || 0;
      target.subtotal = q * p;
      items[index] = target;
      return { ...prev, items };
    });
  };

  const handleAddItemRow = () => {
    setEditForm((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          key: `item-${Date.now()}`,
          productName: 'White Terry Towel',
          size: '30x60',
          hsnCode: '6302.60',
          quantity: 25,
          price: 150,
          subtotal: 3750,
        },
      ],
    }));
  };

  const handleRemoveItemRow = (index) => {
    setEditForm((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  // Apply Changes to Bill Layout & DB Persistence
  const handleSaveBillEdits = async (e) => {
    e.preventDefault();
    setIsSavingChanges(true);

    const calculatedBuyerStateCode = resolveStateCode(editForm.buyerState, editForm.buyerGstin);

    const computedItems = (editForm.items || []).map((item) => {
      const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
      const rate = Math.max(0, Number(item.price) || 0);
      return {
        ...item,
        quantity: qty,
        price: rate,
        subtotal: qty * rate,
      };
    });

    const computedTotalPieces = computedItems.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const computedSubtotal = computedItems.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
    const computedTaxable = Math.max(0, computedSubtotal - discount);
    const computedTax = Math.round(computedTaxable * 0.05);
    const computedTotalAmount = computedTaxable + computedTax;
    const cleanBuyerStateCode = (editForm.buyerStateCode || calculatedBuyerStateCode || '33').replace(/\D/g, '').slice(0, 2).padStart(2, '0');

    const overrides = {
      ...editForm,
      items: computedItems,
      totalPieces: computedTotalPieces,
      subtotal: computedSubtotal,
      tax: computedTax,
      totalAmount: computedTotalAmount,
      buyerState: editForm.buyerState || defaultBuyerState,
      buyerStateCode: cleanBuyerStateCode,
      millStateCode: (editForm.millStateCode || '33').replace(/\D/g, '').slice(0, 2).padStart(2, '0'),
    };

    setBillOverrides(overrides);

    // 1. If Admin opted to save as global mill defaults, push to backend Settings
    if (saveAsDefaults && updateMillSettings) {
      try {
        await updateMillSettings({
          name: editForm.millName,
          tagline: editForm.millTagline,
          deityText: editForm.deityText,
          phone: editForm.millPhone,
          email: editForm.millEmail,
          gstin: editForm.millGstin,
          stateCode: editForm.millStateCode,
          placeOfSupply: editForm.placeOfSupply,
          vehicleNo: editForm.vehicleNo,
          transportMode: editForm.transportMode,
          signatoryTitle: editForm.signatoryTitle,
          address: editForm.millAddress,
          bankDetails: {
            bankName: editForm.bankName,
            branch: editForm.branch,
            accountName: editForm.accountName,
            accountNumber: editForm.accountNumber,
            ifsc: editForm.ifsc,
          },
        });
      } catch (err) {
        console.warn('[Invoice] Could not save mill defaults:', err);
      }
    }

    // 2. Persist invoice customizations directly to MongoDB database
    try {
      const targetId =
        (invoice?._id && !String(invoice._id).startsWith('draft-') ? invoice._id : null) ||
        invoice?.order?._id ||
        invoice?.order ||
        order?._id ||
        id;
      const res = await updateInvoice(targetId, overrides);
      if (res.success && res.invoice) {
        setInvoice(res.invoice);
        if (res.order) setOrder(res.order);
        setBillOverrides(null);
        setSaveSuccessBanner(true);
        setTimeout(() => setSaveSuccessBanner(false), 5000);
      } else {
        alert(res.error || 'Failed to save bill customizations to server.');
      }
    } catch (err) {
      console.error('[Invoice] Failed to save invoice customizations to DB:', err);
      alert(err.message || 'Failed to save bill customizations.');
    }

    // 3. If Admin opted to also confirm payment upon saving bill edits
    if (confirmPaymentOnSave && isPaymentPending) {
      try {
        const targetOrderId = invoice?.order?._id || invoice?.order || order?._id || id;
        const payRes = await confirmPayment(targetOrderId, {
          paymentMethod: paymentMethod || 'UPI',
          paymentReference: paymentRef || `REMIT-${Date.now().toString().slice(-6)}`,
          amount: computedTotalAmount,
        });
        if (payRes.success) {
          if (payRes.invoice) setInvoice(payRes.invoice);
          if (payRes.order) setOrder(payRes.order);
        }
      } catch (err) {
        console.error('[Invoice] Error confirming payment on save:', err);
      }
    }

    setIsSavingChanges(false);
    setIsEditingBill(false);
  };

  // Direct Manual Payment Confirmation Handler (Admin)
  const handleConfirmOrderPayment = async (e) => {
    if (e) e.preventDefault();
    setIsConfirmingPayment(true);
    try {
      const targetOrderId = invoice?.order?._id || invoice?.order || order?._id || id;
      const res = await confirmPayment(targetOrderId, {
        paymentMethod,
        paymentReference: paymentRef || `REMIT-${Date.now().toString().slice(-6)}`,
        amount: totalAmount,
      });

      if (res.success) {
        if (res.invoice) setInvoice(res.invoice);
        if (res.order) setOrder(res.order);
        setShowConfirmPaymentModal(false);
        setSaveSuccessBanner(true);
        setTimeout(() => setSaveSuccessBanner(false), 5000);
      } else {
        alert(res.error || 'Failed to confirm payment.');
      }
    } catch (err) {
      console.error('[Invoice] Payment confirmation error:', err);
      alert(err.message || 'Payment confirmation failed.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-24 print:p-0 print:m-0 print:max-w-full">
      {/* Top action bar (hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to={`/orders/${id}`}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary font-bold text-label-md"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back to Order Details</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Confirm Payment Button - STRICTLY FOR ADMIN WHEN PENDING */}
          {isUserAdmin && isPaymentPending && (
            <button
              type="button"
              onClick={() => setShowConfirmPaymentModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-label-md font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Admin Portal: Confirm manual remittance payment and generate final official invoice"
            >
              <span className="material-symbols-outlined text-lg">payments</span>
              <span>Confirm Payment Received</span>
            </button>
          )}

          {/* Edit Bill Details Button - STRICTLY FOR ADMIN ONLY */}
          {isUserAdmin && (
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant rounded-lg font-label-md font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Admin Portal: Edit all Mill, Buyer, Pieces & HSN details on this bill before finalizing"
            >
              <span className="material-symbols-outlined text-lg text-secondary">admin_panel_settings</span>
              <span>Edit Bill Details (Admin Only)</span>
              {(billOverrides || invoice?.isCustomized) && (
                <span className="w-2 h-2 rounded-full bg-secondary inline-block" title="Customized Bill"></span>
              )}
            </button>
          )}

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-primary-container hover:bg-primary text-white rounded-lg font-label-md font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            <span>Print / Save Tax Bill (PDF)</span>
          </button>
        </div>
      </div>

      {/* Bill Changes Saved Notification Banner */}
      {saveSuccessBanner && (
        <div className="p-3 bg-[#E6F5F0] text-secondary border border-secondary-fixed rounded-xl font-bold text-label-md flex items-center justify-between shadow-sm print:hidden animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>Bill customizations successfully saved to database! Updates are reflected permanently on the invoice.</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessBanner(false)}
            className="text-secondary hover:text-primary font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Buyer Proforma Bill Notice if Payment is Pending */}
      {!isUserAdmin && isPaymentPending && (
        <div className="p-3 bg-[#FFF4E5] border border-[#FFE2B3] rounded-xl text-[#8C5300] text-body-xs font-medium flex items-center justify-between gap-2 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg shrink-0 text-[#B76E00]">info</span>
            <span>
              <strong>Proforma Bill (Payment Pending):</strong> Please review your consignment details below and transfer the total bill amount (<strong>₹{totalAmount.toLocaleString('en-IN')}</strong>) to our mill bank account (detailed below). Your final tax invoice will be generated upon confirmation.
            </span>
          </div>
        </div>
      )}

      {/* Admin Draft Preview Notification Banner */}
      {isUserAdmin && invoice?.isDraft && (
        <div className="p-3 bg-[#E6F5F0] border border-secondary-fixed rounded-xl text-secondary text-body-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg shrink-0">verified_user</span>
            <span>
              Admin Draft Bill Mode: You are previewing Order #{orderNumber} before confirming payment. Edit bill details, save to reflect changes, then confirm payment.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowConfirmPaymentModal(true)}
              className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800 cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-xs">payments</span>
              <span>Confirm Payment</span>
            </button>
            <Link
              to="/admin/orders"
              className="px-3 py-1 bg-surface-container text-primary border border-outline-variant rounded-lg text-[11px] font-bold hover:bg-surface-container-high"
            >
              Admin Orders
            </Link>
          </div>
        </div>
      )}

      {/* Official Physical Bill Paper Layout */}
      <div className="printable-bill bg-white text-black font-sans text-xs border-2 border-black rounded-none shadow-md print:shadow-none print:border-2 print:border-black print:p-0">

        {/* 1. Header: Cell numbers, Logo/Emblem, Mill Identity & Copy Box */}
        <div className="p-3 border-b-2 border-black">
          <div className="flex justify-between items-start gap-2">

            {/* Left: Traditional Deity / Mill Emblem */}
            <div className="w-16 h-16 flex flex-col items-center justify-center border border-gray-300 rounded p-1 bg-gray-50/50 shrink-0 text-center">
              <span className="material-symbols-outlined text-3xl text-black">temple_hindu</span>
              <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">{currentDeityText}</span>
            </div>

            {/* Center: Contact Phones & Mill Identity */}
            <div className="flex-1 text-center space-y-0.5">
              <p className="text-[11px] font-bold font-mono tracking-wide text-gray-800">
                Cell : {currentMillPhone || '95666 47825'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black font-serif">
                {currentMillName || 'SSTextiles'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold italic text-gray-800">
                {currentMillTagline || 'Whole Sale Hand Looms Cloth Manufacturer'}
              </p>
              <p className="text-[11px] text-gray-700 max-w-xl mx-auto leading-tight pt-0.5">
                {currentMillAddress || 'D/No. 1/144, Devanampalayam,2nd street K nagar Kunnathur - 638 103. (Via) Tirupur Dt. Tamilnadu.'}
              </p>
            </div>

            {/* Right: INVOICE Copy Indicator Box */}
            <div className="border-2 border-black w-44 shrink-0 text-left bg-white">
              <div className="bg-[#1a2d4c] text-white text-center font-bold text-xs py-1 tracking-wider uppercase">
                {isPaymentPending ? 'PROFORMA INVOICE' : 'TAX INVOICE'}
              </div>
              <div className="p-1.5 space-y-0.5 text-[10px] font-medium leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-black flex items-center justify-center text-[9px] font-bold">✓</span>
                  <span>Original for Recipient</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <span className="w-2.5 h-2.5 border border-black inline-block"></span>
                  <span>Duplicate for / Transporter</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <span className="w-2.5 h-2.5 border border-black inline-block"></span>
                  <span>Triplicate for Supplier</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <span className="w-2.5 h-2.5 border border-black inline-block"></span>
                  <span>Quadruplicate</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 2. Metadata Bar: GSTIN, State Code, Invoice No, Date, Transportation Mode, Vehicle No & Place of Supply */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x-2 divide-black text-[11px]">
          {/* Admin GSTIN & Admin State Code (Editable by Admin) */}
          <div className="p-2.5 space-y-1.5">
            <p>
              <span className="font-bold">GSTIN :</span>{' '}
              <span className="font-mono font-black">{currentMillGstin || '33BRWIK7711D1ZD'}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">State Code :</span>
              <StateCodeBox code={currentAdminStateCode} />
            </div>
          </div>

          {/* Invoice No & Date */}
          <div className="p-2.5 space-y-1.5">
            <p>
              <span className="font-bold">Invoice No :</span>{' '}
              <span className="font-mono font-bold text-black">{currentInvoiceNumber}</span>
            </p>
            <p>
              <span className="font-bold">Date :</span>{' '}
              <span className="font-mono font-bold text-black">{currentInvoiceDateStr}</span>
            </p>
          </div>

          {/* Transportation Mode, Vehicle No & Place of Supply (Editable by Admin) */}
          <div className="p-2.5 space-y-1 text-[10px]">
            <p>
              <span className="font-semibold">Transportation Mode :</span>{' '}
              <span className="font-medium text-black">{currentTransportMode}</span>
            </p>
            <p>
              <span className="font-semibold">Veh. No / LR :</span>{' '}
              <span className="font-mono font-bold text-black">{currentVehicleNo}</span>
            </p>
            <p>
              <span className="font-semibold">Place Of Supply :</span>{' '}
              <span className="font-medium text-black font-semibold">{currentPlaceOfSupply}</span>
            </p>
          </div>
        </div>

        {/* 3. Receiver Details (Billed to) - Full Width, dynamically populated from Buyer Account */}
        <div className="p-3 border-b-2 border-black text-[11px] space-y-1.5 bg-white">
          <div className="font-bold text-black uppercase tracking-wider text-[11px] pb-1 border-b border-gray-300 flex items-center justify-between">
            <span>Details of Receiver (Billed to)</span>
            <span className="text-[10px] text-gray-600 font-normal">Buyer Account &amp; Tax Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <p>
                <span className="font-semibold text-gray-700">Name : </span>
                <strong className="text-black text-xs uppercase">{currentCustomerName}</strong>
              </p>
              <p className="leading-snug">
                <span className="font-semibold text-gray-700">Address : </span>
                <span className="text-black font-medium">{currentBillingAddress || 'Direct Buyer Registered Address'}</span>
              </p>
              {currentCustomerContact && (
                <p className="text-[10px] text-gray-600 font-mono">
                  Phone: {currentCustomerContact} {currentCustomerEmail ? `• ${currentCustomerEmail}` : ''}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:border-l sm:pl-4 border-gray-300">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-gray-700">GSTIN Number :</span>
                <GstinBoxGrid gstin={currentBuyerGstin} />
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <p>
                  <span className="font-semibold text-gray-700">State : </span>
                  <strong className="text-black">{currentBuyerState}</strong>
                </p>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700">State Code :</span>
                  <StateCodeBox code={currentBuyerStateCode} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Itemized Goods Table with Total Pieces Row */}
        <div className="border-b-2 border-black">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-black bg-gray-100 font-bold uppercase text-[11px]">
                <th className="p-1.5 border-r border-black text-center w-10">S.No</th>
                <th className="p-1.5 border-r border-black">Description</th>
                <th className="p-1.5 border-r border-black text-center w-16">HSN</th>
                <th className="p-1.5 border-r border-black text-center w-12">UOM</th>
                <th className="p-1.5 border-r border-black text-right w-16">Qty</th>
                <th className="p-0 border-r border-black text-center w-28">
                  <div className="border-b border-black py-0.5">Rate</div>
                  <div className="grid grid-cols-2 text-[10px]">
                    <span className="border-r border-black py-0.5">Rs.</span>
                    <span className="py-0.5">Ps.</span>
                  </div>
                </th>
                <th className="p-0 text-center w-32">
                  <div className="border-b border-black py-0.5">Total</div>
                  <div className="grid grid-cols-2 text-[10px]">
                    <span className="border-r border-black py-0.5">Rs.</span>
                    <span className="py-0.5">Ps.</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayItems?.map((item, index) => {
                const lineTotal = item.subtotal || item.price * item.quantity;
                const rateSplit = formatRsPs(item.price);
                const totalSplit = formatRsPs(lineTotal);
                const itemHsn = getProductHsn(item, index);

                return (
                  <tr key={item.key || item._id || index} className="border-b border-black font-mono">
                    <td className="p-1.5 border-r border-black text-center">{index + 1}</td>
                    <td className="p-1.5 border-r border-black font-sans font-medium text-black">
                      <p className="font-bold uppercase text-xs">{item.productName || item.name || 'White Towel Product'}</p>
                      <p className="text-[10px] text-gray-700">Size: {item.size || 'Standard'} • 100% Cotton Hand Loom Quality</p>
                    </td>
                    <td className="p-1.5 border-r border-black text-center font-bold">{itemHsn}</td>

                    {/* UOM column: completely empty as requested */}
                    <td className="p-1.5 border-r border-black text-center font-sans font-bold"></td>

                    <td className="p-1.5 border-r border-black text-right font-bold">{item.quantity}</td>

                    {/* Rate Split */}
                    <td className="p-0 border-r border-black text-right">
                      <div className="grid grid-cols-2 h-full">
                        <span className="p-1.5 border-r border-black text-right font-bold">{rateSplit.rs}</span>
                        <span className="p-1.5 text-center text-gray-700">{rateSplit.ps}</span>
                      </div>
                    </td>

                    {/* Total Split */}
                    <td className="p-0 text-right">
                      <div className="grid grid-cols-2 h-full">
                        <span className="p-1.5 border-r border-black text-right font-bold">{totalSplit.rs}</span>
                        <span className="p-1.5 text-center text-gray-700">{totalSplit.ps}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Total Pieces Summary Row (After All Entries of Product) */}
              <tr className="border-b-2 border-black bg-gray-100 font-bold font-mono text-xs">
                <td className="p-2 border-r border-black text-center font-bold">TOTAL</td>
                <td className="p-2 border-r border-black font-sans uppercase font-bold text-black" colSpan={3}>
                  TOTAL PIECES: <span className="font-mono text-sm font-black">{totalPieces.toLocaleString('en-IN')} PCS</span>
                </td>
                <td className="p-2 border-r border-black text-right font-black text-sm">
                  {totalPieces.toLocaleString('en-IN')}
                </td>
                <td className="p-0 border-r border-black">
                  <div className="grid grid-cols-2 h-full">
                    <span className="border-r border-black"></span>
                    <span></span>
                  </div>
                </td>
                <td className="p-0 text-right">
                  <div className="grid grid-cols-2 h-full">
                    <span className="p-2 border-r border-black text-right font-black">{formatRsPs(subtotal).rs}</span>
                    <span className="p-2 text-center text-gray-700 font-bold">{formatRsPs(subtotal).ps}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Bottom Settlement & Totals Grid */}
        <div className="grid grid-cols-12 text-xs">

          {/* Left Column: Bank Details, E&OE, E-Way Bill & Certification */}
          <div className="col-span-12 sm:col-span-7 border-r-0 sm:border-r-2 border-black flex flex-col justify-between">

            {/* Bank Information & E&OE */}
            <div className="p-2.5 space-y-1 border-b border-black">
              <span className="font-bold text-[10px] uppercase block tracking-wider text-gray-700">E &amp; OE</span>
              <p className="text-[11px] font-semibold text-black">
                <span className="font-bold">Bank Name &amp; Branch :</span> {currentBankName || 'Tamilnadu Mercantile Bank'}, {currentBranch || 'Kunnathur'}
              </p>
              <p className="text-[11px] font-semibold text-black font-mono">
                <span className="font-bold font-sans">Bank Account Number :</span> {currentAccountNumber || '325159050800786'}
              </p>
              <p className="text-[11px] font-semibold text-black font-mono">
                <span className="font-bold font-sans">Bank Branch IFSC :</span> {currentIfsc || 'TMBL6000654'}
              </p>
            </div>

            {/* E-Way Bill & Amount in Words */}
            <div className="p-2.5 space-y-1.5 border-b border-black bg-gray-50/40">
              <p className="text-[11px]">
                <span className="font-bold">E-Way Bill No :</span>{' '}
                <span className="font-mono font-bold">{currentEwbNo}</span>
              </p>
              <p className="text-[11px] font-serif font-bold text-black italic">
                <span className="font-sans font-bold not-italic">Invoice value (in words) :</span> {numberToWordsINR(totalAmount)}
              </p>
            </div>

            {/* Certification & Checked By */}
            <div className="p-2.5 text-[10px] space-y-1 text-gray-800">
              <p className="italic leading-tight">
                We Certified that the above particulars are true and correct best of my knowledge
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] font-bold">
                <span>Checked by: <strong className="font-mono text-emerald-800">[ Verified Online ]</strong></span>
              </div>
            </div>

          </div>

          {/* Right Column: Taxes, Freight & Final Grand Total */}
          <div className="col-span-12 sm:col-span-5 flex flex-col justify-between">

            <div className="divide-y divide-black text-[11px]">

              {/* Gross Subtotal */}
              <div className="grid grid-cols-12 p-1.5 font-bold">
                <span className="col-span-7">Total (Subtotal)</span>
                <span className="col-span-3 text-right font-mono">{formatRsPs(subtotal).rs}</span>
                <span className="col-span-2 text-center font-mono">{formatRsPs(subtotal).ps}</span>
              </div>

              {/* CGST */}
              <div className="grid grid-cols-12 p-1.5 font-medium">
                <span className="col-span-7">CGST (2.5%)</span>
                <span className="col-span-3 text-right font-mono">{formatRsPs(cgst).rs}</span>
                <span className="col-span-2 text-center font-mono">{formatRsPs(cgst).ps}</span>
              </div>

              {/* SGST */}
              <div className="grid grid-cols-12 p-1.5 font-medium">
                <span className="col-span-7">SGST (2.5%)</span>
                <span className="col-span-3 text-right font-mono">{formatRsPs(sgst).rs}</span>
                <span className="col-span-2 text-center font-mono">{formatRsPs(sgst).ps}</span>
              </div>

              {/* IGST */}
              <div className="grid grid-cols-12 p-1.5 font-medium text-gray-700">
                <span className="col-span-7">IGST (0%)</span>
                <span className="col-span-3 text-right font-mono">-</span>
                <span className="col-span-2 text-center font-mono">00</span>
              </div>

              {/* Freight Charges */}
              <div className="grid grid-cols-12 p-1.5 font-medium text-gray-700">
                <span className="col-span-7">Freight Charges</span>
                <span className="col-span-3 text-right font-mono">0</span>
                <span className="col-span-2 text-center font-mono">00</span>
              </div>

              {/* Grand Total Box (Highlight) */}
              <div className="grid grid-cols-12 p-2 bg-gray-100 font-extrabold text-xs sm:text-sm border-t-2 border-b-2 border-black">
                <span className="col-span-7 uppercase">Invoice Total</span>
                <span className="col-span-3 text-right font-mono text-black font-black">{formatRsPs(totalAmount).rs}</span>
                <span className="col-span-2 text-center font-mono text-black font-black">{formatRsPs(totalAmount).ps}</span>
              </div>

            </div>

            {/* Authorized Signatory for SSTex */}
            <div className="p-3 text-center sm:text-right border-t border-black bg-white">
              <span className="text-xs font-black block uppercase tracking-wide">
                For {currentMillName || 'SSTex'}
              </span>
              <div className="h-8 flex items-center justify-center sm:justify-end text-[11px] font-bold text-emerald-800 italic">
                [ Digitally Verified Remittance ]
              </div>
              <span className="text-[11px] font-bold text-gray-900 block">
                {currentSignatoryTitle || 'Proprietor'}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Live Bill Edit Modal */}
      {isEditingBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-border-subtle pb-3">
              <div>
                <span className="text-label-xs uppercase font-bold text-secondary tracking-wider">
                  Live Bill Customization
                </span>
                <h2 className="text-headline-xs font-bold text-primary mt-0.5">
                  Edit Bill Details &amp; Addresses
                </h2>
                <p className="text-body-xs text-on-surface-variant">
                  Modify Mill (Admin) or Receiver (Buyer) details. Updates reflect immediately on this bill and printed output.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingBill(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border-subtle gap-1 sm:gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setEditTab('mill')}
                className={`pb-2 px-2.5 sm:px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${editTab === 'mill'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-base">domain</span>
                <span>Mill Details</span>
              </button>

              <button
                type="button"
                onClick={() => setEditTab('buyer')}
                className={`pb-2 px-2.5 sm:px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${editTab === 'buyer'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-base">person</span>
                <span>Buyer Details</span>
              </button>

              <button
                type="button"
                onClick={() => setEditTab('items')}
                className={`pb-2 px-2.5 sm:px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${editTab === 'items'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-base">inventory_2</span>
                <span>Items &amp; Pieces ({(editForm.items?.length || displayItems?.length || 0)})</span>
              </button>

              <button
                type="button"
                onClick={() => setEditTab('meta')}
                className={`pb-2 px-2.5 sm:px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${editTab === 'meta'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Invoice No &amp; Date</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBillEdits} className="space-y-4">

              {/* TAB 1: Mill / Admin Details */}
              {editTab === 'mill' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Mill Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.millName || ''}
                        onChange={(e) => setEditForm({ ...editForm, millName: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Mill Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={editForm.millTagline || ''}
                        onChange={(e) => setEditForm({ ...editForm, millTagline: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Emblem Title (Top-Left)
                      </label>
                      <input
                        type="text"
                        value={editForm.deityText || ''}
                        onChange={(e) => setEditForm({ ...editForm, deityText: e.target.value.toUpperCase() })}
                        placeholder="SHIVAM"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Mill GSTIN (15-chars)
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editForm.millGstin || ''}
                        onChange={(e) => setEditForm({ ...editForm, millGstin: e.target.value.toUpperCase() })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Admin Mill State Code (2-Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={editForm.millStateCode || ''}
                        onChange={(e) => setEditForm({ ...editForm, millStateCode: e.target.value.replace(/\D/g, '') })}
                        placeholder="33"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Mill Contact Cell Numbers
                      </label>
                      <input
                        type="text"
                        value={editForm.millPhone || ''}
                        onChange={(e) => setEditForm({ ...editForm, millPhone: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Signatory Title
                      </label>
                      <input
                        type="text"
                        value={editForm.signatoryTitle || ''}
                        onChange={(e) => setEditForm({ ...editForm, signatoryTitle: e.target.value })}
                        placeholder="Proprietor"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Place of Supply
                      </label>
                      <input
                        type="text"
                        value={editForm.placeOfSupply || ''}
                        onChange={(e) => setEditForm({ ...editForm, placeOfSupply: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Vehicle No / Dispatch
                      </label>
                      <input
                        type="text"
                        value={editForm.vehicleNo || ''}
                        onChange={(e) => setEditForm({ ...editForm, vehicleNo: e.target.value.toUpperCase() })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Transportation Mode
                      </label>
                      <input
                        type="text"
                        value={editForm.transportMode || ''}
                        onChange={(e) => setEditForm({ ...editForm, transportMode: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Mill Dispatch Address
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.millAddress || ''}
                      onChange={(e) => setEditForm({ ...editForm, millAddress: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                    />
                  </div>

                  {/* Bank Details */}
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant space-y-2">
                    <span className="text-[11px] font-bold text-primary uppercase block">
                      Commercial Bank Details (Shown on Bottom Left)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-outline">Bank Name</label>
                        <input
                          type="text"
                          value={editForm.bankName || ''}
                          onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                          className="w-full bg-white border border-outline-variant rounded px-2.5 py-1 text-xs text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-outline">Branch Name</label>
                        <input
                          type="text"
                          value={editForm.branch || ''}
                          onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                          className="w-full bg-white border border-outline-variant rounded px-2.5 py-1 text-xs text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-outline">Account Number</label>
                        <input
                          type="text"
                          value={editForm.accountNumber || ''}
                          onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                          className="w-full bg-white border border-outline-variant rounded px-2.5 py-1 text-xs text-primary font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-outline">IFSC Code</label>
                        <input
                          type="text"
                          value={editForm.ifsc || ''}
                          onChange={(e) => setEditForm({ ...editForm, ifsc: e.target.value.toUpperCase() })}
                          className="w-full bg-white border border-outline-variant rounded px-2.5 py-1 text-xs text-primary font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Option to Persist to Settings */}
                  {isUserAdmin && (
                    <label className="flex items-center gap-2 pt-1 text-xs font-bold text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAsDefaults}
                        onChange={(e) => setSaveAsDefaults(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Also save Mill changes as global defaults in Database</span>
                    </label>
                  )}
                </div>
              )}

              {/* TAB 2: Buyer / Receiver Details */}
              {editTab === 'buyer' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Receiver Business / Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.customerName || ''}
                        onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Receiver GSTIN Number (15-chars)
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editForm.buyerGstin || ''}
                        onChange={(e) => {
                          const gstinVal = e.target.value.toUpperCase();
                          const autoCode = resolveStateCode(editForm.buyerState, gstinVal);
                          setEditForm({
                            ...editForm,
                            buyerGstin: gstinVal,
                            buyerStateCode: autoCode || editForm.buyerStateCode,
                          });
                        }}
                        placeholder="Leave blank for UNREGISTERED"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono uppercase font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Receiver State *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.buyerState || ''}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          const autoCode = resolveStateCode(stateVal, editForm.buyerGstin);
                          setEditForm({
                            ...editForm,
                            buyerState: stateVal,
                            buyerStateCode: autoCode || editForm.buyerStateCode,
                          });
                        }}
                        placeholder="Tamil Nadu or Karnataka"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Receiver State Code (2-Digits) *
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        required
                        value={editForm.buyerStateCode || ''}
                        onChange={(e) => setEditForm({ ...editForm, buyerStateCode: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                        placeholder="33"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Billing &amp; Delivery Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={editForm.billingAddress || ''}
                      onChange={(e) => setEditForm({ ...editForm, billingAddress: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={editForm.customerContact || ''}
                        onChange={(e) => setEditForm({ ...editForm, customerContact: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editForm.customerEmail || ''}
                        onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        E-Way Bill / LR No
                      </label>
                      <input
                        type="text"
                        value={editForm.ewbNo || ''}
                        onChange={(e) => setEditForm({ ...editForm, ewbNo: e.target.value.toUpperCase() })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono font-bold uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Product Items, Pieces & HSN Codes (Fully Editable) */}
              {editTab === 'items' && (
                <div className="space-y-4">
                  {/* Live Recomputation Banner */}
                  {(() => {
                    const formItems = editForm.items || [];
                    const liveTotalPieces = formItems.reduce((s, it) => s + (parseInt(it.quantity, 10) || 0), 0);
                    const liveSubtotal = formItems.reduce((s, it) => s + ((parseInt(it.quantity, 10) || 0) * (Number(it.price) || 0)), 0);
                    const liveTaxable = Math.max(0, liveSubtotal - discount);
                    const liveTax = Math.round(liveTaxable * 0.05);
                    const liveGrandTotal = liveTaxable + liveTax;

                    return (
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 bg-white rounded-lg border border-outline-variant/60 shadow-xs">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Pieces</span>
                          <span className="text-sm sm:text-base font-black text-primary font-mono">{liveTotalPieces.toLocaleString('en-IN')} <span className="text-xs font-bold text-secondary">PCS</span></span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-outline-variant/60 shadow-xs">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Subtotal</span>
                          <span className="text-sm sm:text-base font-black text-primary font-mono">₹{liveSubtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-outline-variant/60 shadow-xs">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">5% GST (CGST+SGST)</span>
                          <span className="text-sm sm:text-base font-black text-primary font-mono">₹{liveTax.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-2 bg-primary/5 rounded-lg border border-primary/20 shadow-xs">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Grand Total</span>
                          <span className="text-sm sm:text-base font-black text-primary font-mono">₹{liveGrandTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-on-surface-variant font-medium">
                      Modify towel pieces (quantities), unit rates (₹), sizes, or HSN codes.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>Add Towel Item</span>
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(editForm.items || []).map((item, idx) => {
                      const rowSubtotal = (parseInt(item.quantity, 10) || 0) * (Number(item.price) || 0);

                      return (
                        <div
                          key={item.key || item._id || idx}
                          className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 pb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 rounded-full bg-primary text-white font-bold text-[10px] flex items-center justify-center font-mono shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                required
                                value={item.productName || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'productName', e.target.value)}
                                placeholder="Product / Towel Name"
                                className="font-bold text-primary text-xs uppercase bg-white border border-outline-variant rounded px-2 py-1 w-full max-w-xs"
                              />
                            </div>
                            {(editForm.items || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                title="Remove item"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-on-surface-variant mb-0.5">
                                Size / Specs
                              </label>
                              <input
                                type="text"
                                required
                                value={item.size || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'size', e.target.value)}
                                placeholder="30x60"
                                className="w-full bg-white border border-outline-variant rounded px-2 py-1 text-xs text-primary font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-on-surface-variant mb-0.5">
                                Pieces (Qty) *
                              </label>
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity !== undefined ? item.quantity : ''}
                                onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                                placeholder="50"
                                className="w-full bg-white border border-outline-variant rounded px-2 py-1 text-xs text-primary font-mono font-black"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-on-surface-variant mb-0.5">
                                Rate / Piece (₹) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={item.price !== undefined ? item.price : ''}
                                onChange={(e) => handleItemFieldChange(idx, 'price', e.target.value)}
                                placeholder="150"
                                className="w-full bg-white border border-outline-variant rounded px-2 py-1 text-xs text-primary font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-on-surface-variant mb-0.5">
                                HSN Code
                              </label>
                              <input
                                type="text"
                                required
                                value={item.hsnCode || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'hsnCode', e.target.value.toUpperCase())}
                                placeholder="6302.60"
                                className="w-full bg-white border border-outline-variant rounded px-2 py-1 text-xs text-primary font-mono font-bold uppercase"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px] text-on-surface-variant border-t border-outline-variant/30">
                            <span>Line Item Total:</span>
                            <span className="font-mono font-bold text-primary">
                              {item.quantity || 0} pcs × ₹{item.price || 0} = <strong className="text-xs">₹{rowSubtotal.toLocaleString('en-IN')}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: Invoice Metadata */}
              {editTab === 'meta' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Invoice Document Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.invoiceNumber || ''}
                        onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value.toUpperCase() })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Invoice Date (DD/MM/YYYY) *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.invoiceDateStr || ''}
                        onChange={(e) => setEditForm({ ...editForm, invoiceDateStr: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setBillOverrides(null);
                    setIsEditingBill(false);
                  }}
                  className="px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Reset to Original Order Data
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {isPaymentPending && (
                    <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmPaymentOnSave}
                        onChange={(e) => setConfirmPaymentOnSave(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Also Confirm Payment</span>
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsEditingBill(false)}
                    className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingChanges}
                    className="px-5 py-2 bg-primary-container hover:bg-primary text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSavingChanges ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving &amp; Reflecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        <span>Save &amp; Reflect in Bill</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Admin Payment Confirmation Modal */}
      {showConfirmPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full border border-outline-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-2xl">payments</span>
                <h3 className="font-bold text-base text-primary">Confirm Payment Received</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPaymentModal(false)}
                className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs text-gray-700 font-medium">
                <span>Order Reference:</span>
                <strong className="font-mono text-black">#{orderNumber}</strong>
              </div>
              <div className="flex justify-between text-xs text-gray-700 font-medium">
                <span>Buyer / Customer:</span>
                <strong className="text-black uppercase">{currentCustomerName}</strong>
              </div>
              <div className="flex justify-between text-xs text-gray-700 font-medium">
                <span>Total Consignment:</span>
                <strong className="text-black font-mono">{totalPieces.toLocaleString('en-IN')} PCS</strong>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-900 pt-1.5 border-t border-emerald-200">
                <span>Invoice Total:</span>
                <span className="font-mono text-base font-black">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmOrderPayment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Payment Method Received *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-bold"
                >
                  <option value="UPI">UPI (GPay / PhonePe / QR Code)</option>
                  <option value="NEFT">Bank NEFT Transfer</option>
                  <option value="RTGS">Bank RTGS Transfer</option>
                  <option value="Cheque">Cheque / Demand Draft</option>
                  <option value="Cash">Direct Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Bank UTR / Transaction Reference # (Optional)
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR4928104820 or IMPS98214"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary font-mono font-bold uppercase"
                />
              </div>

              <p className="text-[11px] text-on-surface-variant italic leading-relaxed">
                ✓ Upon confirming payment, this invoice will be issued as an official <strong>Final Confirmed GST Tax Invoice</strong> and order status will transition to <strong>PAID</strong>.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowConfirmPaymentModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConfirmingPayment}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isConfirmingPayment ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Confirm Payment &amp; Issue Final Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Invoice;
