// ──────────────────────────────────────────────
// LagChow — Shared Types
// ──────────────────────────────────────────────

/** Represents a user on the platform */
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: "customer" | "vendor" | "rider" | "admin";
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A campus food vendor */
export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  logoUrl?: string;
  location: string;
  isActive: boolean;
  rating: number;
  createdAt: Date;
}

/** A single item on a vendor's menu */
export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
}

/** An item within an order */
export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

/** A customer order */
export interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  riderId?: string;
  items: OrderItem[];
  totalAmount: number;
  serviceFee: number;
  deliveryFee: number;
  status: OrderStatus;
  deliveryAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

/** A delivery rider */
export interface Rider {
  id: string;
  userId: string;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  vehicleType: "bicycle" | "motorcycle" | "foot";
  rating: number;
}
