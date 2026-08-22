const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ones[num] + ' ';
  if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + (num % 10 !== 0 ? ' ' : '');
  return ones[Math.floor(num / 100)] + ' Hundred ' + convertLessThanThousand(num % 100);
}

export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  if (isNaN(num)) return '';

  let n = Math.floor(Math.abs(num));
  let result = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remaining = n;

  if (crore > 0) {
    result += convertLessThanThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    result += convertLessThanThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    result += convertLessThanThousand(thousand) + 'Thousand ';
  }
  if (remaining > 0) {
    result += convertLessThanThousand(remaining);
  }

  return 'INR ' + result.trim() + ' Only';
}
