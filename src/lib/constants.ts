// Fixed dropdown option sets used across the app. Kept in one place so
// wording stays consistent with the brand voice (plain Filipino/English
// mix, no database jargon).

export const CONFIDENCE_LEVELS = ["Verified", "Needs Verification", "Unverified"] as const;

export const PAYMENT_STATUSES = ["Planned", "Paid"] as const;

export const CUSTOMER_TYPES = ["Retail", "Suki"] as const;

export const SALE_PAYMENT_METHODS = ["Cash", "GCash", "COD"] as const;

export const EXPENSE_PAYMENT_METHODS = ["Cash", "GCash", "Bank Transfer", "Other"] as const;

export const ORDER_SOURCES = ["In-store", "Facebook", "TikTok", "Direct Message", "Other"] as const;

export const ORDER_STATUSES = [
  "New",
  "Confirmed",
  "Preparing",
  "Ready/Out for Delivery",
  "Completed",
  "Cancelled",
] as const;

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Delivery/Gas",
  "Packaging",
  "Permits/Fees",
  "Utilities",
  "Other",
] as const;

export const INQUIRY_PLATFORMS = ["Facebook", "TikTok", "Direct"] as const;

export const INQUIRY_STATUSES = ["New", "Replied", "Converted to Order", "Not interested"] as const;

export const COMPLIANCE_STATUSES = ["Not Started", "In Progress", "Completed"] as const;

export const UNIT_OPTIONS = ["kg", "tray", "sack", "piece"] as const;

// San Mateo, Rizal — default map center for the delivery location picker.
export const DEFAULT_MAP_CENTER: [number, number] = [14.6963, 121.1197];
