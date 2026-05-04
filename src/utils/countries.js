export const countryOptions = [
  {
    id: "NG",
    dialCode: "+234",
    flag: "🇳🇬",
    name: "Nigeria",
    currency: "NGN",
    localPhoneLength: 10,
  },
  {
    id: "US",
    dialCode: "+1",
    flag: "🇺🇸",
    name: "United States",
    currency: "USD",
    localPhoneLength: 10,
  },
  {
    id: "GB",
    dialCode: "+44",
    flag: "🇬🇧",
    name: "United Kingdom",
    currency: "GBP",
    localPhoneLength: 10,
  },
  {
    id: "CA",
    dialCode: "+1",
    flag: "🇨🇦",
    name: "Canada",
    currency: "CAD",
    localPhoneLength: 10,
  },
  {
    id: "GH",
    dialCode: "+233",
    flag: "🇬🇭",
    name: "Ghana",
    currency: "GHS",
    localPhoneLength: 9,
  },
  {
    id: "KE",
    dialCode: "+254",
    flag: "🇰🇪",
    name: "Kenya",
    currency: "KES",
    localPhoneLength: 9,
  },
  {
    id: "ZA",
    dialCode: "+27",
    flag: "🇿🇦",
    name: "South Africa",
    currency: "ZAR",
    localPhoneLength: 9,
  },
  {
    id: "EG",
    dialCode: "+20",
    flag: "🇪🇬",
    name: "Egypt",
    currency: "EGP",
    localPhoneLength: 10,
  },
  {
    id: "MA",
    dialCode: "+212",
    flag: "🇲🇦",
    name: "Morocco",
    currency: "MAD",
    localPhoneLength: 9,
  },
  {
    id: "AE",
    dialCode: "+971",
    flag: "🇦🇪",
    name: "United Arab Emirates",
    currency: "AED",
    localPhoneLength: 9,
  },
  {
    id: "SA",
    dialCode: "+966",
    flag: "🇸🇦",
    name: "Saudi Arabia",
    currency: "SAR",
    localPhoneLength: 9,
  },
  {
    id: "IN",
    dialCode: "+91",
    flag: "🇮🇳",
    name: "India",
    currency: "INR",
    localPhoneLength: 10,
  },
  {
    id: "PK",
    dialCode: "+92",
    flag: "🇵🇰",
    name: "Pakistan",
    currency: "PKR",
    localPhoneLength: 10,
  },
  {
    id: "CN",
    dialCode: "+86",
    flag: "🇨🇳",
    name: "China",
    currency: "CNY",
    localPhoneLength: 11,
  },
  {
    id: "JP",
    dialCode: "+81",
    flag: "🇯🇵",
    name: "Japan",
    currency: "JPY",
    localPhoneLength: 10,
  },
  {
    id: "KR",
    dialCode: "+82",
    flag: "🇰🇷",
    name: "South Korea",
    currency: "KRW",
    localPhoneLength: 10,
  },
  {
    id: "AU",
    dialCode: "+61",
    flag: "🇦🇺",
    name: "Australia",
    currency: "AUD",
    localPhoneLength: 9,
  },
  {
    id: "NZ",
    dialCode: "+64",
    flag: "🇳🇿",
    name: "New Zealand",
    currency: "NZD",
    localPhoneLength: 9,
  },
  {
    id: "DE",
    dialCode: "+49",
    flag: "🇩🇪",
    name: "Germany",
    currency: "EUR",
    localPhoneLength: 11,
  },
  {
    id: "FR",
    dialCode: "+33",
    flag: "🇫🇷",
    name: "France",
    currency: "EUR",
    localPhoneLength: 9,
  },
  {
    id: "IT",
    dialCode: "+39",
    flag: "🇮🇹",
    name: "Italy",
    currency: "EUR",
    localPhoneLength: 10,
    keepLeadingZero: true,
  },
  {
    id: "ES",
    dialCode: "+34",
    flag: "🇪🇸",
    name: "Spain",
    currency: "EUR",
    localPhoneLength: 9,
  },
  {
    id: "NL",
    dialCode: "+31",
    flag: "🇳🇱",
    name: "Netherlands",
    currency: "EUR",
    localPhoneLength: 9,
  },
  {
    id: "IE",
    dialCode: "+353",
    flag: "🇮🇪",
    name: "Ireland",
    currency: "EUR",
    localPhoneLength: 9,
  },
  {
    id: "CH",
    dialCode: "+41",
    flag: "🇨🇭",
    name: "Switzerland",
    currency: "CHF",
    localPhoneLength: 9,
  },
  {
    id: "SE",
    dialCode: "+46",
    flag: "🇸🇪",
    name: "Sweden",
    currency: "SEK",
    localPhoneLength: 9,
  },
  {
    id: "NO",
    dialCode: "+47",
    flag: "🇳🇴",
    name: "Norway",
    currency: "NOK",
    localPhoneLength: 8,
  },
  {
    id: "DK",
    dialCode: "+45",
    flag: "🇩🇰",
    name: "Denmark",
    currency: "DKK",
    localPhoneLength: 8,
  },
  {
    id: "BR",
    dialCode: "+55",
    flag: "🇧🇷",
    name: "Brazil",
    currency: "BRL",
    localPhoneLength: 11,
  },
  {
    id: "MX",
    dialCode: "+52",
    flag: "🇲🇽",
    name: "Mexico",
    currency: "MXN",
    localPhoneLength: 10,
  },
];

export function findCountryById(countryId) {
  return countryOptions.find((country) => country.id === countryId);
}

export function findCountryByName(countryName) {
  const normalizedCountryName = String(countryName || "").trim().toLowerCase();

  return countryOptions.find(
    (country) => country.name.toLowerCase() === normalizedCountryName,
  );
}

export function findCountryByDialCode(dialCode) {
  return countryOptions.find((country) => country.dialCode === dialCode);
}

export function getDialCodeDigits(country) {
  return String(country?.dialCode || "").replace(/\D/g, "");
}

export function normalizeLocalPhoneNumber(value, country) {
  const dialCodeDigits = getDialCodeDigits(country);
  let phoneDigits = String(value || "").replace(/\D/g, "");

  if (dialCodeDigits && phoneDigits.startsWith(dialCodeDigits)) {
    phoneDigits = phoneDigits.slice(dialCodeDigits.length);
  }

  if (!country?.keepLeadingZero) {
    phoneDigits = phoneDigits.replace(/^0+/, "");
  }

  return phoneDigits.slice(0, country?.localPhoneLength || 15);
}

export function formatPhoneWithCountryCode(value, country) {
  const dialCodeDigits = getDialCodeDigits(country);
  const localPhoneNumber = normalizeLocalPhoneNumber(value, country);

  if (!dialCodeDigits) return localPhoneNumber;
  if (!localPhoneNumber) return `(${dialCodeDigits})`;

  return `(${dialCodeDigits}) ${localPhoneNumber}`;
}
