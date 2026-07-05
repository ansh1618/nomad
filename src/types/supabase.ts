// ==========================================
// NOMADIK — SUPABASE DATABASE TYPES
// Auto-generated from schema_v3.sql (ERP Foundation)
// ==========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BookingState = 'CREATED' | 'SEAT_LOCKED' | 'PAYMENT_PENDING' | 'PARTIAL_PAID' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'TRIP_MANAGER' | 'HOTEL_MANAGER' | 'SUPPORT' | 'ACCOUNTANT'
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type NotificationType = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH'
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED'

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string
          category: string
          key: string
          value: Json
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
      users: {
        Row: {
          id: string
          full_name: string
          phone: string
          email: string | null
          wallet_balance: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'wallet_balance'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      admins: {
        Row: {
          id: string
          email: string
          role: AdminRole
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admins']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['admins']['Insert']>
      }
      destinations: {
        Row: {
          id: string
          slug: string
          name: string
          subtitle: string | null
          hero_image: string | null
          hero_video: string | null
          description: string | null
          seo: Json | null
          status: ContentStatus
          gallery_media_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['destinations']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'gallery_media_ids'> & { status?: ContentStatus, gallery_media_ids?: string[] }
        Update: Partial<Database['public']['Tables']['destinations']['Insert']>
      }
      journeys: {
        Row: {
          id: string
          destination_id: string
          slug: string
          name: string
          duration: string
          difficulty: string | null
          distance: string | null
          best_season: string | null
          pickup_point: string | null
          drop_point: string | null
          itinerary: Json | null
          inclusions: Json | null
          exclusions: Json | null
          packing_list: Json | null
          status: ContentStatus
          gallery_media_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['journeys']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'gallery_media_ids'> & { status?: ContentStatus, gallery_media_ids?: string[] }
        Update: Partial<Database['public']['Tables']['journeys']['Insert']>
      }
      buses: {
        Row: {
          id: string
          name: string
          registration_number: string | null
          total_seats: number
          layout_type: string | null
          amenities: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['buses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['buses']['Insert']>
      }
      bus_seats: {
        Row: {
          id: string
          bus_id: string
          seat_number: string
          is_sleeper: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bus_seats']['Row'], 'id' | 'created_at' | 'is_sleeper'> & { is_sleeper?: boolean }
        Update: Partial<Database['public']['Tables']['bus_seats']['Insert']>
      }
      hotels: {
        Row: {
          id: string
          destination_id: string | null
          name: string
          location: string | null
          rating: number | null
          amenities: Json | null
          gallery: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hotels']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hotels']['Insert']>
      }
      hotel_rooms: {
        Row: {
          id: string
          hotel_id: string
          room_type: string
          capacity: number
          amenities: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hotel_rooms']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hotel_rooms']['Insert']>
      }
      departures: {
        Row: {
          id: string
          journey_id: string
          departure_date: string
          return_date: string
          base_price: number
          dynamic_pricing_modifier: number
          status: string
          trip_captain_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['departures']['Row'], 'id' | 'created_at' | 'updated_at' | 'dynamic_pricing_modifier' | 'status'> & { dynamic_pricing_modifier?: number, status?: string }
        Update: Partial<Database['public']['Tables']['departures']['Insert']>
      }
      departure_transport: {
        Row: {
          id: string
          departure_id: string
          bus_id: string
          driver_name: string | null
          driver_phone: string | null
          pickup_time: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['departure_transport']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['departure_transport']['Insert']>
      }
      departure_rooms: {
        Row: {
          id: string
          departure_id: string
          hotel_room_id: string
          allocated_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['departure_rooms']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['departure_rooms']['Insert']>
      }
      departure_inventory: {
        Row: {
          id: string
          departure_id: string
          seat_id: string | null
          room_id: string | null
          inventory_type: string
          status: string
          locked_by: string | null
          locked_at: string | null
          booking_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['departure_inventory']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: string }
        Update: Partial<Database['public']['Tables']['departure_inventory']['Insert']>
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: string
          discount_value: number
          min_order_amount: number
          max_discount_amount: number | null
          valid_from: string
          valid_until: string | null
          max_redemptions: number | null
          current_redemptions: number
          first_booking_only: boolean
          destination_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['coupons']['Row'], 'id' | 'created_at' | 'current_redemptions' | 'min_order_amount' | 'first_booking_only'> & { current_redemptions?: number, min_order_amount?: number, first_booking_only?: boolean }
        Update: Partial<Database['public']['Tables']['coupons']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          booking_id: string | null
          user_id: string
          departure_id: string
          status: BookingState
          traveller_count: number
          base_amount: number
          addon_amount: number
          gst_amount: number
          coupon_id: string | null
          discount_amount: number
          total_amount: number
          amount_paid: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'booking_id' | 'addon_amount' | 'discount_amount' | 'amount_paid'> & { status?: BookingState, booking_id?: string | null, addon_amount?: number, discount_amount?: number, amount_paid?: number }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      booking_travellers: {
        Row: {
          id: string
          booking_id: string
          is_primary: boolean
          full_name: string
          gender: string | null
          dob: string | null
          phone: string | null
          email: string | null
          aadhaar_number: string | null
          passport_number: string | null
          food_preference: string | null
          medical_conditions: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          pickup_point: string | null
          assigned_seat_id: string | null
          assigned_room_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['booking_travellers']['Row'], 'id' | 'created_at' | 'is_primary'> & { is_primary?: boolean }
        Update: Partial<Database['public']['Tables']['booking_travellers']['Insert']>
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          status: PaymentStatus
          payment_gateway: string
          transaction_id: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'payment_gateway'> & { status?: PaymentStatus, payment_gateway?: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
    Functions: {
      has_role: {
        Args: { required_roles: AdminRole[] }
        Returns: boolean
      }
    }
    Enums: {
      booking_state_enum: BookingState
      payment_status_enum: PaymentStatus
      admin_role_enum: AdminRole
      notification_type_enum: NotificationType
      notification_status_enum: NotificationStatus
    }
  }
}

// Convenience row types
export type Destination = Database['public']['Tables']['destinations']['Row']
export type Journey = Database['public']['Tables']['journeys']['Row']
export type Departure = Database['public']['Tables']['departures']['Row']
export type DepartureInventory = Database['public']['Tables']['departure_inventory']['Row']
export type Bus = Database['public']['Tables']['buses']['Row']
export type BusSeat = Database['public']['Tables']['bus_seats']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingTraveller = Database['public']['Tables']['booking_travellers']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Admin = Database['public']['Tables']['admins']['Row']
export type SiteUser = Database['public']['Tables']['users']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
