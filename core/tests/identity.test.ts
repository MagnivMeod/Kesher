import { describe, expect, it } from "vitest";
import { lastDigits, normalizeEmail, normalizeName, normalizePhone } from "../src/safety/identity";

describe("normalizePhone", () => {
  it.each([
    ["054-1234567", "+972541234567"],
    ["0541234567", "+972541234567"],
    ["+972 54-123-4567", "+972541234567"],
    ["972541234567", "+972541234567"],
    ["00972541234567", "+972541234567"],
    ["+972 054 1234567", "+972541234567"],
    ["541234567", "+972541234567"],
    ["03-1234567", "+97231234567"],
    ["+1 (415) 555-0100", "+14155550100"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("rejects junk", () => {
    expect(normalizePhone("")).toBeUndefined();
    expect(normalizePhone("abc")).toBeUndefined();
    expect(normalizePhone("123")).toBeUndefined();
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => expect(normalizeEmail("  Noa.Cohen@Gmail.COM ")).toBe("noa.cohen@gmail.com"));
  it("rejects non-emails", () => expect(normalizeEmail("noa")).toBeUndefined());
});

describe("normalizeName", () => {
  it("ignores case, punctuation and niqqud", () => {
    expect(normalizeName("  Ben-David ")).toBe("ben david");
    expect(normalizeName("כֹּהֵן")).toBe("כהן");
  });
});

describe("lastDigits", () => {
  it("takes the last 4 digits", () => expect(lastDigits("054-123-4567")).toBe("4567"));
});
