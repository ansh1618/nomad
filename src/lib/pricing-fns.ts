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
  room: any; // Room object from db or mapped object or string
  travellers: any[];
  addons: any[];
  coupon: any | null;
}) {
  // 1. Determine base journey/departure price in whole Rupees
  const journeyPrice = parseRupeeAmount(journey?.starting_price ?? journey?.price) || 6500;
  let journeyBase = journeyPrice;

  if (departure) {
    const depPrice = parseRupeeAmount(departure.dynamic_price ?? departure.base_price ?? departure.basePrice ?? departure.price);
    if (depPrice > 0) {
      journeyBase = depPrice;
    }
  }

  // 2. Determine per-person accommodation price (absolute total package price for selected tier)
  let accommodationPrice = journeyBase;
  let roomModifier = 0;

  if (room) {
    const directPrice = parseRupeeAmount(room.price ?? room.totalPrice ?? room.accommodationPrice);
    const modPrice = parseRupeeAmount(room.priceModifier ?? room.price_modifier ?? room.pricePerPerson);

    if (directPrice >= 3000) {
      // Direct absolute per-person price (e.g. 6500, 7500, 8500)
      accommodationPrice = directPrice;
      roomModifier = Math.max(0, directPrice - journeyBase);
    } else if (modPrice >= 3000) {
      // Direct absolute price stored in price_modifier column
      accommodationPrice = modPrice;
      roomModifier = Math.max(0, modPrice - journeyBase);
    } else if (modPrice > 0 && modPrice < 3000) {
      // Relative delta modifier (e.g. +1000, +2000)
      roomModifier = modPrice;
      accommodationPrice = journeyBase + modPrice;
    } else {
      // Sharing type fallback (Quad = 6500, Triple = 7500, Double = 8500 for standard 2N/3D)
      const st = String(room.sharing_type || room.room_type || room.type || room.sharingType || room || "").toLowerCase();
      if (st.includes("double")) {
        accommodationPrice = Math.max(8500, journeyBase === 6499 ? 8500 : journeyBase + 2000);
        roomModifier = accommodationPrice - journeyBase;
      } else if (st.includes("triple")) {
        accommodationPrice = Math.max(7500, journeyBase === 6499 ? 7500 : journeyBase + 1000);
        roomModifier = accommodationPrice - journeyBase;
      } else if (st.includes("quad")) {
        accommodationPrice = Math.max(6500, journeyBase === 6499 ? 6500 : journeyBase);
        roomModifier = accommodationPrice - journeyBase;
      }
    }
  }

  const effectiveBasePrice = accommodationPrice;
  const travellersCount = Math.max(1, travellers?.length || 1);
  const addonsTotal = (addons || []).reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);

  // Subtotal before coupon
  const subtotal = accommodationPrice * travellersCount + addonsTotal;

  // Coupon Discount
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
      couponDiscount = coupon.discount;
    }
  }

  couponDiscount = Math.min(couponDiscount, subtotal);
  const payableBeforeGst = Math.max(0, subtotal - couponDiscount);
  const gst = Math.round(payableBeforeGst * 0.05);
  const total = payableBeforeGst;

  const deposit = 2000 * travellersCount;
  const remaining = Math.max(0, total - deposit);

  return {
    effectiveBasePrice,
    basePrice: effectiveBasePrice,
    roomModifier,
    roomSurcharge: roomModifier,
    accommodationPrice,
    travellersCount,
    addonsTotal,
    couponDiscount,
    subtotal,        // pre-coupon subtotal (accommodationPrice + addons)
    payableBeforeGst, // post-coupon payable total
    gst,
    total: payableBeforeGst, // post-coupon final payable amount
    deposit,
    remaining
  };
}
