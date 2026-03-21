export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDesc?: string;
  manufacturerSku?: string;
  ean?: string;
  unitName?: string;
  price: number;
  salePrice?: number;
  purchasePrice?: number;
  vatRate?: string;
  sku: string;
  stock: number;
  images: string[];
  documents?: Array<{ name: string; url: string }>;
  categoryId: string;
  categoryIds?: string[];
  manufacturer?: string;
  category?: Category;
  tags: string[];
  weight?: number;
  weightUnit?: string;
  sizeValue?: string;
  sizeUnit?: string;
  attributes?: Record<string, string | string[]>;
  supplierUrl?: string;
  excludedPaymentMethods?: string[];
  excludedShippingMethods?: string[];
  promotions?: Array<{
    name: string;
    startAt?: string;
    endAt?: string;
    salePrice?: number;
  }>;
  rating?: number;
  reviewCount?: number;
  ageGroups?: string[];
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  productCount?: number;
  sortOrder: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: string;
  shippingPickupPoint?: {
    id: string;
    type: "parcel-locker" | "parcel-shop";
    name: string;
    postalCode: string;
    city: string;
    address: string;
  };
  shippingPrice: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  purchaseEventId?: string;
  stripePaymentId?: string;
  billingoInvoiceId?: string;
  glsTrackingId?: string;
  postaTrackingId?: string;
  notes?: string;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscount?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsGranted?: boolean;
  attribution?: {
    fbp?: string;
    fbc?: string;
    fbclid?: string;
    gclid?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    landingPath?: string;
    metaPurchaseSentAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variant?: Record<string, string>;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface Address {
  name: string;
  email?: string;
  phone?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  company?: string;
  taxNumber?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  publishedAt?: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: "CUSTOMER" | "ADMIN";
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  icon: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  orderConfirmationEnabled: boolean;
  orderStatusUpdateEnabled: boolean;
  adminNewOrderEnabled: boolean;
  adminNotificationEmail?: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  earnOnDelivered: boolean;
  earnDivisor: number;
  pointValueHuf: number;
  maxRedeemPercent: number;
}

export interface LoyaltyBalance {
  email: string;
  points: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  updatedAt: string;
}

export type PluginStatus = "active" | "inactive";

export interface PluginConfigField {
  key: string;
  label: string;
  value: string;
  type: "text" | "secret" | "number" | "boolean";
}

export interface AdminPlugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  developer: string;
  category: string;
  status: PluginStatus;
  isInstalled: boolean;
  config: PluginConfigField[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  ageGroups: string[];
  brands: string[];
  rating: number | null;
  inStock: boolean;
  sortBy: SortOption;
}

export type SortOption =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest";
