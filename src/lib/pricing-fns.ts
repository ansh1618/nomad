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
  // 1. Determine effective base price
  // priority: departure.dynamic_price -> departure.base_price -> journey.starting_price (or journey.price)
  const journeyPrice = journey?.starting_price ?? journey?.price ?? 0;
  let effectiveBasePrice = journeyPrice;

  if (departure) {
    if (typeof departure.dynamic_price === "number") {
      effectiveBasePrice = departure.dynamic_price;
    } else if (typeof departure.base_price === "number") {
      effectiveBasePrice = departure.base_price;
    } else if (typeof departure.basePrice === "number") {
      effectiveBasePrice = departure.basePrice;
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
    subtotal,
    gst,
    total,
    deposit,
    remaining
  };
}
