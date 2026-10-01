/* =========================================================
   Farzana's Home Made Achar — shared data store
   Used by both the shop (index.html) and admin (admin.html).
   Data lives in the browser's localStorage. For production,
   swap the get/set functions below for real API calls.
   ========================================================= */
(function () {
  const KEYS = {
    products: 'fz_products',
    orders: 'fz_orders',
    settings: 'fz_settings',
    cart: 'fz_cart',
    myOrders: 'fz_my_orders',
    notes: 'fz_customer_notes',
    version: 'fz_data_version',
    recent: 'fz_recent_search'
  };
  const DATA_VERSION = 1;

  /* ---------- helpers ---------- */
  const BN = '০১২৩৪৫৬৭৮৯';
  const bn = (v) => String(v).replace(/\d/g, (d) => BN[d]);
  const money = (n) => '৳' + bn(Math.round(n).toLocaleString('en-IN'));
  const moneyEn = (n) => '৳' + Math.round(n).toLocaleString('en-IN');
  const pct = (p) => (p.price > p.offerPrice ? Math.round(((p.price - p.offerPrice) / p.price) * 100) : 0);
  const uid = (pre = 'id') => pre + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage full or blocked', e);
      alert('ডেটা সেভ করা যায়নি। ব্রাউজারের স্টোরেজ ভরে গেছে — ছোট ছবি ব্যবহার করুন।');
      return false;
    }
  }

  /* ---------- default products ---------- */
  const commonStorage = [
    'সবসময় শুকনো ও পরিষ্কার চামচ দিয়ে আচার তুলুন।',
    'বয়াম খোলার পর অবশ্যই ফ্রিজে রাখুন, কারণ এতে কোনো প্রিজারভেটিভ নেই।',
    'ঢাকনা শক্ত করে বন্ধ রাখুন যাতে বাতাস ও আর্দ্রতা না ঢোকে।',
    'আচার যেন তেলের নিচে ডুবে থাকে — এতে স্বাদ ও মান দুটোই ভালো থাকে।',
    'মাঝে মাঝে ঝলমলে রোদে ঢাকনা খুলে ১–২ ঘণ্টা রাখলে আচার আরও ভালো থাকে।',
    'মেয়াদ: উৎপাদনের তারিখ থেকে ৬ মাস।'
  ];

  const DEFAULT_PRODUCTS = [
    {
      id: 'p-chalta', slug: 'chalta', type: 'single',
      name: 'চালতার আচার', nameEn: 'Chalta Achar', weight: '২৫০ গ্রাম',
      price: 150, offerPrice: 99, stock: 60, sold: 184, rating: 4.9, reviews: 126,
      tags: ['featured', 'hot', 'best', 'popular'], lid: '#F6C21C',
      image: 'images/chalta-scene.webp',
      gallery: ['images/chalta-scene.webp', 'images/jar-chalta.webp', 'images/banner-chalta.webp', 'images/label-chalta.webp'],
      short: 'টক-মিষ্টি চালতা, সরিষার তেল আর পাঁচফোড়নের ঘ্রাণে ঘরে বানানো।',
      description: 'বাজার থেকে বেছে আনা কচি চালতা ধুয়ে, কেটে, রোদে শুকিয়ে খাঁটি সরিষার তেলে ধীরে ধীরে রান্না করা হয়। পাঁচফোড়ন আর রসুনের ঘ্রাণে টক-মিষ্টি-ঝালের যে মিশেল, সেটাই চালতার আচারের আসল স্বাদ। কোনো রং বা প্রিজারভেটিভ ছাড়া, ছোট ব্যাচে ঘরে বানানো।',
      ingredients: ['চালতা', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'রসুন', 'শুকনা মরিচ'],
      storage: commonStorage,
      pairing: ['গরম ভাত ও ডাল', 'খিচুড়ি', 'পরোটা বা রুটি', 'মুড়ি মাখা', 'ভর্তা-ভাত'],
      benefits: ['চালতায় প্রাকৃতিকভাবে ভিটামিন সি থাকে।', 'টক স্বাদ খাবারে রুচি ফেরাতে সাহায্য করে।', 'সরিষার তেল ও পাঁচফোড়ন হজমে সহায়ক বলে পরিচিত।', 'কোনো কৃত্রিম রং বা প্রিজারভেটিভ নেই।'],
      keywords: 'chalta chaltar achar elephant apple tok mishti sour sweet চালতা টক মিষ্টি', active: true
    },
    {
      id: 'p-rosun', slug: 'rosun', type: 'single',
      name: 'রসুনের আচার', nameEn: 'Garlic Achar', weight: '২৫০ গ্রাম',
      price: 200, offerPrice: 149, stock: 45, sold: 142, rating: 4.8, reviews: 98,
      tags: ['featured', 'best', 'popular'], lid: '#D42A26',
      image: 'images/rosun-scene.webp',
      gallery: ['images/rosun-scene.webp', 'images/jar-rosun.webp', 'images/banner-rosun.webp'],
      short: 'আস্ত রসুনের কোয়া, ঝাল মশলা আর সরিষার তেলে মজানো।',
      description: 'বাছাই করা দেশি রসুনের কোয়া ছিলে সরিষার তেল, শুকনা মরিচ আর পাঁচফোড়নে মজিয়ে বানানো হয়। দিন যত যায়, রসুন তত নরম আর মশলাদার হয়। ভাত, খিচুড়ি বা মাংসের সাথে এক কোয়াই যথেষ্ট।',
      ingredients: ['দেশি রসুন', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'শুকনা মরিচ গুঁড়া', 'ভিনেগার (প্রাকৃতিক)'],
      storage: commonStorage,
      pairing: ['গরম ভাত', 'খিচুড়ি', 'গরুর মাংস ভুনা', 'পোলাও', 'ডাল-ভাত'],
      benefits: ['রসুনে অ্যালিসিন থাকে, যা ঐতিহ্যগতভাবে উপকারী বলে পরিচিত।', 'ঠান্ডা-কাশির মৌসুমে অনেকেই রসুন খেতে পছন্দ করেন।', 'ভারী খাবারের সাথে হজমে সাহায্য করে।', 'কোনো প্রিজারভেটিভ নেই।'],
      keywords: 'rosun roshun garlic achar jhal spicy রসুন ঝাল', active: true
    },
    {
      id: 'p-amra', slug: 'amra', type: 'single',
      name: 'আমড়ার আচার', nameEn: 'Amra Achar', weight: '২৫০ গ্রাম',
      price: 150, offerPrice: 110, stock: 40, sold: 96, rating: 4.7, reviews: 64,
      tags: ['hot', 'popular'], lid: '#D42A26',
      image: 'images/amra-scene.webp',
      gallery: ['images/amra-scene.webp', 'images/banner-amra.webp'],
      short: 'কচমচে আমড়ার টুকরো, হালকা মিষ্টি আর মশলার ঝাঁঝ।',
      description: 'মৌসুমের তাজা আমড়া কেটে খোসাসহ সরিষার তেলে রান্না করা হয়, যাতে কামড়ে কচমচে ভাবটা থেকে যায়। চিনি আর পাঁচফোড়নের ভারসাম্যে টক-মিষ্টি স্বাদ।',
      ingredients: ['আমড়া', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'রসুন', 'শুকনা মরিচ'],
      storage: commonStorage,
      pairing: ['ভাত ও ভর্তা', 'মুড়ি মাখা', 'খিচুড়ি', 'বিকেলের নাস্তা'],
      benefits: ['আমড়ায় প্রাকৃতিক ভিটামিন সি থাকে।', 'আঁশযুক্ত ফল, খেতে হালকা।', 'মুখের রুচি বাড়ায়।', 'কোনো কৃত্রিম রং নেই।'],
      keywords: 'amra amrar achar hog plum tok mishti আমড়া', active: true
    },
    {
      id: 'p-tetul', slug: 'tetul', type: 'single',
      name: 'তেঁতুলের আচার', nameEn: 'Tetul Achar', weight: '২৫০ গ্রাম',
      price: 160, offerPrice: 120, stock: 50, sold: 128, rating: 4.8, reviews: 87,
      tags: ['featured', 'hot', 'best'], lid: '#0E5A2B',
      image: 'images/tetul-scene.webp',
      gallery: ['images/tetul-scene.webp', 'images/banner-tetul.webp'],
      short: 'ঘন, টক-ঝাল-মিষ্টি তেঁতুল — জিভে জল আনা স্বাদ।',
      description: 'পাকা তেঁতুল ভিজিয়ে বিচি ছাড়িয়ে গুড়-চিনি, শুকনা মরিচ আর মশলায় ঘন করে জ্বাল দেওয়া হয়। ফুচকা-চটপটির সঙ্গী বা এমনিতেই চামচে খাওয়ার মতো।',
      ingredients: ['তেঁতুল', 'চিনি ও আখের গুড়', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'রসুন', 'শুকনা মরিচ'],
      storage: commonStorage,
      pairing: ['ফুচকা ও চটপটি', 'সিঙ্গারা-সমুচা', 'ভাত', 'এমনিতেই চামচে'],
      benefits: ['তেঁতুল হজমে সহায়ক বলে ঐতিহ্যগতভাবে পরিচিত।', 'প্রাকৃতিক টক স্বাদ মুখের রুচি বাড়ায়।', 'আয়রন ও খনিজের উৎস।', 'কোনো প্রিজারভেটিভ নেই।'],
      keywords: 'tetul tentul tamarind achar tok jhal mishti তেঁতুল চটপটি ফুচকা', active: true
    },
    {
      id: 'p-jolpai', slug: 'jolpai', type: 'single',
      name: 'জলপাইয়ের আচার', nameEn: 'Jolpai Achar', weight: '২৫০ গ্রাম',
      price: 150, offerPrice: 115, stock: 35, sold: 88, rating: 4.7, reviews: 52,
      tags: ['popular', 'hot'], lid: '#0E5A2B',
      image: 'images/jolpai-scene.webp',
      gallery: ['images/jolpai-scene.webp', 'images/banner-all.webp'],
      short: 'দেশি জলপাই, সরিষার তেলে মাখামাখা টক-ঝাল আচার।',
      description: 'দেশি সবুজ জলপাই সেদ্ধ করে সরিষার তেল, পাঁচফোড়ন আর মরিচে রান্না। টক স্বাদের ভক্তদের জন্য — খিচুড়ি বা ডাল-ভাতের সাথে জমে যায়।',
      ingredients: ['জলপাই', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'রসুন', 'শুকনা মরিচ'],
      storage: commonStorage,
      pairing: ['খিচুড়ি', 'ডাল-ভাত', 'পরোটা', 'মুড়ি'],
      benefits: ['জলপাইয়ে প্রাকৃতিক ভিটামিন সি ও আঁশ আছে।', 'টক স্বাদ রুচি বাড়ায়।', 'ঘরে ছোট ব্যাচে বানানো।', 'কোনো কৃত্রিম রং নেই।'],
      keywords: 'jolpai jalpai olive achar tok জলপাই', active: true
    },
    {
      id: 'p-aam', slug: 'aam', type: 'single',
      name: 'আমের আচার', nameEn: 'Mango Achar', weight: '২৫০ গ্রাম',
      price: 170, offerPrice: 130, stock: 30, sold: 110, rating: 4.8, reviews: 73,
      tags: ['featured', 'popular'], lid: '#0E5A2B',
      image: 'images/aam-scene.webp',
      gallery: ['images/aam-scene.webp', 'images/banner-all.webp'],
      short: 'কাঁচা আমের টুকরো, ঝাল-টক মশলায় ক্লাসিক স্বাদ।',
      description: 'কাঁচা আমের ফালি রোদে শুকিয়ে সরিষার তেল, মৌরি, কালোজিরা আর মরিচে মজানো হয়। নানি-দাদির হাতের সেই চেনা আমের আচার।',
      ingredients: ['কাঁচা আম', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'রসুন', 'শুকনা মরিচ'],
      storage: commonStorage,
      pairing: ['গরম ভাত', 'খিচুড়ি', 'পরোটা', 'মুড়ি মাখা'],
      benefits: ['কাঁচা আমে ভিটামিন সি থাকে।', 'গরমের দিনে খাবারে রুচি আনে।', 'সরিষার তেলের ঝাঁঝ হজমে সাহায্য করে বলে পরিচিত।', 'কোনো প্রিজারভেটিভ নেই।'],
      keywords: 'aam am mango kacha aam achar আম', active: true
    },
    {
      id: 'k-duo', slug: 'duo-combo', type: 'package',
      name: 'ডুও প্যাক: চালতা + রসুন', nameEn: 'Duo Pack', weight: '২ × ২৫০ গ্রাম',
      price: 350, offerPrice: 229, stock: 25, sold: 76, rating: 4.9, reviews: 41,
      tags: ['hot', 'best'], lid: '#F6C21C', items: ['p-chalta', 'p-rosun'],
      image: 'images/combo2.webp', gallery: ['images/combo2.webp', 'images/jar-chalta.webp', 'images/jar-rosun.webp'],
      short: 'সবচেয়ে বেশি বিক্রি হওয়া দুই আচার একসাথে।',
      description: 'টক-মিষ্টি চালতা আর ঝাল রসুন — দুই রকম স্বাদ এক প্যাকে। প্রথমবার অর্ডার করছেন? এখান থেকেই শুরু করুন।',
      ingredients: ['চালতা', 'রসুন', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'শুকনা মরিচ'],
      storage: commonStorage,
      pairing: ['গরম ভাত ও ডাল', 'খিচুড়ি', 'মাংস ভুনা', 'পরোটা'],
      benefits: ['নিয়মিত দামের চেয়ে ৳১২১ সাশ্রয়।', 'দুই রকম স্বাদ — টক-মিষ্টি ও ঝাল।', 'উপহার দেওয়ার জন্যও ভালো।'],
      keywords: 'combo package duo 2 pack chalta rosun কম্বো প্যাকেজ', active: true
    },
    {
      id: 'k-trio', slug: 'trio-combo', type: 'package',
      name: 'ট্রায়ো প্যাক: আমড়া + তেঁতুল + জলপাই', nameEn: 'Trio Pack', weight: '৩ × ২৫০ গ্রাম',
      price: 460, offerPrice: 319, stock: 20, sold: 54, rating: 4.8, reviews: 29,
      tags: ['featured'], lid: '#D42A26', items: ['p-amra', 'p-tetul', 'p-jolpai'],
      image: 'images/combo3.webp', gallery: ['images/combo3.webp', 'images/banner-all.webp'],
      short: 'টক প্রেমীদের জন্য তিনটি আচার একসাথে।',
      description: 'আমড়ার কচমচে টক, তেঁতুলের ঘন টক-ঝাল আর জলপাইয়ের ঝাঁঝ — তিন স্বাদের এক বক্স।',
      ingredients: ['আমড়া', 'তেঁতুল', 'জলপাই', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'রসুন'],
      storage: commonStorage,
      pairing: ['ভাত', 'ফুচকা-চটপটি', 'খিচুড়ি', 'মুড়ি'],
      benefits: ['নিয়মিত দামের চেয়ে প্রায় ৳১৪০ সাশ্রয়।', 'পরিবারের সবার পছন্দ মিলিয়ে নিন।'],
      keywords: 'combo package trio 3 pack amra tetul jolpai কম্বো প্যাকেজ', active: true
    },
    {
      id: 'k-family', slug: 'family-combo', type: 'package',
      name: 'ফ্যামিলি প্যাক: ৪টি আচার', nameEn: 'Family Pack', weight: '৪ × ২৫০ গ্রাম',
      price: 610, offerPrice: 429, stock: 15, sold: 47, rating: 5.0, reviews: 22,
      tags: ['hot', 'featured', 'best'], lid: '#0E5A2B', items: ['p-chalta', 'p-amra', 'p-jolpai', 'p-tetul'],
      image: 'images/combo4.webp', gallery: ['images/combo4.webp', 'images/banner-all.webp'],
      short: 'চালতা, আমড়া, জলপাই ও তেঁতুল — পুরো পরিবারের জন্য।',
      description: 'আমাদের চারটি জনপ্রিয় আচার এক প্যাকে। মাসের বাজারে একবার নিলেই প্রতিদিনের ভাতের পাতে আচার থাকবে।',
      ingredients: ['চালতা', 'আমড়া', 'জলপাই', 'তেঁতুল', 'চিনি', 'সরিষার তেল', 'পাঁচফোড়ন', 'লবণ', 'রসুন'],
      storage: commonStorage,
      pairing: ['প্রতিদিনের ভাত', 'খিচুড়ি', 'ফুচকা-চটপটি', 'নাস্তা'],
      benefits: ['নিয়মিত দামের চেয়ে ৳১৮১ সাশ্রয়।', 'চার রকম স্বাদ, এক অর্ডারে।', 'উপহার হিসেবেও দারুণ।'],
      keywords: 'combo package family 4 pack কম্বো প্যাকেজ ফ্যামিলি', active: true
    }
  ];

  const DEFAULT_SETTINGS = {
    storeName: "Farzana's Home Made Achar",
    tagline: 'দেশি স্বাদ, ঘরের মতো যত্নে',
    phone: '01775480868',
    whatsapp: '8801775480868',
    address: 'টি এন্ড টি রোড, ঝালকাঠি',
    facebook: 'https://facebook.com/',
    homeDistrict: 'ঝালকাঠি',
    deliveryInside: 60,
    deliveryOutside: 120,
    freeDeliveryOver: 1000,
    hotDealEnds: new Date(Date.now() + 3 * 864e5).toISOString(),
    notices: [
      'সারা বাংলাদেশে হোম ডেলিভারি',
      '৳১০০০+ অর্ডারে ডেলিভারি ফ্রি',
      'কুপন FARZANA10 ব্যবহার করে ১০% ছাড়',
      '১০০% প্রাকৃতিক, কোনো প্রিজারভেটিভ নেই'
    ],
    sections: {
      featured: { show: true, title: 'ফিচার্ড আচার' },
      hot: { show: true, title: 'হট ডিল' },
      best: { show: true, title: 'বেস্ট সেলার' },
      packages: { show: true, title: 'কম্বো প্যাকেজ' },
      popular: { show: true, title: 'জনপ্রিয় আচার' }
    },
    banners: [
      { image: 'images/banner-all.webp', link: 'packages' },
      { image: 'images/banner-chalta.webp', link: 'chalta' },
      { image: 'images/banner-rosun.webp', link: 'rosun' },
      { image: 'images/banner-tetul.webp', link: 'tetul' },
      { image: 'images/banner-amra.webp', link: 'amra' }
    ],
    coupons: [
      { code: 'FARZANA10', type: 'percent', value: 10, min: 300, active: true },
      { code: 'ACHAR50', type: 'flat', value: 50, min: 500, active: true }
    ],
    admin: { user: 'admin', passHash: '' } // empty = default password "farzana123"
  };

  /* ---------- seeding ---------- */
  function seed(force) {
    if (force || !localStorage.getItem(KEYS.products)) write(KEYS.products, DEFAULT_PRODUCTS);
    if (force || !localStorage.getItem(KEYS.settings)) write(KEYS.settings, DEFAULT_SETTINGS);
    if (force || !localStorage.getItem(KEYS.orders)) write(KEYS.orders, []);
    write(KEYS.version, DATA_VERSION);
  }
  seed(false);

  /* ---------- products ---------- */
  const products = () => read(KEYS.products, DEFAULT_PRODUCTS);
  const activeProducts = () => products().filter((p) => p.active !== false);
  const saveProducts = (list) => write(KEYS.products, list);
  const product = (idOrSlug) => products().find((p) => p.id === idOrSlug || p.slug === idOrSlug);

  /* ---------- settings ---------- */
  const settings = () => {
    const s = read(KEYS.settings, DEFAULT_SETTINGS);
    // merge new default keys into older saved settings
    return Object.assign({}, DEFAULT_SETTINGS, s, { sections: Object.assign({}, DEFAULT_SETTINGS.sections, s.sections || {}) });
  };
  const saveSettings = (s) => write(KEYS.settings, s);

  /* ---------- cart ---------- */
  const cart = () => read(KEYS.cart, []);
  const saveCart = (c) => { write(KEYS.cart, c); document.dispatchEvent(new CustomEvent('cart:change')); };
  function cartAdd(id, qty = 1) {
    const c = cart();
    const p = product(id);
    if (!p) return;
    const line = c.find((l) => l.id === id);
    const max = Math.max(0, p.stock);
    if (line) line.qty = Math.min(max, line.qty + qty);
    else c.push({ id, qty: Math.min(max, qty) });
    saveCart(c.filter((l) => l.qty > 0));
  }
  function cartSet(id, qty) {
    const p = product(id);
    let c = cart();
    if (qty <= 0) c = c.filter((l) => l.id !== id);
    else {
      const line = c.find((l) => l.id === id);
      const q = Math.min(qty, p ? p.stock : qty);
      if (line) line.qty = q; else c.push({ id, qty: q });
    }
    saveCart(c);
  }
  const cartQty = (id) => (cart().find((l) => l.id === id) || {}).qty || 0;
  const cartCount = () => cart().reduce((s, l) => s + l.qty, 0);
  const cartLines = () => cart().map((l) => ({ ...l, p: product(l.id) })).filter((l) => l.p);
  const cartClear = () => saveCart([]);

  function findCoupon(code, subtotal) {
    if (!code) return null;
    const c = settings().coupons.find((x) => x.active && x.code.toUpperCase() === code.trim().toUpperCase());
    if (!c) return { error: 'এই কুপন কোডটি সঠিক নয়।' };
    if (subtotal < c.min) return { error: `এই কুপনের জন্য কমপক্ষে ${money(c.min)} অর্ডার করতে হবে।` };
    const amount = c.type === 'percent' ? Math.round((subtotal * c.value) / 100) : c.value;
    return { code: c.code, amount: Math.min(amount, subtotal) };
  }

  /* ---------- orders ---------- */
  const orders = () => read(KEYS.orders, []);
  const saveOrders = (o) => write(KEYS.orders, o);
  function addOrder(order) {
    const list = orders();
    list.unshift(order);
    saveOrders(list);
    // reduce stock & increase sold
    const ps = products();
    order.items.forEach((it) => {
      const p = ps.find((x) => x.id === it.id);
      if (p) { p.stock = Math.max(0, p.stock - it.qty); p.sold = (p.sold || 0) + it.qty; }
    });
    saveProducts(ps);
    const mine = read(KEYS.myOrders, []);
    mine.unshift(order.id);
    write(KEYS.myOrders, mine);
    return order;
  }
  function updateOrder(id, patch) {
    const list = orders();
    const o = list.find((x) => x.id === id);
    if (!o) return;
    Object.assign(o, patch);
    saveOrders(list);
    return o;
  }
  const myOrders = () => {
    const ids = read(KEYS.myOrders, []);
    const all = orders();
    return ids.map((id) => all.find((o) => o.id === id)).filter(Boolean);
  };
  function newOrderId() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return 'FZ' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /* ---------- password hashing ---------- */
  async function hash(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fz::' + text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (const ch of 'fz::' + text) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }

  /* ---------- search ---------- */
  function search(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const tagWords = { featured: 'ফিচার্ড featured', hot: 'হট ডিল hot deal offer অফার', best: 'বেস্ট সেলার best seller', popular: 'জনপ্রিয় popular' };
    return activeProducts()
      .map((p) => {
        const name = (p.name + ' ' + p.nameEn).toLowerCase();
        const kw = (p.keywords || '').toLowerCase() + ' ' + p.tags.map((t) => tagWords[t] || '').join(' ').toLowerCase() + (p.type === 'package' ? ' প্যাকেজ কম্বো combo package' : '');
        const ing = p.ingredients.join(' ').toLowerCase();
        const desc = (p.short + ' ' + p.description + ' ' + p.pairing.join(' ')).toLowerCase();
        let score = 0;
        tokens.forEach((t) => {
          if (name.startsWith(t)) score += 12;
          else if (name.includes(t)) score += 8;
          if (kw.includes(t)) score += 6;
          if (ing.includes(t)) score += 3;
          if (desc.includes(t)) score += 1;
        });
        if (name.includes(q)) score += 5;
        return { p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.p.sold - a.p.sold)
      .map((r) => r.p);
  }

  /* ---------- backup ---------- */
  const exportAll = () => ({ version: DATA_VERSION, exportedAt: new Date().toISOString(), products: products(), orders: orders(), settings: settings(), notes: read(KEYS.notes, {}) });
  function importAll(data) {
    if (!data || !Array.isArray(data.products)) throw new Error('ফাইলটি সঠিক ব্যাকআপ নয়।');
    write(KEYS.products, data.products);
    write(KEYS.orders, data.orders || []);
    if (data.settings) write(KEYS.settings, data.settings);
    if (data.notes) write(KEYS.notes, data.notes);
  }

  window.FZ = {
    KEYS, bn, money, moneyEn, pct, uid, read, write,
    products, activeProducts, saveProducts, product,
    settings, saveSettings, DEFAULT_PRODUCTS,
    cart, cartAdd, cartSet, cartQty, cartCount, cartLines, cartClear, findCoupon,
    orders, saveOrders, addOrder, updateOrder, myOrders, newOrderId,
    hash, search, exportAll, importAll,
    reset: () => seed(true)
  };
})();
