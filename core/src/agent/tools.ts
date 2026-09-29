import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { OrderAccess } from "../safety/access";
import type { TrackingProvider } from "../tracking/TrackingProvider";
import type { Order, StoreSettings } from "../types";

// ---------- What the tools may see (dependencies for one conversation) ----------

export type ToolContext = {
  access: OrderAccess;
  tracking: TrackingProvider;
  settings: StoreSettings;
};

// ---------- Final decisions ----------

export const ESCALATION_CATEGORIES = [
  "angry_or_legal",
  "refund_or_compensation",
  "damaged_wrong_or_missing",
  "action_request",
  "human_requested",
  "unclear_or_unsupported",
  "suspicious",
] as const;

const language = z.string().min(2).max(10);
const replyInput = z.object({ message: z.string().min(1), language, summary: z.string().min(1) });
const escalateInput = z.object({
  category: z.enum(ESCALATION_CATEGORIES),
  reason: z.string().min(1),
  customer_message: z.string().min(1),
  suggested_reply: z.string().min(1),
  language,
  summary: z.string().min(1),
});
const noReplyInput = z.object({ reason: z.string().min(1), summary: z.string().min(1) });

export type Decision =
  | { action: "reply"; message: string; language: string; summary: string }
  | {
      action: "escalate";
      category: (typeof ESCALATION_CATEGORIES)[number];
      reason: string;
      /** Sent to the customer right away (a polite "a team member will get back to you"). */
      customerMessage: string;
      /** The reply Kesher recommends the team send. */
      suggestedReply: string;
      language: string;
      summary: string;
    }
  | { action: "none"; reason: string; summary: string };

// ---------- Tool definitions shown to Claude ----------

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object" as const,
  properties,
  required,
  additionalProperties: false,
});
const str = (description: string) => ({ type: "string", description });

export const TOOL_DEFINITIONS: Anthropic.Beta.BetaTool[] = [
  {
    name: "find_orders",
    description:
      "Find orders for the person writing. With no arguments, returns their recent orders, matched to the email address or phone number the message came from (already verified). With order_number, looks up that one order; if it isn't the sender's own, pass the proof the customer gave (last_name or phone_last4). Orders that don't exist and orders that can't be verified return the same 'not_verified' answer.",
    input_schema: obj({
      order_number: str("Order number the customer mentioned, e.g. \"1042\" or \"#1042\"."),
      last_name: str("Last name the customer gave as proof of ownership."),
      phone_last4: str("Last 4 digits of the phone number on the order, as given by the customer."),
    }),
    strict: true,
  },
  {
    name: "get_order_details",
    description: "Full details of an order already returned by find_orders: items, sizes, prices, payment, shipping method and address, shipments.",
    input_schema: obj({ order_number: str("The order number.") }, ["order_number"]),
    strict: true,
  },
  {
    name: "get_tracking_status",
    description: "Live tracking from the carrier for each shipment of an order already returned by find_orders. Tells you honestly when the carrier has no data.",
    input_schema: obj({ order_number: str("The order number.") }, ["order_number"]),
    strict: true,
  },
  {
    name: "get_store_policies",
    description: "The store's policies in the owner's own words: shipping times, returns, exchanges, refunds, cancellations, service hours.",
    input_schema: obj({}),
    strict: true,
  },
  {
    name: "reply_to_customer",
    description: "Finish: send this reply to the customer (the store may review it first).",
    input_schema: obj(
      {
        message: str("The reply, in the customer's language, ready to send."),
        language: str("Language code of the reply, e.g. \"he\" or \"en\"."),
        summary: str("One short line for the store owner's inbox, in the owner's language."),
      },
      ["message", "language", "summary"],
    ),
    strict: true,
  },
  {
    name: "escalate_to_human",
    description: "Finish: hand the conversation to a person on the store's team. The customer immediately gets customer_message; the team gets the reason and suggested_reply.",
    input_schema: obj(
      {
        category: { type: "string", enum: [...ESCALATION_CATEGORIES], description: "Why a human is needed." },
        reason: str("One line for the team, in the owner's language."),
        customer_message: str("Short, warm message sent to the customer now, in their language, saying a team member will take it from here."),
        suggested_reply: str("The full reply you recommend the team send, in the customer's language, based on the facts you found."),
        language: str("Language code of the customer, e.g. \"he\" or \"en\"."),
        summary: str("One short line for the store owner's inbox, in the owner's language."),
      },
      ["category", "reason", "customer_message", "suggested_reply", "language", "summary"],
    ),
    strict: true,
  },
  {
    name: "no_reply_needed",
    description: "Finish without replying: automatic messages (out-of-office, delivery notifications), spam, or anything where a reply adds nothing.",
    input_schema: obj(
      {
        reason: str("Why no reply is needed, in the owner's language."),
        summary: str("One short line for the store owner's inbox, in the owner's language."),
      },
      ["reason", "summary"],
    ),
    strict: true,
  },
];

export const FINISHING_TOOLS = new Set(["reply_to_customer", "escalate_to_human", "no_reply_needed"]);

// ---------- Running the tools ----------

export type ToolOutcome = { output: unknown; isError?: boolean; decision?: Decision };

const orderNumberInput = z.object({ order_number: z.string().min(1) });
const findInput = z.object({
  order_number: z.string().optional(),
  last_name: z.string().optional(),
  phone_last4: z.string().optional(),
});

export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<ToolOutcome> {
  switch (name) {
    case "find_orders": {
      const p = findInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const { order_number, last_name, phone_last4 } = p.data;
      if (!order_number) {
        if (!ctx.access.hasSenderIdentity) return { output: { orders: [], note: "The sender's email/phone is unknown, so orders can only be found by order number plus proof." } };
        const orders = await ctx.access.ordersForSender();
        return { output: orders.length ? { orders: orders.map(orderSummary) } : { orders: [], note: "No orders found for the sender's email address or phone number." } };
      }
      const r = await ctx.access.lookupByNumber(order_number, { lastName: last_name, phoneLast4: phone_last4 });
      if (r.status === "verified") return { output: { orders: [orderSummary(r.order)] } };
      if (r.status === "locked")
        return { output: { result: "locked", note: "Too many failed verification attempts in this conversation. Don't look up more orders; escalate to a human." } };
      return {
        output: {
          result: "not_verified",
          note: "No order could be verified with these details: it may not exist, or the proof doesn't match. Don't tell the customer which. Ask them to check the order number and give the last name or the last 4 digits of the phone number on the order.",
        },
      };
    }

    case "get_order_details": {
      const p = orderNumberInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const order = ctx.access.getVerified(p.data.order_number);
      if (!order) return notAvailable();
      return { output: orderDetails(order) };
    }

    case "get_tracking_status": {
      const p = orderNumberInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const order = ctx.access.getVerified(p.data.order_number);
      if (!order) return notAvailable();
      if (order.fulfillments.length === 0)
        return { output: { order_number: order.number, shipments: [], note: order.fulfillmentStatus === "cancelled" ? "The order was cancelled." : "Nothing has shipped yet for this order." } };
      const shipments = await Promise.all(
        order.fulfillments.map(async (f) => {
          const base = { carrier: f.carrier, tracking_number: f.trackingNumber, tracking_url: f.trackingUrl, shipped_at: f.shippedAt, items: f.items };
          if (!f.trackingNumber) return { ...base, tracking: "No tracking number on this shipment." };
          const t = await ctx.tracking.track(f.carrier, f.trackingNumber);
          if (!t) return { ...base, status_in_store: f.status, tracking: "The carrier has no tracking data for this number right now." };
          return {
            ...base,
            status: t.status,
            ...(t.estimatedDelivery ? { carrier_estimated_delivery: t.estimatedDelivery } : {}),
            last_update: t.lastUpdatedAt,
            recent_events: t.events.slice(-5),
          };
        }),
      );
      return { output: { order_number: order.number, shipments } };
    }

    case "get_store_policies":
      return { output: { store: ctx.settings.storeName, policies: ctx.settings.policies || "The store hasn't written any policies yet." } };

    case "reply_to_customer": {
      const p = replyInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      return { output: "ok", decision: { action: "reply", ...p.data } };
    }

    case "escalate_to_human": {
      const p = escalateInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      const d = p.data;
      return {
        output: "ok",
        decision: { action: "escalate", category: d.category, reason: d.reason, customerMessage: d.customer_message, suggestedReply: d.suggested_reply, language: d.language, summary: d.summary },
      };
    }

    case "no_reply_needed": {
      const p = noReplyInput.safeParse(input);
      if (!p.success) return invalid(p.error);
      return { output: "ok", decision: { action: "none", ...p.data } };
    }

    default:
      return { output: `Unknown tool "${name}".`, isError: true };
  }
}

const invalid = (error: z.ZodError): ToolOutcome => ({ output: `Invalid input: ${z.prettifyError(error)}`, isError: true });
const notAvailable = (): ToolOutcome => ({
  output: "This order isn't available in this conversation. Use find_orders first; orders are only available once they are matched to this customer.",
  isError: true,
});

// ---------- How orders are shown to Claude ----------

const itemLine = (i: Order["lineItems"][number]) => `${i.title}${i.variant ? ` (${i.variant})` : ""} x${i.quantity}`;

function orderSummary(o: Order) {
  return {
    order_number: o.number,
    placed_at: o.createdAt,
    items: o.lineItems.map(itemLine),
    payment: o.financialStatus,
    fulfillment: o.fulfillmentStatus,
    ...(o.cancelledAt ? { cancelled_at: o.cancelledAt } : {}),
    shipments: o.fulfillments.map((f) => ({ status_in_store: f.status, carrier: f.carrier, shipped_at: f.shippedAt })),
  };
}

function orderDetails(o: Order) {
  return {
    order_number: o.number,
    placed_at: o.createdAt,
    customer_first_name: o.customer.firstName,
    items: o.lineItems.map((i) => ({ title: i.title, variant: i.variant, quantity: i.quantity, unit_price: `${i.price.amount} ${i.price.currency}` })),
    total: `${o.total.amount} ${o.total.currency}`,
    payment: o.financialStatus,
    fulfillment: o.fulfillmentStatus,
    ...(o.cancelledAt ? { cancelled_at: o.cancelledAt } : {}),
    shipping_method: o.shippingMethod,
    shipping_address: o.shippingAddress ? `${o.shippingAddress.address1}${o.shippingAddress.address2 ? ", " + o.shippingAddress.address2 : ""}, ${o.shippingAddress.city}` : undefined,
    shipments: o.fulfillments.map((f) => ({ status_in_store: f.status, carrier: f.carrier, tracking_number: f.trackingNumber, tracking_url: f.trackingUrl, shipped_at: f.shippedAt, items: f.items })),
  };
}
