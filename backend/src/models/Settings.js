import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    // Mill & Company Identity
    name: {
      type: String,
      default: 'GOWTHAM TEX',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Whole Sale Hand Looms Cloth Manufacturer',
      trim: true,
    },
    subTagline: {
      type: String,
      default: 'Direct Mill White Towels',
      trim: true,
    },
    address: {
      type: String,
      default: 'D/No. 1/144, Devanampalayam, VELLIRAVELI (P.O.), Kunnathur - 638 103. (Via) Tirupur Dt. Tamilnadu.',
      trim: true,
    },
    phone: {
      type: String,
      default: '80728 65362, 94890 40067, 95666 47834',
      trim: true,
    },
    whatsapp: {
      type: String,
      default: '919566647834',
      trim: true,
    },
    email: {
      type: String,
      default: 'orders@gowthamtex.com',
      trim: true,
    },
    gstin: {
      type: String,
      default: '33BRWPV7711D1ZD',
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      default: 'BRWPV7711D',
      trim: true,
      uppercase: true,
    },
    stateCode: {
      type: String,
      default: '33',
      trim: true,
    },
    placeOfSupply: {
      type: String,
      default: 'Tamil Nadu (33)',
      trim: true,
    },
    vehicleNo: {
      type: String,
      default: 'TN 33 AB 1234',
      trim: true,
    },
    signatoryTitle: {
      type: String,
      default: 'Proprietor',
      trim: true,
    },
    deityText: {
      type: String,
      default: 'SHIVAM',
      trim: true,
    },
    transportMode: {
      type: String,
      default: 'Road Cargo / VRL Logistics',
      trim: true,
    },
    hsnCode: {
      type: String,
      default: '6302.60',
      trim: true,
    },
    taxRatePercent: {
      type: Number,
      default: 5,
    },
    cgstPercent: {
      type: Number,
      default: 2.5,
    },
    sgstPercent: {
      type: Number,
      default: 2.5,
    },
    igstPercent: {
      type: Number,
      default: 5,
    },

    // Commercial Bank Details for Invoicing
    bankDetails: {
      bankName: {
        type: String,
        default: 'Tamilnadu Mercantile Bank',
        trim: true,
      },
      branch: {
        type: String,
        default: 'Pallagoundanpalayam',
        trim: true,
      },
      accountName: {
        type: String,
        default: 'GOWTHAM TEX',
        trim: true,
      },
      accountNumber: {
        type: String,
        default: '325150050800389',
        trim: true,
      },
      ifsc: {
        type: String,
        default: 'TMBL0000325',
        trim: true,
        uppercase: true,
      },
      accountType: {
        type: String,
        default: 'Current Account',
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
