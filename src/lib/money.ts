export const formatMoney = (value: number, symbol = '₱') =>
  `${symbol}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

