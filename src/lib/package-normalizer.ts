import type { PolicyItem, FaqItem } from '@/types/supabase'
import type { ItineraryDayForm } from '@/components/admin/ItineraryEditor'

/**
 * Normalizes any raw input (array, JSON string, comma-separated string, or object)
 * into a safe, clean string array.
 */
export function normalizeStringList(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter(Boolean)
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return normalizeStringList(parsed)
      } catch {
        // Fall through to delimiter split
      }
    }
    if (trimmed.includes('\n')) {
      return trimmed.split('\n').map((s) => s.trim()).filter(Boolean)
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return trimmed ? [trimmed] : []
  }
  if (typeof raw === 'object') {
    return Object.values(raw)
      .map((v) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim()))
      .filter(Boolean)
  }
  return []
}

/**
 * Normalizes packing list / things to carry from diverse database structures.
 * Checks pkg.packing_list, pkg.policies?.things_to_carry, and pkg.things_to_carry.
 */
export function normalizePackingList(pkg: any): string[] {
  if (!pkg) return []
  const directList = normalizeStringList(pkg.packing_list)
  if (directList.length > 0) return directList

  const fromPolicies = normalizeStringList(pkg.policies?.things_to_carry)
  if (fromPolicies.length > 0) return fromPolicies

  const fromThingsToCarry = normalizeStringList(pkg.things_to_carry)
  if (fromThingsToCarry.length > 0) return fromThingsToCarry

  return []
}

/**
 * Normalizes policies from either an Array of PolicyItems, an Object with policy keys
 * (e.g. cancellation_policy, terms_and_conditions), or JSON strings into PolicyItem[].
 */
export function normalizePolicies(raw: any): PolicyItem[] {
  if (!raw) return []

  // If already an array of policy items
  if (Array.isArray(raw)) {
    return raw
      .map((item: any, idx: number) => {
        if (!item) return null
        if (typeof item === 'string') {
          return { title: `Policy ${idx + 1}`, content: item }
        }
        return {
          title: String(item.title || item.name || `Policy ${idx + 1}`),
          content: String(item.content || item.description || item.text || ''),
        }
      })
      .filter((p): p is PolicyItem => p !== null && Boolean(p.title || p.content))
  }

  // If string, try JSON parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return normalizePolicies(parsed)
    } catch {
      return [{ title: 'General Travel Policy', content: raw }]
    }
  }

  // If raw is an Object (e.g. { original_price, cancellation_policy: [...], terms_and_conditions: [...] })
  if (typeof raw === 'object') {
    const list: PolicyItem[] = []

    // 1. Cancellation Policy
    if (raw.cancellation_policy) {
      const content = Array.isArray(raw.cancellation_policy)
        ? raw.cancellation_policy.join('\n')
        : String(raw.cancellation_policy)
      list.push({ title: 'Cancellation & Refund Policy', content })
    }

    // 2. Terms and Conditions
    if (raw.terms_and_conditions) {
      const content = Array.isArray(raw.terms_and_conditions)
        ? raw.terms_and_conditions.join('\n')
        : String(raw.terms_and_conditions)
      list.push({ title: 'Terms & Conditions', content })
    }

    // 3. Payment Policy
    if (raw.payment_policy) {
      const content = Array.isArray(raw.payment_policy)
        ? raw.payment_policy.join('\n')
        : String(raw.payment_policy)
      list.push({ title: 'Payment Policy', content })
    }

    // 4. Safety Instructions / Guidelines
    if (raw.safety_instructions || raw.safety_guidelines) {
      const safety = raw.safety_instructions || raw.safety_guidelines
      const content = Array.isArray(safety) ? safety.join('\n') : String(safety)
      list.push({ title: 'Safety Guidelines', content })
    }

    // 5. Embedded list
    if (Array.isArray(raw.items) || Array.isArray(raw.list)) {
      const subList = normalizePolicies(raw.items || raw.list)
      list.push(...subList)
    }

    // 6. Generic other string/array keys (excluding metadata keys)
    const skipKeys = new Set([
      'original_price',
      'discount_percent',
      'things_to_carry',
      'cancellation_policy',
      'terms_and_conditions',
      'payment_policy',
      'safety_instructions',
      'safety_guidelines',
      'items',
      'list',
    ])

    for (const [key, val] of Object.entries(raw)) {
      if (skipKeys.has(key) || !val) continue
      if (typeof val === 'string' || Array.isArray(val)) {
        const title = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        const content = Array.isArray(val) ? val.join('\n') : String(val)
        list.push({ title, content })
      }
    }

    return list
  }

  return []
}

/**
 * Builds the merged database policies payload when saving a package,
 * preserving original_price, discount_percent, things_to_carry, cancellation_policy, etc.
 */
export function buildPoliciesPayload(
  policies: PolicyItem[],
  existingPolicies: any,
  maxPrice: number,
  startPrice: number,
  packingList: string[]
): Record<string, any> {
  const base = typeof existingPolicies === 'object' && !Array.isArray(existingPolicies)
    ? { ...existingPolicies }
    : {}

  const safePolicies = Array.isArray(policies) ? policies : []
  const cancellationItem = safePolicies.find((p) =>
    p.title.toLowerCase().includes('cancellation')
  )
  const termsItem = safePolicies.find(
    (p) =>
      p.title.toLowerCase().includes('terms') ||
      p.title.toLowerCase().includes('condition')
  )
  const paymentItem = safePolicies.find((p) =>
    p.title.toLowerCase().includes('payment')
  )
  const safetyItem = safePolicies.find(
    (p) =>
      p.title.toLowerCase().includes('safety') ||
      p.title.toLowerCase().includes('guideline')
  )

  const discountPercent =
    maxPrice > 0 && startPrice > 0 && maxPrice > startPrice
      ? Math.round(((maxPrice - startPrice) / maxPrice) * 100)
      : base.discount_percent || 0

  return {
    ...base,
    original_price: maxPrice > 0 ? maxPrice : base.original_price || startPrice,
    discount_percent: discountPercent,
    things_to_carry: packingList,
    cancellation_policy: cancellationItem
      ? cancellationItem.content.split('\n').map((s) => s.trim()).filter(Boolean)
      : base.cancellation_policy || [],
    terms_and_conditions: termsItem
      ? termsItem.content.split('\n').map((s) => s.trim()).filter(Boolean)
      : base.terms_and_conditions || [],
    payment_policy: paymentItem
      ? paymentItem.content.split('\n').map((s) => s.trim()).filter(Boolean)
      : base.payment_policy || [],
    safety_guidelines: safetyItem
      ? safetyItem.content.split('\n').map((s) => s.trim()).filter(Boolean)
      : base.safety_guidelines || [],
    items: safePolicies,
  }
}

/**
 * Normalizes day-wise itinerary items for the form from either
 * pkg.itinerary_days or legacy pkg.itinerary.
 */
export function normalizeItineraryDaysForForm(pkg: any): ItineraryDayForm[] {
  if (!pkg) return []

  let rawDays = pkg.itinerary_days
  if (!Array.isArray(rawDays) || rawDays.length === 0) {
    rawDays = pkg.itinerary
  }

  if (typeof rawDays === 'string') {
    try {
      rawDays = JSON.parse(rawDays)
    } catch {
      rawDays = []
    }
  }

  if (!Array.isArray(rawDays) || rawDays.length === 0) {
    return []
  }

  return rawDays.map((d: any, idx: number) => {
    let meals = { breakfast: false, lunch: false, dinner: false }
    if (d?.meals) {
      if (Array.isArray(d.meals)) {
        meals = {
          breakfast: d.meals.some((m: string) => String(m).toLowerCase().includes('breakfast')),
          lunch: d.meals.some((m: string) => String(m).toLowerCase().includes('lunch')),
          dinner: d.meals.some((m: string) => String(m).toLowerCase().includes('dinner')),
        }
      } else if (typeof d.meals === 'object') {
        meals = {
          breakfast: Boolean(d.meals.breakfast),
          lunch: Boolean(d.meals.lunch),
          dinner: Boolean(d.meals.dinner),
        }
      }
    }

    return {
      day_number: Number(d.day_number || d.day || idx + 1),
      title: String(d.title || `Day ${idx + 1}`),
      description: String(d.description || ''),
      meals,
      stay: String(d.stay || ''),
      transport: String(d.transport || ''),
      image_url: d.image_url || null,
      is_highlight: Boolean(d.is_highlight),
      sort_order: Number(d.sort_order ?? idx + 1),
    }
  })
}

/**
 * Normalizes gallery assets to `{ url, caption, day }[]`.
 */
export function normalizeGallery(raw: any): { url: string; caption: string; day: number | null }[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    if (raw.startsWith('http')) {
      return [{ url: raw, caption: '', day: null }]
    }
    try {
      const parsed = JSON.parse(raw)
      return normalizeGallery(parsed)
    } catch {
      return []
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item: any) => {
        if (!item) return null
        if (typeof item === 'string') {
          return { url: item, caption: '', day: null }
        }
        return {
          url: String(item.url || item.image || item.src || ''),
          caption: String(item.caption || item.alt || ''),
          day: item.day ? Number(item.day) : null,
        }
      })
      .filter((g): g is { url: string; caption: string; day: number | null } => Boolean(g?.url))
  }

  return []
}

/**
 * Normalizes video assets to `{ url, title, day, type }[]`.
 */
export function normalizeVideos(raw: any): { url: string; title: string; day: number | null; type: string }[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    if (raw.startsWith('http')) {
      return [{ url: raw, title: '', day: null, type: 'youtube' }]
    }
    try {
      const parsed = JSON.parse(raw)
      return normalizeVideos(parsed)
    } catch {
      return []
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item: any) => {
        if (!item) return null
        if (typeof item === 'string') {
          return { url: item, title: '', day: null, type: 'youtube' }
        }
        return {
          url: String(item.url || ''),
          title: String(item.title || ''),
          day: item.day ? Number(item.day) : null,
          type: String(item.type || 'youtube'),
        }
      })
      .filter((v): v is { url: string; title: string; day: number | null; type: string } => Boolean(v?.url))
  }

  return []
}

/**
 * Normalizes reels assets to `{ url, caption, day }[]`.
 */
export function normalizeReels(raw: any): { url: string; caption: string; day: number | null }[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item: any) => {
        if (!item) return null
        if (typeof item === 'string') return { url: item, caption: '', day: null }
        return {
          url: String(item.url || ''),
          caption: String(item.caption || ''),
          day: item.day ? Number(item.day) : null,
        }
      })
      .filter((r): r is { url: string; caption: string; day: number | null } => Boolean(r?.url))
  }
  return []
}

/**
 * Normalizes transport configuration object.
 */
export function normalizeTransport(raw: any): any {
  let t = raw
  if (typeof raw === 'string') {
    try {
      t = JSON.parse(raw)
    } catch {
      t = { vehicle_name: raw }
    }
  }
  if (Array.isArray(t)) t = t[0]
  if (!t || typeof t !== 'object') {
    return {
      vehicle_name: '',
      vehicle_type: '',
      cover_image: '',
      gallery: [],
      features: [],
      pickup_points: [],
      drop_points: [],
      departure_time: '',
      arrival_time: '',
      seat_capacity: 17,
      available_seats: 17,
      trip_captain: true,
      ac: true,
      music: true,
      charging_ports: true,
      pushback_seats: true,
      charging_ports_text: 'Individual USB & Socket Ports',
      music_system_text: 'JBL Sound System & Ambient Lighting',
      luggage_space: 'Under-deck & Overhead Luggage Racks',
      driver_experience: 'Certified Highway Captains (10+ Yrs Exp)',
      washroom_stops: 'Scheduled Clean Restroom Breaks Every 3-4 Hours',
    }
  }

  const images = Array.isArray(t.images)
    ? t.images
    : Array.isArray(t.gallery)
    ? t.gallery
    : []

  return {
    vehicle_name: t.vehicle_name || t.name || '',
    vehicle_type: t.vehicle_type || t.vehicleType || '',
    capacity: t.capacity || '',
    seat_capacity: Number(t.seat_capacity || 30),
    available_seats: Number(t.available_seats || 30),
    departure_time: t.departure_time || '',
    arrival_time: t.arrival_time || '',
    ac: t.ac ?? t.isAc ?? true,
    music: t.music ?? true,
    charging_ports: t.charging_ports ?? true,
    trip_captain: t.trip_captain ?? true,
    pushback_seats: t.pushback_seats ?? t.pushbackSeats ?? true,
    charging_ports_text: t.charging_ports_text || t.chargingPorts || '',
    music_system_text: t.music_system_text || t.musicSystem || '',
    luggage_space: t.luggage_space || t.luggageSpace || '',
    driver_experience: t.driver_experience || t.driverExperience || '',
    washroom_stops: t.washroom_stops || t.washroomStops || '',
    cover_image: images.length > 0 ? images[0] : t.cover_image || '',
    gallery: images,
    features: Array.isArray(t.features) ? t.features : [],
    pickup_points: Array.isArray(t.pickup_points) ? t.pickup_points : [],
    drop_points: Array.isArray(t.drop_points) ? t.drop_points : [],
  }
}

/**
 * Normalizes accommodation configuration object.
 */
export function normalizeAccommodation(raw: any): any {
  let acc = raw
  if (Array.isArray(acc) && acc.length > 0) acc = acc[0]
  if (!acc || typeof acc !== 'object') {
    return {
      hotel_name: '',
      hotel_category: '3 Star',
      location: '',
      cover_image: '',
      gallery: [],
      room_types: ['Double Sharing', 'Triple Sharing', 'Quad Sharing'],
      amenities: ['Wifi', 'Geyser', 'TV', 'Parking', 'Room Service'],
      google_maps: '',
      check_in: '12:00 PM',
      check_out: '11:00 AM',
    }
  }

  return {
    id: acc.id,
    hotel_name: acc.hotel_name || acc.name || '',
    hotel_category: acc.hotel_category || '3 Star',
    location: acc.location || '',
    cover_image: acc.cover_image || '',
    gallery: Array.isArray(acc.gallery) ? acc.gallery : [],
    room_types: Array.isArray(acc.room_types)
      ? acc.room_types
      : ['Double Sharing', 'Triple Sharing', 'Quad Sharing'],
    amenities: Array.isArray(acc.amenities)
      ? acc.amenities
      : ['Wifi', 'Geyser', 'TV', 'Parking', 'Room Service'],
    google_maps: acc.google_maps || '',
    check_in: acc.check_in || '12:00 PM',
    check_out: acc.check_out || '11:00 AM',
  }
}

