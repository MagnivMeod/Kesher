import type { Order } from "../types";

/**
 * The "plug" between Kesher's brain and a real store.
 * Today: FakeStore (test orders). Later: a Shopify implementation.
 *
 * These are raw lookups with no access control. The safety layer
 * (src/safety/access.ts) decides what the agent is allowed to see.
 */
export interface StoreData {
  /** Most recent first. */
  findOrdersByEmail(email: string, limit?: number): Promise<Order[]>;
  /** Most recent first. `phone` is already normalized (see normalizePhone). */
  findOrdersByPhone(phone: string, limit?: number): Promise<Order[]>;
  /** Accepts "1042" or "#1042". */
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
}
