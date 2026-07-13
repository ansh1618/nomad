// ==========================================
// NOMADIK ERP — COMPLETE SUPABASE TYPES (v7)
// Updated for Production Booking System (migration_v15)
// ==========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ==========================================
// ENUM TYPES
// ==========================================
export type ErpStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type DepartureStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'SOLD_OUT' | 'CLOSED'
export type BookingState =
  | 'CREATED'
  | 'SEAT_LOCKED'
  | 'PAYMENT_PENDING'
  | 'PARTIAL_PAID'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
export type PaymentState = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIAL'
export type ErpRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TRIP_MANAGER'
  | 'SALES'
  | 'SUPPORT'
  | 'ACCOUNTANT'
  | 'CONTENT_EDITOR'
  | 'TRIP_CAPTAIN'
export type InventoryStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'BLOCKED'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'PAYMENT_PENDING' | 'CONVERTED' | 'LOST' | 'SPAM'
export type WalletTxType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'REFERRAL'
export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'IN_APP'

// ==========================================
// TABLE ROW TYPES
// ==========================================

export interface Setting {
  id: string
  category: string
  key: string
  value: Json
  description: string | null
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: ErpRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SiteUser {
  id: string
  full_name: string
  phone: string
  email: string | null
  avatar_url: string | null
  date_of_birth: string | null
  gender: string | null
  city: string | null
  state: string | null
  aadhaar_number: string | null
  passport_number: string | null
  wallet_balance: number
  referral_code: string | null
  referred_by: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  filename: string
  size: number
  mime_type: string
  url: string
  thumbnail_url: string | null
  folder: string
  alt_text: string | null
  width: number | null
  height: number | null
  usage_count: number
  tags: string[] | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface TripCaptain {
  id: string
  user_id: string | null
  full_name: string
  phone: string
  email: string | null
  photo_url: string | null
  bio: string | null
  experience_years: number
  specializations: string[] | null
  languages: string[] | null
  rating: number
  total_trips: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// SEO metadata type
export interface SeoMeta {
  title?: string
  description?: string
  keywords?: string[]
  og_image?: string
}

// Weather info type
export interface WeatherInfo {
  summer?: string
  monsoon?: string
  winter?: string
  spring?: string
}

// How to reach type
export interface HowToReach {
  road?: string
  rail?: string
  air?: string
  local?: string
}

// Gallery item type
export interface GalleryItem {
  url: string
  alt?: string
  caption?: string
  thumbnail_url?: string
}

// FAQ item type
export interface FaqItem {
  question: string
  answer: string
}

// Thing to do type
export interface ThingToDo {
  title: string
  description?: string
  icon?: string
}

export interface Destination {
  id: string
  slug: string
  name: string
  subtitle: string | null
  country: string
  state: string | null
  region: string | null
  hero_image: string | null
  hero_video: string | null
  gallery: GalleryItem[]
  short_description: string | null
  description: string | null
  altitude: string | null
  best_time: string | null
  weather: WeatherInfo | null
  things_to_do: ThingToDo[]
  how_to_reach: HowToReach | null
  coordinates: { lat: number; lng: number } | null
  google_map_url: string | null
  faqs: FaqItem[]
  seo: SeoMeta | null
  status: ErpStatus
  is_featured: boolean
  priority: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

// Itinerary meals type
export interface MealPlan {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

export interface ItineraryDay {
  id: string
  journey_id: string
  day_number: number
  title: string
  description: string | null
  meals: MealPlan | null
  stay: string | null
  transport: string | null
  image_url: string | null
  is_highlight: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Policy type
export interface PolicyItem {
  title: string
  content: string
}

// Cancellation policy type
export interface CancellationPolicy {
  description?: string
  tiers?: Array<{
    days_before: number
    refund_percent: number
    label?: string
  }>
}

export interface Journey {
  id: string
  destination_id: string
  trip_captain_id: string | null
  slug: string
  name: string
  tagline: string | null
  hero_banner: string | null
  gallery: GalleryItem[]
  videos: string[]
  duration_days: number | null
  duration_nights: number | null
  duration: string | null
  difficulty: string | null
  group_size_min: number
  group_size_max: number
  starting_price: number | null
  maximum_price: number | null
  pickup_point: string | null
  drop_point: string | null
  short_description: string | null
  overview: string | null
  highlights: string[]
  policies: PolicyItem[]
  cancellation_policy: CancellationPolicy | null
  inclusions: string[]
  exclusions: string[]
  packing_list: string[]
  faqs: FaqItem[]
  seo: SeoMeta | null
  status: ErpStatus
  is_featured: boolean
  is_published: boolean
  priority: number
  avg_rating: number
  review_count: number
  booking_count: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  // joined
  destinations?: Partial<Destination>
  trip_captains?: Partial<TripCaptain>
  itinerary_days?: ItineraryDay[]
}

export interface Bus {
  id: string
  name: string
  registration_number: string
  bus_type: string
  total_seats: number
  seat_layout: Json | null
  amenities: string[] | null
  photos: string[]
  driver_name: string | null
  driver_phone: string | null
  driver_photo: string | null
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BusSeat {
  id: string
  bus_id: string
  seat_number: string
  seat_type: string
  row_number: number | null
  column_letter: string | null
  is_window: boolean
  is_sleeper: boolean
  price_modifier: number
  created_at: string
}

export interface Hotel {
  id: string
  destination_id: string | null
  name: string
  slug: string | null
  address: string | null
  city: string | null
  state: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  star_rating: number | null
  description: string | null
  gallery: GalleryItem[]
  amenities: string[] | null
  meal_plans: string[] | null
  check_in_time: string
  check_out_time: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  website: string | null
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  hotel_rooms?: HotelRoom[]
}

export interface HotelRoom {
  id: string
  hotel_id: string
  room_type: string
  sharing_type: string | null
  capacity: number
  price_per_night: number | null
  price_modifier: number
  total_rooms: number
  amenities: string[] | null
  description: string | null
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Departure {
  id: string
  journey_id: string
  trip_captain_id: string | null
  bus_id: string | null
  hotel_id: string | null
  departure_date: string
  return_date: string
  total_seats: number
  available_seats: number
  booked_seats: number
  base_price: number
  dynamic_price: number | null
  discount_amount: number
  discount_type: string | null
  pickup_location: string | null
  drop_location: string | null
  pickup_time: string | null
  hotel_name: string | null
  notes: string | null
  status: string
  is_visible: boolean
  is_closed: boolean
  is_cancelled: boolean
  is_sold_out: boolean
  cancellation_reason: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  // joined
  journeys?: Partial<Journey>
  trip_captains?: Partial<TripCaptain>
  buses?: Partial<Bus>
  hotels?: Partial<Hotel>
}

export interface DepartureInventory {
  id: string
  departure_id: string
  inventory_type: string
  bus_seat_id: string | null
  hotel_room_id: string | null
  label: string
  status: InventoryStatus
  price_modifier: number
  locked_by: string | null
  locked_at: string | null
  locked_until: string | null
  booking_id: string | null
  created_at: string
  updated_at: string
}

export interface PricingTier {
  id: string
  departure_id: string
  tier_name: string
  price: number
  seats_limit: number | null
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'PERCENTAGE' | 'FLAT'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  valid_from: string
  valid_until: string | null
  max_redemptions: number | null
  current_redemptions: number
  per_user_limit: number
  is_first_booking_only: boolean
  destination_id: string | null
  journey_id: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── Customer (CRM-ready, linked to bookings) ──────────────────
export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  whatsapp: string | null
  gender: string | null
  date_of_birth: string | null
  city: string | null
  state: string | null
  address: string | null
  referral_source: string | null
  total_bookings: number
  total_spent: number
  last_booking_at: string | null
  created_at: string
  updated_at: string
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_bookings' | 'total_spent' | 'last_booking_at'>

// ── Transaction (raw gateway response log) ────────────────────
export interface Transaction {
  id: string
  booking_id: string
  gateway: string
  order_id: string | null
  gateway_payment_id: string | null
  amount: number
  currency: string
  status: string
  gateway_response: Json | null
  ip_address: string | null
  created_at: string
}

// ── Booking Timeline (activity log) ──────────────────────────
export interface BookingTimeline {
  id: string
  booking_id: string
  event: string
  description: string | null
  actor: string
  actor_id: string | null
  metadata: Json | null
  created_at: string
}

// ── Notification ──────────────────────────────────────────────
export interface Notification {
  id: string
  recipient_type: string
  recipient_id: string | null
  title: string
  message: string
  type: string
  related_booking_id: string | null
  is_read: boolean
  created_at: string
}

export interface Booking {
  id: string
  booking_id: string | null
  user_id: string | null
  customer_id: string | null
  departure_id: string
  journey_id: string | null
  coupon_id: string | null
  status: BookingState
  booking_status: string
  payment_status: string
  traveller_count: number
  base_amount: number
  addon_amount: number
  gst_rate: number
  gst_amount: number
  discount_amount: number
  coupon_discount: number
  wallet_amount_used: number
  total_amount: number
  amount_paid: number
  balance_due: number
  cashfree_order_id: string | null
  cashfree_payment_id: string | null
  transaction_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  room_preference: string | null
  room_sharing: string | null
  seat_preference: string | null
  food_preference: string | null
  special_requests: string | null
  internal_notes: string | null
  cancellation_reason: string | null
  refund_amount: number
  refund_status: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  customers?: Partial<Customer>
  users?: Partial<SiteUser>
  departures?: Partial<Departure> & {
    journeys?: Partial<Journey>
  }
  booking_travellers?: BookingTraveller[]
  payments?: Payment[]
  booking_timeline?: BookingTimeline[]
}

export interface BookingTraveller {
  id: string
  booking_id: string
  is_primary: boolean
  full_name: string
  gender: string | null
  date_of_birth: string | null
  age: number | null
  phone: string | null
  email: string | null
  aadhaar_number: string | null
  passport_number: string | null
  food_preference: string | null
  seat_preference: string | null
  room_sharing: string | null
  address: string | null
  guardian_number: string | null
  heard_from: string | null
  referred_by: string | null
  medical_conditions: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  pickup_point: string | null
  assigned_seat_id: string | null
  assigned_room_id: string | null
  aadhaar_doc_url: string | null
  photo_url: string | null
  created_at: string
}

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  status: PaymentState
  payment_type: string
  payment_gateway: string
  payment_method: string | null
  gateway_order_id: string | null
  gateway_payment_id: string | null
  gateway_signature: string | null
  receipt_url: string | null
  failure_reason: string | null
  metadata: Json | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string | null
  booking_id: string
  user_id: string
  amount: number
  gst_amount: number
  gst_number: string | null
  invoice_date: string
  due_date: string | null
  pdf_url: string | null
  status: string
  issued_by: string | null
  issued_at: string
  created_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  tx_type: WalletTxType
  amount: number
  balance_after: number
  reference_id: string | null
  reference_type: string | null
  description: string
  created_by: string | null
  created_at: string
}

export interface Review {
  id: string
  journey_id: string | null
  booking_id: string | null
  user_id: string | null
  author_name: string
  author_email: string | null
  rating: number
  title: string | null
  content: string
  photos: string[]
  trip_date: string | null
  is_verified: boolean
  is_approved: boolean
  is_featured: boolean
  admin_reply: string | null
  admin_reply_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  // joined
  journeys?: Partial<Journey>
  users?: Partial<SiteUser>
}

export interface Inquiry {
  id: string
  name: string
  phone: string
  email: string | null
  destination_id: string | null
  journey_id: string | null
  departure_id: string | null
  traveller_count: number
  travel_date: string | null
  budget: string | null
  message: string | null
  source: string
  status: LeadStatus
  priority: string
  assigned_to: string | null
  notes: string | null
  follow_up_at: string | null
  converted_booking_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
  updated_at: string
  // joined
  destinations?: Partial<Destination>
  journeys?: Partial<Journey>
  admins?: Partial<Admin>
}

export interface Blog {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featured_image: string | null
  gallery: string[]
  category: string
  tags: string[] | null
  author_id: string | null
  author_name: string | null
  destination_id: string | null
  journey_id: string | null
  seo: SeoMeta | null
  is_published: boolean
  is_featured: boolean
  view_count: number
  read_time_minutes: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Banner {
  id: string
  placement: string
  title: string | null
  subtitle: string | null
  image_url: string | null
  cta_text: string | null
  cta_link: string | null
  bg_color: string | null
  text_color: string | null
  is_active: boolean
  display_order: number
  valid_from: string | null
  valid_until: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CmsSection {
  id: string
  section_key: string
  title: string | null
  content: Json
  is_enabled: boolean
  sort_order: number
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  admin_id: string | null
  admin_email: string | null
  admin_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  entity_label: string | null
  description: string
  old_data: Json | null
  new_data: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Addon {
  id: string
  name: string
  description: string | null
  icon: string | null
  price: number
  addon_type: string
  applies_to: string
  journey_id: string | null
  is_active: boolean
  created_at: string
}

export interface Wishlist {
  id: string
  user_id: string
  journey_id: string
  created_at: string
  journeys?: Partial<Journey>
}

export interface Notification {
  id: string
  user_id: string | null
  channel: NotificationChannel
  notification_type: string
  status: string
  subject: string | null
  content: string
  metadata: Json | null
  scheduled_for: string | null
  sent_at: string | null
  error_message: string | null
  created_at: string
}

// ==========================================
// INSERT TYPES (Omit auto-generated fields)
// ==========================================
export type DestinationInsert = Omit<Destination, 'id' | 'created_at' | 'updated_at'>
export type DestinationUpdate = Partial<DestinationInsert>

export type JourneyInsert = Omit<Journey, 'id' | 'created_at' | 'updated_at' | 'avg_rating' | 'review_count' | 'booking_count' | 'destinations' | 'trip_captains' | 'itinerary_days'>
export type JourneyUpdate = Partial<JourneyInsert>

export type ItineraryDayInsert = Omit<ItineraryDay, 'id' | 'created_at' | 'updated_at'>
export type ItineraryDayUpdate = Partial<ItineraryDayInsert>

export type BusInsert = Omit<Bus, 'id' | 'created_at' | 'updated_at'>
export type BusUpdate = Partial<BusInsert>

export type HotelInsert = Omit<Hotel, 'id' | 'created_at' | 'updated_at' | 'hotel_rooms'>
export type HotelUpdate = Partial<HotelInsert>

export type HotelRoomInsert = Omit<HotelRoom, 'id' | 'created_at' | 'updated_at'>
export type HotelRoomUpdate = Partial<HotelRoomInsert>

export type DepartureInsert = Omit<Departure, 'id' | 'created_at' | 'updated_at' | 'journeys' | 'trip_captains' | 'buses' | 'hotels'>
export type DepartureUpdate = Partial<DepartureInsert>

export type BookingInsert = Omit<Booking, 'id' | 'booking_id' | 'created_at' | 'updated_at' | 'balance_due' | 'users' | 'departures' | 'booking_travellers' | 'payments'>
export type BookingUpdate = Partial<BookingInsert>

export type BookingTravellerInsert = Omit<BookingTraveller, 'id' | 'created_at'>
export type BookingTravellerUpdate = Partial<BookingTravellerInsert>

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>
export type PaymentUpdate = Partial<PaymentInsert>

export type CouponInsert = Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'current_redemptions'>
export type CouponUpdate = Partial<CouponInsert>

export type ReviewInsert = Omit<Review, 'id' | 'created_at' | 'updated_at' | 'journeys' | 'users'>
export type ReviewUpdate = Partial<ReviewInsert>

export type InquiryInsert = Omit<Inquiry, 'id' | 'created_at' | 'updated_at' | 'destinations' | 'journeys' | 'admins'>
export type InquiryUpdate = Partial<InquiryInsert>

export type BlogInsert = Omit<Blog, 'id' | 'created_at' | 'updated_at'>
export type BlogUpdate = Partial<BlogInsert>

export type MediaAssetInsert = Omit<MediaAsset, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
export type MediaAssetUpdate = Partial<MediaAssetInsert>

export type TripCaptainInsert = Omit<TripCaptain, 'id' | 'created_at' | 'updated_at'>
export type TripCaptainUpdate = Partial<TripCaptainInsert>

export type CmsSectionUpdate = Pick<CmsSection, 'content' | 'is_enabled' | 'title' | 'sort_order'>

// ==========================================
// PAGINATION
// ==========================================
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

// ==========================================
// DASHBOARD STATS
// ==========================================
export interface DashboardStats {
  today_bookings: number
  today_revenue: number
  monthly_revenue: number
  confirmed_bookings: number
  pending_bookings: number
  completed_trips: number
  today_leads: number
  week_leads: number
  total_customers: number
  active_packages: number
  upcoming_departures: number
  lead_conversion_rate: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  bookings: number
}

export interface PackagePerformance {
  id: string
  name: string
  slug: string
  starting_price: number | null
  booking_count: number
  total_revenue: number
  avg_rating: number
  review_count: number
}
