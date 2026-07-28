function parseRupeeAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") {
    if (isNaN(val)) return 0;
    if (val > 0 && val < 100) return Math.round(val * 10000);
    return Math.round(val);
  }
  const str = String(val).trim();
  const cleaned = str.replace(/rs\.?/gi, "").replace(/₹/g, "").replace(/inr/gi, "").replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return 0;
  if (num < 100) return Math.round(num * 10000);
  return Math.round(num);
}

export function resolveBookingPricing({
  journey,
  departure,
  room,
  travellers,
  addons,
  coupon,
}: {
  journey: any;
  departure: any;
  room: any; // Room object from db or mapped object
  travellers: any[];
  addons: any[];
  coupon: any | null;
}) {
  // 1. Determine effective base price in whole Rupees
  const journeyPrice = parseRupeeAmount(journey?.starting_price ?? journey?.price) || 6499;
  let effectiveBasePrice = journeyPrice;

  if (departure) {
    const depPrice = parseRupeeAmount(departure.dynamic_price ?? departure.base_price ?? departure.basePrice ?? departure.price);
    if (depPrice > 0) {
      effectiveBasePrice = depPrice;
    }
  }

  // 2. Room Modifier
  let roomModifier = 0;
  if (room) {
    // If it's the mapped object with priceModifier
    if (typeof room.priceModifier === "number") {
      roomModifier = room.priceModifier;
    } 
    // If it's the raw DB object
    else if (room.sharing_type) {
      const st = room.sharing_type.toLowerCase();
      if (st.includes("double")) roomModifier = 800;
      else if (st.includes("triple")) roomModifier = 500;
    }
  }

  // 3. Travellers
  const travellersCount = Math.max(1, travellers?.length || 1);

  // 4. Addons
  const addonsTotal = (addons || []).reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);

  // 5. Subtotal
  const subtotal = (effectiveBasePrice + roomModifier) * travellersCount + addonsTotal;

  // 6. Coupon Discount
  let couponDiscount = 0;
  if (coupon) {
    if (coupon.discount_type === "PERCENTAGE" || coupon.discountType === "PERCENTAGE") {
      const discountVal = Number(coupon.discount_value || coupon.discountValue || 0);
      couponDiscount = Math.round((subtotal * discountVal) / 100);
      const maxDiscount = Number(coupon.max_discount_amount || coupon.maxDiscountAmount || 0);
      if (maxDiscount > 0 && couponDiscount > maxDiscount) {
        couponDiscount = maxDiscount;
      }
    } else if (coupon.discount_type === "FIXED" || coupon.discountType === "FIXED") {
      couponDiscount = Number(coupon.discount_value || coupon.discountValue || 0);
    } else if (typeof coupon.discount === "number") {
      // Legacy mapped coupon object
      couponDiscount = coupon.discount;
    }
  }

  // Cap discount to subtotal
  couponDiscount = Math.min(couponDiscount, subtotal);

  // 7. GST (5% on taxable amount)
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const gst = Math.round(taxableAmount * 0.05); // 5% GST

  // 8. Total
  const total = taxableAmount + gst;

  // 9. Deposit
  const deposit = 2000 * travellersCount;
  const remaining = Math.max(0, total - deposit);

  return {
    effectiveBasePrice,
    travellersCount,
    roomModifier,
    addonsTotal,
    couponDiscount,
    subtotal,        // pre-coupon, pre-GST
    payableBeforeGst: taxableAmount, // post-coupon, pre-GST — this is what the user pays (before GST)
    gst,
    total,           // post-coupon, post-GST — this is what Razorpay charges
    deposit,
    remaining
  };
}
