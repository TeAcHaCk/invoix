import type { CurrencyConfig } from '../types';

export const formatCurrency = (
  amount: number,
  currencyOrSymbol: CurrencyConfig | Partial<CurrencyConfig> | string = '₹',
  options?: { showFraction?: boolean; suffixDash?: boolean }
): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  let symbol = '₹';
  let locale = 'en-IN';
  let decimals = 0;

  if (typeof currencyOrSymbol === 'object' && currencyOrSymbol !== null) {
    symbol = currencyOrSymbol.symbol || '$';
    locale = currencyOrSymbol.locale || 'en-US';
    decimals = options?.showFraction ? currencyOrSymbol.decimalPlaces || 2 : currencyOrSymbol.decimalPlaces || 0;
  } else if (typeof currencyOrSymbol === 'string') {
    symbol = currencyOrSymbol;
    if (symbol === '$') locale = 'en-US';
    else if (symbol === '€') locale = 'de-DE';
    else if (symbol === '£') locale = 'en-GB';
    else if (symbol === '₹') locale = 'en-IN';
    else locale = 'en-US';
    decimals = options?.showFraction ? 2 : 0;
  }

  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals > 0 && amount % 1 !== 0 ? decimals : 0,
      maximumFractionDigits: decimals,
    }).format(amount);

    const suffix = options?.suffixDash !== false && symbol === '₹' ? '/-' : '';
    return `${symbol}${symbol.endsWith(' ') ? '' : ' '}${formatted}${suffix}`;
  } catch {
    return `${symbol} ${amount.toLocaleString()}`;
  }
};

export const sanitizeContactNumber = (input: string): string => {
  if (!input) return '';
  return input.replace(/[^0-9+ \-()]/g, '');
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr;
};
