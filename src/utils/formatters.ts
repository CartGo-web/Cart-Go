export function formatPKR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rs. 0';
  }
  return `Rs. ${amount.toLocaleString('en-PK', {
    maximumFractionDigits: 2,
  })}`;
}
