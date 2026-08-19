import { supabase } from '@/lib/supabase';

export interface CollegeSpecial {
  id: string;
  college_name: string;
  short_name: string;
  journey_slug: string;
  page_href: string;
  headline: string;
  trip_title: string;
  subtitle: string;
  description: string;
  price: number;
  badge_text: string;
  badge_accent?: string;
  is_all_girls?: boolean;
  coupon_code?: string | null;
  coupon_discount_text?: string | null;
  chips: string[];
  cta_text: string;
  dates_text?: string;
  accent_gradient: string;
  tab_accent?: string;
  is_visible: boolean;
  display_order: number;
}

export const DEFAULT_COLLEGE_SPECIALS: CollegeSpecial[] = [
  {
    id: "miranda-house",
    college_name: "Miranda House",
    short_name: "MH",
    journey_slug: "udaipur",
    page_href: "/go-nomadik-x-mh",
    headline: "GoNomadik × Miranda House",
    trip_title: "UDAIPUR 2026",
    subtitle: "Exclusive All-Girls College Trip",
    description: "2 Nights • 3 Days of lakes, grand Mewar palaces, sunset boat cruises, bonfire jam sessions & memories with your girl gang.",
    price: 6499,
    badge_text: "SPECIAL COLLEGE TRIP",
    badge_accent: "LIMITED SEATS",
    is_all_girls: true,
    coupon_code: "STUTI500",
    coupon_discount_text: "🏷️ ₹500 OFF Code: STUTI500",
    chips: ["📅 11 September 2026", "All-Girls Batch", "🏷️ ₹500 OFF Code: STUTI500"],
    cta_text: "Explore MH Trip",
    dates_text: "11 September 2026",
    accent_gradient: "from-[#102A43] via-[#1A365D] to-[#0F2942]",
    tab_accent: "#E05688",
    is_visible: true,
    display_order: 1,
  },
  {
    id: "bpit",
    college_name: "BPIT",
    short_name: "BPIT",
    journey_slug: "udaipur",
    page_href: "/go-nomadik-x-bpit",
    headline: "GoNomadik × BPIT",
    trip_title: "UDAIPUR 2026",
    subtitle: "The City of Lakes — College Getaway",
    description: "2 Nights • 3 Days of lakes, royal palaces, local experiences, sunsets, fun and unforgettable memories with your college gang.",
    price: 6499,
    badge_text: "SPECIAL COLLEGE TRIP",
    badge_accent: "LIMITED SEATS",
    is_all_girls: false,
    coupon_code: null,
    coupon_discount_text: null,
    chips: ["Udaipur 2026", "BPIT Special", "2 Nights / 3 Days"],
    cta_text: "Explore BPIT Trip →",
    dates_text: "Upcoming 2026 Batch",
    accent_gradient: "from-[#0F2642] via-[#1E3A5F] to-[#122238]",
    tab_accent: "#3B82F6",
    is_visible: true,
    display_order: 2,
  },
];

export async function getCollegeSpecials(): Promise<CollegeSpecial[]> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'college_specials')
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_COLLEGE_SPECIALS;
    }

    const parsed = JSON.parse(data.value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((item: CollegeSpecial) => item.is_visible !== false)
                   .sort((a: CollegeSpecial, b: CollegeSpecial) => a.display_order - b.display_order);
    }
  } catch (err) {
    console.warn("Falling back to default college specials:", err);
  }
  return DEFAULT_COLLEGE_SPECIALS;
}
