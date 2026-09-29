import { describe, expect, it } from "vitest";
import { runTool } from "../src/agent/tools";
import { OrderAccess } from "../src/safety/access";
import { FakeStore, FakeTracking } from "../src/store/fake/FakeStore";
import { nolaSettings } from "../src/store/fake/fixtures";

const ctxFor = (email: string) => ({ access: new OrderAccess(new FakeStore(), { email }), tracking: new FakeTracking(), settings: nolaSettings });

describe("tools", () => {
  it("find_orders with no arguments returns the sender's orders", async () => {
    const r = await runTool("find_orders", {}, ctxFor("noa.cohen@gmail.com"));
    expect(JSON.stringify(r.output)).toContain('"order_number":"1042"');
  });

  it("order details and tracking are refused until the order is verified", async () => {
    const ctx = ctxFor("noa.cohen@gmail.com");
    const details = await runTool("get_order_details", { order_number: "1051" }, ctx);
    const tracking = await runTool("get_tracking_status", { order_number: "1051" }, ctx);
    expect(details.isError).toBe(true);
    expect(tracking.isError).toBe(true);
    expect(JSON.stringify(details.output)).not.toContain("דנה");
  });

  it("tracking says honestly when the carrier has no data", async () => {
    const ctx = ctxFor("lior.sh@gmail.com");
    await runTool("find_orders", {}, ctx);
    const r = await runTool("get_tracking_status", { order_number: "1044" }, ctx);
    expect(JSON.stringify(r.output)).toContain("no tracking data");
    expect(JSON.stringify(r.output)).not.toContain("carrier_estimated_delivery");
  });

  it("tracking includes the carrier's estimate only when the carrier gave one", async () => {
    const ctx = ctxFor("hila.rosen@icloud.com");
    await runTool("find_orders", {}, ctx);
    const r = await runTool("get_tracking_status", { order_number: "1057" }, ctx);
    expect(JSON.stringify(r.output)).toContain('"carrier_estimated_delivery":"2026-10-01"');
  });

  it("finishing tools produce a decision", async () => {
    const r = await runTool("reply_to_customer", { message: "היי!", language: "he", summary: "שאלה" }, ctxFor("x@y.com"));
    expect(r.decision).toEqual({ action: "reply", message: "היי!", language: "he", summary: "שאלה" });
  });

  it("rejects malformed finishing input instead of guessing", async () => {
    const r = await runTool("escalate_to_human", { reason: "x" }, ctxFor("x@y.com"));
    expect(r.isError).toBe(true);
    expect(r.decision).toBeUndefined();
  });
});
