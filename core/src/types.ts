/**
 * The shared vocabulary of Kesher's brain. Nothing here knows about Shopify,
 * email or WhatsApp: channels and stores are translated into these shapes.
 */

// ---------- Store data ----------

export type Money = { amount: number; currency: string };

export type Address = {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  zip?: string;
  country: string;
  phone?: string;
};

export type LineItem = {
  title: string;
  variant?: string; // e.g. "Black / M"
  quantity: number;
  price: Money;
};

export type Fulfillment = {
  status: "pending" | "in_transit" | "out_for_delivery" | "delivered" | "failure" | "unknown";
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string; // ISO date
  items: { title: string; quantity: number }[];
};

export type Order = {
  id: string;
  number: string; // what the customer sees, e.g. "1042"
  createdAt: string; // ISO date
  customer: { firstName: string; lastName: string; email?: string; phone?: string };
  financialStatus: "paid" | "pending" | "refunded" | "partially_refunded" | "voided";
  fulfillmentStatus: "unfulfilled" | "partially_fulfilled" | "fulfilled" | "cancelled";
  cancelledAt?: string;
  lineItems: LineItem[];
  total: Money;
  shippingAddress?: Address;
  shippingMethod?: string;
  fulfillments: Fulfillment[];
  note?: string;
};

export type TrackingEvent = { at: string; description: string; location?: string };

export type TrackingInfo = {
  carrier: string;
  trackingNumber: string;
  status: Fulfillment["status"];
  /** Only set when the carrier itself gave an estimate. Kesher never invents one. */
  estimatedDelivery?: string;
  events: TrackingEvent[];
  lastUpdatedAt?: string;
};

// ---------- Store settings (written by the owner) ----------

export type Language = "he" | "en";

export type StoreSettings = {
  storeName: string;
  /** The language the owner reads in the dashboard; used for summaries and escalation reasons. */
  ownerLanguage: Language;
  tone: "friendly" | "formal";
  /** Store policies in the owner's own words (returns, exchanges, shipping times...). */
  policies: string;
  /** Largest refund or compensation Kesher may mention without asking a human, in the store currency. 0 = never. */
  refundLimit: number;
  currency: string;
  /** Always send damaged / wrong / missing item reports to a human. */
  escalateDamagedItems: boolean;
  /** How replies are signed, e.g. "The Nola team". Optional. */
  signature?: string;
};

// ---------- Conversations ----------

export type Channel = "email" | "whatsapp";

/**
 * Who sent the message, as proven by the channel itself (the email envelope or the
 * WhatsApp phone number) - never taken from the message text, which anyone can type.
 */
export type SenderIdentity = {
  email?: string;
  phone?: string;
  displayName?: string;
};

export type ConversationMessage = {
  from: "customer" | "kesher" | "staff";
  text: string;
  at: string; // ISO date-time
};

export type Conversation = {
  id: string;
  channel: Channel;
  sender: SenderIdentity;
  subject?: string;
  /** Earlier messages, oldest first. */
  history: ConversationMessage[];
  /** The new customer message Kesher must handle now. */
  message: ConversationMessage;
};
