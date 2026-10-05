/** Derive a buyer-friendly progress state from an order payload. */
export function orderProgress(order) {
  if (!order) return { step: 0, label: '', tone: 'gray', terminal: null };
  const status = order.status;
  const pathao = (order.pathao_order_status || '').toLowerCase();
  const vendorStatuses = (order.vendor_orders || []).map((v) => v.status);

  if (status === 'REJECTED') return { step: 0, label: 'Rejected', tone: 'red', terminal: 'REJECTED' };
  if (status === 'CANCELLED') return { step: 0, label: 'Cancelled', tone: 'red', terminal: 'CANCELLED' };
  if (status === 'RETURNED' || pathao === 'returned') return { step: 0, label: 'Returned', tone: 'orange', terminal: 'RETURNED' };

  const delivered = pathao === 'delivered' || (vendorStatuses.length > 0 && vendorStatuses.every((s) => s === 'DELIVERED'));
  if (delivered) return { step: 4, label: 'Delivered', tone: 'green', terminal: null };

  const shipped = Boolean(order.pathao_consignment_id) || vendorStatuses.some((s) => s === 'SHIPPED') || pathao === 'in_transit';
  if (shipped) return { step: 3, label: pathao === 'pickup_pending' ? 'Awaiting pickup' : 'In transit', tone: 'blue', terminal: null };

  if (status === 'APPROVED') {
    const packed = vendorStatuses.length > 0 && vendorStatuses.every((s) => s === 'PACKED');
    return { step: 2, label: packed ? 'Packed' : 'Processing', tone: 'purple', terminal: null };
  }

  return { step: 1, label: 'Pending approval', tone: 'yellow', terminal: null };
}

export const ORDER_STEPS = ['Order placed', 'Confirmed', 'Shipped', 'Delivered'];

export const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All orders' },
  { value: 'PENDING_ADMIN_APPROVAL', label: 'Pending approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

export const VENDOR_ORDER_FLOW = ['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
