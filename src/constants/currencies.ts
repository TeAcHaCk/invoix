import type { CurrencyConfig } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'USD',
    symbol: '$',
    label: 'USD - US Dollar ($)',
    locale: 'en-US',
    decimalPlaces: 2,
  },
  {
    code: 'INR',
    symbol: '₹',
    label: 'INR - Indian Rupee (₹)',
    locale: 'en-IN',
    decimalPlaces: 0,
  },
  {
    code: 'EUR',
    symbol: '€',
    label: 'EUR - Euro (€)',
    locale: 'de-DE',
    decimalPlaces: 2,
  },
  {
    code: 'GBP',
    symbol: '£',
    label: 'GBP - British Pound (£)',
    locale: 'en-GB',
    decimalPlaces: 2,
  },
  {
    code: 'AED',
    symbol: 'AED ',
    label: 'AED - UAE Dirham (AED)',
    locale: 'en-AE',
    decimalPlaces: 2,
  },
  {
    code: 'CAD',
    symbol: 'CA$',
    label: 'CAD - Canadian Dollar (CA$)',
    locale: 'en-CA',
    decimalPlaces: 2,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    label: 'AUD - Australian Dollar (A$)',
    locale: 'en-AU',
    decimalPlaces: 2,
  },
  {
    code: 'SGD',
    symbol: 'S$',
    label: 'SGD - Singapore Dollar (S$)',
    locale: 'en-SG',
    decimalPlaces: 2,
  },
  {
    code: 'SAR',
    symbol: 'SAR ',
    label: 'SAR - Saudi Riyal (SAR)',
    locale: 'en-SA',
    decimalPlaces: 2,
  },
  {
    code: 'MYR',
    symbol: 'RM ',
    label: 'MYR - Malaysian Ringgit (RM)',
    locale: 'ms-MY',
    decimalPlaces: 2,
  },
];

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[1]; // INR by default or USD
