import { productPrice } from './utils';

/**
 * Price breakdown of the cart items: list price (MRP) total, product discounts and the
 * subtotal actually charged for the books (before delivery and coupons).
 */
export function cartBreakdown(items = []) {
  let count = 0;
  let mrp = 0;
  let subtotal = 0;
  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.unit_price) || 0;
    const { original } = productPrice(item.product_details || {});
    const listUnit = original && original > unit ? original : unit;
    count += qty;
    mrp += listUnit * qty;
    subtotal += Number(item.subtotal_price ?? unit * qty);
  }
  return { count, mrp, discount: Math.max(0, mrp - subtotal), subtotal };
}
