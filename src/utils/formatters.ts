export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  if (isNaN(amount)) return `${currency} 0/-`;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency} ${formatted}/-`;
};

export const sanitizeContactNumber = (input: string): string => {
  // Extract only numbers and optional leading +
  return input.replace(/[^0-9+]/g, '');
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr;
};
