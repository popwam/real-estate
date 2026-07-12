export const countries = [
  { code: 'EG', name: { en: 'Egypt', ar: 'مصر', fr: 'Égypte' }, callingCode: '+20', currency: 'EGP', timezones: ['Africa/Cairo'] },
  { code: 'SA', name: { en: 'Saudi Arabia', ar: 'السعودية', fr: 'Arabie saoudite' }, callingCode: '+966', currency: 'SAR', timezones: ['Asia/Riyadh'] },
  { code: 'AE', name: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', fr: 'Émirats arabes unis' }, callingCode: '+971', currency: 'AED', timezones: ['Asia/Dubai'] },
  { code: 'QA', name: { en: 'Qatar', ar: 'قطر', fr: 'Qatar' }, callingCode: '+974', currency: 'QAR', timezones: ['Asia/Qatar'] },
  { code: 'KW', name: { en: 'Kuwait', ar: 'الكويت', fr: 'Koweït' }, callingCode: '+965', currency: 'KWD', timezones: ['Asia/Kuwait'] },
  { code: 'BH', name: { en: 'Bahrain', ar: 'البحرين', fr: 'Bahreïn' }, callingCode: '+973', currency: 'BHD', timezones: ['Asia/Bahrain'] },
  { code: 'OM', name: { en: 'Oman', ar: 'عمان', fr: 'Oman' }, callingCode: '+968', currency: 'OMR', timezones: ['Asia/Muscat'] },
  { code: 'MA', name: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, callingCode: '+212', currency: 'MAD', timezones: ['Africa/Casablanca'] },
  { code: 'FR', name: { en: 'France', ar: 'فرنسا', fr: 'France' }, callingCode: '+33', currency: 'EUR', timezones: ['Europe/Paris'] },
  { code: 'US', name: { en: 'United States', ar: 'الولايات المتحدة', fr: 'États-Unis' }, callingCode: '+1', currency: 'USD', timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'] },
];

export const currencies = [
  { code: 'EGP', name: { en: 'Egyptian pound', ar: 'جنيه مصري', fr: 'Livre égyptienne' } },
  { code: 'SAR', name: { en: 'Saudi riyal', ar: 'ريال سعودي', fr: 'Riyal saoudien' } },
  { code: 'AED', name: { en: 'UAE dirham', ar: 'درهم إماراتي', fr: 'Dirham des Émirats' } },
  { code: 'QAR', name: { en: 'Qatari riyal', ar: 'ريال قطري', fr: 'Riyal qatari' } },
  { code: 'KWD', name: { en: 'Kuwaiti dinar', ar: 'دينار كويتي', fr: 'Dinar koweïtien' } },
  { code: 'BHD', name: { en: 'Bahraini dinar', ar: 'دينار بحريني', fr: 'Dinar bahreïni' } },
  { code: 'OMR', name: { en: 'Omani rial', ar: 'ريال عماني', fr: 'Rial omanais' } },
  { code: 'MAD', name: { en: 'Moroccan dirham', ar: 'درهم مغربي', fr: 'Dirham marocain' } },
  { code: 'EUR', name: { en: 'Euro', ar: 'يورو', fr: 'Euro' } },
  { code: 'USD', name: { en: 'US dollar', ar: 'دولار أمريكي', fr: 'Dollar américain' } },
];

export const languages = [
  { code: 'en', name: { en: 'English', ar: 'الإنجليزية', fr: 'Anglais' }, dir: 'ltr' },
  { code: 'ar', name: { en: 'Arabic', ar: 'العربية', fr: 'Arabe' }, dir: 'rtl' },
  { code: 'fr', name: { en: 'French', ar: 'الفرنسية', fr: 'Français' }, dir: 'ltr' },
];

export const timezones = Array.from(
  new Set(countries.flatMap((country) => country.timezones)),
).map((value) => ({ value, label: value }));

export const callingCodes = countries.map((country) => ({
  countryCode: country.code,
  callingCode: country.callingCode,
  name: country.name,
}));
