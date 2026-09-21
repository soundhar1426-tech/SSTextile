import { Settings, Invoice } from '../models/index.js';
import { User } from '../models/User.js';

/**
 * Default fallback settings object
 */
const DEFAULT_SETTINGS = {
  name: 'SSTextiles',
  tagline: 'Whole Sale Hand Looms Cloth Manufacturer',
  subTagline: 'Direct Mill White Towels',
  address: '123, Weaver Street, Textile Nagar, Erode - 638 001, Tamil Nadu.',
  phone: '9876543210, 9876543211',
  whatsapp: '919876543210',
  email: 'contact@sstextiles.com',
  gstin: '33AAAAA0000A1Z5',
  pan: 'AAAAA0000A',
  stateCode: '33',
  placeOfSupply: 'Tamil Nadu (33)',
  vehicleNo: 'TN 33 AB 1234',
  signatoryTitle: 'Proprietor',
  hsnCode: '6302.60',
  taxRatePercent: 5,
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  igstPercent: 5,
  bankDetails: {
    bankName: 'State Bank of India',
    branch: 'Erode Main',
    accountName: 'SSTextiles',
    accountNumber: '000012345678901',
    ifsc: 'SBIN0001234',
    accountType: 'Current Account',
  },
};

/**
 * @desc    Get current mill settings (Public / Admin)
 * @route   GET /api/settings
 * @access  Public
 */
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(DEFAULT_SETTINGS);
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[Get Settings Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mill settings.',
      settings: DEFAULT_SETTINGS,
    });
  }
};

/**
 * @desc    Update mill settings (Admin only)
 * @route   PUT /api/admin/settings
 * @access  Private (Admin)
 */
export const updateSettings = async (req, res) => {
  try {
    const { millSettings, ...otherProps } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(DEFAULT_SETTINGS);
    }

    // Merge millSettings if provided
    const sourceSettings = millSettings || otherProps;

    if (sourceSettings) {
      if (sourceSettings.name !== undefined) settings.name = sourceSettings.name.trim();
      if (sourceSettings.tagline !== undefined) settings.tagline = sourceSettings.tagline.trim();
      if (sourceSettings.subTagline !== undefined) settings.subTagline = sourceSettings.subTagline.trim();
      if (sourceSettings.address !== undefined) settings.address = sourceSettings.address.trim();
      if (sourceSettings.phone !== undefined) {
        settings.phone = sourceSettings.phone.trim();
        if (!sourceSettings.whatsapp) {
          const firstPhone = sourceSettings.phone.split(',')[0].trim().replace(/[^0-9]/g, '');
          if (firstPhone) {
            settings.whatsapp = firstPhone.length === 10 ? `91${firstPhone}` : (firstPhone.length === 12 ? firstPhone : `91${firstPhone.slice(-10)}`);
          }
        }
      }
      if (sourceSettings.whatsapp !== undefined && sourceSettings.whatsapp.trim()) {
        const cleanWa = sourceSettings.whatsapp.split(',')[0].trim().replace(/[^0-9]/g, '');
        if (cleanWa) {
          settings.whatsapp = cleanWa.length === 10 ? `91${cleanWa}` : (cleanWa.length === 12 ? cleanWa : `91${cleanWa.slice(-10)}`);
        }
      }
      if (sourceSettings.email !== undefined) settings.email = sourceSettings.email.trim();
      if (sourceSettings.gstin !== undefined) settings.gstin = sourceSettings.gstin.trim().toUpperCase();
      if (sourceSettings.pan !== undefined) settings.pan = sourceSettings.pan.trim().toUpperCase();
      if (sourceSettings.stateCode !== undefined) settings.stateCode = sourceSettings.stateCode.trim();
      if (sourceSettings.placeOfSupply !== undefined) settings.placeOfSupply = sourceSettings.placeOfSupply.trim();
      if (sourceSettings.vehicleNo !== undefined) settings.vehicleNo = sourceSettings.vehicleNo.trim().toUpperCase();
      if (sourceSettings.signatoryTitle !== undefined) settings.signatoryTitle = sourceSettings.signatoryTitle.trim();
      if (sourceSettings.deityText !== undefined) settings.deityText = sourceSettings.deityText.trim().toUpperCase();
      if (sourceSettings.transportMode !== undefined) settings.transportMode = sourceSettings.transportMode.trim();
      if (sourceSettings.hsnCode !== undefined) settings.hsnCode = sourceSettings.hsnCode.trim();
      if (sourceSettings.taxRatePercent !== undefined) settings.taxRatePercent = Number(sourceSettings.taxRatePercent) || 5;

      if (sourceSettings.bankDetails) {
        settings.bankDetails = {
          bankName: sourceSettings.bankDetails.bankName !== undefined ? sourceSettings.bankDetails.bankName.trim() : settings.bankDetails.bankName,
          branch: sourceSettings.bankDetails.branch !== undefined ? sourceSettings.bankDetails.branch.trim() : settings.bankDetails.branch,
          accountName: sourceSettings.bankDetails.accountName !== undefined ? sourceSettings.bankDetails.accountName.trim() : settings.bankDetails.accountName,
          accountNumber: sourceSettings.bankDetails.accountNumber !== undefined ? sourceSettings.bankDetails.accountNumber.trim() : settings.bankDetails.accountNumber,
          ifsc: sourceSettings.bankDetails.ifsc !== undefined ? sourceSettings.bankDetails.ifsc.trim().toUpperCase() : settings.bankDetails.ifsc,
          accountType: sourceSettings.bankDetails.accountType !== undefined ? sourceSettings.bankDetails.accountType.trim() : settings.bankDetails.accountType,
        };
      }
    }

    await settings.save();

    // Also keep authenticated admin's User profile business info synchronized (without clobbering contact person name)
    if (req.user?._id) {
      try {
        const adminUser = await User.findById(req.user._id);
        if (adminUser && adminUser.role === 'admin') {
          if (sourceSettings.name !== undefined && sourceSettings.name.trim()) {
            adminUser.businessName = sourceSettings.name.trim();
          }
          if (sourceSettings.phone !== undefined && sourceSettings.phone.trim()) {
            adminUser.phone = sourceSettings.phone.trim();
          }
          if (sourceSettings.gstin !== undefined) {
            adminUser.gstin = sourceSettings.gstin.trim().toUpperCase();
          }
          await adminUser.save();
        }
      } catch (userSyncErr) {
        console.warn('[SettingsController] Warning: Could not sync admin user:', userSyncErr.message);
      }
    }

    // Synchronize non-customized invoices with updated mill settings
    try {
      await Invoice.updateMany(
        { isCustomized: { $ne: true } },
        {
          $set: {
            millGstin: settings.gstin,
            placeOfSupply: settings.placeOfSupply || 'Tamil Nadu (33)',
            vehicleNo: settings.vehicleNo || 'TN 33 AB 1234',
            transportMode: settings.transportMode || 'Road Cargo / VRL Logistics',
            signatoryTitle: settings.signatoryTitle || 'Proprietor',
            'millDetails.name': settings.name,
            'millDetails.tagline': settings.tagline,
            'millDetails.deityText': settings.deityText || 'SHIVAM',
            'millDetails.address': settings.address,
            'millDetails.gstin': settings.gstin,
            'millDetails.stateCode': settings.stateCode,
            'millDetails.phone': settings.phone,
            'millDetails.email': settings.email,
            'millDetails.signatoryTitle': settings.signatoryTitle || 'Proprietor',
            'millDetails.bankDetails': settings.bankDetails,
          },
        }
      );
    } catch (invSyncErr) {
      console.warn('[SettingsController] Non-customized invoice sync notice:', invSyncErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Mill configurations saved successfully.',
      settings,
    });
  } catch (error) {
    console.error('[Update Settings Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update mill settings.',
    });
  }
};
