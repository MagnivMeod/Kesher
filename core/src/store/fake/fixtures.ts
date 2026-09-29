import type { Order, StoreSettings, TrackingInfo } from "../../types";

/**
 * A made-up Israeli clothing boutique, "Nola", used for testing Kesher's brain
 * without a real store. Every person and order here is fictional.
 *
 * "Today" in this test world is Tuesday 29 September 2026.
 */
export const FAKE_NOW = "2026-09-29T10:00:00+03:00";

export const nolaSettings: StoreSettings = {
  storeName: "Nola",
  ownerLanguage: "he",
  tone: "friendly",
  currency: "ILS",
  refundLimit: 0,
  escalateDamagedItems: true,
  signature: "צוות Nola",
  policies: `משלוחים:
- הזמנות יוצאות מהמחסן תוך 1–2 ימי עסקים.
- דואר ישראל (רשום): 3–7 ימי עסקים מרגע המשלוח. משלוח חינם מעל 250 ₪.
- שליח עד הבית (HFD / צ'יטה): 1–3 ימי עסקים מרגע המשלוח, 29.90 ₪.
- כמה פריטים מגיעים מספק בחו"ל ומסומנים באתר "משלוח מחו"ל": 14–30 ימי עסקים.

החזרות והחלפות:
- אפשר להחזיר או להחליף תוך 14 יום מקבלת ההזמנה, כשהפריט לא נלבש ועם התוויות.
- החלפת מידה ראשונה בחינם (אנחנו שולחים שליח). החזרה רגילה: דמי משלוח החזרה על הלקוח.
- פריט פגום או פריט שגוי: אנחנו מטפלים בזה מיד ועל חשבוננו, צריך רק תמונה.
- החזר כספי חוזר לאמצעי התשלום המקורי תוך 7 ימי עסקים מרגע שהפריט הגיע אלינו.
- פריטים במבצע סוף עונה: אפשר להחליף, אי אפשר לקבל החזר כספי.
- לפתיחת החזרה צריך לכתוב לנו מה מחזירים ולמה, ואנחנו שולחים הוראות.

שינויים וביטולים:
- שינוי כתובת או ביטול אפשריים רק לפני שההזמנה נשלחה.

שירות לקוחות: ראשון–חמישי 9:00–17:00. אנחנו עונים באימייל ובוואטסאפ.`,
};

const ils = (amount: number) => ({ amount, currency: "ILS" });

export const nolaOrders: Order[] = [
  // Noa: ordered a week ago, shipped by Israel Post, sitting at a sorting center.
  {
    id: "o1042", number: "1042", createdAt: "2026-09-22T20:14:00+03:00",
    customer: { firstName: "נועה", lastName: "כהן", email: "noa.cohen@gmail.com", phone: "054-1234567" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "שמלת מידי ירוקה", variant: "S", quantity: 1, price: ils(289) }],
    total: ils(289),
    shippingAddress: { name: "נועה כהן", address1: "סוקולוב 45 דירה 12", city: "חולון", zip: "5832513", country: "IL", phone: "054-1234567" },
    shippingMethod: "דואר ישראל רשום",
    fulfillments: [{ status: "in_transit", carrier: "Israel Post", trackingNumber: "RR123456789IL", trackingUrl: "https://israelpost.co.il/itemtrace?itemcode=RR123456789IL", shippedAt: "2026-09-23T12:00:00+03:00", items: [{ title: "שמלת מידי ירוקה", quantity: 1 }] }],
  },
  // Dana: ordered a shirt in M, got L, has an event on Friday.
  {
    id: "o1051", number: "1051", createdAt: "2026-09-24T09:30:00+03:00",
    customer: { firstName: "דנה", lastName: "לוי", email: "dana.levi88@walla.co.il", phone: "052-9876543" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "חולצת פשתן לבנה", variant: "M", quantity: 1, price: ils(219) }],
    total: ils(248.9),
    shippingAddress: { name: "דנה לוי", address1: "דיזנגוף 180", city: "תל אביב", zip: "6346210", country: "IL", phone: "052-9876543" },
    shippingMethod: "שליח HFD",
    fulfillments: [{ status: "delivered", carrier: "HFD", trackingNumber: "HFD7788123", shippedAt: "2026-09-24T16:00:00+03:00", items: [{ title: "חולצת פשתן לבנה", quantity: 1 }] }],
  },
  // Yossi: black hoodie, ordered yesterday, not shipped yet (address change still possible).
  {
    id: "o1055", number: "1055", createdAt: "2026-09-28T22:05:00+03:00",
    customer: { firstName: "Yossi", lastName: "Mizrahi", email: "yossi.m@gmail.com", phone: "050-5551212" },
    financialStatus: "paid", fulfillmentStatus: "unfulfilled",
    lineItems: [{ title: "קפוצ'ון אוברסייז", variant: "שחור / L", quantity: 1, price: ils(259) }],
    total: ils(259),
    shippingAddress: { name: "Yossi Mizrahi", address1: "הרצל 12", city: "חיפה", zip: "3303312", country: "IL", phone: "050-5551212" },
    shippingMethod: "דואר ישראל רשום",
    fulfillments: [],
  },
  // Michal: two orders (an old delivered one and a new one), for "and the other one?".
  {
    id: "o1033", number: "1033", createdAt: "2026-09-10T11:00:00+03:00",
    customer: { firstName: "מיכל", lastName: "בן דוד", email: "michal.bd@hotmail.com", phone: "058-7003344" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "ג'ינס גבוה", variant: "28", quantity: 1, price: ils(329) }],
    total: ils(329),
    shippingAddress: { name: "מיכל בן דוד", address1: "עמק רפאים 30", city: "ירושלים", zip: "9310520", country: "IL", phone: "058-7003344" },
    shippingMethod: "שליח צ'יטה",
    fulfillments: [{ status: "delivered", carrier: "Cheetah", trackingNumber: "CH55012", shippedAt: "2026-09-13T10:00:00+03:00", items: [{ title: "ג'ינס גבוה", quantity: 1 }] }],
  },
  {
    id: "o1058", number: "1058", createdAt: "2026-09-27T18:40:00+03:00",
    customer: { firstName: "מיכל", lastName: "בן דוד", email: "michal.bd@hotmail.com", phone: "058-7003344" },
    financialStatus: "paid", fulfillmentStatus: "unfulfilled",
    lineItems: [
      { title: "טי-שירט בייסיק", variant: "לבן / S", quantity: 2, price: ils(79) },
      { title: "צעיף צמר", variant: "בז'", quantity: 1, price: ils(149) },
    ],
    total: ils(307),
    shippingAddress: { name: "מיכל בן דוד", address1: "עמק רפאים 30", city: "ירושלים", zip: "9310520", country: "IL", phone: "058-7003344" },
    shippingMethod: "שליח צ'יטה",
    fulfillments: [],
  },
  // Avi: an item shipped from abroad a month ago, tracking has been quiet for 12 days.
  {
    id: "o1019", number: "1019", createdAt: "2026-08-30T15:20:00+03:00",
    customer: { firstName: "Avi", lastName: "Peretz", email: "avi.peretz@yahoo.com", phone: "053-2224466" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "תיק צד קלוע (משלוח מחו\"ל)", variant: "חום", quantity: 1, price: ils(139) }],
    total: ils(139),
    shippingAddress: { name: "Avi Peretz", address1: "רגר 50", city: "באר שבע", zip: "8410501", country: "IL", phone: "053-2224466" },
    shippingMethod: "משלוח מחו\"ל",
    fulfillments: [{ status: "in_transit", carrier: "Cainiao", trackingNumber: "LP00987654321CN", shippedAt: "2026-09-02T08:00:00+03:00", items: [{ title: "תיק צד קלוע", quantity: 1 }] }],
  },
  // Shira: marked delivered to a parcel locker, she says it never arrived.
  {
    id: "o1047", number: "1047", createdAt: "2026-09-20T13:00:00+03:00",
    customer: { firstName: "שירה", lastName: "כץ", email: "shira.katz@gmail.com", phone: "054-3332211" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "סוודר סרוג", variant: "קרם / M", quantity: 1, price: ils(279) }],
    total: ils(279),
    shippingAddress: { name: "שירה כץ", address1: "ביאליק 8", city: "רמת גן", zip: "5245108", country: "IL", phone: "054-3332211" },
    shippingMethod: "דואר ישראל רשום",
    fulfillments: [{ status: "delivered", carrier: "Israel Post", trackingNumber: "RR555666777IL", shippedAt: "2026-09-21T11:00:00+03:00", items: [{ title: "סוודר סרוג", quantity: 1 }] }],
  },
  // Omer: ordered this morning.
  {
    id: "o1060", number: "1060", createdAt: "2026-09-29T08:12:00+03:00",
    customer: { firstName: "עומר", lastName: "פרידמן", email: "omer.fr@gmail.com", phone: "052-1112233" },
    financialStatus: "paid", fulfillmentStatus: "unfulfilled",
    lineItems: [{ title: "מכנסי פשתן", variant: "כחול / 32", quantity: 1, price: ils(239) }],
    total: ils(239),
    shippingAddress: { name: "עומר פרידמן", address1: "שד' בנימין 20", city: "נתניה", zip: "4236220", country: "IL", phone: "052-1112233" },
    shippingMethod: "שליח HFD",
    fulfillments: [],
  },
  // Tamar: delivered 9 days ago, may want to return (within 14 days).
  {
    id: "o1038", number: "1038", createdAt: "2026-09-16T10:00:00+03:00",
    customer: { firstName: "תמר", lastName: "אזולאי", email: "tamar.az@gmail.com", phone: "050-8889990" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "שמלת קיץ פרחונית", variant: "M", quantity: 1, price: ils(199) }],
    total: ils(199),
    shippingAddress: { name: "תמר אזולאי", address1: "רוגוזין 3", city: "אשדוד", zip: "7720103", country: "IL", phone: "050-8889990" },
    shippingMethod: "דואר ישראל רשום",
    fulfillments: [{ status: "delivered", carrier: "Israel Post", trackingNumber: "RR222333444IL", shippedAt: "2026-09-17T12:00:00+03:00", items: [{ title: "שמלת קיץ פרחונית", quantity: 1 }] }],
  },
  // Lior: shipped with HFD but the tracking service has no data (honesty test).
  {
    id: "o1044", number: "1044", createdAt: "2026-09-23T17:45:00+03:00",
    customer: { firstName: "ליאור", lastName: "שפירא", email: "lior.sh@gmail.com", phone: "054-6667788" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "חגורת עור", variant: "שחור", quantity: 1, price: ils(119) }],
    total: ils(148.9),
    shippingAddress: { name: "ליאור שפירא", address1: "ויצמן 100", city: "כפר סבא", zip: "4435100", country: "IL", phone: "054-6667788" },
    shippingMethod: "שליח HFD",
    fulfillments: [{ status: "unknown", carrier: "HFD", trackingNumber: "HFD9900001", shippedAt: "2026-09-25T09:00:00+03:00", items: [{ title: "חגורת עור", quantity: 1 }] }],
  },
  // Rachel: English speaker, out for delivery today with Cheetah.
  {
    id: "o1049", number: "1049", createdAt: "2026-09-24T21:00:00+03:00",
    customer: { firstName: "Rachel", lastName: "Goldberg", email: "rachel.goldberg@gmail.com", phone: "+972 52-444-5566" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [
      { title: "Linen shirt", variant: "Sand / L", quantity: 1, price: ils(219) },
      { title: "Wool scarf", variant: "Grey", quantity: 1, price: ils(149) },
    ],
    total: ils(368),
    shippingAddress: { name: "Rachel Goldberg", address1: "Emek Dotan 15", city: "Modiin", zip: "7178515", country: "IL", phone: "+972 52-444-5566" },
    shippingMethod: "Cheetah courier",
    fulfillments: [{ status: "out_for_delivery", carrier: "Cheetah", trackingNumber: "CH77120", shippedAt: "2026-09-27T09:00:00+03:00", items: [{ title: "Linen shirt", quantity: 1 }, { title: "Wool scarf", quantity: 1 }] }],
  },
  // David: order cancelled and refunded.
  {
    id: "o1030", number: "1030", createdAt: "2026-09-08T12:00:00+03:00",
    customer: { firstName: "דוד", lastName: "אמסלם", email: "david.ams@gmail.com", phone: "052-3334455" },
    financialStatus: "refunded", fulfillmentStatus: "cancelled", cancelledAt: "2026-09-12T10:00:00+03:00",
    lineItems: [{ title: "ז'קט ג'ינס", variant: "L", quantity: 1, price: ils(349) }],
    total: ils(349),
    shippingAddress: { name: "דוד אמסלם", address1: "הרצל 70", city: "ראשון לציון", zip: "7526570", country: "IL", phone: "052-3334455" },
    shippingMethod: "שליח HFD",
    fulfillments: [],
    note: "בוטל לבקשת הלקוח, החזר מלא בוצע ב-12.9",
  },
  // Yael: one item shipped, one still waiting in the warehouse.
  {
    id: "o1053", number: "1053", createdAt: "2026-09-25T14:10:00+03:00",
    customer: { firstName: "יעל", lastName: "חדד", email: "yael.h@gmail.com", phone: "058-2223344" },
    financialStatus: "paid", fulfillmentStatus: "partially_fulfilled",
    lineItems: [
      { title: "חולצת פשתן לבנה", variant: "S", quantity: 1, price: ils(219) },
      { title: "מעיל טרנץ'", variant: "בז' / S", quantity: 1, price: ils(489) },
    ],
    total: ils(708),
    shippingAddress: { name: "יעל חדד", address1: "רוטשילד 40", city: "פתח תקווה", zip: "4942440", country: "IL", phone: "058-2223344" },
    shippingMethod: "דואר ישראל רשום",
    fulfillments: [{ status: "in_transit", carrier: "Israel Post", trackingNumber: "RR888999000IL", shippedAt: "2026-09-27T10:00:00+03:00", items: [{ title: "חולצת פשתן לבנה", quantity: 1 }] }],
  },
  // Moshe: shares a last name with Dana, to test that last-name proof only works for the right order.
  {
    id: "o1040", number: "1040", createdAt: "2026-09-18T19:00:00+03:00",
    customer: { firstName: "משה", lastName: "לוי", email: "moshe.levi@gmail.com", phone: "050-1231234" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "טי-שירט בייסיק", variant: "שחור / XL", quantity: 3, price: ils(79) }],
    total: ils(237),
    shippingAddress: { name: "משה לוי", address1: "הרצל 150", city: "רחובות", zip: "7626150", country: "IL", phone: "050-1231234" },
    shippingMethod: "דואר ישראל רשום",
    fulfillments: [{ status: "delivered", carrier: "Israel Post", trackingNumber: "RR101010101IL", shippedAt: "2026-09-19T12:00:00+03:00", items: [{ title: "טי-שירט בייסיק", quantity: 3 }] }],
  },
  // Hila: in transit with HFD, carrier gave an estimated delivery date.
  {
    id: "o1057", number: "1057", createdAt: "2026-09-26T16:30:00+03:00",
    customer: { firstName: "הילה", lastName: "רוזן", email: "hila.rosen@icloud.com", phone: "054-9990001" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "סריג וי", variant: "ירוק זית / M", quantity: 1, price: ils(229) }],
    total: ils(258.9),
    shippingAddress: { name: "הילה רוזן", address1: "העצמאות 25", city: "אשקלון", zip: "7845125", country: "IL", phone: "054-9990001" },
    shippingMethod: "שליח HFD",
    fulfillments: [{ status: "in_transit", carrier: "HFD", trackingNumber: "HFD7788990", shippedAt: "2026-09-28T09:00:00+03:00", items: [{ title: "סריג וי", quantity: 1 }] }],
  },
  // Eli: item arrived torn, very angry.
  {
    id: "o1036", number: "1036", createdAt: "2026-09-14T09:00:00+03:00",
    customer: { firstName: "אלי", lastName: "אוחיון", email: "eli.ohayon@gmail.com", phone: "052-7778899" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "ז'קט עור טבעוני", variant: "שחור / L", quantity: 1, price: ils(459) }],
    total: ils(459),
    shippingAddress: { name: "אלי אוחיון", address1: "הנביאים 5", city: "טבריה", zip: "1420105", country: "IL", phone: "052-7778899" },
    shippingMethod: "שליח HFD",
    fulfillments: [{ status: "delivered", carrier: "HFD", trackingNumber: "HFD6655443", shippedAt: "2026-09-15T09:00:00+03:00", items: [{ title: "ז'קט עור טבעוני", quantity: 1 }] }],
  },
  // Gal: delivered 3 days ago, wants money back.
  {
    id: "o1050", number: "1050", createdAt: "2026-09-23T11:11:00+03:00",
    customer: { firstName: "גל", lastName: "צור", email: "gal.tzur@gmail.com", phone: "053-4445566" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "מעיל טרנץ'", variant: "שחור / M", quantity: 1, price: ils(489) }],
    total: ils(489),
    shippingAddress: { name: "גל צור", address1: "הגפן 7", city: "זכרון יעקב", zip: "3095007", country: "IL", phone: "053-4445566" },
    shippingMethod: "שליח צ'יטה",
    fulfillments: [{ status: "delivered", carrier: "Cheetah", trackingNumber: "CH80001", shippedAt: "2026-09-24T09:00:00+03:00", items: [{ title: "מעיל טרנץ'", quantity: 1 }] }],
  },
  // Ben: English speaker, sale item (exchange only), delivered 5 days ago.
  {
    id: "o1045", number: "1045", createdAt: "2026-09-21T20:20:00+03:00",
    customer: { firstName: "Ben", lastName: "Carter", email: "ben.carter@outlook.com", phone: "054-2020202" },
    financialStatus: "paid", fulfillmentStatus: "fulfilled",
    lineItems: [{ title: "End-of-season sale: Denim jacket", variant: "Blue / M", quantity: 1, price: ils(199) }],
    total: ils(228.9),
    shippingAddress: { name: "Ben Carter", address1: "Ahad Ha'am 60", city: "Tel Aviv", zip: "6520260", country: "IL", phone: "054-2020202" },
    shippingMethod: "HFD courier",
    fulfillments: [{ status: "delivered", carrier: "HFD", trackingNumber: "HFD1212121", shippedAt: "2026-09-22T09:00:00+03:00", items: [{ title: "Denim jacket", quantity: 1 }] }],
  },
];

/** What the fake tracking service knows. A missing number means "no data from the carrier". */
export const nolaTracking: Record<string, TrackingInfo> = {
  RR123456789IL: {
    carrier: "Israel Post", trackingNumber: "RR123456789IL", status: "in_transit",
    events: [
      { at: "2026-09-23T15:10:00+03:00", description: "הפריט התקבל ביחידת דואר", location: "תל אביב" },
      { at: "2026-09-24T06:40:00+03:00", description: "הפריט במיון", location: "מרכז מיון חולון" },
      { at: "2026-09-27T11:20:00+03:00", description: "הפריט בדרך ליחידת החלוקה", location: "מרכז מיון חולון" },
    ],
    lastUpdatedAt: "2026-09-27T11:20:00+03:00",
  },
  HFD7788123: {
    carrier: "HFD", trackingNumber: "HFD7788123", status: "delivered",
    events: [
      { at: "2026-09-24T16:30:00+03:00", description: "Picked up from sender" },
      { at: "2026-09-25T13:05:00+03:00", description: "Delivered to recipient", location: "Tel Aviv" },
    ],
    lastUpdatedAt: "2026-09-25T13:05:00+03:00",
  },
  CH55012: {
    carrier: "Cheetah", trackingNumber: "CH55012", status: "delivered",
    events: [{ at: "2026-09-14T12:00:00+03:00", description: "נמסר ללקוח", location: "ירושלים" }],
    lastUpdatedAt: "2026-09-14T12:00:00+03:00",
  },
  LP00987654321CN: {
    carrier: "Cainiao", trackingNumber: "LP00987654321CN", status: "in_transit",
    events: [
      { at: "2026-09-02T18:00:00+08:00", description: "Accepted by carrier", location: "Guangzhou, CN" },
      { at: "2026-09-06T03:00:00+08:00", description: "Departed from origin country", location: "Guangzhou, CN" },
      { at: "2026-09-17T09:30:00+03:00", description: "Arrived at destination country, handed to Israel Post", location: "Ben Gurion Airport, IL" },
    ],
    lastUpdatedAt: "2026-09-17T09:30:00+03:00",
  },
  RR555666777IL: {
    carrier: "Israel Post", trackingNumber: "RR555666777IL", status: "delivered",
    events: [
      { at: "2026-09-21T14:00:00+03:00", description: "הפריט התקבל ביחידת דואר", location: "תל אביב" },
      { at: "2026-09-24T10:00:00+03:00", description: "הפריט הופקד בלוקר למסירה עצמית", location: "לוקר דואר, ביאליק רמת גן" },
      { at: "2026-09-24T18:45:00+03:00", description: "הפריט נמסר", location: "לוקר דואר, ביאליק רמת גן" },
    ],
    lastUpdatedAt: "2026-09-24T18:45:00+03:00",
  },
  RR222333444IL: {
    carrier: "Israel Post", trackingNumber: "RR222333444IL", status: "delivered",
    events: [{ at: "2026-09-20T12:00:00+03:00", description: "הפריט נמסר לנמען", location: "אשדוד" }],
    lastUpdatedAt: "2026-09-20T12:00:00+03:00",
  },
  CH77120: {
    carrier: "Cheetah", trackingNumber: "CH77120", status: "out_for_delivery",
    estimatedDelivery: "2026-09-29",
    events: [
      { at: "2026-09-27T10:00:00+03:00", description: "Picked up" },
      { at: "2026-09-29T07:30:00+03:00", description: "Out for delivery with courier", location: "Modiin" },
    ],
    lastUpdatedAt: "2026-09-29T07:30:00+03:00",
  },
  RR888999000IL: {
    carrier: "Israel Post", trackingNumber: "RR888999000IL", status: "in_transit",
    events: [
      { at: "2026-09-27T14:00:00+03:00", description: "הפריט התקבל ביחידת דואר", location: "תל אביב" },
      { at: "2026-09-28T08:00:00+03:00", description: "הפריט במיון", location: "מרכז מיון חולון" },
    ],
    lastUpdatedAt: "2026-09-28T08:00:00+03:00",
  },
  RR101010101IL: {
    carrier: "Israel Post", trackingNumber: "RR101010101IL", status: "delivered",
    events: [{ at: "2026-09-22T11:00:00+03:00", description: "הפריט נמסר לנמען", location: "רחובות" }],
    lastUpdatedAt: "2026-09-22T11:00:00+03:00",
  },
  HFD7788990: {
    carrier: "HFD", trackingNumber: "HFD7788990", status: "in_transit",
    estimatedDelivery: "2026-10-01",
    events: [
      { at: "2026-09-28T09:30:00+03:00", description: "Picked up from sender" },
      { at: "2026-09-28T20:00:00+03:00", description: "At distribution hub", location: "Ashdod hub" },
    ],
    lastUpdatedAt: "2026-09-28T20:00:00+03:00",
  },
  HFD6655443: {
    carrier: "HFD", trackingNumber: "HFD6655443", status: "delivered",
    events: [{ at: "2026-09-16T12:00:00+03:00", description: "Delivered to recipient", location: "Tiberias" }],
    lastUpdatedAt: "2026-09-16T12:00:00+03:00",
  },
  CH80001: {
    carrier: "Cheetah", trackingNumber: "CH80001", status: "delivered",
    events: [{ at: "2026-09-26T15:00:00+03:00", description: "נמסר ללקוח", location: "זכרון יעקב" }],
    lastUpdatedAt: "2026-09-26T15:00:00+03:00",
  },
  HFD1212121: {
    carrier: "HFD", trackingNumber: "HFD1212121", status: "delivered",
    events: [{ at: "2026-09-24T11:00:00+03:00", description: "Delivered to recipient", location: "Tel Aviv" }],
    lastUpdatedAt: "2026-09-24T11:00:00+03:00",
  },
  // HFD9900001 (Lior) is deliberately missing: the carrier has no data.
};
