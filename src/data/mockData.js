export const initialProducts = [
  {
    id: "white-towels",
    title: "White Towels",
    name: "White Towels",
    subtitle: "Direct Weaving Mill Cotton Plain White Terry Towels. Fast-absorb yarn.",
    category: "White Towels",
    gsmRange: "450 - 700 GSM",
    weaveType: "2/20s Ring Spun",
    fastness: "Grade 4+ Cl",
    material: "Cotton",
    border: "Dobby Ribbed Hem",
    hsnCode: "6302.60",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCdKqsvfuy2yau3AySGBI8zrrt1U9ghlW3X5wsoSzGBmztb7AyEZEhYV6EL6hsHNIBYMWtdL482GVLBRWvqbV0yTmpIlrmoJph838qaVWq9l1eDuxkE1I__-yKdS3oaLCCRrHpvWejMDeHWnT87rkOyHa0EKZu56Gbw6hoaMcb3hM9wIo5pCxDGGx6g7JtSEJY9wy9ZOXaAhzH4nphAIFBcgFZ6Bb85_5NECSf6XaYsx6x0NyYuSCwXw",
    status: "Ready to Dispatch",
    isGstCompliant: true,
    sizes: [
      {
        id: "sz-20-40",
        dimension: "20×40 cm",
        inches: "8×16 in",
        widthCm: 20,
        lengthCm: 40,
        gsm: 450,
        grams: 36,
        price: 60,
        stock: 600,
        moq: 40,
        weightKg: 0.036,
        status: "Optimal Stock"
      },
      {
        id: "sz-25-50",
        dimension: "25×50 cm",
        inches: "10×20 in",
        widthCm: 25,
        lengthCm: 50,
        gsm: 500,
        grams: 63,
        price: 80,
        stock: 500,
        moq: 40,
        weightKg: 0.063,
        status: "Optimal Stock"
      },
      {
        id: "sz-30-60",
        dimension: "30×60 cm",
        inches: "12×24 in",
        widthCm: 30,
        lengthCm: 60,
        gsm: 550,
        grams: 99,
        price: 120,
        stock: 750,
        moq: 40,
        weightKg: 0.099,
        isPopular: true,
        status: "Optimal Stock"
      },
      {
        id: "sz-35-70",
        dimension: "35×70 cm",
        inches: "14×28 in",
        widthCm: 35,
        lengthCm: 70,
        gsm: 550,
        grams: 135,
        price: 140,
        stock: 450,
        moq: 40,
        weightKg: 0.135,
        status: "Optimal Stock"
      },
      {
        id: "sz-40-80",
        dimension: "40×80 cm",
        inches: "16×32 in",
        widthCm: 40,
        lengthCm: 80,
        gsm: 600,
        grams: 192,
        price: 160,
        stock: 400,
        moq: 40,
        weightKg: 0.192,
        status: "In Demand"
      },
      {
        id: "sz-50-100",
        dimension: "50×100 cm",
        inches: "20×40 in",
        widthCm: 50,
        lengthCm: 100,
        gsm: 600,
        grams: 300,
        price: 220,
        stock: 350,
        moq: 40,
        weightKg: 0.300,
        status: "Optimal Stock"
      },
      {
        id: "sz-70-140",
        dimension: "70×140 cm",
        inches: "27×54 in",
        widthCm: 70,
        lengthCm: 140,
        gsm: 650,
        grams: 637,
        price: 380,
        stock: 300,
        moq: 40,
        weightKg: 0.637,
        status: "Optimal Stock"
      },
      {
        id: "sz-75-150",
        dimension: "75×150 cm",
        inches: "30×60 in",
        widthCm: 75,
        lengthCm: 150,
        gsm: 650,
        grams: 731,
        price: 420,
        stock: 250,
        moq: 40,
        weightKg: 0.731,
        status: "Optimal Stock"
      },
      {
        id: "sz-80-160",
        dimension: "80×160 cm",
        inches: "32×64 in",
        widthCm: 80,
        lengthCm: 160,
        gsm: 700,
        grams: 896,
        price: 480,
        stock: 200,
        moq: 40,
        weightKg: 0.896,
        status: "Optimal Stock"
      }
    ]
  }
];

export const initialOrders = [];

export const initialCustomers = [];


export const millInfo = {
  name: "SSTextiles",
  tagline: "Whole Sale Hand Looms Cloth Manufacturer",
  subTagline: "Direct Mill White Towels",
  address: "D/No. 1/144, Devanampalayam, 2nd street K nagar Kunnathur - 638 103. (Via) Tirupur Dt. Tamilnadu.",
  phone: "9566647825",
  whatsapp: "919566647825",
  email: "[EMAIL_ADDRESS]",
  gstin: "33BRWPV6711D1ZD",
  pan: "BRWTV7811D",
  stateCode: "33",
  hsnCode: "6302.60",
  taxRatePercent: 5,
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  igstPercent: 5,
  bankDetails: {
    bankName: "Tamilnadu Mercantile Bank",
    branch: "Kunnathur",
    accountName: "SSTextiles",
    accountNumber: "328950005800678",
    ifsc: "TMBL0700765",
    accountType: "Current Account"
  }
};
