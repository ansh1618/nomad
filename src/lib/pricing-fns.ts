/**
 * pricing-fns.ts
 *
 * Booking price calculation logic.
 *
 * IMPORTANT:
 * - accommodationPrice MUST come from journey_accommodation_prices table
 *   (keyed by journey_id + accommodation_type)
 * - hotel_rooms.price_modifier is NOT used for selling price
 * - No starting_price + offset fallbacks
 *
 * If accommodationPrice is null/undefined, callers MUST reject the booking
 * rather than inventing a price.
 */

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

/**
 * Resolve booking pricing given authoritative inputs.
 *
 * `room.price` MUST already contain the journey-scoped price from
 * journey_accommodation_prices. If the caller provides null/0, pricing
 * will use the journey base price (which is correct only if accommodation
 * selection was skipped).
 *
 * The booking engine (booking-fns.ts) is responsible for doing the
 * server-side DB lookup before calling this function.
 */
export function resolveBookingPricing({
  journey,
  departure,
  room,
  travellers,
  addons = [],
  coupon,
  studentOffer,
}: {
  journey: any;
  departure: any;
  room: any; // Must have room.price = authoritative price from journey_accommodation_prices
  travellers: any[];
  addons: any[];
  coupon: any | null;
  studentOffer?: {
    isApplied: boolean;
    discountPercentage: number;
    allowCouponStacking?: boolean;
  } | null;
}) {
  // 1. Journey base price (fallback reference — not used for accommodation pricing)
  const journeyPrice = parseRupeeAmount(journey?.starting_price ?? journey?.price) || 6500;
  let journeyBase = journeyPrice;

  if (departure) {
    const depPrice = parseRupeeAmount(departure.dynamic_price ?? departure.base_price ?? departure.basePrice ?? departure.price);
    if (depPrice > 0) {
      journeyBase = depPrice;
    }
  }

  // 2. Accommodation price — MUST come from journey_accommodation_prices
  //    via the server-side resolver before this function is called.
  //    room.price = the authoritative per-person price for this journey+type.
  let accommodationPrice = journeyBase;

  if (room) {
    // Primary: use room.price which should be the authoritative DB price
    const directPrice = parseRupeeAmount(room.price ?? room.totalPrice ?? room.accommodationPrice);

    if (directPrice >= 100) {
      // Authoritative absolute price (from journey_accommodation_prices)
      accommodationPrice = directPrice;
    }
    // NOTE: We do NOT fall back to starting_price offsets or price_modifier.
    // If directPrice is 0/missing, the caller should have rejected the booking first.
  }

  const roomModifier = 0;
  const effectiveBasePrice = accommodationPrice;
  const travellersCount = Math.max(1, travellers?.length || 1);
  const roomTotal = accommodationPrice * travellersCount;
  const addonsTotal = (addons || []).reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);

  // Gross total before discounts
  const grossSubtotal = roomTotal + addonsTotal;

  // Student Discount Calculation (from base package price, NOT from an already discounted price)
  let studentDiscountAmount = 0;
  let isStudentApplied = false;
  const allowCouponStacking = studentOffer?.allowCouponStacking === true;

  if (studentOffer?.isApplied && studentOffer?.discountPercentage > 0) {
    isStudentApplied = true;
    // Calculate discount per traveller based on base accommodation price
    studentDiscountAmount = Math.round((roomTotal * studentOffer.discountPercentage) / 100);
  }

  // Coupon Discount
  let couponDiscount = 0;
  // If student discount is applied and coupon stacking is NOT allowed, ignore coupon
  if (coupon && (!isStudentApplied || allowCouponStacking)) {
    const dt = String(coupon.discount_type || coupon.discountType || "").toUpperCase();
    const val = Number(coupon.discount_value ?? coupon.discountValue ?? coupon.discount ?? 0);

    if (dt === "PERCENTAGE" || dt === "PERCENT") {
      // Coupon percentage applies to grossSubtotal
      couponDiscount = Math.round((grossSubtotal * val) / 100);
      const maxDiscount = Number(coupon.max_discount_amount || coupon.maxDiscountAmount || 0);
      if (maxDiscount > 0 && couponDiscount > maxDiscount) {
        couponDiscount = maxDiscount;
      }
    } else if (dt === "FIXED" || dt === "FLAT" || val > 0) {
      couponDiscount = val;
    } else if (typeof coupon.discount === "number") {
      couponDiscount = coupon.discount;
    }
  }

  const totalDiscount = Math.min(studentDiscountAmount + couponDiscount, grossSubtotal);

  // Subtotal (post discount, before GST)
  const subtotal = Math.max(0, grossSubtotal - totalDiscount);

  // 5% GST applied to post-discount subtotal
  const gstRate = 5;
  const gstAmount = Math.round((subtotal * gstRate) / 100);

  // Grand Total (Subtotal + GST)
  const grandTotal = subtotal + gstAmount;

  const deposit = 2000 * travellersCount;
  const remaining = Math.max(0, grandTotal - deposit);

  return {
    roomPrice: accommodationPrice,
    effectiveBasePrice,
    basePrice: effectiveBasePrice,
    roomModifier,
    roomSurcharge: roomModifier,
    accommodationPrice,
    travellersCount,
    roomTotal,
    addonsTotal,
    studentDiscountAmount,
    isStudentApplied,
    couponDiscount,
    totalDiscount,
    subtotal,            // post-discount subtotal (Room * Travellers + Addons - Discounts)
    payableBeforeGst: subtotal,
    gstRate,
    gstAmount,           // 5% of subtotal
    gst: gstAmount,      // alias
    grandTotal,          // subtotal + gstAmount
    total: grandTotal,   // post-GST final payable total (passed to Razorpay)
    deposit,
    remaining
  };
}
