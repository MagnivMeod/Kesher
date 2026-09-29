import { describe, expect, it } from "vitest";
import { MAX_FAILED_VERIFICATIONS, OrderAccess } from "../src/safety/access";
import { FakeStore } from "../src/store/fake/FakeStore";

const store = new FakeStore();

describe("OrderAccess: customer verification", () => {
  it("finds the sender's own orders by email, newest first", async () => {
    const access = new OrderAccess(store, { email: "Michal.BD@hotmail.com" });
    const orders = await access.ordersForSender();
    expect(orders.map((o) => o.number)).toEqual(["1058", "1033"]);
    expect(access.verifiedOrderNumbers.sort()).toEqual(["1033", "1058"]);
  });

  it("finds the sender's own orders by phone in any format", async () => {
    const access = new OrderAccess(store, { phone: "+972 54-123-4567" });
    expect((await access.ordersForSender()).map((o) => o.number)).toEqual(["1042"]);
  });

  it("returns nothing for an unknown sender", async () => {
    const access = new OrderAccess(store, { email: "stranger@example.com" });
    expect(await access.ordersForSender()).toEqual([]);
  });

  it("gives the sender their own order by number without extra proof", async () => {
    const access = new OrderAccess(store, { email: "noa.cohen@gmail.com" });
    const r = await access.lookupByNumber("#1042");
    expect(r.status).toBe("verified");
  });

  it("refuses someone else's order when no proof is given", async () => {
    const access = new OrderAccess(store, { email: "noa.cohen@gmail.com" });
    expect((await access.lookupByNumber("1051")).status).toBe("not_verified");
    expect(access.getVerified("1051")).toBeUndefined();
  });

  it("accepts order number + matching last name", async () => {
    const access = new OrderAccess(store, { email: "dana.work@company.co.il" });
    const r = await access.lookupByNumber("1051", { lastName: "לוי" });
    expect(r).toMatchObject({ status: "verified", verifiedBy: "last_name" });
  });

  it("accepts order number + last 4 phone digits", async () => {
    const access = new OrderAccess(store, { email: "someone@else.com" });
    const r = await access.lookupByNumber("1049", { phoneLast4: "5566" });
    expect(r).toMatchObject({ status: "verified", verifiedBy: "phone_last4" });
  });

  it("rejects a wrong last name", async () => {
    const access = new OrderAccess(store, { email: "someone@else.com" });
    expect((await access.lookupByNumber("1040", { lastName: "כהן" })).status).toBe("not_verified");
  });

  it("answers a missing order exactly like an unverified one", async () => {
    const access = new OrderAccess(store, { email: "someone@else.com" });
    const missing = await access.lookupByNumber("9999", { lastName: "לוי" });
    const wrongProof = await access.lookupByNumber("1051", { lastName: "כהן" });
    expect(missing).toEqual(wrongProof);
  });

  it("locks after too many failed attempts, even for a correct guess afterwards", async () => {
    const access = new OrderAccess(store, { email: "attacker@example.com" });
    for (let i = 0; i < MAX_FAILED_VERIFICATIONS; i++) await access.lookupByNumber(String(1040 + i), { phoneLast4: "0000" });
    expect((await access.lookupByNumber("1051", { lastName: "לוי" })).status).toBe("locked");
  });
});
