export const RealtimeRooms = {
  vendor: (vendorId: string) => `vendor:${vendorId}`,
  customer: (customerId: string) => `customer:${customerId}`,
  trekker: (trekkerId: string) => `trekker:${trekkerId}`,
  order: (orderId: string) => `order:${orderId}`,
  admin: () => `admin`,
  vendorOrders: () => `vendor-orders`,
  trekkers: () => `trekkers`,
  customers: () => `customers`,
};
