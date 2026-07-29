export interface VoucherCode {
  code: string;
  title: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number; // e.g. 20 for 20%, 100 for Rs. 100, 100 for 100% free delivery
  description: string;
  badge: string;
  minSubtotal?: number;
}

export const OFFICIAL_VOUCHERS: VoucherCode[] = [
  {
    code: 'CARTGO20',
    title: '20% Storewide Discount',
    discountType: 'percentage',
    discountValue: 20,
    description: 'Get 20% OFF on all products in your cart',
    badge: '20% OFF',
  },
  {
    code: 'WELCOME50',
    title: '50% New Customer Special',
    discountType: 'percentage',
    discountValue: 50,
    description: 'Special 50% discount for new Cart Go shoppers',
    badge: '50% OFF',
  },
  {
    code: 'CARTGO10',
    title: '10% Instant Discount',
    discountType: 'percentage',
    discountValue: 10,
    description: 'Get 10% instant savings on your order',
    badge: '10% OFF',
  },
  {
    code: 'CARTGO15',
    title: '15% Hot Deal Voucher',
    discountType: 'percentage',
    discountValue: 15,
    description: 'Enjoy 15% discount on total subtotal',
    badge: '15% OFF',
  },
  {
    code: 'MEGA25',
    title: '25% Mega Saver',
    discountType: 'percentage',
    discountValue: 25,
    description: 'Mega 25% discount voucher code',
    badge: '25% OFF',
  },
  {
    code: 'SUPER30',
    title: '30% Super Discount',
    discountType: 'percentage',
    discountValue: 30,
    description: 'Super 30% savings on your cart items',
    badge: '30% OFF',
  },
  {
    code: 'FLAT100',
    title: 'Rs. 100 Flat Savings',
    discountType: 'fixed',
    discountValue: 100,
    description: 'Flat Rs. 100 instant cash discount',
    badge: 'Rs. 100 OFF',
  },
  {
    code: 'FLAT200',
    title: 'Rs. 200 Cash Voucher',
    discountType: 'fixed',
    discountValue: 200,
    description: 'Flat Rs. 200 instant savings on checkout',
    badge: 'Rs. 200 OFF',
  },
  {
    code: 'FREESHIP',
    title: '100% Free Shipping',
    discountType: 'free_shipping',
    discountValue: 100,
    description: 'Zero delivery fee on all items in your cart',
    badge: 'FREE DELIVERY',
  },
];

export function findVoucher(code: string): VoucherCode | undefined {
  if (!code) return undefined;
  const cleanCode = code.trim().toUpperCase();
  return OFFICIAL_VOUCHERS.find((v) => v.code === cleanCode);
}
