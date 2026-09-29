import { cleanOrderNumber } from "../../safety/access";
import { normalizeEmail, normalizePhone } from "../../safety/identity";
import type { TrackingProvider } from "../../tracking/TrackingProvider";
import type { Order, TrackingInfo } from "../../types";
import type { StoreData } from "../StoreData";
import { nolaOrders, nolaTracking } from "./fixtures";

const newestFirst = (a: Order, b: Order) => b.createdAt.localeCompare(a.createdAt);

/** An in-memory store for tests and the evaluation. */
export class FakeStore implements StoreData {
  constructor(private readonly orders: Order[] = nolaOrders) {}

  async findOrdersByEmail(email: string, limit = 5): Promise<Order[]> {
    const e = normalizeEmail(email);
    return this.orders.filter((o) => e && normalizeEmail(o.customer.email) === e).sort(newestFirst).slice(0, limit);
  }

  async findOrdersByPhone(phone: string, limit = 5): Promise<Order[]> {
    const p = normalizePhone(phone);
    return this.orders
      .filter((o) => p && [o.customer.phone, o.shippingAddress?.phone].map(normalizePhone).includes(p))
      .sort(newestFirst)
      .slice(0, limit);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const n = cleanOrderNumber(orderNumber);
    return this.orders.find((o) => o.number === n);
  }
}

/** A tracking service that answers from a fixed table. */
export class FakeTracking implements TrackingProvider {
  constructor(private readonly table: Record<string, TrackingInfo> = nolaTracking) {}

  async track(_carrier: string | undefined, trackingNumber: string): Promise<TrackingInfo | undefined> {
    return this.table[trackingNumber];
  }
}
